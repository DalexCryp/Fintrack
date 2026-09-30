export const TRANSACTION_TYPES = ["INCOME", "EXPENSE"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CATEGORIES: Record<TransactionType, readonly string[]> = {
  INCOME: ["Salary", "Freelance", "Investments", "Gifts", "Other"],
  EXPENSE: [
    "Rent",
    "Food",
    "Subscriptions",
    "Transport",
    "Utilities",
    "Entertainment",
    "Health",
    "Shopping",
    "Other",
  ],
};

export const ALL_CATEGORIES = [
  ...new Set([...CATEGORIES.INCOME, ...CATEGORIES.EXPENSE]),
];
