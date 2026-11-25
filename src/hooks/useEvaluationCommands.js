import { useCallback, useRef, useState } from "react";
import * as Speech from "expo-speech";
import { COMMANDS } from "../config/evaluationCommands";
import { useCommandSettings } from "../context/CommandSettingsContext";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_PRE_GO_LEAD_MS = 350;

/**
 * Secuencia: Preparado → Listo → (opcional: empezar a medir) → lead → ¡Ahora!
 * Si `onBeforeGo` está definido, la captura ya corre antes de “Ahora”.
 */
export async function runStabilityStartSequence(emit, options = {}) {
  const {
    onBeforeGo,
    preGoLeadMs = DEFAULT_PRE_GO_LEAD_MS,
    afterGoWaitMs,
    interCommandGapMs = 220,
  } = options;

  await emit("PREPARED", { delay: interCommandGapMs, ...options });
  await emit("READY", { delay: interCommandGapMs, ...options });

  if (typeof onBeforeGo === "function") {
    await onBeforeGo();
    await wait(Math.max(0, Number(preGoLeadMs) || DEFAULT_PRE_GO_LEAD_MS));
    await emit("GO", { waitForSpeech: false, ...options });
    if (afterGoWaitMs != null) {
      await wait(afterGoWaitMs);
    }
    return;
  }

  await emit("GO", options);
  await wait(afterGoWaitMs != null ? afterGoWaitMs : 1500);
}

export function useEvaluationCommands({ accentColor = "#00ffff" } = {}) {
  const { voiceEnabled } = useCommandSettings();
  const [cue, setCue] = useState(null);
  const speakTokenRef = useRef(0);

  const speakAsync = useCallback(
    (text) =>
      new Promise((resolve) => {
        if (!voiceEnabled || !text) {
          resolve();
          return;
        }

        const token = ++speakTokenRef.current;
        try {
          Speech.stop();
        } catch {
          // ignore
        }

        const finish = () => {
          if (speakTokenRef.current === token) {
            resolve();
          } else {
            resolve();
          }
        };

        Speech.speak(String(text), {
          language: "es-ES",
          onDone: finish,
          onStopped: finish,
          onError: finish,
        });
      }),
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
      const waitForSpeech = options.waitForSpeech !== false;

      const nextCue = {
        key: commandKey,
        text,
        visual,
        icon: options.icon ?? definition.icon,
        accentColor: options.accentColor ?? accentColor,
      };

      setCue(nextCue);

      if (waitForSpeech) {
        await speakAsync(speech);
      } else {
        // Dispara voz sin bloquear (p.ej. “Ahora” ya con la prueba corriendo).
        speakAsync(speech);
      }

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
    [accentColor, speakAsync],
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
