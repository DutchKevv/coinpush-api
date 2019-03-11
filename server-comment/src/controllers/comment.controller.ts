import { Comment } from '../schemas/comment.schema';
import { Types } from 'mongoose';
import { pubClient } from 'coinpush/src/redis';
import { IReqUser } from 'coinpush/src/interface/IReqUser.interface';
import * as request from 'requestretry';
import { Request, RequestAPI } from 'request';

export const commentController = {

	/**
	 * find a specific post by ID
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
					sort: { createdAt: -1 },
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
	 * find all posts directed to specific user
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
			.sort({ createdAt: -1 })
			.populate('createUser')
			.populate('toUser')
			.populate({
				path: 'children',
				populate: { path: 'createUser' },
				options: {
					sort: { createdAt: -1 },
					limit: 5
				}
			})
			.lean();

		(<any>Comment).addILike(reqUser.id, comments);

		return comments;
	},

	/**
	 * 
	 * find many (old timeline?)
	 * TODO - can be deleted I think
	 * 
	 * @param reqUser 
	 * @param userId 
	 */
	async findMany(reqUser, params) {
		let comments = <Array<any>>await Comment
			.find({})
			.skip(parseInt(params.offset, 10) || 0)
			.limit(parseInt(params.limit, 10) || 10)
			.sort({ createdAt: -1 })
			.populate('createUser')
			.populate('toUser')
			.populate({
				path: 'children',
				populate: { path: 'createUser' },
				options: {
					sort: { createdAt: -1 },
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
	 * @param parentId 
	 * @param params 
	 */
	async findChildren(reqUser: IReqUser, parentId: string, params: any = {}) {

		const children = <Array<any>>await Comment
			.find({ parentId: { $eq: Types.ObjectId(parentId) } })
			.sort({ createdAt: -1 })
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
		// Posting on other user wall, otherwhise if own wall, set post as 'global' post (toUserId: undefined)
		const toUserId = options.toUserId && options.toUserId !== reqUser.id ? options.toUserId : undefined;

		const comment = <any>await Comment.create({
			createUser: reqUser.id,
			toUser: toUserId,
			imgs: options.images,
			// public: options.toUserId && options.toUserId !== reqUser.id ? undefined : true,
			parentId: options.parentId,
			content: options.content
		});

		// new post
		if (!options.parentId) {

			// only notify if posting on specific users wall
			if (toUserId && toUserId !== reqUser.id) {
				let pubOptions = {
					type: 'new-wall-post',
					toUserId: toUserId,
					fromUserId: reqUser.id,
					data: {
						commentId: comment._id,
						content: options.content.substring(0, 100) // Don't send entire message (is only for notification label)
					}
				};

				pubClient.publish("notify", JSON.stringify(pubOptions));
			}
		}

		// reaction on post
		else {
			const parent = <any>await Comment.findOneAndUpdate({ _id: comment.parentId }, { $inc: { childCount: 1 }, $addToSet: { children: comment._id } });

			// only notify parent creator, if it is not self
			if (parent && parent.createUser && parent.createUser.toString() !== reqUser.id) {
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

		// save to elastic search
		try {
			const elkObject = {
				mongo_id: comment._id,
				content: comment.content,
				createUser: comment.createUser._id,
				createdAt: comment.createdAt,
				title: comment.title,
				likeCount: comment.likeCount,
				childCount: comment.childCount
			};

			await request({
				method: 'post',
				uri: 'http://elk:9200/comments/doc',
				body: elkObject,
				json: true
			});
		} catch(error) {
			console.error(error);
		}

		return { _id: comment._id };
	},

	createNewsArticle(options: any): Promise<any> {
		options.isNews = true;
		return Comment.create(options);
	},

	/**
	 * 
	 * @param reqUser 
	 * @param commentId 
	 */
	async toggleLike(reqUser, commentId) {
		const { iLike, comment } = await (<any>Comment).toggleLike(reqUser.id, commentId);

		// do not send when liking own message
		if (comment && iLike && comment.createUser && comment.createUser.toString() !== reqUser.id) {

		// if (comment && iLike) {
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