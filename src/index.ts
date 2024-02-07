import express from 'express';
import { createServer } from 'http';
import { connectSocket } from './utils/socket.js';

const app = express();
const port = 3001;
const server = createServer(app);

connectSocket(server);

app.get('/', (_, res) => res.send('Sever is Up'));

server.listen(port, () => {
	console.log(`app listening port ${port}`);
});
