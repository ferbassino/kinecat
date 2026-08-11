import { useCallback, useState } from "react";
import * as Speech from "expo-speech";
import { COMMANDS } from "../config/evaluationCommands";
import { useCommandSettings } from "../context/CommandSettingsContext";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Secuencia estándar KinApp: Preparado → Listo → ¡Ahora! → pausa 1,5 s */
export async function runStabilityStartSequence(emit, options = {}) {
  await emit("PREPARED", { delay: 1000, ...options });
  await emit("READY", { delay: 1000, ...options });
  await emit("GO", options);
  await wait(1500);
}

export function useEvaluationCommands({ accentColor = "#00ffff" } = {}) {
  const { voiceEnabled } = useCommandSettings();
  const [cue, setCue] = useState(null);

  const speak = useCallback(
    (text) => {
      if (!voiceEnabled || !text) return;
      Speech.stop();
      Speech.speak(String(text), { language: "es-ES" });
    },
    [voiceEnabled],
  );

  const clearCue = useCallback(() => setCue(null), []);

  const emit = useCallback(
    async (commandKey, options = {}) => {
      const definition = COMMANDS[commandKey];
      if (!definition) return;

      const text = options.text ?? definition.text ?? "";
      const speech = options.speech ?? definition.speech ?? text;
      const visual = options.visual ?? definition.visual ?? "banner";
      const hideAfter = options.hideAfter ?? definition.hideAfter ?? 1200;

      const nextCue = {
        key: commandKey,
        text,
        visual,
        icon: options.icon ?? definition.icon,
        accentColor: options.accentColor ?? accentColor,
      };

      setCue(nextCue);
      speak(speech);

      if (options.delay) {
        await wait(options.delay);
      }

      if (visual === "flash" || visual === "countdown") {
        setTimeout(() => setCue(null), hideAfter);
      } else if (visual === "banner") {
        setTimeout(() => {
          setCue((current) =>
            current?.key === commandKey ? null : current,
          );
        }, hideAfter);
      }

      return nextCue;
    },
    [accentColor, speak],
  );

  const runStartSequence = useCallback(
    (options = {}) => runStabilityStartSequence(emit, options),
    [emit],
  );

  return {
    cue,
    emit,
    runStartSequence,
    runStabilityStartSequence: runStartSequence,
    clearCue,
    accentColor,
  };
}
