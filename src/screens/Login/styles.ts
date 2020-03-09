import { StyleSheet } from 'react-native';
import { theme } from '../../theme';

export const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', alignItems: 'center' },
  pravicaLogo: { width: 253, height: 115, marginTop: 75 },
  icon: { width: 208, height: 192, marginTop: 31 },
  text: { fontSize: 15, color: theme.colors.textGreyColor, marginTop: 31 },
  loginButton: {
    padding: 8,
    paddingLeft: 25,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 25,
    marginTop: 28,
    width: '70%',
  },
  blockstackLogo: { width: 34, height: 34, marginRight: 9 },
  buttonText: { color: theme.colors.white, fontSize: 20 },
});
