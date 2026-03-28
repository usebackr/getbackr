/**
 * Socket.io integration stub.
 *
 * Full Socket.io integration requires a custom Next.js server (e.g. `server.ts` using
 * `createServer` from `http` + `new Server(httpServer)` from `socket.io`). The default
 * Next.js dev server does not expose the underlying HTTP server, so Socket.io cannot be
 * attached to it directly.
 *
 * To enable real-time dashboard updates in production:
 *  1. Create a custom `server.ts` at the project root.
 *  2. Attach `new Server(httpServer, { cors: { origin: '*' } })` to the HTTP server.
 *  3. Replace the `getSocketServer()` stub below with a reference to that instance.
 *  4. Call `emitDashboardUpdate(campaignId)` from the payments webhook handler after
 *     crediting the project wallet.
 *
 * The `dashboard:update` event is emitted to the room `campaign:{campaignId}`.
 * Clients join the room via: `socket.emit('join', campaignId)`.
 */

import type { Server as SocketIOServer } from 'socket.io';

let _socketServer: SocketIOServer | null = null;

/**
 * Returns the Socket.io server instance, or null if not yet initialised.
 * Full Socket.io integration requires a custom Next.js server.
 */
export function getSocketServer(): SocketIOServer | null {
  return _socketServer;
}

/**
 * Registers the Socket.io server instance (called from the custom server bootstrap).
 */
export function setSocketServer(io: SocketIOServer): void {
  _socketServer = io;
}

/**
 * Emits a `dashboard:update` event to all clients in the campaign's Socket.io room.
 * TODO: replace stub with real emission once custom server is wired up.
 */
export function emitDashboardUpdate(campaignId: string): void {
  const io = getSocketServer();
  if (!io) {
    // TODO: Socket.io server not initialised — requires custom Next.js server setup.
    console.log(`[socket] TODO: emit dashboard:update for campaign ${campaignId}`);
    return;
  }
  io.to(`campaign:${campaignId}`).emit('dashboard:update', { campaignId });
}
