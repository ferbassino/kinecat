import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@kinecat/commandSettings";

const CommandSettingsContext = createContext(null);

const defaultSettings = {
  voiceEnabled: true,
  soundEnabled: true,
};

export const CommandSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setSettings({ ...defaultSettings, ...JSON.parse(raw) });
        }
      } catch (error) {
        console.warn("No se pudieron cargar ajustes de comando:", error);
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  const persist = useCallback(async (next) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn("No se pudieron guardar ajustes de comando:", error);
    }
  }, []);

  const setVoiceEnabled = useCallback(
    (voiceEnabled) => persist({ ...settings, voiceEnabled }),
    [persist, settings],
  );

  const setSoundEnabled = useCallback(
    (soundEnabled) => persist({ ...settings, soundEnabled }),
    [persist, settings],
  );

  const toggleVoice = useCallback(
    () => setVoiceEnabled(!settings.voiceEnabled),
    [setVoiceEnabled, settings.voiceEnabled],
  );

  const toggleSound = useCallback(
    () => setSoundEnabled(!settings.soundEnabled),
    [setSoundEnabled, settings.soundEnabled],
  );

  const value = useMemo(
    () => ({
      ...settings,
      loaded,
      setVoiceEnabled,
      setSoundEnabled,
      toggleVoice,
      toggleSound,
      visualAlwaysEnabled: true,
    }),
    [
      settings,
      loaded,
      setVoiceEnabled,
      setSoundEnabled,
      toggleVoice,
      toggleSound,
    ],
  );

  return (
    <CommandSettingsContext.Provider value={value}>
      {children}
    </CommandSettingsContext.Provider>
  );
};

export const useCommandSettings = () => {
  const context = useContext(CommandSettingsContext);
  if (!context) {
    throw new Error(
      "useCommandSettings debe usarse dentro de CommandSettingsProvider",
    );
  }
  return context;
};
