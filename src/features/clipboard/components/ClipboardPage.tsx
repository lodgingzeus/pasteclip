import { ArrowUpRight, Globe2, Radio } from 'lucide-react';
import type { Room } from '../../rooms/rooms';
import RoomToolbar from '../../rooms/components/RoomToolbar';
import ConnectionPanel from '../../realtime/components/ConnectionPanel';
import { useSharedClipboard } from '../hooks/useSharedClipboard';
import ClipboardEditor from './ClipboardEditor';

export default function ClipboardPage({ room }: { room: Room }) {
  const { state, connection, edit, retry } = useSharedClipboard(room.id);
  const roomUrl = `${location.origin}${room.path}`;
  const status =
    state.error || connection.problem
      ? 'Connection issue'
      : !state.ready
        ? 'Connecting…'
        : state.saving
          ? 'Sharing…'
          : state.connected
            ? 'Live & connected'
            : 'Waiting for another device';
  return (
    <>
      <section className="intro">
        <span className="eyebrow">
          <span className="tiny-dot" /> A LITTLE SPACE TO SHARE
        </span>
        <h1>
          Copy here.
          <br className="mobile-break" /> Paste anywhere<span className="accent">.</span>
        </h1>
        <p>
          A thought, a snippet, a link. Drop it here and pick it up on another screen.
          <br className="desktop-break" /> Everyone in this room sees the same thing, in real time.
        </p>
      </section>
      <RoomToolbar
        room={room}
        roomUrl={roomUrl}
        participants={connection.serviceConnected ? connection.peers + 1 : 0}
      />
      <ConnectionPanel
        connection={connection}
        error={state.error}
        roomUrl={roomUrl}
        onRetry={retry}
      />
      <ClipboardEditor state={state} status={status} isRoom={Boolean(room.id)} onEdit={edit} />
      <div className="below-editor">
        <span>
          <Radio size={14} /> Keep your room open to share live
        </span>
        <span>Text disappears when everyone leaves.</span>
      </div>
      <div className="how-it-works">
        <div>
          <span className="step-number">01</span>
          <h3>Make a space</h3>
          <p>Create a room or use the public clipboard.</p>
        </div>
        <ArrowUpRight className="step-arrow" size={18} />
        <div>
          <span className="step-number">02</span>
          <h3>Share the link</h3>
          <p>Open the same room on every device.</p>
        </div>
        <ArrowUpRight className="step-arrow" size={18} />
        <div>
          <span className="step-number">03</span>
          <h3>Contribute together</h3>
          <p>Paste, copy, clear, and share something new.</p>
        </div>
      </div>
      <p className="public-note">
        <Globe2 size={14} /> Anyone with this room’s link can read or replace its contents.
      </p>
    </>
  );
}
