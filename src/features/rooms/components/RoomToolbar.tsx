import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Link, Plus, Users } from 'lucide-react';
import { createRoom, parseRoomInput, type Room } from '../rooms';

type Props = { room: Room; roomUrl: string; participants: number };

export default function RoomToolbar({ room, roomUrl, participants }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const linkInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(''), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  function join(event: FormEvent) {
    event.preventDefault();
    const destination = parseRoomInput(input, location.origin);
    if (!destination) {
      setError('Enter a valid room code or a room link from this site.');
      return;
    }
    if (destination.path === room.path) {
      setError('You are already in this room.');
      return;
    }
    window.location.assign(destination.path);
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setFeedback('Link copied');
    } catch {
      linkInput.current?.focus();
      linkInput.current?.select();
      setFeedback('Link selected. Press Ctrl+C or ⌘C to copy.');
    }
  }

  return (
    <section className="room-panel" aria-label="Room controls">
      <div className="room-heading">
        <div>
          <span className="eyebrow">{room.id ? 'YOUR SHARED ROOM' : 'THE PUBLIC SPACE'}</span>
          <h2>{room.title}</h2>
        </div>
        <span className="participant-count">
          <Users size={15} />
          {participants} {participants === 1 ? 'person' : 'people'} here
        </span>
      </div>
      <div className="room-share">
        <input
          ref={linkInput}
          aria-label="Room link"
          value={roomUrl}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
        />
        <button className="room-button secondary" onClick={copyLink}>
          {feedback === 'Link copied' ? <Check size={15} /> : <Link size={15} />}{' '}
          {feedback === 'Link copied' ? 'Link copied' : 'Copy link'}
        </button>
        <button
          className="room-button primary"
          onClick={() => window.location.assign(createRoom().path)}
        >
          <Plus size={15} /> Create new room
        </button>
      </div>
      <form className="room-join" onSubmit={join}>
        <label htmlFor="room-input">Join a room</label>
        <input
          id="room-input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setError('');
          }}
          placeholder="Paste a room link or code"
          aria-describedby={error ? 'room-error' : undefined}
          aria-invalid={Boolean(error)}
          required
        />
        <button className="room-button secondary" type="submit">
          Join room
        </button>
      </form>
      {error && (
        <p id="room-error" className="room-error" role="alert">
          {error}
        </p>
      )}
      <p className="room-hint">
        Share the link so others can contribute. Keep a tab open to keep the text.{' '}
        {room.id && <a href="/">Public clipboard</a>}
      </p>
      <span className="sr-only" role="status">
        {feedback}
      </span>
    </section>
  );
}
