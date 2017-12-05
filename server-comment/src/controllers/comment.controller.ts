import { Comment } from '../schemas/comment';
import { Types } from 'mongoose';
import * as redis from '../modules/redis';

const config = require('../../../tradejs.config');

export const commentController = {

	async findById(reqUser, id: string): Promise<any> {
		const comment = await Comment.findById(id).lean();

		if (!comment)
			return;

		if (!comment.parentId)
			comment.children = (await Comment.find({ parentId: { $eq: Types.ObjectId(comment._id) } }).sort({ _id: -1 }).limit(5).lean()).reverse();

		Comment.addILike(reqUser.id, [comment]);

		return comment;
	},

	async findByChannelId(reqUser, channelId) {
		let comments = await Comment.find({ channelId, parentId: { $eq: undefined } }).sort({ _id: -1 }).limit(20).lean();

		comments = await Promise.all(comments.map(async comment => {
			comment.children = (await Comment.find({ parentId: { $eq: Types.ObjectId(comment._id) } }).sort({ _id: -1 }).limit(5).lean()).reverse();
			return comment;
		}));

		Comment.addILike(reqUser.id, comments);

		return comments;
	},

	async findByUserd(reqUser, userId) {
		let comments = await Comment.find({ userId, parentId: { $eq: undefined } }).sort({ _id: -1 }).limit(20).lean();

		comments = await Promise.all(comments.map(async comment => {
			comment.children = (await Comment.find({ parentId: { $eq: Types.ObjectId(comment._id) } }).sort({ _id: -1 }).limit(5).lean()).reverse();
			return comment;
		}));

		Comment.addILike(reqUser.id, comments);

		return comments;
	},

	async create(reqUser, options): Promise<any> {

		const comment = await Comment.create({
			userId: reqUser.id,
			channelId: options.channelId,
			parentId: options.parentId,
			content: options.content,
			username: options.name,
			profileImg: options.profileImg
		});

		if (options.parentId) {
			const parent = await Comment.findOneAndUpdate({ _id: comment.parentId }, { $inc: { childCount: 1 } });

			// notify
			// if (parent.userId.toString() !== reqUser.id) {
				let pubOptions = {
					type: 'post-comment',
					data: {
						toUserId: parent.userId,
						fromUserId: reqUser.id,
						parentId: parent._id,
						commentId: comment._id,
						content: options.content
					}
				};

				redis.client.publish("notify", JSON.stringify(pubOptions));
			// }
		}

		return { _id: comment._id };
	},

	async toggleLike(reqUser, commentId) {
		const { iLike, comment } = await Comment.toggleLike(reqUser.id, commentId);

		if (comment && iLike) {
			let pubOptions = {
				type: comment.parentId ? 'comment-like' : 'post-like',
				data: {
					commentId: commentId,
					parentId: comment.parentId,
					fromUserId: reqUser.id,
					toUserId: comment.userId,
				}
			};

			redis.client.publish("notify", JSON.stringify(pubOptions));
		}

		return { state: iLike };
	}
};