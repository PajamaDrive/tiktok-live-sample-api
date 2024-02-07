import { FUNC_TYPE } from '../types/function.js';
import { linear, normalizeSigmoid, quadratic } from './function.js';

/**
 * 重みなしの当落判定を行う
 * @param {number} probability 確率
 * @return {object} 確率・判定結果
 */
export const drawRaffle = (probability: number) => {
	const threshold = 1 - probability;
	const result = Math.random() >= threshold;
	return {
		probability,
		result
	};
};

/**
 * 重みつきの当落判定を行う
 * @param {number} num 入力値
 * @param {number} limit 入力の最大値
 * @param {number} minProbability 確率の最小値
 * @param {number} maxProbability 確率の最大値
 * @param {FUNC_TYPE} funcType 関数の種別
 * @return {object} 確率・判定結果
 */
export const drawWeightedRaffle = (
	num: number,
	limit: number,
	minProbability: number,
	maxProbability: number,
	funcType: FUNC_TYPE
) => {
	const ratio = num / limit;
	const probability = Math.min(
		Math.max(minProbability, getFuncValue(ratio, funcType)),
		maxProbability
	);
	const threshold = 1 - probability;
	const result = Math.random() >= threshold;
	return {
		probability,
		result,
		funcType
	};
};

/**
 * 選択肢の中から1つ選ぶ
 * @param {T[]} choices 選択肢
 * @return {object} 選択肢・当選した値
 */
export const pickChoice = <T>(choices: T[]) => {
	const choiceCount = choices.length;
	const result = choices[Math.floor(Math.random() * choiceCount)];
	return {
		choices,
		result
	};
};

/**
 * 関数の値を計算する
 * @param {number} value 入力値
 * @param {FUNC_TYPE} funcType 関数の種別
 * @return {number} 関数の値
 */
const getFuncValue = (value: number, funcType: FUNC_TYPE) => {
	switch (funcType) {
		case FUNC_TYPE.LINEAR:
			return linear(value);
		case FUNC_TYPE.QUADRATIC:
			return quadratic(value);
		default:
			return normalizeSigmoid(value, 5, 1, 0.5);
	}
};
