export type ConnectionInfo = {
  relaysOnline: number;
  peers: number;
  elapsedSeconds: number;
  problem: 'offline' | 'discovery' | 'direct' | 'handshake' | 'browser' | null;
};
export const initialConnection: ConnectionInfo = { relaysOnline: 0, peers: 0, elapsedSeconds: 0, problem: null };

export function connectionMessage(info: ConnectionInfo) {
  if (info.peers > 0) return 'Connected to another browser. Keep these pages open.';
  switch (info.problem) {
    case 'offline': return 'This browser is offline. Restore its internet connection, then retry.';
    case 'discovery': return 'Cannot reach the discovery service. Check this device’s connection, VPN, or firewall, then retry.';
    case 'direct': return 'Another browser was found, but the direct connection failed. A VM’s NAT, VPN, or firewall may be blocking it. Try a bridged VM adapter or another network. Otherwise, this connection needs a TURN relay.';
    case 'handshake': return 'The connection handshake failed. Refresh both devices so they use the same app version, then retry.';
    case 'browser': return 'This browser could not initialize peer sharing. Try an updated browser with WebRTC enabled.';
    default: return info.elapsedSeconds >= 20
      ? 'Still looking for another browser. Check that both devices show the same clipboard URL below and keep both tabs active. A virtual machine may need bridged networking.'
      : 'Open this same URL on your other device and keep both pages open while they connect.';
  }
}
