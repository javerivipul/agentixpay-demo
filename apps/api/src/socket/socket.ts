import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '@agentix/core';
import { config } from '../config';

let io: SocketIOServer | null = null;

export function setupSocketIO(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: [config.dashboardUrl, config.demoUrl, 'http://localhost:3000', 'http://localhost:3002'],
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');

    socket.on('join:tenant', (tenantId: string) => {
      socket.join(`tenant:${tenantId}`);
      logger.info({ socketId: socket.id, tenantId }, 'Client joined tenant room');
    });

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Client disconnected');
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToTenant(tenantId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, data);
  }
}

export function emitGlobal(event: string, data: unknown): void {
  if (io) {
    io.emit(event, data);
  }
}
