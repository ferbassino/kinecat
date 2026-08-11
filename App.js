import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import { AuthProvider } from "./src/auth/AuthContext";
import { CommandSettingsProvider } from "./src/context/CommandSettingsContext";
import AppNavigator from "./src/navigation/AppNavigator";

enableScreens(true);

export default function App() {
  return (
    <SafeAreaProvider>
      <CommandSettingsProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </CommandSettingsProvider>
    </SafeAreaProvider>
  );
}
