import React from 'react';
import { theme } from './theme';
import { View, Text } from 'react-native';
import {
  createAppContainer,
  StackActions,
  NavigationActions,
} from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import Login from './screens/Login';
import SplashScreen from './screens/SplashScreen';

const HomeScreen = () => {
  return (
    <View>
      <Text>EHH</Text>
    </View>
  );
};
const ChatPageNavigator = createStackNavigator(
  {
    Splash: {
      screen: SplashScreen,
      navigationOptions: {
        header: () => null,
      },
    },
    Login: {
      screen: Login,
      navigationOptions: {
        header: () => null,
      },
    },
    Home: createBottomTabNavigator(
      {
        HomeScreen: HomeScreen,
      },
      {
        initialRouteName: 'HomeScreen',
        tabBarOptions: {
          activeTintColor: theme.colors.primary,
          inactiveTintColor: theme.colors.textGreyColor,
          tabStyle: {
            backgroundColor: 'transparent',
          },
          labelStyle: {
            fontWeight: 'bold',
            fontSize: 11,
          },
          // indicatorStyle: {
          //   backgroundColor: theme.colors.tabIndicator
          // },
          style: {
            backgroundColor: theme.colors.tabBackground,
          },
        },
        navigationOptions: {
          /* HEADER Component
          The onPress function is to
          navigate to ContaPage when you click on the ProfilePage picture */
          header: () => null,
        },
      },
    ),
  },
  {
    initialRouteName: 'Splash',
  },
);
const AppNavigator = createAppContainer(ChatPageNavigator);

// Function for reseting Navigation;
export const resetNavigation = (dispatch: any, routeName: string) => {
  dispatch(
    StackActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName })],
    }),
  );
};

export default AppNavigator;
