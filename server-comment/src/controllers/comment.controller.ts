import {Comment} from '../schemas/comment';
import {Types} from 'mongoose';

const config = require('../../../tradejs.config');

export const commentController = {

	async findById(reqUser, id: string): Promise<any> {
		const comment = await Comment.findById(id).lean();

		if (!comment)
			return;

		Comment.addILike(reqUser.id, [comment]);

		return comment;
	},

	async findByChannelId(reqUser, channelId) {
		let comments = await Comment.find({channelId, parentId: {$eq: undefined}}).sort({_id: -1}).limit(20).lean();

		comments = await Promise.all(comments.map(async comment => {
			comment.children = (await Comment.find({parentId: {$eq: Types.ObjectId(comment._id)}}).sort({_id: -1}).limit(5).lean()).reverse();
			return comment;
		}));

		Comment.addILike(reqUser.id, comments);

		return comments;
	},

	async create(reqUser, options): Promise<any> {
		console.log(options);

		const comment = await Comment.create({
			userId: reqUser.id,
			channelId: options.channelId,
			parentId: options.parentId,
			content: options.content,
			username: options.name,
			profileImg: options.profileImg
		});

		console.log('asdfsadf', comment);

		if (options.parentId) {
			await Comment.update({_id: comment.parentId}, {$inc: {childCount: 1}});
		}

		return {_id: comment._id};
	},

	async toggleLike(reqUser, commentId) {
		const isLiked = await Comment.toggleLike(reqUser.id, commentId);
		return {state: isLiked};
	}
};