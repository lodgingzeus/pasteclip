export type Clip = { content: string; revision: number; updated_at: string };
export type Transport = {
  read(): Promise<Clip>;
  write(content: string): Promise<Clip>;
  subscribe(onChange: () => void, onStatus: (connected: boolean) => void): () => void;
};
export type State = { text: string; ready: boolean; connected: boolean; saving: boolean; error: string; updatedAt: string | null };

// Serialize local writes; revisions prevent delayed reads from replacing newer text.
export function createClipboard(transport: Transport, notify: (state: State) => void, delay = 300) {
  let state: State = { text: '', ready: false, connected: false, saving: false, error: '', updatedAt: null };
  let latest: Clip | null = null;
  let pending: string | null = null;
  let writing = false;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const emit = () => { if (!disposed) notify({ ...state }); };
  const accept = (clip: Clip) => {
    if (!latest || clip.revision >= latest.revision) latest = clip;
    if (pending === null && !writing) {
      state.text = latest.content;
      state.updatedAt = latest.updated_at;
    }
    state.ready = true;
    emit();
  };
  const refresh = async () => {
    try { accept(await transport.read()); }
    catch { state.error = 'Could not load the shared clipboard. Check your connection and retry.'; emit(); }
  };
  const flush = async () => {
    if (writing || pending === null || disposed) return;
    const value = pending;
    pending = null;
    writing = true;
    state.saving = true;
    state.error = '';
    emit();
    try {
      const clip = await transport.write(value);
      writing = false;
      accept(clip);
      state.saving = pending !== null;
      emit();
      if (pending !== null) void flush();
    } catch {
      writing = false;
      if (pending === null) pending = value;
      state.saving = false;
      state.error = 'Your changes are not saved. Keep this page open and retry.';
      emit();
    }
  };
  const stop = transport.subscribe(() => void refresh(), (connected) => {
    state.connected = connected;
    emit();
    if (connected) { void refresh(); if (pending !== null) void flush(); }
  });
  void refresh();
  return {
    edit(text: string) {
      state.text = text;
      pending = text;
      state.saving = true;
      emit();
      clearTimeout(timer);
      timer = setTimeout(() => void flush(), delay);
    },
    retry() { state.error = ''; emit(); void refresh(); void flush(); },
    hasUnsaved: () => pending !== null || writing,
    dispose() { disposed = true; clearTimeout(timer); stop(); },
  };
}
