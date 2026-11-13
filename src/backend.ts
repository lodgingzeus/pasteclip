import { joinRoom } from 'trystero';
import { createPeerTransport } from './peer';
import type { Clip } from './clipboard';

export function createTransport() {
  // One room per origin: preview deployments and localhost remain separate.
  const room = joinRoom({ appId: `pasteclip:${location.origin}`, identity: 'none' }, 'clipboard');
  const action = room.makeAction<Clip>('clip');
  return createPeerTransport({
    send: (clip, target) => action.send(clip, target ? { target } : undefined),
    count: () => Object.keys(room.getPeers()).length,
    listen(receive, joined, changed) {
      const stops = [
        action.onMessage(receive),
        room.onPeerJoin(({ peerId }) => joined(peerId)),
        room.onPeerLeave(changed),
      ];
      return () => stops.forEach(stop => stop());
    },
    close: () => { void room.leave(); },
  });
}
