import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Clip, Transport } from './clipboard';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key && !url.includes('your-project') && !key.includes('your-publishable'));
let sharedClient: SupabaseClient | undefined;

export function createTransport(): Transport {
  const client = sharedClient ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return {
    async read() {
      const { data, error } = await client.from('clipboard').select('content, revision, updated_at').eq('id', 1).single();
      if (error) throw error;
      return data as Clip;
    },
    async write(content) {
      const { data, error } = await client.rpc('write_clipboard', { new_content: content }).single();
      if (error) throw error;
      return data as Clip;
    },
    subscribe(onChange, onStatus) {
      const channel = client.channel('shared-clipboard').on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'clipboard', filter: 'id=eq.1',
      }, onChange).subscribe((status) => onStatus(status === 'SUBSCRIBED'));
      // Reconcile missed events and large payloads as well as returning tabs.
      const interval = setInterval(onChange, 10000);
      const onVisible = () => { if (document.visibilityState === 'visible') onChange(); };
      window.addEventListener('online', onChange);
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        clearInterval(interval);
        window.removeEventListener('online', onChange);
        document.removeEventListener('visibilitychange', onVisible);
        void client.removeChannel(channel);
      };
    },
  };
}
