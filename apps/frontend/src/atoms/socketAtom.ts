import { atom } from "recoil";

export const socketAtom = atom<any>({
  key: "socketAtom",
  default: null,
});
