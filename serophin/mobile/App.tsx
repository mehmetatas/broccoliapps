import { ThemeProvider, ToastContainer } from "@broccoliapps/mobile";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { RootStackParamList } from "./src/navigation/types";
import { BreathingScreen } from "./src/screens/BreathingScreen";
import { CourseLessonScreen } from "./src/screens/CourseLessonScreen";
import { CourseScreen } from "./src/screens/CourseScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MeditationScreen } from "./src/screens/MeditationScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { SleepScreen } from "./src/screens/SleepScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppContent = () => {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Meditation" component={MeditationScreen} />
          <Stack.Screen name="Breathing" component={BreathingScreen} />
          <Stack.Screen name="Sleep" component={SleepScreen} />
          <Stack.Screen name="Course" component={CourseScreen} />
          <Stack.Screen name="CourseLesson" component={CourseLessonScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <ToastContainer />
    </>
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
