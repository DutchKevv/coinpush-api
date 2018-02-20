export interface ISystemState {
	booting: boolean;
	connected: boolean;
	state: number;
	code: number;
	message?: string;
	workers: number;
	cpu: number
}