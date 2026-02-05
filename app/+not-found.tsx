import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppColors } from '@/hooks/useAppColors';

const SplashScreen = () => {
  const router = useRouter();
  const colors = useAppColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textOnPrimary }]}>...oops</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          we couldn&apos;t find what you were looking for
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.buttonPrimary },
            pressed && styles.buttonOpacity,
          ]}
          onPress={() => router.back()}
        >
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>back to safety</Text>
        </Pressable>
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
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
    width: 250,
    marginTop: 20,
  },
  buttonText: {
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
