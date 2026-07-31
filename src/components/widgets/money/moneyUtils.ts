import type {
  LegacyMoneyData,
  MoneyBreakdownItem,
  MoneyCategory,
  MoneyCategoryDefinition,
  MoneyData,
  MoneyExpenseType,
  MoneyRecurringExpense,
  MoneySpendingView,
  MoneyStorageShape,
  MoneyTransaction,
  MoneyWishlistItem,
  MoneyWishlistView,
} from "../../../types/money";

/* =========================================================
   1. Category and preset catalogs
   Category answers "what the money was for"; store answers "where it was paid".
   Keep those concepts separate so charts do not mix stores with categories.
========================================================= */

export const moneyCategories: MoneyCategoryDefinition[] = [
  {
    id: "Food",
    label: "Food",
    color: "#C98E7A",
    subcategories: ["Lunch", "Cafe", "Convenience", "Delivery", "Snack", "Dining"],
  },
  {
    id: "Fashion",
    label: "Fashion",
    color: "#A78BC8",
    subcategories: ["Top", "Bottom", "Outerwear", "Shoes", "Bag", "Accessories"],
  },
  {
    id: "Beauty",
    label: "Beauty",
    color: "#D08CA9",
    subcategories: ["Makeup", "Skincare", "Hair", "Nail", "Beauty Care"],
  },
  {
    id: "Living",
    label: "Living",
    color: "#8EAE88",
    subcategories: ["Household", "Organization", "Supplies"],
  },
  {
    id: "Digital",
    label: "Digital",
    color: "#72B3BF",
    subcategories: ["Device", "PC Accessory", "Phone Accessory", "Charger / Adapter"],
  },
  {
    id: "Transport",
    label: "Transport",
    color: "#8599CF",
    subcategories: [],
  },
  {
    id: "Fixed",
    label: "Fixed",
    color: "#B99B6C",
    subcategories: ["Phone", "Subscription"],
  },
  {
    id: "Study",
    label: "Study",
    color: "#74A994",
    subcategories: ["Book", "Workbook", "Exam"],
  },
  {
    id: "Content",
    label: "Content",
    color: "#AE86D1",
    subcategories: ["Webtoon", "Game"],
  },
  {
    id: "Gift",
    label: "Gift",
    color: "#C5AE62",
    subcategories: [],
  },
  {
    id: "Other",
    label: "Other",
    color: "#95A2AF",
    subcategories: [],
  },
];

export const moneyCategoryIds = moneyCategories.map((category) => category.id);

export const moneyStoreDefaults = [
  "Coupang",
  "Ably",
  "Musinsa",
  "Olive Young",
  "Naver Store",
  "AliExpress",
  "Temu",
  "Offline",
  "Other",
];

export const spendingViews: MoneySpendingView[] = [
  "All",
  "Purchases",
  "Food",
  "Fixed",
  "Shopping",
  "Gift",
];

export const wishlistViews: MoneyWishlistView[] = [
  "All",
  "★★★★★",
  "Recent",
  "Purchased",
];

export const quickExpenseTemplates = [
  {
    label: "Coffee",
    name: "Coffee",
    category: "Food" as const,
    subcategory: "Cafe",
    store: "Offline",
    expenseType: "variable" as const,
  },
  {
    label: "Lunch",
    name: "Lunch",
    category: "Food" as const,
    subcategory: "Lunch",
    store: "Offline",
    expenseType: "variable" as const,
  },
  {
    label: "Convenience",
    name: "Convenience store",
    category: "Food" as const,
    subcategory: "Convenience",
    store: "Offline",
    expenseType: "variable" as const,
  },
  {
    label: "Transport",
    name: "Transport",
    category: "Transport" as const,
    subcategory: "",
    store: "Offline",
    expenseType: "variable" as const,
  },
  {
    label: "Webtoon",
    name: "Naver Webtoon cookies",
    category: "Content" as const,
    subcategory: "Webtoon",
    store: "Naver Store",
    expenseType: "one-time" as const,
  },
];

/* =========================================================
   2. Formatting, ids, and date helpers
   These helpers are UI-safe and have no React dependency.
========================================================= */

const isMoneyCategory = (value: unknown): value is MoneyCategory => {
  return typeof value === "string" && moneyCategoryIds.includes(value as MoneyCategory);
};

const getToday = () => new Date().toISOString().slice(0, 10);

const getIsoNow = () => new Date().toISOString();

const createSampleTransaction = (
  id: string,
  name: string,
  amount: number,
  date: string,
  category: MoneyCategory,
  subcategory: string,
  store: string,
  expenseType: MoneyExpenseType
): MoneyTransaction => ({
  id,
  name,
  amount,
  date,
  category,
  subcategory,
  store,
  channel: store === "Offline" ? "offline" : "online",
  expenseType,
  createdAt: getIsoNow(),
  updatedAt: getIsoNow(),
});

export const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const formatWon = (value: number) => {
  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
};

export const parseMoneyAmount = (value: string) => {
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export const getMonthKey = (date: string) => {
  return date.slice(0, 7);
};

export const getCurrentMonthKey = () => getMonthKey(getToday());

export const getMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-");
  return `${year}.${month}`;
};

export const getPreviousMonthKey = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const getCategoryDefinition = (category: MoneyCategory) => {
  return (
    moneyCategories.find((definition) => definition.id === category) ??
    moneyCategories[moneyCategories.length - 1]
  );
};

export const getSubcategories = (category: MoneyCategory) => {
  return getCategoryDefinition(category).subcategories;
};

/* =========================================================
   3. Default data and legacy migration
   Existing users may already have "glassday.money" from the old savings widget.
   normalizeMoneyData preserves the old monthlyGoal as the new monthlyBudget and
   falls back to seeded transactions/wishlist only when the new arrays are absent.
========================================================= */

const defaultTransactions = (): MoneyTransaction[] => {
  const today = getToday();
  const month = today.slice(0, 8);

  return [
    createSampleTransaction(
      "money-transaction-lunch",
      "Lunch",
      12000,
      `${month}03`,
      "Food",
      "Lunch",
      "Offline",
      "variable"
    ),
    createSampleTransaction(
      "money-transaction-cafe",
      "Cafe",
      5800,
      `${month}06`,
      "Food",
      "Cafe",
      "Offline",
      "variable"
    ),
    createSampleTransaction(
      "money-transaction-phone",
      "Phone bill",
      69000,
      `${month}10`,
      "Fixed",
      "Phone",
      "Other",
      "fixed"
    ),
    createSampleTransaction(
      "money-transaction-webtoon",
      "Naver Webtoon cookies",
      9900,
      `${month}12`,
      "Content",
      "Webtoon",
      "Naver Store",
      "one-time"
    ),
    createSampleTransaction(
      "money-transaction-workbook",
      "Actuarial workbook",
      32000,
      `${month}15`,
      "Study",
      "Workbook",
      "Offline",
      "one-time"
    ),
  ];
};

const defaultWishlist = (): MoneyWishlistItem[] => [
  {
    id: "money-wishlist-keyboard",
    name: "Compact keyboard",
    reason: "Desk setup upgrade",
    need: 4,
    expectedPrice: 79000,
    category: "Digital",
    subcategory: "PC Accessory",
    store: "Naver Store",
    url: "",
    images: [],
    status: "considering",
    addedAt: getToday(),
  },
];

const defaultRecurring = (): MoneyRecurringExpense[] => [
  {
    id: "money-recurring-phone",
    name: "Phone",
    amount: 69000,
    category: "Fixed",
    subcategory: "Phone",
    billingDay: 10,
    active: true,
  },
];

export const defaultMoneyData: MoneyData = {
  version: 2,
  monthlyBudget: 1000000,
  transactions: defaultTransactions(),
  wishlist: defaultWishlist(),
  recurring: defaultRecurring(),
  updatedAt: getIsoNow(),
};

const normalizeTransaction = (transaction: MoneyTransaction): MoneyTransaction => ({
  ...transaction,
  amount: Number.isFinite(transaction.amount) ? transaction.amount : 0,
  category: isMoneyCategory(transaction.category) ? transaction.category : "Other",
  expenseType: transaction.expenseType ?? "one-time",
  createdAt: transaction.createdAt ?? getIsoNow(),
  updatedAt: transaction.updatedAt ?? transaction.createdAt ?? getIsoNow(),
});

const normalizeWishlistItem = (item: MoneyWishlistItem): MoneyWishlistItem => ({
  ...item,
  images: Array.isArray(item.images) ? item.images : [],
  need: Math.min(5, Math.max(1, Math.round(item.need || 3))),
  status: item.status ?? "want",
  addedAt: item.addedAt ?? getToday(),
});

const normalizeRecurringExpense = (
  item: MoneyRecurringExpense
): MoneyRecurringExpense => ({
  ...item,
  amount: Number.isFinite(item.amount) ? item.amount : 0,
  category: isMoneyCategory(item.category) ? item.category : "Other",
  billingDay: Math.min(31, Math.max(1, Math.round(item.billingDay || 1))),
  active: Boolean(item.active),
});

export const normalizeMoneyData = (value: MoneyStorageShape): MoneyData => {
  const legacy = value as LegacyMoneyData;
  const budget =
    typeof value.monthlyBudget === "number"
      ? value.monthlyBudget
      : typeof legacy.monthlyGoal === "number"
        ? legacy.monthlyGoal
        : defaultMoneyData.monthlyBudget;

  return {
    version: 2,
    monthlyBudget: budget,
    transactions: Array.isArray(value.transactions)
      ? value.transactions.map(normalizeTransaction)
      : defaultMoneyData.transactions,
    wishlist: Array.isArray(value.wishlist)
      ? value.wishlist.map(normalizeWishlistItem)
      : defaultMoneyData.wishlist,
    recurring: Array.isArray(value.recurring)
      ? value.recurring.map(normalizeRecurringExpense)
      : defaultMoneyData.recurring,
    updatedAt: value.updatedAt ?? getIsoNow(),
  };
};

export const touchMoneyData = (data: MoneyData): MoneyData => ({
  ...data,
  updatedAt: getIsoNow(),
});

/* =========================================================
   4. Aggregation helpers
   Overview, donut chart, store bars, and filtered spending views all read from
   the same transaction list so Wishlist purchases update every summary at once.
========================================================= */

export const getTransactionsForMonth = (
  transactions: MoneyTransaction[],
  monthKey: string
) => {
  return transactions.filter((transaction) => getMonthKey(transaction.date) === monthKey);
};

export const getTotalAmount = (transactions: MoneyTransaction[]) => {
  return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
};

export const getBudgetPercentage = (spent: number, budget: number) => {
  if (budget <= 0) return 0;
  return Math.min(100, Math.round((spent / budget) * 100));
};

export const getCategoryBreakdown = (
  transactions: MoneyTransaction[]
): MoneyBreakdownItem[] => {
  const total = getTotalAmount(transactions);

  return moneyCategories
    .map((category) => {
      const amount = transactions
        .filter((transaction) => transaction.category === category.id)
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      return {
        key: category.id,
        label: category.label,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: category.color,
      };
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
};

export const getStoreBreakdown = (
  transactions: MoneyTransaction[]
): MoneyBreakdownItem[] => {
  const total = getTotalAmount(transactions);
  const storeMap = new Map<string, number>();

  transactions.forEach((transaction) => {
    const store = transaction.store?.trim() || "Other";
    storeMap.set(store, (storeMap.get(store) ?? 0) + transaction.amount);
  });

  return [...storeMap.entries()]
    .map(([store, amount]) => ({
      key: store,
      label: store,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
};

export const filterTransactionsByView = (
  transactions: MoneyTransaction[],
  view: MoneySpendingView
) => {
  if (view === "All") return transactions;
  if (view === "Food") return transactions.filter((item) => item.category === "Food");
  if (view === "Fixed") {
    return transactions.filter(
      (item) => item.category === "Fixed" || item.expenseType === "fixed"
    );
  }
  if (view === "Gift") return transactions.filter((item) => item.category === "Gift");
  if (view === "Purchases") {
    return transactions.filter((item) => item.expenseType === "one-time");
  }

  return transactions.filter((item) =>
    ["Fashion", "Beauty", "Living", "Digital", "Content", "Study"].includes(
      item.category
    )
  );
};

export const filterWishlistByView = (
  items: MoneyWishlistItem[],
  view: MoneyWishlistView
) => {
  if (view === "★★★★★") return items.filter((item) => item.need === 5);
  if (view === "Purchased") return items.filter((item) => item.status === "purchased");
  if (view === "Recent") {
    return [...items].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  }

  return items;
};

export const groupTransactionsByDate = (transactions: MoneyTransaction[]) => {
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return sorted.reduce<Array<{ date: string; transactions: MoneyTransaction[] }>>(
    (groups, transaction) => {
      const current = groups[groups.length - 1];

      if (current?.date === transaction.date) {
        current.transactions.push(transaction);
        return groups;
      }

      groups.push({
        date: transaction.date,
        transactions: [transaction],
      });

      return groups;
    },
    []
  );
};

/* =========================================================
   5. Wishlist purchase bridge
   Purchasing a wishlist item must create exactly one transaction. The widget
   calls this only after checking whether the wishlist item already has a live
   transactionId, which is the duplicate-transaction guard.
========================================================= */

export const createTransactionFromWishlist = (
  item: MoneyWishlistItem,
  patch: {
    amount: number;
    date: string;
    store: string;
    category: MoneyCategory;
    subcategory?: string;
  }
): MoneyTransaction => {
  const now = getIsoNow();

  return {
    id: createId("money-transaction"),
    name: item.name,
    amount: patch.amount,
    date: patch.date,
    category: patch.category,
    subcategory: patch.subcategory,
    store: patch.store,
    channel: patch.store === "Offline" ? "offline" : "online",
    expenseType: "one-time",
    wishlistItemId: item.id,
    createdAt: now,
    updatedAt: now,
  };
};
