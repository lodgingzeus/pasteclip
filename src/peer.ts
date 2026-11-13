import { compareClips, type Clip, type Transport } from './clipboard';

export type PeerLink = {
  send(clip: Clip, target?: string): Promise<void>;
  listen(receive: (clip: unknown) => void, joined: (id: string) => void, changed: () => void): () => void;
  count(): number;
  close(): void;
};

export function createPeerTransport(link: PeerLink, writer = crypto.randomUUID()): Transport {
  let clip: Clip = { content: '', revision: 0, writer: '', updated_at: '' };
  return {
    read: async () => ({ ...clip }),
    async write(content) {
      clip = { content, revision: clip.revision + 1, writer, updated_at: new Date().toISOString() };
      await link.send(clip);
      return { ...clip };
    },
    subscribe(onChange, onStatus) {
      const status = () => onStatus(link.count() > 0);
      const share = (target?: string) => { void link.send(clip, target).catch(() => onStatus(false)); };
      const stop = link.listen(value => {
        if (!value || typeof value !== 'object') return;
        const incoming = value as Clip;
        if (typeof incoming.content !== 'string' || typeof incoming.writer !== 'string' ||
          typeof incoming.updated_at !== 'string' || !Number.isSafeInteger(incoming.revision) || incoming.revision < 0) return;
        if (compareClips(incoming, clip) > 0) {
          clip = incoming;
          onChange();
          share();
        }
      }, id => { status(); share(id); }, status);
      // Repair missed messages and synchronize peers after a suspended tab resumes.
      const timer = setInterval(() => { status(); share(); }, 10000);
      status();
      return () => { clearInterval(timer); stop(); link.close(); };
    },
  };
}
