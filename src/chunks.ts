export type Chunk = { id: string; sender: string; target?: string; index: number; total: number; data: string };
const CHUNK_SIZE = 12000;

export function splitMessage(value: unknown, sender: string, target?: string): Chunk[] {
  const data = JSON.stringify(value);
  const id = crypto.randomUUID();
  const total = Math.ceil(data.length / CHUNK_SIZE);
  return Array.from({ length: total }, (_, index) => ({
    id, sender, target, index, total, data: data.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  }));
}

export function createAssembler(self: string, receive: (value: unknown) => void) {
  const messages = new Map<string, { parts: Map<number, string>; total: number; updatedAt: number }>();
  const sweep = () => { for (const [key, message] of messages) if (Date.now() - message.updatedAt > 60000) messages.delete(key); };
  return {
    accept(value: unknown) {
      if (!value || typeof value !== 'object') return;
      const chunk = value as Chunk;
      if (typeof chunk.id !== 'string' || typeof chunk.sender !== 'string' || typeof chunk.data !== 'string' ||
        chunk.sender === self || (chunk.target !== undefined && chunk.target !== self) ||
        !Number.isSafeInteger(chunk.index) || !Number.isSafeInteger(chunk.total) ||
        chunk.index < 0 || chunk.total < 1 || chunk.index >= chunk.total || chunk.data.length > CHUNK_SIZE) return;
      sweep();
      const key = JSON.stringify([chunk.sender, chunk.id]);
      let message = messages.get(key);
      if (!message) {
        if (messages.size >= 64) messages.delete(messages.keys().next().value!);
        message = { parts: new Map(), total: chunk.total, updatedAt: Date.now() };
        messages.set(key, message);
      }
      if (message.total !== chunk.total) return;
      message.updatedAt = Date.now();
      message.parts.set(chunk.index, chunk.data);
      if (message.parts.size !== message.total) return;
      messages.delete(key);
      const text = Array.from({ length: message.total }, (_, index) => message.parts.get(index)!).join('');
      try { receive(JSON.parse(text)); } catch { /* Ignore malformed broadcast data. */ }
    },
    sweep,
    clear: () => messages.clear(),
  };
}
