import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createTransport } from '../src/backend';
import { type ConnectionInfo } from '../src/connection';

const fake = vi.hoisted(() => ({ channels: [] as any[], remove: vi.fn(async () => 'ok') }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    removeChannel: fake.remove,
    channel(_topic: string, options: any) {
      const channel = {
        self: options.config.presence.key,
        handlers: {} as Record<string, (...args: any[]) => void>,
        state: {} as Record<string, unknown>,
        status: (_status: string) => {},
        on(type: string, _filter: unknown, handler: (...args: any[]) => void) { this.handlers[type] = handler; return this; },
        subscribe(handler: (status: string) => void) { this.status = handler; return this; },
        track: vi.fn(async () => 'ok'),
        send: vi.fn(async () => 'ok'),
        presenceState() { return this.state; },
      };
      fake.channels.push(channel);
      return channel;
    },
  }),
}));
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('location', { origin: 'https://pasteclip.test' });
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('window', new EventTarget());
  fake.channels.length = 0; fake.remove.mockClear();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('reports a subscribed service separately from other browsers', () => {
  let info!: ConnectionInfo;
  const transport = createTransport(value => { info = value; });
  const stop = transport.subscribe(() => {}, () => {});
  const channel = fake.channels[0];
  channel.status('SUBSCRIBED');
  expect(info.serviceConnected).toBe(true);
  expect(info.peers).toBe(0);
  channel.state = { [channel.self]: [{}], other: [{}] };
  channel.handlers.presence();
  expect(info.peers).toBe(1);
  channel.state = { [channel.self]: [{}] };
  channel.handlers.presence();
  expect(info.peers).toBe(0);
  stop();
});
it('retains a disconnected draft and reconnects with a new subscription', async () => {
  let info!: ConnectionInfo;
  const transport = createTransport(value => { info = value; });
  const stop = transport.subscribe(() => {}, () => {});
  fake.channels[0].status('CHANNEL_ERROR');
  await expect(transport.write('Keep my text')).rejects.toThrow('disconnected');
  expect(info.problem).toBe('service');
  transport.reconnect!();
  await Promise.resolve(); await Promise.resolve();
  expect(fake.channels).toHaveLength(2);
  fake.channels[1].status('SUBSCRIBED');
  expect(info.serviceConnected).toBe(true);
  expect((await transport.read()).content).toBe('Keep my text');
  stop();
  expect(vi.getTimerCount()).toBe(0);
});
it('reports failed broadcast acknowledgments rather than claiming success', async () => {
  const transport = createTransport();
  const stop = transport.subscribe(() => {}, () => {});
  const channel = fake.channels[0];
  channel.status('SUBSCRIBED');
  channel.state = { other: [{}] }; channel.handlers.presence();
  channel.send.mockResolvedValue('timed out');
  await expect(transport.write('Unsent')).rejects.toThrow('not acknowledged');
  expect((await transport.read()).content).toBe('Unsent');
  stop();
});
