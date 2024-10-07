import { atom } from 'recoil';

export type User = {
  id: string;
  name: string;
  age: number;
};

export const userAtom = atom<User >({
  key: 'userAtom',
  default: {id: "", name: "", age: 0},
});