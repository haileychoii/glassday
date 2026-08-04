/**
 * ============================================================
 * [Domain Types] Money / Personal Finance
 * ============================================================
 *
 * Consumer: src/components/widgets/MoneyWidget.tsx 및 moneyUtils
 * Source of Truth: MoneyWidget의 useLocalStorage state
 * Persistence: glassday.money (Transaction/Wishlist/Recurring 한 snapshot)
 *
 * Figma Mapping:
 * - MoneyTransaction = Spending Row
 * - MoneyWishlistItem = Wishlist Card + Detail Window
 * - MoneyRecurringExpense = Recurring Row
 * - MoneySection/View union = Segmented Control 및 Filter Chip Variant
 * - MoneyBreakdownItem = Donut Legend / Store Bar row의 view model
 *
 * Wishlist Purchased action은 transactionId/wishlistItemId로 두 record를 연결한다.
 * ============================================================
 */

export type MoneyCategory =
  | "Food"
  | "Fashion"
  | "Beauty"
  | "Living"
  | "Digital"
  | "Transport"
  | "Fixed"
  | "Study"
  | "Content"
  | "Gift"
  | "Other";

export type MoneyChannel = "online" | "offline";

export type MoneyExpenseType = "fixed" | "variable" | "one-time";

export type MoneyWishlistStatus =
  | "want"
  | "considering"
  | "purchased"
  | "dropped";

export type MoneySection = "overview" | "spending" | "wishlist" | "recurring";

export type MoneySpendingView =
  | "All"
  | "Purchases"
  | "Food"
  | "Fixed"
  | "Shopping"
  | "Gift";

export type MoneyWishlistView = "All" | "★★★★★" | "Recent" | "Purchased";

export type MoneyTransaction = {
  /** Spending list, chart 합계, Wishlist purchase 연결의 record id. */
  id: string;
  name: string;
  amount: number;
  date: string;
  category: MoneyCategory;
  subcategory?: string;
  store?: string;
  channel?: MoneyChannel;
  expenseType: MoneyExpenseType;
  note?: string;
  wishlistItemId?: string;
  createdAt: string;
  updatedAt: string;
};

export type MoneyWishlistItem = {
  id: string;
  name: string;
  reason: string;
  need: number;
  expectedPrice?: number;
  category?: MoneyCategory;
  subcategory?: string;
  store?: string;
  url?: string;
  images: string[];
  status: MoneyWishlistStatus;
  addedAt: string;
  purchasedAt?: string;
  purchasedPrice?: number;
  /** 구매 완료 시 자동 생성된 MoneyTransaction과 연결한다. */
  transactionId?: string;
};

export type MoneyRecurringExpense = {
  id: string;
  name: string;
  amount: number;
  category: MoneyCategory;
  subcategory?: string;
  billingDay: number;
  active: boolean;
};

export type MoneyData = {
  version: 2;
  monthlyBudget: number;
  transactions: MoneyTransaction[];
  wishlist: MoneyWishlistItem[];
  recurring: MoneyRecurringExpense[];
  updatedAt: string;
};

export type LegacyMoneyData = {
  monthlyCurrent?: number;
  monthlyGoal?: number;
  assetCurrent?: number;
  assetGoal?: number;
};

export type MoneyStorageShape = Partial<MoneyData> & LegacyMoneyData;

export type MoneyCategoryDefinition = {
  id: MoneyCategory;
  label: string;
  color: string;
  subcategories: string[];
};

export type MoneyBreakdownItem = {
  key: string;
  label: string;
  amount: number;
  percentage: number;
  color?: string;
};
