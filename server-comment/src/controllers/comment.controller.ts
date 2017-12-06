import { Comment } from '../schemas/comment.schema';
import { Types } from 'mongoose';
import * as redis from '../modules/redis';
import { User } from '../schemas/user.schema';

const config = require('../../../tradejs.config');

export const commentController = {

	async findById(reqUser, id: string): Promise<any> {
		const comment = await Comment.findById(id).populate('createUser').lean();

		if (!comment)
			return;

		if (comment.childCount)
			comment.children = (await Comment.find({ parentId: { $eq: Types.ObjectId(comment._id) } }).populate('createUser').sort({ _id: -1 }).limit(5).lean()).reverse();

		Comment.addILike(reqUser.id, [comment]);
		User.normalizeProfileImg(comment);

		return comment;
	},

	async findByToUserId(reqUser, toUserId) {
		let comments = await Comment.find({ toUser: toUserId, parentId: { $eq: undefined } }).sort({ _id: -1 }).limit(20).populate('createUser').lean();

		comments = await Promise.all(comments.map(async comment => {
			comment.children = (await Comment.find({ parentId: { $eq: Types.ObjectId(comment._id) } }).sort({ _id: -1 }).limit(5).populate('createUser').lean()).reverse();
			return comment;
		}));
		
		Comment.addILike(reqUser.id, comments);
		comments.forEach(User.normalizeProfileImg);
		
		return comments;
	},

	async findMany(reqUser, userId) {
		return [];
	},

	async create(reqUser, options): Promise<any> {

		const comment = await Comment.create({
			createUser: reqUser.id,
			toUser: options.toUserId,
			parentId: options.parentId,
			content: options.content
		});

		if (options.parentId) {
			const parent = await Comment.findOneAndUpdate({ _id: comment.parentId }, { $inc: { childCount: 1 } });

			// notify
			// if (parent.userId.toString() !== reqUser.id) {
				let pubOptions = {
					type: 'post-comment',
					data: {
						toUserId: parent.createUser,
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