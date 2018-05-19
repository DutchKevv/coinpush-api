import * as nodeMailer from 'nodemailer';
import { userController } from './user.controller';
import { IUser } from 'coinpush/interface/IUser.interface';

const config = require('../../../tradejs.config.js');

const transporter = nodeMailer.createTransport(config.email.account.noReply);

const templates = {
	html: 'Hello {{username}}! \n {{content}}'
};

export const emailController = {

	async newMember(reqUser, params: { userId: string }): Promise<void> {
		const user = <IUser>await userController.findById({ id: params.userId }, params.userId).lean();

		await new Promise((resolve, reject) => {

			const HTML = `Hi there ${user.name} <br /><br />Welcome to <a href="${config.domain.apiUrl}">CoinPush</a>`;

			const mailOptions = {
				from: config.email.account.noReply.auth.user, // sender address
				to: [user.email],
				subject: `Hi there ${user.name} - CoinPush`,
				html: HTML
			};

			transporter.sendMail(mailOptions, (error, info) => {
				if (error)
					return reject(error);

				console.log('Email sent: ' + info.response);
				resolve();
			});
		});
	},

	async requestPasswordReset(reqUser, user: any) {

		return new Promise((resolve, reject) => {

			const url = `${config.domain.apiUrl}/#/symbols/?loginRoute=resetpassword&token=${user.resetPasswordToken}`;
			const HTML = `
Hi there ${user.name} <br /><br />

Click on <a href="${url}">this link</a> to reset your password. This link is valid for 24 hours.
`;

			const mailOptions = {
				from: config.email.account.noReply.auth.user, // sender address
				to: [user.email],
				subject: 'Password reset',
				html: HTML // You can choose to send an HTML body instead
			};

			transporter.sendMail(mailOptions, (error, info) => {
				if (error)
					return reject(error);

				console.log('Email sent: ' + info.response);
				resolve();
			});
		})
	},

	removeAccount(reqUser, userId) {

	}
};