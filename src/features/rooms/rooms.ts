export type Room = { id: string | null; path: string; title: string };
const roomIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const publicRoom: Room = { id: null, path: '/', title: 'Public clipboard' };

export function getRoom(pathname: string): Room | null {
  if (pathname === '/') return publicRoom;
  const match = pathname.match(/^\/room\/([^/]+)\/?$/);
  if (!match || !roomIdPattern.test(match[1])) return null;
  const id = match[1].toLowerCase();
  return { id, path: `/room/${id}`, title: `Room ${id.slice(0, 8)}` };
}

export function createRoom(): Room {
  return getRoom(`/room/${crypto.randomUUID()}`)!;
}

export function parseRoomInput(input: string, origin: string): Room | null {
  const value = input.trim();
  if (roomIdPattern.test(value)) return getRoom(`/room/${value}`);
  if (!value) return null;
  try {
    const url = new URL(value, origin);
    return url.origin === origin ? getRoom(url.pathname) : null;
  } catch {
    return null;
  }
}

export function roomTopic(origin: string, id: string | null): string {
  // Preserve the original public channel while isolating every named room.
  return id === null ? `pasteclip:${origin}` : `pasteclip:${origin}:room:${id}`;
}
