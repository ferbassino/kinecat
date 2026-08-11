import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MODULES } from "../config/modules";

const STORAGE_KEY = "@kinecat/enabledModules";

const DEFAULT_ENABLED_IDS = MODULES.filter((module) => module.available).map(
  (module) => module.id,
);

export function useAccessibleModules(planEnabledIds = null) {
  const [enabledIds, setEnabledIds] = useState(DEFAULT_ENABLED_IDS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) {
            setEnabledIds(parsed);
          }
        }
      } catch (error) {
        console.warn("No se pudieron cargar módulos habilitados:", error);
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  const saveEnabledIds = useCallback(async (nextIds) => {
    setEnabledIds(nextIds);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
    } catch (error) {
      console.warn("No se pudieron guardar módulos habilitados:", error);
    }
  }, []);

  const toggleModule = useCallback((moduleId) => {
    setEnabledIds((current) => {
      const next = current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : [...current, moduleId];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const accessibleModules = MODULES.map((module) => {
    const locallyEnabled = module.available && enabledIds.includes(module.id);
    const allowedByPlan =
      planEnabledIds == null || planEnabledIds.includes(module.id);

    return {
      ...module,
      enabled: locallyEnabled && allowedByPlan,
      lockedByPlan: locallyEnabled && !allowedByPlan,
    };
  });

  const activeModules = accessibleModules.filter((module) => module.enabled);
  const lockedModules = accessibleModules.filter((module) => !module.enabled);
  const planLockedModules = accessibleModules.filter((module) => module.lockedByPlan);

  return {
    loaded,
    enabledIds,
    accessibleModules,
    activeModules,
    lockedModules,
    planLockedModules,
    toggleModule,
    saveEnabledIds,
  };
}
