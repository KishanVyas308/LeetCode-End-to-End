import { atom } from 'recoil';

export type User = {
  id: string;
  name: string;
  roomId: string;
};

export const userAtom = atom<User >({
  key: 'userAtom',
  default: {id: "", name: "", roomId: ""},
});