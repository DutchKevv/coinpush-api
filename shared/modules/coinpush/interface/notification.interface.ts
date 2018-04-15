export interface INotification {
    _id: string;
    toUserId: string;
    type: string;
    data?: any;
    fromUserId?: string;
    createDate?: Date;
    readDate?: Date;
    isRead?: boolean;
}