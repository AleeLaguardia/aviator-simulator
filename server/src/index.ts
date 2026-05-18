import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameEngine } from './game';

const PORT = Number(process.env.PORT) || 4100;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const game = new GameEngine(io);
game.start();

io.on('connection', (socket) => {
  game.registerSocket(socket);
});

httpServer.listen(PORT, () => {
  console.log(`[aviator-server] listening on http://localhost:${PORT}`);
});
