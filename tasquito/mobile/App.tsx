import { AuthGate, useTheme } from "@broccoliapps/mobile";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/auth/AuthContext";
import type { RootStackParamList } from "./src/navigation/types";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ProjectDetailScreen } from "./src/screens/ProjectDetailScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { colors } = useTheme();

  return (
    <AuthGate colors={colors} loginScreen={<LoginScreen />}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthGate>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
