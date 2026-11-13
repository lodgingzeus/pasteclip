import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { createPeerTransport } from './peer';
import { createAssembler, splitMessage } from './chunks';
import { supabaseUrl, supabaseKey } from './config';
import type { ConnectionInfo } from './connection';

export function createTransport(onConnection: (info: ConnectionInfo) => void = () => {}) {
  const self = crypto.randomUUID();
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: `pasteclip:${self}` },
  });
  const topic = `pasteclip:${location.origin}`;
  let channel: RealtimeChannel | undefined;
  let connected = false;
  let disposed = false;
  let restarting = false;
  let peers = new Set<string>();
  let problem: ConnectionInfo['problem'] = null;
  let receive: (value: unknown) => void = () => {};
  let joined: (id: string) => void = () => {};
  let changed = () => {};
  const assembler = createAssembler(self, value => receive(value));
  const report = () => {
    if (disposed) return;
    onConnection({ serviceConnected: connected, peers: connected ? peers.size : 0, problem: !navigator.onLine ? 'offline' : problem });
    changed();
  };
  const start = () => {
    if (disposed) return;
    problem = null;
    const current = client.channel(topic, {
      config: { private: false, broadcast: { ack: true, self: false }, presence: { key: self } },
    });
    channel = current;
    current.on('broadcast', { event: 'clipboard' }, ({ payload }) => assembler.accept(payload));
    current.on('presence', { event: 'sync' }, () => {
      if (disposed || channel !== current || !connected) return;
      const next = new Set(Object.keys(current.presenceState()).filter(id => id !== self));
      const added = [...next].filter(id => !peers.has(id));
      peers = next;
      report();
      added.forEach(joined);
    });
    current.subscribe(status => {
      if (disposed || channel !== current) return;
      connected = status === 'SUBSCRIBED';
      if (!connected) peers.clear();
      problem = connected ? null : 'service';
      report();
      if (connected) void current.track({ online: true }).then(result => {
        if (!disposed && channel === current && result !== 'ok') { problem = 'service'; report(); }
      }).catch(() => { if (!disposed && channel === current) { problem = 'service'; report(); } });
    });
    report();
  };
  const reconnect = () => {
    if (disposed || restarting) return;
    restarting = true;
    connected = false;
    peers.clear();
    problem = null;
    const previous = channel;
    channel = undefined;
    assembler.clear();
    report();
    void (previous ? client.removeChannel(previous) : Promise.resolve()).then(() => {
      restarting = false;
      start();
    }).catch(() => { restarting = false; problem = 'service'; report(); });
  };
  return createPeerTransport({
    rebroadcast: false,
    async send(clip, target) {
      if (!connected || !channel) throw new Error('Sharing service is disconnected');
      if (peers.size === 0) return;
      const current = channel;
      for (const payload of splitMessage(clip, self, target)) {
        if (disposed || !connected || channel !== current) throw new Error('Connection changed during transfer');
        const result = await current.send({ type: 'broadcast', event: 'clipboard', payload });
        if (result !== 'ok') throw new Error('Broadcast was not acknowledged');
      }
    },
    count: () => connected ? peers.size : 0,
    listen(onReceive, onJoin, onChange) {
      receive = onReceive; joined = onJoin; changed = onChange;
      const timer = setInterval(() => { assembler.sweep(); report(); }, 5000);
      window.addEventListener('online', reconnect);
      window.addEventListener('offline', report);
      start();
      return () => {
        clearInterval(timer);
        window.removeEventListener('online', reconnect);
        window.removeEventListener('offline', report);
        receive = () => {}; joined = () => {}; changed = () => {};
      };
    },
    reconnect,
    close() {
      disposed = true;
      assembler.clear();
      if (channel) void client.removeChannel(channel);
    },
  });
}
