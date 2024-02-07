import { Socket, Server as SocketServer } from 'socket.io';
import type { Server } from 'http';
import { WebcastPushConnection } from 'tiktok-live-connector';
import { drawRaffle, drawWeightedRaffle, pickChoice } from './raffle.js';
import { Parameter } from '../types/parameter.js';
import { ConnectState, Gift, GiftEmitMessage } from '../types/tiktokLive.js';
import { connectEventName, disconnectEventName, disconnectMessage } from '../const/socket.js';
import { FUNC_TYPE } from '../types/function.js';

let parameter: Parameter = {
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
};

export const connectSocket = (server: Server) => {
	const io = new SocketServer(server, {
		cors: {
			origin: 'http://localhost:5173',
			credentials: true,
			methods: ['GET', 'POST']
		}
	});
	io.on('connection', async (socket) => {
		await setConnectTiktokLiveListener(socket, io);
		setParametersListener(socket);
	});
};

/**
 * TikTok Liveとの接続を確率するlistener
 * @param {Socket} socket ソケット
 * @param {SocketServer} server Socket.ioサーバ
 * @param {WebcastPushConnection} tiktokLiveConnection Tiktok Liveとの接続情報
 */
const setConnectTiktokLiveListener = async (socket: Socket, server: SocketServer) => {
	socket.on(connectEventName, async (userName: string) => {
		const tiktokLiveConnection = new WebcastPushConnection(userName);
		await tiktokLiveConnection
			.connect()
			.then((state: ConnectState) => {
				console.log(`Connected to roomID $${state.roomId}`);
				// 接続情報をクライアントに送信
				emitConnect(server, state);
				// 各種listenerの設定
				setGiftListener(server, tiktokLiveConnection);
				setDisconnectTiktokLiveListener(socket, server, tiktokLiveConnection);
			})
			.catch((err) => {
				emitDisconnect(server);
				console.log('Failed to connect', err);
			});
	});
};

/**
 * ギフトの通知を受け取るlistener
 * @see https://github.com/zerodytrash/TikTok-Live-Connector#gift
 * @param {Socket} socket ソケット
 * @param {SocketServer} server Socket.ioサーバ
 * @param {WebcastPushConnection} tiktokLiveConnection Tiktok Liveとの接続情報
 */
const setGiftListener = (server: SocketServer, tiktokLiveConnection: WebcastPushConnection) => {
	tiktokLiveConnection.on('gift', (data: Gift) => {
		// 連続でないギフト or 連続ギフトの終端で実行
		if (data.giftType !== 1 || data.repeatEnd) {
			console.log(
				`[gift] userID: ${data.userId} sends ${data.giftId} | diamonds: ${data.diamondCount} x ${data.repeatCount}`
			);
			emitGift(server, data);
		}
	});
};

/**
 * パラメータの更新を行うlistener
 * @param {Socket} socket ソケット
 */
const setParametersListener = (socket: Socket) => {
	socket.on('updateParameters', (message: Parameter) => {
		parameter = message;
		console.log(`Updated Parameter: ${JSON.stringify(parameter)}`);
	});
};

/**
 * TikTok Liveとの接続を切断するlistener
 * @param {Socket} socket ソケット
 * @param {SocketServer} server Socket.ioサーバ
 * @param {WebcastPushConnection} tiktokLiveConnection Tiktok Liveとの接続情報
 */
const setDisconnectTiktokLiveListener = (
	socket: Socket,
	server: SocketServer,
	tiktokLiveConnection: WebcastPushConnection
) => {
	socket.on(disconnectEventName, () => {
		tiktokLiveConnection.disconnect();
		emitDisconnect(server);
	});
};

/**
 * 接続情報を送信
 * @param {SocketServer} server Socket.ioサーバ
 * @param {ConnectState} state 接続状態
 */
const emitConnect = (server: SocketServer, state: ConnectState) => {
	server.emit(connectEventName, {
		roomId: state.roomId,
		isConnected: state.isConnected
	});
};

/**
 * 切断情報を送信
 * @param {SocketServer} server Socket.ioサーバ
 */
const emitDisconnect = (server: SocketServer) => {
	server.emit(disconnectEventName, disconnectMessage);
};

/**
 * ギフトを送信する
 * @param {SocketServer} server Socket.ioサーバ
 * @param {Gift} gift ギフト
 */
const emitGift = (server: SocketServer, gift: Gift) => {
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
		userName: gift.nickname,
		diamond: totalDiamond,
		raffle,
		weightedRaffle,
		pick
	});
	server.emit('recieveGift', giftEmitMessage);
	console.log(`[raffle]: ${JSON.stringify(raffle)}`);
	console.log(`[weightedRaffle]: ${JSON.stringify(weightedRaffle)}`);
	console.log(`[pick]: ${JSON.stringify(pick)}`);
};
