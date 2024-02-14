import { Socket, Server as SocketServer } from 'socket.io';
import type { Server } from 'http';
import { WebcastPushConnection } from 'tiktok-live-connector';
import { drawRaffle, drawWeightedRaffle, pickChoice } from './raffle.js';
import { Parameter } from '../types/parameter.js';
import { ConnectState, Gift, GiftEmitMessage } from '../types/tiktokLive.js';
import {
	connectEventName,
	defaultParameter,
	disconnectEventName,
	disconnectMessage
} from '../const/socket.js';
import { randomUUID } from 'crypto';

const parameterMap: Map<string, Parameter> = new Map();

/**
 * Socket.ioのサーバを立てる
 * @param {SocketServer} server httpサーバ
 */
export const setUpSocketServer = (server: Server) => {
	const io = new SocketServer(server, {
		cors: {
			origin: process.env.CLIENT_URL,
			credentials: true,
			methods: ['GET', 'POST']
		}
	});
	io.on('connection', async (socket) => {
		const userId = randomUUID();
		parameterMap.set(userId, defaultParameter);
		socket.join(userId);
		await setConnectTiktokLiveListener(userId, socket, io);
		setParametersListener(userId, socket);
	});
};

/**
 * TikTok Liveとの接続を確立するlistener
 * @param {string} id ユーザID
 * @param {Socket} socket ソケット
 * @param {SocketServer} server Socket.ioサーバ
 * @param {WebcastPushConnection} tiktokLiveConnection Tiktok Liveとの接続情報
 */
const setConnectTiktokLiveListener = async (id: string, socket: Socket, server: SocketServer) => {
	socket.on(connectEventName, async (userName: string) => {
		const tiktokLiveConnection = new WebcastPushConnection(userName);
		await tiktokLiveConnection
			.connect()
			.then((state: ConnectState) => {
				console.log(`Connected to roomID $${state.roomId}`);
				// 接続情報をクライアントに送信
				emitConnect(id, server, state);
				// 各種listenerの設定
				setGiftListener(id, server, tiktokLiveConnection);
				setDisconnectTiktokLiveListener(id, socket, server, tiktokLiveConnection);
			})
			.catch((err) => {
				emitDisconnect(id, server);
				console.log('Failed to connect', err);
			});
	});
};

/**
 * ギフトの通知を受け取るlistener
 * @see https://github.com/zerodytrash/TikTok-Live-Connector#gift
 * @param {string} id ユーザID
 * @param {Socket} socket ソケット
 * @param {SocketServer} server Socket.ioサーバ
 * @param {WebcastPushConnection} tiktokLiveConnection Tiktok Liveとの接続情報
 */
const setGiftListener = (
	id: string,
	server: SocketServer,
	tiktokLiveConnection: WebcastPushConnection
) => {
	tiktokLiveConnection.on('gift', (data: Gift) => {
		// 連続でないギフト or 連続ギフトの終端で実行
		if (data.giftType !== 1 || data.repeatEnd) {
			console.log(
				`[gift] userID: ${data.userId} sends ${data.giftId} | diamonds: ${data.diamondCount} x ${data.repeatCount}`
			);
			emitGift(id, server, data);
		}
	});
};

/**
 * パラメータの更新を行うlistener
 * @param {string} id ユーザID
 * @param {Socket} socket ソケット
 */
const setParametersListener = (id: string, socket: Socket) => {
	socket.on('updateParameters', (message: Parameter) => {
		parameterMap.set(id, message);
		console.log(`Updated Parameter: [${id}] ${JSON.stringify(parameterMap.get(id))}`);
	});
};

/**
 * TikTok Liveとの接続を切断するlistener
 * @param {string} id ユーザID
 * @param {Socket} socket ソケット
 * @param {SocketServer} server Socket.ioサーバ
 * @param {WebcastPushConnection} tiktokLiveConnection Tiktok Liveとの接続情報
 */
const setDisconnectTiktokLiveListener = (
	id: string,
	socket: Socket,
	server: SocketServer,
	tiktokLiveConnection: WebcastPushConnection
) => {
	socket.on(disconnectEventName, () => {
		tiktokLiveConnection.disconnect();
		emitDisconnect(id, server);
	});
};

/**
 * 接続情報を送信
 * @param {string} id ユーザID
 * @param {SocketServer} server Socket.ioサーバ
 * @param {ConnectState} state 接続状態
 */
const emitConnect = (id: string, server: SocketServer, state: ConnectState) => {
	server.to(id).emit(connectEventName, {
		id,
		roomId: state.roomId,
		isConnected: state.isConnected
	});
};

/**
 * 切断情報を送信
 * @param {string} id ユーザID
 * @param {SocketServer} server Socket.ioサーバ
 */
const emitDisconnect = (id: string, server: SocketServer) => {
	server.to(id).emit(disconnectEventName, { ...disconnectMessage, id });
};

/**
 * ギフトを送信する
 * @param {string} id ユーザID
 * @param {SocketServer} server Socket.ioサーバ
 * @param {Gift} gift ギフト
 */
const emitGift = (id: string, server: SocketServer, gift: Gift) => {
	const parameter = parameterMap.get(id);
	if (parameter) {
		const totalDiamond = gift.diamondCount * gift.repeatCount;
		const raffle = drawRaffle(parameter.raffle.probability);
		const weightedRaffle = drawWeightedRaffle(
			totalDiamond,
			parameter.weightedRaffle.limit,
			parameter.weightedRaffle.minProbability,
			parameter.weightedRaffle.maxProbability,
			parameter.weightedRaffle.funcType
		);
		const pick = pickChoice(parameter.pick.choices);
		// 抽選結果をクライアントに送信
		const giftEmitMessage = Object.freeze<GiftEmitMessage>({
			id,
			userName: gift.nickname,
			diamond: totalDiamond,
			raffle,
			weightedRaffle,
			pick
		});
		server.to(id).emit('recieveGift', giftEmitMessage);
		console.log(`[raffle]: ${JSON.stringify(raffle)}`);
		console.log(`[weightedRaffle]: ${JSON.stringify(weightedRaffle)}`);
		console.log(`[pick]: ${JSON.stringify(pick)}`);
	}
};
