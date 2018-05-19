import { Comment } from '../schemas/comment.schema';
import { Types } from 'mongoose';
import { pubClient } from 'coinpush/redis';
import { User } from '../schemas/user.schema';
import { IReqUser } from 'coinpush/interface/IReqUser.interface';

const config = require('../../../tradejs.config.js');

export const commentController = {

	/**
	 * 
	 * @param reqUser 
	 * @param id 
	 * @param params 
	 */
	async findById(reqUser, id: string, params: any = {}): Promise<any> {
		const comment = <any>await Comment
			.findById(id)
			.populate('createUser')
			.populate('toUser')
			.populate({
				options: {
					sort: { created: -1 },
					limit: 5
				},
				path: 'children',
				populate: { path: 'createUser' }
			})
			.lean();

		if (!comment)
			return;

		(<any>Comment).addILike(reqUser.id, [comment]);

		return comment;
	},

	/**
	 * 
	 * @param reqUser 
	 * @param params 
	 */
	async findByToUserId(reqUser, params: { toUserId: string, offset: any, limit: any }) {
		let comments = <Array<any>>await Comment
			.find({
				$or: [
					{ toUser: params.toUserId },
					{
						$and: [{
							toUser: {
								$eq: undefined
							},
							createUser: params.toUserId
						}]
					}
				], parentId: { $eq: undefined }
			})
			.skip(parseInt(params.offset, 10) || 0)
			.limit(parseInt(params.limit, 10) || 10)
			.sort({ _id: -1 })
			.populate('createUser')
			.populate('toUser')
			.populate({
				path: 'children',
				populate: { path: 'createUser' },
				options: {
					sort: { created: -1 },
					limit: 5
				}
			})
			.lean();

		(<any>Comment).addILike(reqUser.id, comments);

		return comments;
	},

	/**
	 * 
	 * @param reqUser 
	 * @param userId 
	 */
	async findMany(reqUser, userId) {
		return [];
	},

	/**
	 * 
	 * @param reqUser 
	 * @param parentId 
	 * @param params 
	 */
	async findChildren(reqUser: IReqUser, parentId: string, params: any = {}) {

		const children = <Array<any>>await Comment
			.find({ parentId: { $eq: Types.ObjectId(parentId) } })
			.sort({ _id: -1 })
			.skip(parseInt(params.offset, 10) || 0)
			.limit(parseInt(params.limit, 10) || 5)
			.populate('createUser')
			.lean();

		return children.reverse();
	},

	/**
	 * 
	 * @param reqUser 
	 * @param options 
	 */
	async create(reqUser, options): Promise<any> {
		const comment = <any>await Comment.create({
			createUser: reqUser.id,
			toUser: options.toUserId && options.toUserId !== reqUser.id ? options.toUserId : undefined,
			// public: options.toUserId && options.toUserId !== reqUser.id ? undefined : true,
			parentId: options.parentId,
			content: options.content
		});

		if (options.parentId) {
			const parent = <any>await Comment.findOneAndUpdate({ _id: comment.parentId }, { $inc: { childCount: 1 }, $addToSet: { children: comment._id } });

			// notify if not responding on self
			if (parent.createUser.toString() !== reqUser.id) {
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

	/**
	 * 
	 * @param reqUser 
	 * @param commentId 
	 */
	async toggleLike(reqUser, commentId) {
		const { iLike, comment } = await (<any>Comment).toggleLike(reqUser.id, commentId);

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