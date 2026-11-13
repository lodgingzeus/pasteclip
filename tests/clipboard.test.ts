import { describe, it, expect } from 'vitest';
import { createClipboard, type Clip, type State, type Transport } from '../src/clipboard';
const settle = () => new Promise(resolve => setTimeout(resolve, 20));
function backend() {
  let clip: Clip = { content: '', revision: 0, updated_at: new Date().toISOString() };
  const listeners = new Set<() => void>();
  const transport: Transport = {
    read: async () => ({ ...clip }),
    write: async content => {
      clip = { content, revision: clip.revision + 1, updated_at: new Date().toISOString() };
      listeners.forEach(fn => fn());
      return { ...clip };
    },
    subscribe: fn => { listeners.add(fn); return () => { listeners.delete(fn); }; },
  };
  return transport;
}
describe('shared clipboard', () => {
  it('shares edits, clears, replacements, and content with a later visitor', async () => {
    const transport = backend();
    let a!: State, b!: State, c!: State;
    const first = createClipboard(transport, value => { a = value; }, 0);
    const second = createClipboard(transport, value => { b = value; }, 0);
    await settle();
    first.edit('Hello from device one');
    await settle();
    expect(b.text).toBe('Hello from device one');
    second.edit('');
    await settle();
    expect(a.text).toBe('');
    second.edit('Reply from device two');
    await settle();
    expect(a.text).toBe('Reply from device two');
    const third = createClipboard(transport, value => { c = value; }, 0);
    await settle();
    expect(c.text).toBe('Reply from device two');
    first.dispose(); second.dispose(); third.dispose();
  });
  it('retains failed writes and retries them', async () => {
    const transport = backend();
    const write = transport.write;
    transport.write = async () => { throw new Error('offline'); };
    let state!: State;
    const client = createClipboard(transport, value => { state = value; }, 0);
    await settle();
    client.edit('Do not lose me');
    await settle();
    expect(state.text).toBe('Do not lose me');
    expect(state.error).toContain('could not be shared');
    expect(client.hasUnsaved()).toBe(true);
    transport.write = write;
    client.retry();
    await settle();
    expect((await transport.read()).content).toBe('Do not lose me');
    expect(client.hasUnsaved()).toBe(false);
    expect(state.error).toBe('');
    client.dispose();
  });
  it('serializes in-flight writes and keeps the newest local draft', async () => {
    const transport = backend();
    const write = transport.write;
    let finish!: () => void;
    transport.write = content => new Promise(resolve => { finish = () => { void write(content).then(resolve); }; });
    let state!: State;
    const client = createClipboard(transport, value => { state = value; }, 0);
    await settle();
    client.edit('First draft'); await settle();
    client.edit('Newest draft'); await settle();
    finish(); await settle();
    expect(state.text).toBe('Newest draft');
    finish(); await settle();
    expect((await transport.read()).content).toBe('Newest draft');
    expect(state.saving).toBe(false);
    client.dispose();
  });
  it('does not truncate large text', async () => {
    const transport = backend();
    let state!: State;
    const client = createClipboard(transport, value => { state = value; }, 0);
    await settle();
    const large = 'paste 📝\n'.repeat(30000);
    client.edit(large); await settle();
    expect(state.text).toBe(large);
    expect((await transport.read()).content).toBe(large);
    client.dispose();
  });
});
