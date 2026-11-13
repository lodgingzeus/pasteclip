// Open WebSockets can still reject discovery messages. Count recent protocol
// rejections without retaining signaling payloads or clipboard data.
export function watchRelayRejections(getSockets: () => Record<string, WebSocket>, onChange: () => void) {
  const observed = new Map<WebSocket, { rejectedAt: number | null; listener: (event: MessageEvent) => void }>();
  return {
    count() {
      const sockets = new Set(Object.values(getSockets()));
      for (const [socket, entry] of observed) if (!sockets.has(socket)) {
        socket.removeEventListener('message', entry.listener);
        observed.delete(socket);
      }
      for (const socket of sockets) if (!observed.has(socket)) {
        const entry = {
          rejectedAt: null as number | null,
          listener(event: MessageEvent) {
            if (typeof event.data !== 'string') return;
            let message: unknown;
            try { message = JSON.parse(event.data); } catch { return; }
            if (!Array.isArray(message)) return;
            const rejected = message[0] === 'CLOSED' ||
              (message[0] === 'OK' && message[2] === false && !String(message[3]).startsWith('duplicate:')) ||
              (message[0] === 'NOTICE' && /rate.?limit|too many|throttl|reject|denied/i.test(String(message[1])));
            if (rejected) { entry.rejectedAt = Date.now(); onChange(); }
          },
        };
        observed.set(socket, entry);
        socket.addEventListener('message', entry.listener);
      }
      return [...observed.values()].filter(entry => entry.rejectedAt !== null && Date.now() - entry.rejectedAt < 60000).length;
    },
    dispose() {
      for (const [socket, entry] of observed) socket.removeEventListener('message', entry.listener);
      observed.clear();
    },
  };
}
