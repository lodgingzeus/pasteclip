import { expect, it } from 'vitest';
import {
  createRoom,
  getRoom,
  parseRoomInput,
  publicRoom,
  roomTopic,
} from '../../src/features/rooms/rooms';

it('creates unique valid room links without stored records', () => {
  const first = createRoom();
  const second = createRoom();
  expect(first.id).not.toBe(second.id);
  expect(getRoom(first.path)).toEqual(first);
  expect(getRoom('/')).toEqual(publicRoom);
});

it('joins by code or same-site link and normalizes the room ID', () => {
  const room = createRoom();
  const origin = 'https://pasteclip.test';
  expect(parseRoomInput(room.id!.toUpperCase(), origin)).toEqual(room);
  expect(parseRoomInput(` ${origin}${room.path}/ `, origin)).toEqual(room);
  expect(parseRoomInput(room.path, origin)).toEqual(room);
});

it('rejects invalid rooms and links to other sites', () => {
  expect(getRoom('/room/not-a-room')).toBe(null);
  expect(getRoom('/room/%ZZ')).toBe(null);
  expect(getRoom('/unrelated')).toBe(null);
  expect(
    parseRoomInput('https://elsewhere.test' + createRoom().path, 'https://pasteclip.test'),
  ).toBe(null);
  expect(parseRoomInput('javascript:alert(1)', 'https://pasteclip.test')).toBe(null);
  expect(parseRoomInput('', 'https://pasteclip.test')).toBe(null);
});

it('keeps room channels separate from each other and the existing public clipboard', () => {
  const origin = 'https://pasteclip.test';
  const a = createRoom();
  const b = createRoom();
  expect(roomTopic(origin, null)).toBe(`pasteclip:${origin}`);
  expect(roomTopic(origin, a.id)).not.toBe(roomTopic(origin, b.id));
  expect(roomTopic(origin, a.id)).not.toBe(roomTopic(origin, null));
  expect(roomTopic(origin, a.id)).not.toBe(roomTopic('https://preview.test', a.id));
});
