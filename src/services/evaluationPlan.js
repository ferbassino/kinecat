import client from "../api/client";

export const fetchEvaluationPlanByClient = async (clientId) => {
  const response = await client.get(`/api/evaluation-plans/client/${clientId}`);
  return response.data;
};

export const getEnabledModuleIdsFromPlan = (plan) => {
  if (!plan) return null;
  if (!Array.isArray(plan.modules)) return null;

  return plan.modules
    .filter((item) => item.enabled)
    .map((item) => item.moduleId);
};
