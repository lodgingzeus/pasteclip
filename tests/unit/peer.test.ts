import { expect, it } from 'vitest';
import { createPeerTransport, type PeerLink } from '../../src/features/clipboard/lib/snapshots';
import type { Clip } from '../../src/features/clipboard/lib/controller';

function network() {
  const peers = new Map<
    string,
    { receive: (value: unknown) => void; joined: (id: string) => void; changed: () => void }
  >();
  let paused = false;
  const queued: (() => void)[] = [];
  return {
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
      queued.splice(0).forEach((fn) => fn());
    },
    link(id: string): PeerLink {
      return {
        async send(clip, target) {
          for (const [otherId, other] of peers)
            if (otherId !== id && (!target || target === otherId)) {
              const deliver = () => other.receive(structuredClone(clip));
              if (paused) queued.push(deliver);
              else deliver();
            }
        },
        count: () => peers.size - 1,
        listen(receive, joined, changed) {
          peers.set(id, { receive, joined, changed });
          for (const [otherId, other] of peers)
            if (otherId !== id) {
              other.joined(id);
              joined(otherId);
            }
          return () => {
            peers.delete(id);
            peers.forEach((peer) => peer.changed());
          };
        },
        close() {},
      };
    },
  };
}
it('hands text to late joiners, propagates clear, and forgets when every peer leaves', async () => {
  const net = network();
  const a = createPeerTransport(net.link('a'), 'a');
  const stopA = a.subscribe(
    () => {},
    () => {},
  );
  await a.write('Only in browser memory');
  const b = createPeerTransport(net.link('b'), 'b');
  const stopB = b.subscribe(
    () => {},
    () => {},
  );
  expect((await b.read()).content).toBe('Only in browser memory');
  await b.write('');
  expect((await a.read()).content).toBe('');
  await b.write('Reply');
  expect((await a.read()).content).toBe('Reply');
  stopA();
  stopB();
  const c = createPeerTransport(net.link('c'), 'c');
  const stopC = c.subscribe(
    () => {},
    () => {},
  );
  expect((await c.read()).content).toBe('');
  stopC();
});
it('converges simultaneous edits deterministically and ignores older versions', async () => {
  const net = network();
  const a = createPeerTransport(net.link('a'), 'a');
  const b = createPeerTransport(net.link('b'), 'b');
  const stopA = a.subscribe(
    () => {},
    () => {},
  );
  const stopB = b.subscribe(
    () => {},
    () => {},
  );
  net.pause();
  await a.write('A');
  await b.write('B');
  net.resume();
  expect((await a.read()).content).toBe('B');
  expect(await a.read()).toEqual(await b.read());
  stopA();
  stopB();
});
it('rejects malformed peer data without replacing text', async () => {
  let receive!: (clip: unknown) => void;
  const peer = createPeerTransport({
    send: async () => {},
    count: () => 1,
    close() {},
    listen(fn) {
      receive = fn;
      return () => {};
    },
  });
  const stop = peer.subscribe(
    () => {},
    () => {},
  );
  await peer.write('Keep me');
  receive({ content: {}, revision: 99, writer: 'bad', updated_at: '' } as unknown as Clip);
  receive({ content: 'bad', revision: Infinity, writer: 'bad', updated_at: '' });
  expect((await peer.read()).content).toBe('Keep me');
  stop();
});
