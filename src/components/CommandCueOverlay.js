import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const CommandCueOverlay = ({ cue, accentColor = "#00ffff" }) => {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!cue) return;

    scaleAnim.setValue(cue.visual === "countdown" ? 0.85 : 0.6);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cue, opacityAnim, scaleAnim]);

  if (!cue || cue.visual === "banner") return null;

  const color = cue.accentColor || accentColor;
  const isFlash = cue.visual === "flash";
  const isCountdown = cue.visual === "countdown";

  if (!isFlash && !isCountdown) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <View
        style={[
          styles.backdrop,
          isFlash && { backgroundColor: `${color}33` },
        ]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            isCountdown ? styles.countdownCard : styles.flashCard,
            {
              borderColor: color,
              backgroundColor: isFlash ? `${color}22` : "rgba(15,15,15,0.92)",
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {isCountdown ? (
            <View style={styles.countdownInner}>
              <Text
                style={[styles.countdownText, { color }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {cue.text}
              </Text>
            </View>
          ) : (
            <>
              {cue.icon ? (
                <Ionicons name={cue.icon} size={42} color={color} />
              ) : null}
              <Text
                style={[styles.flashText, { color }]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {cue.text}
              </Text>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  flashCard: {
    minWidth: width * 0.72,
    maxWidth: width * 0.88,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  countdownCard: {
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  countdownInner: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  flashText: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
    maxWidth: width * 0.8,
  },
  countdownText: {
    fontSize: 64,
    fontWeight: "800",
    textAlign: "center",
    width: "100%",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
    lineHeight: Platform.OS === "android" ? 68 : 64,
  },
});

export default CommandCueOverlay;
