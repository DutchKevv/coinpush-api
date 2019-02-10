import { Comment } from '../schemas/comment.schema';
import { Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import { IReqUser } from 'coinpush/src/interface/IReqUser.interface';

export const timelineController = {

	/**
	 * find public messages, messages from sources or people you follow
	 * TODO - followers check
	 * 
	 * @param reqUser 
	 * @param params 
	 */
	async get(reqUser: IReqUser, params: { toUserId: string, offset: any, limit: any, sources: any }) {
		const findOptions: any = {
			$or: [{ toUser: null, parentId: null }]
		};

		// filter options
		if (params.sources) {
			params.sources = JSON.parse(params.sources);
			
			if (params.sources && params.sources.length) {
				findOptions.$or.push({ createUser: { "$in": params.sources } });
			}
		}

		const comments = <Array<any>>await Comment
			.find(findOptions)
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

	// /**
	//  * TODO : optimize!!!!
	//  * @param reqUser 
	//  * @param params 
	//  */
	// async get(reqUser: IReqUser, params: any = {}): Promise<any> {

	//     let comments = <Array<any>>await Comment
	// 		.find({toUser: { $exists: false}, parentId: { $eq: undefined } })
	// 		// .find({public: true})
	// 		.skip(parseInt(params.offset, 10) || 0)
	// 		.limit(parseInt(params.limit, 10) || 10)
	// 		.sort({ _id: -1 })
	// 		.populate('createUser')
	// 		.lean();

	// 	comments = await Promise.all(comments.map(async comment => {
	// 		comment.children = await this.findChildren(reqUser, comment._id);
	// 		return comment;
	// 	}));

	// 	(<any>Comment).addILike(reqUser.id, comments);
	// 	comments.forEach((<any>User).normalizeProfileImg);

	// 	return comments;
	// },

	async findChildren(reqUser: IReqUser, parentId: string, params: any = {}) {

		const children = <Array<any>>await Comment
			.find({ parentId: { $eq: Types.ObjectId(parentId) } })
			.sort({ _id: -1 })
			.skip(parseInt(params.offset, 10) || 0)
			.limit(parseInt(params.limit, 10) || 5)
			.populate('createUser')
			.lean();

		children.forEach((<any>User).normalizeProfileImg);

		return children.reverse();
	}
};