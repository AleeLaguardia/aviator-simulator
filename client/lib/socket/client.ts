import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from './events';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4100';

export function createSocket(): AppSocket {
  return io(SERVER_URL, {
    transports: ['websocket'],
    autoConnect: true,
  });
}
