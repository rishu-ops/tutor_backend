import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socket) {
    // Create the singleton once — never recreate it
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  } else if (token) {
    // If token changed, update auth without destroying the socket
    socket.auth = { token };
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
