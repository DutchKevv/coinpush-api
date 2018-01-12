export class EventModel {
    
    constructor(
        public _id: string,
        public createDate: Date,
        public symbol: string,
        public type: number,
        public alarm: {
            price: number;
            dir: number;
        },
        public triggered: boolean,
        public triggeredDate: Date
    ){}    
}