import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { SoundPressable

 } from '@/components/SoundPressable';
const LoginScreen = () => {
  const router = useRouter();

  return (
    <View style={[styles.container, Platform.OS === 'web' && styles.containerWeb]}>
      <Text style={[styles.title, Platform.OS === 'web' && styles.titleWeb]}>neighborfood</Text>
      <View style={styles.buttonContainer}>
          <SoundPressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonOpacity,
            ]}
            onPress={() => router.navigate('/Login')}
          >
            <Text style={styles.buttonText}>Login</Text>
          </SoundPressable>
        <SoundPressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonOpacity,
          ]}
          onPress = {() => router.navigate('/Register')}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </SoundPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B7FFB0',
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
    color: '#fff',
    marginTop: 40,
  },
  titleWeb: {
    textAlign: 'center',
    fontSize: 60,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#00bfff',
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
    width: 150,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonOpacity: {
    opacity: 0.8,
  },
});

export default LoginScreen;