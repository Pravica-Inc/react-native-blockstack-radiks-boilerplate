import { StyleSheet } from 'react-native';
import { theme } from '../../theme';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  logo: { width: 88, height: 88 },
  bottomText: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    color: theme.colors.textGreyColor,
  },
});
