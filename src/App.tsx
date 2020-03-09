import React, { useState } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import AppNavigator from './routes';
import UserData from './contexts/UserData';
import { useAuth } from './hooks/useAuth';

const App = () => {
  const [isSignedOut, setisSignedOut] = useState(false);
  const { signIn, signOut, userData, setUserData, loading } = useAuth();
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <UserData.Provider
          value={{
            isLoading: loading,
            setUserData,
            userData,
            signIn,
            signOut,
            setisSignedOut,
            isSignedOut,
          }}>
          <AppNavigator />
        </UserData.Provider>
      </SafeAreaView>
    </>
  );
};

export default App;
