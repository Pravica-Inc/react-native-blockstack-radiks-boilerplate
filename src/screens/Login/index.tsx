import React, { useContext } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';
import UserData from '../../contexts/UserData';
import { useNavigation } from 'react-navigation-hooks';
import { resetNavigation } from '../../routes';

const Login: React.FC = () => {
  const {
    userData,
    signIn,
    isLoading,
    isSignedOut,
    setisSignedOut,
  } = useContext(UserData);
  const { dispatch, state } = useNavigation();
  console.warn('Jeez');
  if (userData && !isLoading && !isSignedOut && state.routeName === 'Login') {
    resetNavigation(dispatch, 'Home');
  }
  return (
    <>
      <View style={styles.container}>
        <Text style={styles.text}>Login with your Blockstack ID</Text>
        {isLoading ? (
          <Text>Loading</Text>
        ) : (
          <TouchableOpacity
            disabled={isLoading}
            onPress={() => {
              setisSignedOut(false);
              signIn();
            }}
            style={styles.loginButton}>
            <>
              <Text style={styles.buttonText}>Blockstack ID</Text>
            </>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

export default Login;
