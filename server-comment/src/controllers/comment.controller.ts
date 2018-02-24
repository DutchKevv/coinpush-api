import { Comment } from '../schemas/comment.schema';
import { Types } from 'mongoose';
import { pubClient } from '../modules/redis';
import { User } from '../schemas/user.schema';
import { IReqUser } from 'coinpush/interface/IReqUser.interface';

const config = require('../../../tradejs.config');

export const commentController = {

	async findById(reqUser, id: string, params: any = {}): Promise<any> {
		const comment = await Comment.findById(id).populate('createUser').lean();

		if (!comment)
			return;

		if (comment.childCount)
			comment.children = await this.findChildren(reqUser, comment._id);

		Comment.addILike(reqUser.id, [comment]);
		User.normalizeProfileImg(comment);

		return comment;
	},

	async findByToUserId(reqUser, params: { toUserId: string, offset: any, limit: any }) {

		let comments = await Comment
			.find({ toUser: params.toUserId, parentId: { $eq: undefined } })
			.skip(parseInt(params.offset, 10) || 0)
			.limit(parseInt(params.limit, 10) || 10)
			.sort({ _id: -1 })
			.populate('createUser')
			.lean();

		comments = await Promise.all(comments.map(async comment => {
			comment.children = await this.findChildren(reqUser, comment._id);
			return comment;
		}));

		Comment.addILike(reqUser.id, comments);
		comments.forEach(User.normalizeProfileImg);

		return comments;
	},

	async findMany(reqUser, userId) {
		return [];
	},

	async findChildren(reqUser: IReqUser, parentId: string, params: any = {}) {

		const children = await Comment
			.find({ parentId: { $eq: Types.ObjectId(parentId) } })
			.sort({ _id: -1 })
			.skip(parseInt(params.offset, 10) || 0)
			.limit(parseInt(params.limit, 10) || 5)
			.populate('createUser')
			.lean();

		children.forEach(User.normalizeProfileImg);

		return children.reverse();
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

			// notify if not responding on self
			if (parent.userId.toString() !== reqUser.id) {
				let pubOptions = {
					type: 'post-comment',
					toUserId: parent.createUser,
					fromUserId: reqUser.id,
					data: {
						parentId: parent._id,
						commentId: comment._id,
						content: options.content.substring(0, 100) // Don't send entire message (is only for notification label)
					}
				};

				pubClient.publish("notify", JSON.stringify(pubOptions));
			}
		}

		return { _id: comment._id };
	},

	async toggleLike(reqUser, commentId) {
		const { iLike, comment } = await Comment.toggleLike(reqUser.id, commentId);

		if (comment && iLike) {
			console.log(comment);

			let pubOptions = {
				type: comment.parentId ? 'comment-like' : 'post-like',
				toUserId: comment.createUser,
				fromUserId: reqUser.id,
				data: {
					commentId: commentId,
					parentId: comment.parentId
				}
			};

			pubClient.publish("notify", JSON.stringify(pubOptions));
		}

		return { state: iLike };
	}
};