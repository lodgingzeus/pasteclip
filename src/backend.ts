import { joinRoom, getRelaySockets, setRelayConnectivity } from 'trystero';
import { createPeerTransport } from './peer';
import type { Clip } from './clipboard';
import type { ConnectionInfo } from './connection';

export function createTransport(onConnection: (info: ConnectionInfo) => void = () => {}) {
  // One room per origin: preview deployments and localhost remain separate.
  const room = joinRoom({ appId: `pasteclip:${location.origin}`, identity: 'none' }, 'clipboard');
  const action = room.makeAction<Clip>('clip');
  let startedAt = Date.now();
  let failure: ConnectionInfo['problem'] = null;
  const report = () => {
    const peers = Object.keys(room.getPeers()).length;
    const relaysOnline = Object.values(getRelaySockets()).filter(socket => socket.readyState === WebSocket.OPEN).length;
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    if (peers > 0) failure = null;
    const problem = peers > 0 ? null : !navigator.onLine ? 'offline' : failure ?? (elapsedSeconds >= 20 && relaysOnline === 0 ? 'discovery' : null);
    onConnection({ peers, relaysOnline, elapsedSeconds, problem });
  };
  return createPeerTransport({
    send: (clip, target) => action.send(clip, target ? { target } : undefined),
    count: () => Object.keys(room.getPeers()).length,
    listen(receive, joined, changed) {
      const timer = setInterval(report, 2000);
      report();
      const stops = [
        action.onMessage(receive),
        room.onPeerJoin(({ peerId }) => { report(); joined(peerId); }),
        room.onPeerLeave(() => { report(); changed(); }),
        room.onError(error => {
          if (error.code === 'peer-connect-failed') failure = 'direct';
          else if (error.code === 'handshake-failed' || error.code === 'decrypt-failed') failure = 'handshake';
          else if (error.code === 'identity-failed') failure = 'browser';
          // An individual relay failure is not fatal if other relays are open.
          report();
        }),
      ];
      return () => { clearInterval(timer); stops.forEach(stop => stop()); };
    },
    reconnect() {
      failure = null;
      startedAt = Date.now();
      setRelayConnectivity('online');
      setRelayConnectivity('auto');
      report();
    },
    close: () => { void room.leave(); },
  });
}
