export type ConnectionInfo = {
  serviceConnected: boolean;
  peers: number;
  problem: 'offline' | 'service' | null;
};
export const initialConnection: ConnectionInfo = {
  serviceConnected: false,
  peers: 0,
  problem: null,
};

export function connectionMessage(info: ConnectionInfo) {
  if (info.problem === 'offline')
    return 'This browser is offline. Restore its internet connection, then reconnect.';
  if (info.problem === 'service')
    return 'Could not connect to the sharing service. Check your connection and reconnect. Your text stays in this tab.';
  if (!info.serviceConnected)
    return 'Connecting to the sharing service… You can start typing while it connects.';
  if (info.peers > 0) return 'Connected to another browser. Keep both pages open to share live.';
  return 'Ready to share. Open this same URL on your other device and keep both pages open.';
}
