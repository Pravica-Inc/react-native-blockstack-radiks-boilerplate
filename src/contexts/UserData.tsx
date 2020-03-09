import * as React from 'react';
import { IUser } from '../radiks/models/user';

export type ISetUserData = (userData: IUser) => void;

interface IContextValues {
  userData: IUser | undefined;
  setUserData: ISetUserData;
  signIn: any;
  signOut: any;
  isLoading: boolean;
  isSignedOut: boolean;
  setisSignedOut: any;
}

export default React.createContext<IContextValues>({
  userData: undefined,
  setUserData: _userData => undefined,
  signIn: () => undefined,
  signOut: () => undefined,
  isLoading: true,
  isSignedOut: false,
  setisSignedOut: (_arg: boolean) => undefined,
});
