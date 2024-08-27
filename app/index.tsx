import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import MarketScreen from './Market';
const LoginScreen = () => {
  const router = useRouter();

  return (
    <View style={[styles.container, Platform.OS === 'web' && styles.containerWeb]}>
      <Text style={[styles.title, Platform.OS === 'web' && styles.titleWeb]}>neighborfood</Text>
      <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonOpacity,
            ]}
            onPress={() => router.navigate('/Market')}
          >
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonOpacity,
          ]}
        >
          <Text style={styles.buttonText} onPress={() => alert('sign up')}>Sign Up</Text>
        </Pressable>
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
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: 'TitanOne',
    color: '#fff',
    marginTop: 20,
  },
  titleWeb: {
    textAlign: 'center',
    fontSize: 60,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00bfff',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    width: 100,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonOpacity: {
    opacity: 0.8,
  },
});

export default LoginScreen;