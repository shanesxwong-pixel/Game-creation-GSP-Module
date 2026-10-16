import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {WebSocketServer, WebSocket} from 'ws';

function multiplayerSocketPlugin(): Plugin {
  return {
    name: 'multiplayer-socket',
    configureServer(server) {
      if (!server.httpServer) return;
      const wss = new WebSocketServer({ noServer: true });
      const rooms = new Map<string, Set<WebSocket>>();
      const clientMeta = new Map<WebSocket, { roomId?: string; playerName?: string; playerColor?: string }>();

      server.httpServer.on('upgrade', (request, socket, head) => {
        const pathname = request.url?.split('?')[0];
        if (pathname === '/ws') {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
          });
        }
      });

      wss.on('connection', (ws) => {
        clientMeta.set(ws, {});

        ws.on('message', (data) => {
          try {
            const msg = JSON.parse(data.toString());
            const meta = clientMeta.get(ws) || {};

            if (msg.type === 'join_room') {
              const { roomId, playerName, playerColor } = msg;
              meta.roomId = roomId;
              meta.playerName = playerName;
              meta.playerColor = playerColor;
              clientMeta.set(ws, meta);

              if (!rooms.has(roomId)) {
                rooms.set(roomId, new Set());
              }
              rooms.get(roomId)!.add(ws);

              // Broadcast user joined to room
              const roomSockets = rooms.get(roomId)!;
              const payload = JSON.stringify({
                type: 'room_notification',
                event: 'user_joined',
                playerName,
                playerColor,
                occupancy: roomSockets.size,
              });
              for (const client of roomSockets) {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(payload);
                }
              }
            } else if (msg.type === 'game_event' || msg.type === 'chat_message' || msg.type === 'sync_state') {
              const roomId = meta.roomId || msg.roomId;
              if (roomId && rooms.has(roomId)) {
                const roomSockets = rooms.get(roomId)!;
                const payload = JSON.stringify(msg);
                for (const client of roomSockets) {
                  if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(payload);
                  }
                }
              }
            }
          } catch {
            // ignore malformed
          }
        });

        ws.on('close', () => {
          const meta = clientMeta.get(ws);
          if (meta?.roomId && rooms.has(meta.roomId)) {
            const roomSockets = rooms.get(meta.roomId)!;
            roomSockets.delete(ws);
            if (roomSockets.size === 0) {
              rooms.delete(meta.roomId);
            } else {
              const payload = JSON.stringify({
                type: 'room_notification',
                event: 'user_left',
                playerName: meta.playerName,
                occupancy: roomSockets.size,
              });
              for (const client of roomSockets) {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(payload);
                }
              }
            }
          }
          clientMeta.delete(ws);
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), multiplayerSocketPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
