import {Schema, model, Types} from 'mongoose';
import {join} from 'path';
import {isEmail} from 'validator';
import {CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');

export const CommentSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true
	},
	username: {
		type: String,
		required: true
	},
	profileImg: {
		type: String,
		required: true
	},
	channelId: {
		type: Schema.Types.ObjectId,
		required: true
	},
	parentId: {
		type: Schema.Types.ObjectId,
	},
	content: {
		type: String,
		required: true
	},
	childCount: {
		type: Number,
		default: 0
	},
	liked: {
		type: [Schema.Types.ObjectId],
		default: []
	},
	likeCount: {
		type: Number,
		default: 0
	},
	created: {
		type: Date,
		default: Date.now
	}
});

CommentSchema.statics.addILike = async function (userId, comments: Array<any>): Promise<any> {

	comments.forEach((comment) => {
		comment.iLike = comment.liked.map(l => l.toString()).includes(userId);
		delete comment.liked;

		if (comment.children) {
			comment.children.forEach(child => {
				child.iLike = child.liked.map(l => l.toString()).includes(userId);
				delete child.liked;
			});
		}
	});

	return comments;
};

CommentSchema.statics.toggleLike = async function (userId, commentId: string): Promise<any> {
	const comment = await this.findById(commentId, {liked: 1, userId: 1, parentId: 1});

	if (!comment)
		return;

	const isLiked = comment.liked.map(l => l.toString()).includes(userId);

	await comment.update(isLiked ? {$pull: {liked: userId}, $inc: {likeCount: -1}} : {$addToSet: {liked: userId}, $inc: {likeCount: 1}});

	return {iLike: !isLiked, comment};
};

export const Comment = model('Comment', CommentSchema);