import AppShell from '../components/layout/AppShell';
import ClipboardPage from '../features/clipboard/components/ClipboardPage';
import { getRoom } from '../features/rooms/rooms';

export default function App() {
  const room = getRoom(window.location.pathname);
  return (
    <AppShell>
      {room ? (
        <ClipboardPage key={room.path} room={room} />
      ) : (
        <section className="intro">
          <h1>That room link isn’t valid.</h1>
          <p>Check the link you received, or head back to create a new room.</p>
          <a className="text-link" href="/">
            Back to Pasteclip
          </a>
        </section>
      )}
    </AppShell>
  );
}
