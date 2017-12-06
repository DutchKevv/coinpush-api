import { User } from '../schemas/user.schema';
import { IReqUser } from "../../../shared/interfaces/IReqUser.interface";

export const favoriteController = {

    async toggle(reqUser: IReqUser, symbol: string): Promise<{ state: boolean }> {

        const state = await (<any>User).toggleFavorite(reqUser.id, symbol);

        return { state };
    }
};

