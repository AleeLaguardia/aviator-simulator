import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { loadEnv } from './config/env';
import { GameEngine } from './engine/GameEngine';
import { BettingService } from './services/BettingService';
import { PlayerStore } from './services/PlayerStore';
import {
  AppServer,
  registerSocketHandlers,
} from './sockets/registerSocketHandlers';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@aviator/shared';

function bootstrap() {
  const env = loadEnv();

  const app = express();
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ ok: true }));

  const httpServer = createServer(app);
  const io: AppServer = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    { cors: { origin: env.corsOrigin, methods: ['GET', 'POST'] } },
  );

  const engine = new GameEngine();
  const players = new PlayerStore();
  const betting = new BettingService(engine, players);

  registerSocketHandlers({ io, engine, players, betting });

  engine.start();

  httpServer.listen(env.port, () => {
    console.log(`[aviator-server] listening on http://localhost:${env.port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`[aviator-server] received ${signal}, shutting down…`);
    engine.stop();
    io.close();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
