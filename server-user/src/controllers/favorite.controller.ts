import { User } from '../schemas/user.schema';
import { IReqUser } from "coinpush/src/interface/IReqUser.interface";

export const favoriteController = {

    async set(reqUser: IReqUser, symbol: string): Promise<void> {
        await (<any>User).setFavorite(reqUser.id, symbol);
    },

    async unset(reqUser: IReqUser, symbol: string): Promise<void> {
        await (<any>User).unsetFavorite(reqUser.id, symbol);
    }
};

