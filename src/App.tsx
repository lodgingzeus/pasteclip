import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Clipboard, Copy, Globe2, Radio, Trash2 } from 'lucide-react';
import { createTransport } from './backend';
import { connectionMessage, initialConnection } from './connection';
import { createClipboard, type State } from './clipboard';

const initial: State = { text: '', ready: false, connected: false, saving: false, error: '', updatedAt: null };
export default function App() {
  const [state, setState] = useState(initial);
  const [feedback, setFeedback] = useState('');
  const [connection, setConnection] = useState(initialConnection);
  const controller = useRef<ReturnType<typeof createClipboard> | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    try { controller.current = createClipboard(createTransport(setConnection), setState); }
    catch { setState({ ...initial, error: 'Could not initialize sharing. Check the app configuration and reload this page.' }); }
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (controller.current?.hasUnsaved()) event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => { controller.current?.dispose(); controller.current = null; window.removeEventListener('beforeunload', beforeUnload); };
  }, []);
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(''), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);
  async function copy() {
    try { await navigator.clipboard.writeText(state.text); setFeedback('Copied to your clipboard'); }
    catch { editor.current?.focus(); editor.current?.select(); setFeedback('Text selected. Press Ctrl+C or ⌘C to copy.'); }
  }
  const status = state.error || connection.problem ? 'Connection issue' : !state.ready ? 'Connecting…' : state.saving ? 'Sharing…' : state.connected ? 'Live & connected' : 'Waiting for another device';
  return <div className="app-shell">
    <header className="header"><a className="brand" href="/" aria-label="Pasteclip home"><span className="brand-icon"><Copy size={21}/></span>pasteclip<span className="beta">BETA</span></a><span className="header-note"><Globe2 size={15}/> One page. One shared clipboard.</span></header>
    <main>
      <section className="intro"><span className="eyebrow"><span className="tiny-dot"/> A LITTLE SPACE TO SHARE</span><h1>Copy here.<br className="mobile-break"/> Paste anywhere<span className="accent">.</span></h1><p>A thought, a snippet, a link. Drop it here and pick it up on another screen.<br className="desktop-break"/> Everyone on this page sees the same thing, in real time.</p></section>
      {state.error && <aside className="notice error" role="alert">{state.error}<button onClick={() => controller.current ? controller.current.retry() : location.reload()}>Retry connection</button></aside>}
      <aside className={`notice ${connection.problem ? 'error' : ''}`} role="status">
        {connectionMessage(connection)}
        {!state.connected && <button onClick={() => controller.current ? controller.current.retry() : location.reload()}>Reconnect</button>}
      </aside>
      <details className="notice connection-details">
        <summary>Connection details</summary>
        <p>Clipboard URL: <span>{location.origin}/</span></p>
        <p>Sharing service: {connection.serviceConnected ? "Connected" : "Disconnected"} · Other browsers: {connection.peers}</p>
        <p>Text is kept in open browsers, not a database.</p>
      </details>
      <section className="clipboard-card" aria-label="Shared clipboard">
        <div className="card-toolbar"><div className="card-title"><Clipboard size={18}/><h2>Shared clipboard</h2><span className="public-label">PUBLIC</span></div><span className={`sync-status ${state.connected && !state.error ? 'online' : ''}`} role="status"><span className="tiny-dot"/>{status}</span></div>
        <div className="editor-wrap"><textarea ref={editor} aria-label="Clipboard text" value={state.text} onChange={(event) => controller.current?.edit(event.target.value)} disabled={!state.ready} placeholder="Paste or type something here…" spellCheck={false}/>{!state.text && <div className="empty-hint" aria-hidden="true"><span className="keyboard">⌘ V</span><span>or just start typing. Keep this page open.</span></div>}</div>
        <div className="card-footer"><span className="counts">{state.text.length.toLocaleString()} characters<span className="count-divider">/</span>{state.text.trim() ? state.text.trim().split(/\s+/).length.toLocaleString() : 0} words</span><div className="actions"><button className="clear-button" disabled={!state.text || !state.ready} onClick={() => { controller.current?.edit(''); editor.current?.focus(); }}><Trash2 size={16}/> Clear</button><button className="copy-button" disabled={!state.text} onClick={copy}>{feedback.startsWith('Copied') ? <Check size={16}/> : <Copy size={16}/>} {feedback.startsWith('Copied') ? 'Copied!' : 'Copy text'}</button></div></div>
      </section>
      <div className="below-editor"><span><Radio size={14}/> Keep both pages open to share live</span><span>Text disappears when all pages close.</span></div>
      <div className="how-it-works"><div><span className="step-number">01</span><h3>Put it here</h3><p>Paste anything you want to move.</p></div><ArrowUpRight className="step-arrow" size={18}/><div><span className="step-number">02</span><h3>Open it there</h3><p>Visit this page on another device.</p></div><ArrowUpRight className="step-arrow" size={18}/><div><span className="step-number">03</span><h3>Make it yours</h3><p>Copy, clear, and share something new.</p></div></div>
      <p className="public-note"><Globe2 size={14}/> This is a public clipboard. Anyone can read or replace its contents.</p>
      <span className="sr-only" role="status">{feedback}</span>
    </main>
    <footer><span>Less friction. More flow.</span><span>Made for the in-between.</span></footer>
  </div>;
}
