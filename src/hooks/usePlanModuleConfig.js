import { useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { getPlanModuleConfig } from "../config/evaluationPlanHelpers";

export function usePlanModuleConfig(moduleId) {
  const { evaluationPlan } = useAuth();

  return useMemo(
    () => getPlanModuleConfig(evaluationPlan, moduleId),
    [evaluationPlan, moduleId],
  );
}

export default usePlanModuleConfig;
