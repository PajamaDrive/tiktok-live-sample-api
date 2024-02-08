import express from 'express';
import { createServer } from 'http';
import { connectSocket } from './utils/socket.js';

const app = express();
const port = 3000;
const server = createServer(app);

connectSocket(server);

server.listen(port, () => {
	console.log(`app listening port ${port}`);
});
