import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createTransport } from '../src/backend';
import { connectionMessage, type ConnectionInfo } from '../src/connection';

const socket = (readyState: number) => Object.assign(new EventTarget(), { readyState });

const fake = vi.hoisted(() => ({
  onError: undefined as undefined | ((error: { code: string }) => void),
  peers: {} as Record<string, unknown>,
  sockets: {} as Record<string, EventTarget & { readyState: number }>,
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
  fake.sockets = { relay: socket(1) };
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
it('reports the library’s aggregate relay failure even when sockets are open', () => {
  fake.sockets = { healthy: socket(1), failed: socket(3) };
  let info!: ConnectionInfo;
  const transport = createTransport(value => { info = value; });
  const stop = transport.subscribe(() => {}, () => {});
  vi.advanceTimersByTime(20000);
  fake.onError!({ code: 'relay-failed' });
  expect(info.problem).toBe('discovery');
  expect(connectionMessage(info)).toContain('Cannot reach the discovery service');
  stop();
});

it('reports relay rate limits even when the WebSocket stays open', () => {
  const relay = socket(1);
  fake.sockets = { relay };
  let info!: ConnectionInfo;
  const transport = createTransport(value => { info = value; });
  const stop = transport.subscribe(() => {}, () => {});
  relay.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(['NOTICE', 'Rate limit exceeded for free connections']) }));
  expect(info.relaysOnline).toBe(1);
  expect(info.relayWarnings).toBe(1);
  expect(info.problem).toBe('relay-rejected');
  expect(connectionMessage(info)).toContain('rate limit');
  vi.advanceTimersByTime(62000);
  expect(info.relayWarnings).toBe(0);
  expect(info.problem).toBe(null);
  stop();
});
