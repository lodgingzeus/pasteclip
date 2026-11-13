import { useEffect, useRef, useState } from 'react';
import { createTransport } from '../../realtime/services/broadcastTransport';
import { initialConnection } from '../../realtime/connection';
import { createClipboard, type State } from '../lib/controller';

const initialState: State = {
  text: '',
  ready: false,
  connected: false,
  saving: false,
  error: '',
  updatedAt: null,
};

export function useSharedClipboard(roomId: string | null) {
  const [state, setState] = useState(initialState);
  const [connection, setConnection] = useState(initialConnection);
  const controller = useRef<ReturnType<typeof createClipboard> | null>(null);

  useEffect(() => {
    setState(initialState);
    setConnection(initialConnection);
    try {
      controller.current = createClipboard(createTransport(setConnection, roomId), setState);
    } catch {
      setState({
        ...initialState,
        error: 'Could not initialize sharing. Check the app configuration and reload this page.',
      });
    }
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (controller.current?.hasUnsaved()) event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      controller.current?.dispose();
      controller.current = null;
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [roomId]);

  return {
    state,
    connection,
    edit: (text: string) => controller.current?.edit(text),
    retry: () => (controller.current ? controller.current.retry() : window.location.reload()),
  };
}
