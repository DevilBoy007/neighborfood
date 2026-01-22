import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
const SplashScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>...oops</Text>
        <Text style={styles.subtitle}>we couldn&apos;t find what you were looking for </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonOpacity]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>back to safety</Text>
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
    ...Platform.select({
      web: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      },
    }),
  },
  textContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'TitanOne',
    color: '#fff',
    marginTop: 100,
    ...Platform.select({
      web: {
        fontSize: 60,
      },
    }),
  },
  subtitle: {
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'TextMeOne',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00bfff',
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
    width: 250,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'TextMeOne',
  },
  buttonOpacity: {
    opacity: 0.8,
  },
});

export default SplashScreen;
