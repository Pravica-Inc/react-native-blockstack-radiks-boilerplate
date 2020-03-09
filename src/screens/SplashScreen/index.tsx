import React, { useContext, useEffect } from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';
import UserData from '../../contexts/UserData';
import { useNavigation } from 'react-navigation-hooks';
import { resetNavigation } from '../../routes';

const SplashScreen: React.FC = () => {
  const { userData, isLoading, signOut } = useContext(UserData);
  const { dispatch } = useNavigation();
  useEffect(() => {
    if (userData && !isLoading) {
      resetNavigation(dispatch, 'Home');
      signOut();
    } else if (!userData && !isLoading) {
      resetNavigation(dispatch, 'Login');
    }
  }, [userData, isLoading]);
  return (
    <>
      <View style={styles.container}>
        {/* <Image style={styles.logo} source={require('../../assets/logo.png')} /> */}
        {/* <Spinner color={theme.colors.primary} /> */}
        <Text style={styles.bottomText}>All rights reserved to @Pravica</Text>
      </View>
    </>
  );
};

export default SplashScreen;
