/* Money domain types.
   These types describe the single Money storage object saved under
   localStorage key "glassday.money". Keeping transaction/wishlist/recurring
   together makes Supabase snapshot sync treat Money as one app memory while
   still keeping each record type explicit. */

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
