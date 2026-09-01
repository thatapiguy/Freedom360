import type {
  IncomeEventCategory,
  LifeEventCategory,
  SpendingGoalCategory,
} from "@/lib/types";

export interface LifeEventCategoryMeta {
  label: string;
  /** A single emoji glyph, shown in a colored circle. */
  icon: string;
  /** Which timing mode makes most sense to preselect for this category. */
  defaultMode: "oneTime" | "recurring";
}

export const SPENDING_GOAL_CATEGORIES: Record<SpendingGoalCategory, LifeEventCategoryMeta> = {
  charity_gift: { label: "Charity/gift", icon: "🎁", defaultMode: "oneTime" },
  dependent_support: { label: "Dependent support", icon: "🧑", defaultMode: "recurring" },
  education: { label: "Education", icon: "🎓", defaultMode: "recurring" },
  health_care: { label: "Health care", icon: "⚕️", defaultMode: "oneTime" },
  home_purchase: { label: "Home purchase/upgrade", icon: "🏠", defaultMode: "oneTime" },
  renovation: { label: "Renovation", icon: "🔨", defaultMode: "oneTime" },
  vacation: { label: "Vacation", icon: "✈️", defaultMode: "recurring" },
  vehicle: { label: "Vehicle", icon: "🚗", defaultMode: "oneTime" },
  wedding: { label: "Wedding", icon: "💍", defaultMode: "oneTime" },
  other_expense: { label: "Other expense", icon: "💵", defaultMode: "oneTime" },
};

export const INCOME_EVENT_CATEGORIES: Record<IncomeEventCategory, LifeEventCategoryMeta> = {
  annuity_income: { label: "Annuity income", icon: "🪙", defaultMode: "recurring" },
  inheritance: { label: "Inheritance", icon: "🧧", defaultMode: "oneTime" },
  pension_income: { label: "Pension income", icon: "🏦", defaultMode: "recurring" },
  rental_income: { label: "Rental income", icon: "🏘️", defaultMode: "recurring" },
  sale_of_property: { label: "Sale of property", icon: "🪧", defaultMode: "oneTime" },
  work_during_retirement: { label: "Work during retirement", icon: "☕", defaultMode: "recurring" },
  other_income: { label: "Other income", icon: "💰", defaultMode: "oneTime" },
};

export const LIFE_EVENT_CATEGORIES: Record<LifeEventCategory, LifeEventCategoryMeta> = {
  ...SPENDING_GOAL_CATEGORIES,
  ...INCOME_EVENT_CATEGORIES,
};

export function defaultNameForCategory(category: LifeEventCategory): string {
  return LIFE_EVENT_CATEGORIES[category].label;
}
