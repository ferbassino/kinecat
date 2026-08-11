import React from "react";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../auth/AuthContext";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../auth/LoginScreen";
import ExerciseSelection from "../screens/ExerciseSelection";
import ExerciseScreen from "../components/ExerciseScreen";
import ResultsScreen from "../screens/ResultsScreen";
import SaveDataScreen from "../screens/SaveDataScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ArtroEvaluationSetupScreen from "../modules/artro/screens/EvaluationSetupScreen";
import ArtroEvaluationScreen from "../modules/artro/screens/EvaluationScreen";
import ArtroResultsScreen from "../modules/artro/screens/ResultsScreen";
import ArtroSaveDataScreen from "../modules/artro/screens/SaveDataScreen";
import JumpExerciseSelection from "../modules/jump/screens/ExerciseSelection";
import JumpExerciseScreen from "../modules/jump/components/ExerciseScreen";
import JumpResultsScreen from "../modules/jump/screens/JumpResults";
import JumpSaveDataScreen from "../modules/jump/screens/SaveDataScreen";
import PromsHomeScreen from "../modules/proms/screens/PromsHomeScreen";

const Stack = createStackNavigator();

const screenTransition = {
  detachInactiveScreens: true,
  freezeOnBlur: true,
  ...TransitionPresets.FadeFromBottomAndroid,
  transitionSpec: {
    open: { animation: "timing", config: { duration: 180 } },
    close: { animation: "timing", config: { duration: 150 } },
  },
};

export default function AppNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ffff" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        ...screenTransition,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />

      <Stack.Screen name="ExerciseSelection" component={ExerciseSelection} />
      <Stack.Screen name="Exercise" component={ExerciseScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="SaveData" component={SaveDataScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />

      <Stack.Screen
        name="ArtroEvaluationSetup"
        component={ArtroEvaluationSetupScreen}
      />
      <Stack.Screen name="ArtroEvaluation" component={ArtroEvaluationScreen} />
      <Stack.Screen name="ArtroResults" component={ArtroResultsScreen} />
      <Stack.Screen name="ArtroSaveData" component={ArtroSaveDataScreen} />

      <Stack.Screen
        name="JumpExerciseSelection"
        component={JumpExerciseSelection}
      />
      <Stack.Screen name="JumpExercise" component={JumpExerciseScreen} />
      <Stack.Screen name="JumpResults" component={JumpResultsScreen} />
      <Stack.Screen name="JumpSaveData" component={JumpSaveDataScreen} />

      <Stack.Screen name="PromsHome" component={PromsHomeScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
  },
});
