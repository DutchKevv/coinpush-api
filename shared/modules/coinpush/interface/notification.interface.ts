export interface INotification {
    toUserId: string;
    type: string;
    data?: any;
    fromUserId?: string;
    createDate?: Date;
    readDate?: Date;
    isRead?: boolean;
}