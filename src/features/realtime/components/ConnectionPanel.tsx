import { connectionMessage, type ConnectionInfo } from '../connection';

type Props = { connection: ConnectionInfo; error: string; roomUrl: string; onRetry: () => void };

export default function ConnectionPanel({ connection, error, roomUrl, onRetry }: Props) {
  return (
    <>
      {error && (
        <aside className="notice error" role="alert">
          {error}
          <button onClick={onRetry}>Retry connection</button>
        </aside>
      )}
      <aside className={`notice ${connection.problem ? 'error' : ''}`} role="status">
        {connectionMessage(connection)}
        {(!connection.serviceConnected || connection.problem) && (
          <button onClick={onRetry}>Reconnect</button>
        )}
      </aside>
      <details className="notice connection-details">
        <summary>Connection details</summary>
        <p>
          Clipboard URL: <span>{roomUrl}</span>
        </p>
        <p>
          Sharing service: {connection.serviceConnected ? 'Connected' : 'Disconnected'} · Other
          browsers: {connection.peers}
        </p>
        <p>Text is kept in open browsers, not a database.</p>
      </details>
    </>
  );
}
