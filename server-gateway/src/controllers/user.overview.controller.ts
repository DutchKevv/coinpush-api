import { userController } from './user.controller';

export const userOverviewController = {

	getOverview(reqUser, params?): Promise<any> {
		return userController.findMany(reqUser, params);
	}
};