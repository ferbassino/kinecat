import { useMemo } from "react";
import { useAuth } from "../auth/AuthContext";

/**
 * Modos de sesión en Kinecat:
 * - guest: sin login (solo medición local, sin plan)
 * - free: login pero sin paciente (módulos del dispositivo, manual)
 * - loading: cargando plan del paciente
 * - planned: paciente con plan KinApp desde la web
 * - patient_no_plan: paciente sin plan en el servidor (manual + guardar)
 */
export function useEvaluationSession() {
  const {
    user,
    currentClient,
    evaluationPlan,
    evaluationPlanLoading,
    planEnabledModuleIds,
    selectClient,
    userClients,
    refreshClients,
    reloadEvaluationPlan,
  } = useAuth();

  const mode = useMemo(() => {
    if (!user) return "guest";
    if (!currentClient) return "free";
    if (evaluationPlanLoading) return "loading";
    if (planEnabledModuleIds?.length) return "planned";
    return "patient_no_plan";
  }, [user, currentClient, evaluationPlanLoading, planEnabledModuleIds]);

  const sessionCopy = useMemo(() => {
    switch (mode) {
      case "guest":
        return {
          title: "Modo invitado",
          subtitle:
            "Podés medir sin cuenta. Iniciá sesión para elegir paciente y aplicar el plan KinApp.",
          badge: "Invitado",
          badgeColor: "#888",
        };
      case "free":
        return {
          title: "Modo libre",
          subtitle:
            "Elegí un paciente para cargar su plan desde KinApp web, o entrá a un módulo y configurá manualmente.",
          badge: "Sin paciente",
          badgeColor: "#f59e0b",
        };
      case "loading":
        return {
          title: "Cargando plan…",
          subtitle: "Obteniendo indicaciones clínicas del paciente.",
          badge: "Sincronizando",
          badgeColor: "#6366f1",
        };
      case "planned":
        return {
          title: evaluationPlan?.title || "Plan KinApp",
          subtitle: `${planEnabledModuleIds?.length || 0} módulo(s) indicados para este paciente. Podés ajustar en cada evaluación.`,
          badge: "Plan activo",
          badgeColor: "#00ffff",
        };
      case "patient_no_plan":
        return {
          title: "Sin plan web",
          subtitle:
            "Este paciente no tiene plan en KinApp. Evaluás en modo manual; podés crear el plan desde la web.",
          badge: "Manual",
          badgeColor: "#a855f7",
        };
      default:
        return { title: "", subtitle: "", badge: "", badgeColor: "#888" };
    }
  }, [mode, evaluationPlan?.title, planEnabledModuleIds?.length]);

  const clearPatient = () => selectClient(null);

  return {
    mode,
    user,
    currentClient,
    evaluationPlan,
    evaluationPlanLoading,
    planEnabledModuleIds,
    selectClient,
    clearPatient,
    userClients,
    refreshClients,
    reloadEvaluationPlan,
    sessionCopy,
    isPlanActive: mode === "planned",
    isManualMode: mode === "free" || mode === "patient_no_plan" || mode === "guest",
  };
}

export default useEvaluationSession;
