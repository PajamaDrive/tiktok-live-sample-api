/**
 * 一次関数で計算した値を返す
 * @param {number} x 関数の入力値
 * @return {number} 関数の値
 */
export const linear = (x: number) => x;

/**
 * ニ次関数で計算した値を返す
 * @param {number} x 関数の入力値
 * @return {number} 関数の値
 */
export const quadratic = (x: number) => Math.pow(x, 2.0);

/**
 * シグモイド関数で計算した値を返す
 * @param {number} x 関数の入力値
 * @param {number} slope 関数の係数
 * @return {number} 関数の値
 */
const sigmoid = (x: number, slope: number) => 1.0 / (1 + Math.exp(-slope * x));

/**
 * シグモイド関数で計算して[0,1]に正規化した値を返す
 * @param {number} x 関数の入力値
 * @param {number} slope 関数の係数
 * @param {number} max 最大値
 * @param {number} min 最小値
 * @return {number} 関数の値
 */
export const normalizeSigmoid = (x: number, slope: number, max: number, min: number) =>
	(sigmoid(x, slope) - min) / (max - min);
