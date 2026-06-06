import { createContext } from 'react';

export const MyCart = createContext({
  myCart: [],
  setMyCart: () => {},
});
