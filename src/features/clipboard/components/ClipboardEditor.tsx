import { useEffect, useRef, useState } from 'react';
import { Check, Clipboard, Copy, Trash2 } from 'lucide-react';
import type { State } from '../lib/controller';

type Props = { state: State; status: string; isRoom: boolean; onEdit: (text: string) => void };

export default function ClipboardEditor({ state, status, isRoom, onEdit }: Props) {
  const editor = useRef<HTMLTextAreaElement>(null);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(''), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(state.text);
      setFeedback('Copied to your clipboard');
    } catch {
      editor.current?.focus();
      editor.current?.select();
      setFeedback('Text selected. Press Ctrl+C or ⌘C to copy.');
    }
  }
  const wordCount = state.text.trim() ? state.text.trim().split(/\s+/).length : 0;
  return (
    <>
      <section className="clipboard-card" aria-label="Shared clipboard">
        <div className="card-toolbar">
          <div className="card-title">
            <Clipboard size={18} />
            <h2>Shared clipboard</h2>
            <span className="public-label">{isRoom ? 'ROOM' : 'PUBLIC'}</span>
          </div>
          <span
            className={`sync-status ${state.connected && !state.error ? 'online' : ''}`}
            role="status"
          >
            <span className="tiny-dot" />
            {status}
          </span>
        </div>
        <div className="editor-wrap">
          <textarea
            ref={editor}
            aria-label="Clipboard text"
            value={state.text}
            onChange={(event) => onEdit(event.target.value)}
            disabled={!state.ready}
            placeholder="Paste or type something here…"
            spellCheck={false}
          />
          {!state.text && (
            <div className="empty-hint" aria-hidden="true">
              <span className="keyboard">⌘ V</span>
              <span>or just start typing. Keep this page open.</span>
            </div>
          )}
        </div>
        <div className="card-footer">
          <span className="counts">
            {state.text.length.toLocaleString()} characters<span className="count-divider">/</span>
            {wordCount.toLocaleString()} words
          </span>
          <div className="actions">
            <button
              className="clear-button"
              disabled={!state.text || !state.ready}
              onClick={() => {
                onEdit('');
                editor.current?.focus();
              }}
            >
              <Trash2 size={16} /> Clear
            </button>
            <button className="copy-button" disabled={!state.text} onClick={copy}>
              {feedback.startsWith('Copied') ? <Check size={16} /> : <Copy size={16} />}{' '}
              {feedback.startsWith('Copied') ? 'Copied!' : 'Copy text'}
            </button>
          </div>
        </div>
      </section>
      <span className="sr-only" role="status">
        {feedback}
      </span>
    </>
  );
}
