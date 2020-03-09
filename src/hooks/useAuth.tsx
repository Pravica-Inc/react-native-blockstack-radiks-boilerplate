/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import RNBlockstackSdk from 'react-native-blockstack';
import { configure, User, defaultconfig } from '../radiks';
import { DeviceEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { GroupMembership } from '../radiks';
import { IUser } from '../radiks/models/user';

export const useAuth = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<IUser | undefined>(undefined);
  const [pendingAuth, setPendingAuth] = useState<boolean>(false);
  useEffect(() => {
    createSession();
    DeviceEventEmitter.addListener('url', (e: any) => {
      if (e.url && !pendingAuth) {
        setPendingAuth(true);
        var query = e.url.split(':');
        if (query.length > 1) {
          var parts = query[1].split('=');
          if (parts.length > 1) {
            RNBlockstackSdk.handlePendingSignIn(parts[1]).then(() => {
              createSession();
              setPendingAuth(false);
            });
          }
        }
      }
    });
  }, []);

  const signIn = async () => {
    await RNBlockstackSdk.signIn();
    createSession();
  };

  const signOut = async () => {
    await RNBlockstackSdk.signUserOut();
    await AsyncStorage.clear();
    return Promise;
  };

  const createSession = async () => {
    setLoading(true);
    const hasSession = await RNBlockstackSdk.hasSession();
    if (!hasSession.hasSession) {
      await RNBlockstackSdk.createSession(defaultconfig);
    }

    const signedIn = await RNBlockstackSdk.isUserSignedIn();
    if (signedIn.signedIn) {
      const session = await RNBlockstackSdk.loadUserData();

      configure({
        apiServer: defaultconfig.apiServer,
        userSession: {
          loadUserData: {
            ...session,
            private_key:
              Platform.OS === 'android'
                ? session.appPrivateKey
                : session.private_key,
          },
        },
      });
      const data = await User.findById(session.username);
      if (!data) {
        await User.createWithCurrentUser();
      } else {
        await GroupMembership.cacheKeys();
      }
      setUserData(session);
    }
    setLoading(false);
  };

  return {
    signIn,
    signOut,
    userData,
    setUserData,
    loading,
  };
};
