import {
  mergeModuleConfig,
  sanitizeModuleConfig,
  getDefaultModuleConfig,
} from "../constants/evaluationPlanModuleOptions";

export { mergeModuleConfig, sanitizeModuleConfig, getDefaultModuleConfig };

export const getPlanModuleConfig = (evaluationPlan, moduleId) => {
  if (!evaluationPlan?.modules?.length) return null;

  const moduleEntry = evaluationPlan.modules.find(
    (item) => item.moduleId === moduleId && item.enabled,
  );

  if (!moduleEntry) return null;

  return mergeModuleConfig(moduleId, moduleEntry.config);
};

export const filterByAllowedNames = (items, allowedNames, nameKey = "name") => {
  if (!allowedNames?.length) return items;
  return items.filter((item) => allowedNames.includes(item[nameKey]));
};

export const filterByAllowedIds = (items, allowedIds, idKey = "id") => {
  if (!allowedIds?.length) return items;
  return items.filter((item) => allowedIds.includes(item[idKey]));
};
