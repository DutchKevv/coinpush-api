import * as request from 'requestretry';

export const adminController = {

	async clearElkComments() {
		
		try {
			await request({
				method: 'delete',
				uri: 'http://elk:9200/comments'
			});
		} catch (error) {
			console.error(error);

			throw error;
		}
	}
};
