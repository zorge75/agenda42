import dayjs from 'dayjs';

export interface IEvents extends Partial<any> {
	id?: number;
	start?: Date;
	end?: Date;
	user?: any;
	[key: string]: any;
}
