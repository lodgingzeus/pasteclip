import { expect, it, vi } from 'vitest';
import { createAssembler, splitMessage } from '../../src/features/realtime/lib/chunks';

it('reassembles large Unicode text out of order without truncation', () => {
  const value = { content: '📝\n\u0000'.repeat(40000), revision: 1, writer: 'sender' };
  const chunks = splitMessage(value, 'sender', 'receiver');
  const receive = vi.fn();
  const assembler = createAssembler('receiver', receive);
  expect(chunks.length).toBeGreaterThan(1);
  for (const chunk of [...chunks].reverse()) assembler.accept(chunk);
  expect(receive).toHaveBeenCalledExactlyOnceWith(value);
});
it('ignores messages for other tabs and malformed metadata', () => {
  const receive = vi.fn();
  const assembler = createAssembler('receiver', receive);
  const [chunk] = splitMessage('hello', 'sender', 'someone-else');
  assembler.accept(chunk);
  assembler.accept({ ...chunk, target: 'receiver', index: -1 });
  assembler.accept({ ...chunk, target: 'receiver', sender: 'receiver' });
  expect(receive).not.toHaveBeenCalled();
});
it('expires partial transfers and never delivers partial text', () => {
  vi.useFakeTimers();
  try {
    const receive = vi.fn();
    const assembler = createAssembler('receiver', receive);
    const chunks = splitMessage('x'.repeat(20000), 'sender');
    assembler.accept(chunks[0]);
    vi.advanceTimersByTime(61000);
    assembler.sweep();
    assembler.accept(chunks[1]);
    expect(receive).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});
