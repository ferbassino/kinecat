import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import { AuthProvider } from "./src/auth/AuthContext";
import { CommandSettingsProvider } from "./src/context/CommandSettingsContext";
import AppNavigator from "./src/navigation/AppNavigator";

enableScreens(true);

/** Bump al agregar pantallas al stack (Fast Refresh no siempre las registra). */
const NAV_TREE_VERSION = "atr-escoliometro-1";

export default function App() {
  return (
    <SafeAreaProvider>
      <CommandSettingsProvider>
        <AuthProvider>
          <NavigationContainer key={NAV_TREE_VERSION}>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </CommandSettingsProvider>
    </SafeAreaProvider>
  );
}
