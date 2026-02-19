import { ThemeProvider, ToastContainer, useThemeContext } from "@broccoliapps/mobile";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PreferencesContext, usePreferencesProvider } from "./src/hooks/usePreferences";
import type { RootStackParamList } from "./src/navigation/types";
import { BreathingScreen } from "./src/screens/BreathingScreen";
import { BreathingSessionScreen } from "./src/screens/BreathingSessionScreen";
import { CourseLessonScreen } from "./src/screens/CourseLessonScreen";
import { CourseScreen } from "./src/screens/CourseScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MeditationScreen } from "./src/screens/MeditationScreen";
import { MeditationSessionScreen } from "./src/screens/MeditationSessionScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { SleepScreen } from "./src/screens/SleepScreen";
import { SleepSessionScreen } from "./src/screens/SleepSessionScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F0E8E0",
  },
};

const ThemeForcer = () => {
  const { setPreference } = useThemeContext();
  useEffect(() => {
    setPreference("light");
  }, [setPreference]);
  return null;
};

const AppContent = () => {
  const preferencesValue = usePreferencesProvider();

  return (
    <PreferencesContext.Provider value={preferencesValue}>
      <ThemeForcer />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Meditation" component={MeditationScreen} />
          <Stack.Screen name="MeditationSession" component={MeditationSessionScreen} />
          <Stack.Screen name="Breathing" component={BreathingScreen} />
          <Stack.Screen name="BreathingSession" component={BreathingSessionScreen} />
          <Stack.Screen name="Sleep" component={SleepScreen} />
          <Stack.Screen name="SleepSession" component={SleepSessionScreen} />
          <Stack.Screen name="Course" component={CourseScreen} />
          <Stack.Screen name="CourseLesson" component={CourseLessonScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <ToastContainer />
    </PreferencesContext.Provider>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
