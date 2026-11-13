import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createTransport } from '../src/backend';
import { connectionMessage, type ConnectionInfo } from '../src/connection';

const fake = vi.hoisted(() => ({
  onError: undefined as undefined | ((error: { code: string }) => void),
  peers: {} as Record<string, unknown>,
  sockets: {} as Record<string, { readyState: number }>,
  reconnect: vi.fn(),
  leave: vi.fn(),
}));
vi.mock('trystero', () => ({
  getRelaySockets: () => fake.sockets,
  setRelayConnectivity: fake.reconnect,
  joinRoom: () => ({
    getPeers: () => fake.peers,
    makeAction: () => ({ send: async () => {}, onMessage: () => () => {} }),
    onPeerJoin: () => () => {},
    onPeerLeave: () => () => {},
    onError: (callback: typeof fake.onError) => { fake.onError = callback; return () => { fake.onError = undefined; }; },
    leave: fake.leave,
  }),
}));
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('location', { origin: 'https://pasteclip.test' });
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('WebSocket', { OPEN: 1 });
  fake.sockets = {}; fake.peers = {}; fake.reconnect.mockClear();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('reports failure of direct WebRTC separately from relay discovery', () => {
  fake.sockets = { relay: { readyState: 1 } };
  let info!: ConnectionInfo;
  const transport = createTransport(value => { info = value; });
  const stop = transport.subscribe(() => {}, () => {});
  fake.onError!({ code: 'peer-connect-failed' });
  expect(info.problem).toBe('direct');
  expect(info.relaysOnline).toBe(1);
  expect(connectionMessage(info)).toContain('TURN relay');
  fake.peers = { peer: {} };
  vi.advanceTimersByTime(2000);
  expect(info.problem).toBe(null);
  expect(info.peers).toBe(1);
  stop();
});
it('reports unreachable discovery after a timeout and retries without losing text', async () => {
  let info!: ConnectionInfo;
  const transport = createTransport(value => { info = value; });
  const stop = transport.subscribe(() => {}, () => {});
  await transport.write('My draft');
  vi.advanceTimersByTime(20000);
  expect(info.problem).toBe('discovery');
  expect(connectionMessage(info)).toContain('Cannot reach the discovery service');
  transport.reconnect!();
  expect(fake.reconnect.mock.calls).toEqual([['online'], ['auto']]);
  expect(info.problem).toBe(null);
  expect((await transport.read()).content).toBe('My draft');
  stop();
  expect(fake.onError).toBeUndefined();
  expect(vi.getTimerCount()).toBe(0);
});
it('does not label one failed relay as a total discovery failure', () => {
  fake.sockets = { healthy: { readyState: 1 }, failed: { readyState: 3 } };
  let info!: ConnectionInfo;
  const transport = createTransport(value => { info = value; });
  const stop = transport.subscribe(() => {}, () => {});
  vi.advanceTimersByTime(20000);
  fake.onError!({ code: 'relay-failed' });
  expect(info.problem).toBe(null);
  expect(connectionMessage(info)).toContain('same clipboard URL');
  stop();
});
