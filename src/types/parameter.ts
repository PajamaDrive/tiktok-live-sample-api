import { FUNC_TYPE } from './function.js';

interface RaffleParameter {
	probability: number;
}

interface WeightedRaffleParameter {
	limit: number;
	minProbability: number;
	maxProbability: number;
	funcType: FUNC_TYPE;
}

interface PickParameter {
	choices: string[];
}

export interface Parameter {
	raffle: RaffleParameter;
	weightedRaffle: WeightedRaffleParameter;
	pick: PickParameter;
}
