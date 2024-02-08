import { drawRaffle, drawWeightedRaffle, pickChoice } from '../utils/raffle.js';

interface SocketId {
	socketId: string;
}

export interface GiftEmitMessage extends SocketId {
	socketId: string;
	userName: string;
	diamond: number;
	raffle: ReturnType<typeof drawRaffle>;
	weightedRaffle: ReturnType<typeof drawWeightedRaffle>;
	pick: ReturnType<typeof pickChoice>;
}

/**
 * @see https://github.com/zerodytrash/TikTok-Live-Connector#gift
 */
export interface Gift {
	giftId: number;
	repeatCount: number;
	repeatEnd: boolean;
	userId: number;
	nickname: string;
	giftType: number;
	diamondCount: number;
}

/**
 * @see https://github.com/zerodytrash/TikTok-Live-Connector#connected
 */
export interface ConnectState extends SocketId {
	isConnected: boolean;
	roomId: number;
}
