import { FUNC_TYPE } from '../types/function.js';
import { Parameter } from '../types/parameter.js';

export const connectEventName = 'connectTiktokLive';
export const disconnectEventName = 'disconnectTiktokLive';
export const disconnectMessage = Object.freeze({
	roomId: null,
	isConnected: false
});
export const defaultParameter = Object.freeze<Parameter>({
	raffle: {
		probability: 0
	},
	weightedRaffle: {
		limit: 0,
		minProbability: 0,
		maxProbability: 0,
		funcType: FUNC_TYPE.LINEAR
	},
	pick: {
		choices: []
	}
});
