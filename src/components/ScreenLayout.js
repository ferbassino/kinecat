import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ScreenLayout = ({
  children,
  style,
  contentStyle,
  bottomInset = true,
  topInset = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        topInset && { paddingTop: insets.top },
        bottomInset && { paddingBottom: Math.max(insets.bottom, 16) + 8 },
        style,
      ]}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default ScreenLayout;
