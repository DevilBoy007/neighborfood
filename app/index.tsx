import { StyleSheet, Text, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { SoundPressable } from '@/components/SoundPressable';
import { useAppColors } from '@/hooks/useAppColors';

const LoginScreen = () => {
  const router = useRouter();
  const colors = useAppColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        Platform.OS === 'web' && styles.containerWeb,
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color:
              colors.textOnPrimary === '#00bfff'
                ? '#fff'
                : colors.textOnPrimary /* special case for default theme */,
          },
          Platform.OS === 'web' && styles.titleWeb,
        ]}
      >
        neighborfood
      </Text>
      <View style={styles.buttonContainer}>
        <SoundPressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.buttonPrimary },
            styles.buttonLeft,
            { borderRightColor: colors.border },
            pressed && styles.buttonOpacity,
          ]}
          onPress={() => router.navigate('/Login')}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Login</Text>
        </SoundPressable>
        <SoundPressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.buttonPrimary },
            styles.buttonRight,
            { borderLeftColor: colors.border },
            pressed && styles.buttonOpacity,
          ]}
          onPress={() => router.navigate('/Register')}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Sign Up</Text>
        </SoundPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  containerWeb: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'TitanOne',
    marginTop: 40,
  },
  titleWeb: {
    textAlign: 'center',
    fontSize: 60,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  button: {
    width: '50%',
    padding: 10,
    paddingBottom: 33,
  },
  buttonLeft: {
    borderRightWidth: 0.5,
  },
  buttonRight: {
    borderLeftWidth: 0.5,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 30,
    fontFamily: 'TextMeOne',
  },
  buttonOpacity: {
    opacity: 0.8,
  },
});

export default LoginScreen;
