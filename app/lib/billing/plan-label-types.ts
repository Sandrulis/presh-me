export type ActivePlanLabel = {
  planKey: string;
  name: string;
  moduleKeys: string[];
};

export function resolvePlanBadgeLabelForModule(
  moduleKey: string,
  plans: ActivePlanLabel[],
  fallbackName: string,
): string {
  const withModule = plans.filter((plan) => plan.moduleKeys.includes(moduleKey));
  if (withModule.length > 0) {
    return withModule[0]!.name;
  }
  const pro = plans.find((plan) => plan.planKey === "pro");
  if (pro) return pro.name;
  const paid = plans.find((plan) => plan.planKey !== "basic");
  return paid?.name ?? fallbackName;
}
