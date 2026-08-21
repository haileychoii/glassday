/**
 * ============================================================
 * [Figma Mapping] Dashboard / Money Widget + Finance Detail
 * ============================================================
 *
 * 화면 역할:
 * - Grid에서는 월 지출/예산/category/recent transaction을 compact summary로 보여준다.
 * - Floating Detail에서는 Overview, Spending, Wishlist, Recurring 전체 기능을 제공한다.
 *
 * 연결:
 * - Renderer: DashboardGrid (WidgetId: money, legacy alias: wealth)
 * - Types: src/types/money.ts
 * - Domain helpers/migration: src/components/widgets/money/moneyUtils.ts
 * - Persistence: useLocalStorage / glassday.money
 * - Floating shell: src/components/common/FloatingWindow.tsx
 * - Style: src/styles/widgets/money.css + theme/responsive overrides
 *
 * Data relation:
 * - Wishlist Purchased action은 MoneyTransaction을 생성하고 transactionId/wishlistItemId로
 *   두 record를 연결한다. chart/total/list는 같은 transactions 배열에서 파생된다.
 *
 * Figma 구조:
 * - Compact Widget: Summary, Budget, Donut, Recent List
 * - Detail: Section Tabs + Overview/Spending/Wishlist/Recurring Variant
 * - Overlay states: Wishlist Detail, Purchase Dialog, Add forms
 * ============================================================
 */
import { useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  CalendarDays,
  Check,
  ExternalLink,
  Heart,
  Maximize2,
  Plus,
  ReceiptText,
  Repeat,
  ShoppingBag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import { FloatingWindow } from "../common/FloatingWindow";
import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";
import type {
  MoneyCategory,
  MoneyChannel,
  MoneyData,
  MoneyExpenseType,
  MoneyRecurringExpense,
  MoneySection,
  MoneySpendingView,
  MoneyStorageShape,
  MoneyTransaction,
  MoneyWishlistItem,
  MoneyWishlistStatus,
  MoneyWishlistView,
} from "../../types/money";
import {
  createId,
  createTransactionFromWishlist,
  defaultMoneyData,
  filterTransactionsByView,
  filterWishlistByView,
  formatWon,
  getBudgetPercentage,
  getCategoryBreakdown,
  getCategoryDefinition,
  getCurrentMonthKey,
  getMonthLabel,
  getPreviousMonthKey,
  getStoreBreakdown,
  getSubcategories,
  getTotalAmount,
  getTransactionsForMonth,
  groupTransactionsByDate,
  moneyCategories,
  moneyStoreDefaults,
  normalizeMoneyHashtags,
  normalizeMoneyLabel,
  normalizeMoneyData,
  parseMoneyAmount,
  quickExpenseTemplates,
  spendingViews,
  touchMoneyData,
  wishlistViews,
} from "./money/moneyUtils";

/* Form Draft는 UI-only state다. 빈 number input을 유지하기 위해 문자열로 편집하고
   submit handler에서만 domain number로 변환한다. */
type ExpenseDraft = {
  name: string;
  amount: string;
  date: string;
  category: MoneyCategory;
  subcategory: string;
  store: string;
  channel: MoneyChannel;
  expenseType: MoneyExpenseType;
  hashtags: string;
  note: string;
};

type WishlistDraft = {
  name: string;
  reason: string;
  need: string;
  expectedPrice: string;
  category: MoneyCategory;
  subcategory: string;
  store: string;
  url: string;
  images: string;
  status: MoneyWishlistStatus;
};

type RecurringDraft = {
  name: string;
  amount: string;
  category: MoneyCategory;
  subcategory: string;
  billingDay: string;
  active: boolean;
};

type PurchaseDraft = {
  actualPrice: string;
  purchasedDate: string;
  store: string;
  category: MoneyCategory;
  subcategory: string;
};

const todayInput = () => new Date().toISOString().slice(0, 10);

const createDefaultExpenseDraft = (): ExpenseDraft => ({
  name: "",
  amount: "",
  date: todayInput(),
  category: "Food",
  subcategory: "Lunch",
  store: "Offline",
  channel: "offline",
  expenseType: "variable",
  hashtags: "",
  note: "",
});

const createDefaultWishlistDraft = (): WishlistDraft => ({
  name: "",
  reason: "",
  need: "3",
  expectedPrice: "",
  category: "Digital",
  subcategory: "Device",
  store: "Naver Store",
  url: "",
  images: "",
  status: "want",
});

const createDefaultRecurringDraft = (): RecurringDraft => ({
  name: "",
  amount: "",
  category: "Fixed",
  subcategory: "Subscription",
  billingDay: "1",
  active: true,
});

const getDefaultPurchaseDraft = (item: MoneyWishlistItem): PurchaseDraft => ({
  actualPrice: item.purchasedPrice?.toString() ?? item.expectedPrice?.toString() ?? "",
  purchasedDate: item.purchasedAt ?? todayInput(),
  store: item.store ?? "Other",
  category: item.category ?? "Other",
  subcategory: item.subcategory ?? "",
});

const getDaysSince = (date: string) => {
  const added = new Date(`${date}T00:00:00`);
  const today = new Date(`${todayInput()}T00:00:00`);
  return Math.max(
    0,
    Math.floor((today.getTime() - added.getTime()) / (1000 * 60 * 60 * 24))
  );
};

const splitImages = (value: string) => {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const tagsToDraftValue = (tags?: string[]) =>
  (tags ?? []).map((tag) => `#${tag}`).join(" ");

const createExpenseDraftFromTransaction = (
  transaction: MoneyTransaction
): ExpenseDraft => ({
  name: transaction.name,
  amount: String(transaction.amount),
  date: transaction.date,
  category: transaction.category,
  subcategory: transaction.subcategory ?? "",
  store: transaction.store ?? "Other",
  channel: transaction.channel ?? "offline",
  expenseType: transaction.expenseType,
  hashtags: tagsToDraftValue(transaction.hashtags),
  note: transaction.note ?? "",
});

const getUniqueMoneyOptions = (items: string[]) => {
  const seen = new Set<string>();

  return items.reduce<string[]>((options, item) => {
    const normalized = normalizeMoneyLabel(item);
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) return options;

    seen.add(key);
    options.push(normalized);
    return options;
  }, []);
};

const getMonthDeltaLabel = (current: number, previous: number) => {
  if (previous <= 0) return "No last month data";

  const diff = current - previous;
  const sign = diff >= 0 ? "+" : "-";
  const percent = Math.round((Math.abs(diff) / previous) * 100);

  return `${sign}${formatWon(Math.abs(diff))} · ${percent}% vs last month`;
};

const getTransactionMeta = (transaction: MoneyTransaction) => {
  return [
    transaction.category,
    transaction.subcategory,
    transaction.store,
  ]
    .filter(Boolean)
    .join(" · ");
};

const getTopCategoryLabel = (transactions: MoneyTransaction[]) => {
  const [topCategory] = getCategoryBreakdown(transactions);
  if (!topCategory) return "No spending yet";
  return `${topCategory.label} · ${formatWon(topCategory.amount)}`;
};

/* Shared controls stay local to MoneyWidget because they are tightly bound to
   the Money category/store catalogs and are not a new design system. */
const CategorySelect = ({
  value,
  onChange,
  className,
}: {
  value: MoneyCategory;
  onChange: (value: MoneyCategory) => void;
  className?: string;
}) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value as MoneyCategory)}
    className={className}
  >
    {moneyCategories.map((category) => (
      <option key={category.id} value={category.id}>
        {category.label}
      </option>
    ))}
  </select>
);

const StoreInput = ({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) => (
  <>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={(event) => onChange(normalizeMoneyLabel(event.target.value))}
      list="money-store-defaults"
      className={className}
      placeholder="Store"
    />
  </>
);

const SubcategoryInput = ({
  value,
  onChange,
  category,
  options,
  scope,
}: {
  value: string;
  onChange: (value: string) => void;
  category: MoneyCategory;
  options: string[];
  scope: string;
}) => {
  const listId = `money-subcategories-${scope}-${category.toLowerCase()}`;

  return (
    <>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onChange(normalizeMoneyLabel(event.target.value))}
        list={listId}
        placeholder="Type or choose"
      />

      <datalist id={listId}>
        {options.map((subcategory) => (
          <option key={subcategory} value={subcategory} />
        ))}
      </datalist>
    </>
  );
};

/* SVG donut chart.
   No chart dependency is used; each transaction category becomes one circle
   stroke segment and clicking a segment toggles the category detail filter. */
const SpendingDonut = ({
  items,
  total,
  selectedCategory,
  onSelect,
}: {
  items: ReturnType<typeof getCategoryBreakdown>;
  total: number;
  selectedCategory: MoneyCategory | null;
  onSelect: (category: MoneyCategory | null) => void;
}) => {
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const segments = items.map((item, index) => {
    const dash = total > 0 ? (item.amount / total) * circumference : 0;
    const previousDash = items
      .slice(0, index)
      .reduce(
        (sum, previousItem) =>
          sum +
          (total > 0 ? (previousItem.amount / total) * circumference : 0),
        0
      );

    return {
      ...item,
      dash,
      strokeDashoffset: -previousDash,
    };
  });

  return (
    <div className="money-donut">
      <svg viewBox="0 0 120 120" className="money-donut-svg" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="money-donut-track"
          fill="none"
          strokeWidth="14"
        />

        {segments.map((item) => {
          return (
            <circle
              key={item.key}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={selectedCategory === item.key ? 16 : 14}
              strokeLinecap="round"
              strokeDasharray={`${item.dash} ${circumference}`}
              strokeDashoffset={item.strokeDashoffset}
              className={cn(
                "money-donut-segment",
                selectedCategory === item.key && "is-selected"
              )}
              transform="rotate(-90 60 60)"
              onClick={() =>
                onSelect(selectedCategory === item.key ? null : (item.key as MoneyCategory))
              }
            />
          );
        })}
      </svg>

      <div className="money-donut-center">
        <strong>{formatWon(total)}</strong>
        <span>Total spent</span>
      </div>
    </div>
  );
};

const CategoryLegend = ({
  items,
  selectedCategory,
  onSelect,
}: {
  items: ReturnType<typeof getCategoryBreakdown>;
  selectedCategory: MoneyCategory | null;
  onSelect: (category: MoneyCategory | null) => void;
}) => (
  <div className="money-category-list">
    {items.length === 0 ? (
      <div className="money-empty">No category spending yet.</div>
    ) : (
      items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() =>
            onSelect(selectedCategory === item.key ? null : (item.key as MoneyCategory))
          }
          className={cn(
            "money-category-row",
            selectedCategory === item.key && "is-selected"
          )}
          style={{ "--money-color": item.color } as CSSProperties}
        >
          <span className="money-color-dot" />
          <span>{item.label}</span>
          <strong>{formatWon(item.amount)}</strong>
          <em>{item.percentage}%</em>
        </button>
      ))
    )}
  </div>
);

const StoreBars = ({ items }: { items: ReturnType<typeof getStoreBreakdown> }) => (
  <div className="money-store-bars">
    {items.length === 0 ? (
      <div className="money-empty">No store spending yet.</div>
    ) : (
      items.slice(0, 8).map((item) => (
        <div key={item.key} className="money-store-row">
          <span>{item.label}</span>
          <div className="money-store-track">
            <div
              className="money-store-fill"
              style={{ width: `${Math.max(5, item.percentage)}%` }}
            />
          </div>
          <strong>{formatWon(item.amount)}</strong>
        </div>
      ))
    )}
  </div>
);

const TransactionList = ({
  transactions,
  onDelete,
  onEdit,
}: {
  transactions: MoneyTransaction[];
  onDelete?: (id: string) => void;
  onEdit?: (transaction: MoneyTransaction) => void;
}) => {
  const groups = groupTransactionsByDate(transactions);

  if (groups.length === 0) {
    return <div className="money-empty">No transactions for this view.</div>;
  }

  return (
    <div className="money-transaction-groups">
      {groups.map((group) => (
        <section key={group.date} className="money-date-group">
          <div className="money-date-heading">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{group.date}</span>
          </div>

          <div className="money-transaction-list">
            {group.transactions.map((transaction) => {
              const category = getCategoryDefinition(transaction.category);

              return (
                <button
                  key={transaction.id}
                  type="button"
                  className="money-transaction-row"
                  onClick={() => onEdit?.(transaction)}
                >
                  <span
                    className="money-transaction-mark"
                    style={{ backgroundColor: category.color }}
                  />

                  <div className="money-transaction-copy">
                    <strong>{transaction.name}</strong>
                    <span>{getTransactionMeta(transaction)}</span>
                    {transaction.hashtags && transaction.hashtags.length > 0 && (
                      <em className="money-transaction-tags">
                        {transaction.hashtags.map((tag) => `#${tag}`).join(" ")}
                      </em>
                    )}
                  </div>

                  <div className="money-transaction-side">
                    <strong>{formatWon(transaction.amount)}</strong>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(transaction.id);
                        }}
                        className="money-icon-button"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

const Stars = ({ value }: { value: number }) => (
  <span className="money-stars" aria-label={`Need ${value} of 5`}>
    {"★".repeat(value)}
    {"☆".repeat(Math.max(0, 5 - value))}
  </span>
);

/**
 * MoneyWidget
 * 하나의 MoneyData Source of Truth를 compact Widget과 Floating Detail이 공유한다.
 * section/filter/selected item/form draft는 일시적인 UI state이고 MoneyData만 저장된다.
 */
export const MoneyWidget = () => {
  const [detailOpen, setDetailOpen] = useState(false);
  const [section, setSection] = useState<MoneySection>("overview");
  const [spendingView, setSpendingView] = useState<MoneySpendingView>("All");
  const [wishlistView, setWishlistView] = useState<MoneyWishlistView>("All");
  // Expense creation is opt-in inside the floating window to keep the ledger compact.
  // 지출 입력폼이 항상 펼쳐져 공간을 차지하지 않도록 토글 상태로 관리한다.
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [wishlistFormOpen, setWishlistFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MoneyCategory | null>(
    null
  );
  const [selectedExpenseTag, setSelectedExpenseTag] = useState<string | null>(
    null
  );
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(
    null
  );
  const [purchaseItemId, setPurchaseItemId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(
    null
  );
  const [expenseDraft, setExpenseDraft] = useState(createDefaultExpenseDraft);
  const [editingExpenseDraft, setEditingExpenseDraft] =
    useState<ExpenseDraft | null>(null);
  const [wishlistDraft, setWishlistDraft] = useState(createDefaultWishlistDraft);
  const [recurringDraft, setRecurringDraft] = useState(createDefaultRecurringDraft);
  const [purchaseDraft, setPurchaseDraft] = useState<PurchaseDraft | null>(null);
  /* Expense submit guard:
     Floating windows can receive fast Enter/click repeats before React paints the
     reset form. Keep the guard local to Money so legitimate repeated purchases
     can still be added after a short pause. / 같은 입력이 즉시 여러 번 저장되는
     것을 막되, 나중에 같은 금액을 다시 쓰는 건 허용한다. */
  const lastExpenseSubmitRef = useRef<{
    signature: string;
    submittedAt: number;
  } | null>(null);

  const { value: storedMoney, setValue: setStoredMoney } =
    useLocalStorage<MoneyStorageShape>("glassday.money", defaultMoneyData);

  // Normalize on read so old glassday.money data can coexist with the new model.
  const money = useMemo(() => normalizeMoneyData(storedMoney), [storedMoney]);

  // Every write goes through this helper so the persisted shape stays canonical.
  const setMoneyData = (updater: (data: MoneyData) => MoneyData) => {
    setStoredMoney((prev) => touchMoneyData(updater(normalizeMoneyData(prev))));
  };

  const currentMonth = getCurrentMonthKey();
  const previousMonth = getPreviousMonthKey(currentMonth);
  const monthTransactions = useMemo(
    () => getTransactionsForMonth(money.transactions, currentMonth),
    [money.transactions, currentMonth]
  );
  const previousMonthTransactions = useMemo(
    () => getTransactionsForMonth(money.transactions, previousMonth),
    [money.transactions, previousMonth]
  );

  const totalSpent = getTotalAmount(monthTransactions);
  const previousSpent = getTotalAmount(previousMonthTransactions);
  const budgetPercent = getBudgetPercentage(totalSpent, money.monthlyBudget);
  const categoryBreakdown = getCategoryBreakdown(monthTransactions);
  const storeBreakdown = getStoreBreakdown(monthTransactions);
  const selectedCategoryTransactions = selectedCategory
    ? monthTransactions.filter((transaction) => transaction.category === selectedCategory)
    : monthTransactions;
  const recentTransactions = [...money.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const filteredSpending = filterTransactionsByView(money.transactions, spendingView);
  const expenseTagOptions = useMemo(
    () =>
      getUniqueMoneyOptions(
        money.transactions.flatMap((transaction) => transaction.hashtags ?? [])
      ),
    [money.transactions]
  );
  const visibleSpending = selectedExpenseTag
    ? filteredSpending.filter((transaction) =>
        (transaction.hashtags ?? []).some(
          (tag) => tag.toLowerCase() === selectedExpenseTag.toLowerCase()
        )
      )
    : filteredSpending;
  const subcategoryOptionsByCategory = useMemo(() => {
    return moneyCategories.reduce<Record<MoneyCategory, string[]>>(
      (options, category) => {
        options[category.id] = getUniqueMoneyOptions([
          ...getSubcategories(category.id),
          ...money.transactions
            .filter((transaction) => transaction.category === category.id)
            .map((transaction) => transaction.subcategory ?? ""),
          ...money.wishlist
            .filter((item) => item.category === category.id)
            .map((item) => item.subcategory ?? ""),
          ...money.recurring
            .filter((item) => item.category === category.id)
            .map((item) => item.subcategory ?? ""),
        ]);

        return options;
      },
      {} as Record<MoneyCategory, string[]>
    );
  }, [money.recurring, money.transactions, money.wishlist]);
  const filteredWishlist = filterWishlistByView(money.wishlist, wishlistView);
  const selectedWishlist =
    money.wishlist.find((item) => item.id === selectedWishlistId) ?? null;
  const purchaseItem =
    money.wishlist.find((item) => item.id === purchaseItemId) ?? null;
  const editingTransaction =
    money.transactions.find((item) => item.id === editingTransactionId) ?? null;

  const updateExpenseDraft = <K extends keyof ExpenseDraft>(
    key: K,
    value: ExpenseDraft[K]
  ) => {
    setExpenseDraft((prev) => {
      if (key === "category") {
        const category = value as MoneyCategory;
        return {
          ...prev,
          category,
          subcategory: subcategoryOptionsByCategory[category][0] ?? "",
        };
      }

      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const updateEditingExpenseDraft = <K extends keyof ExpenseDraft>(
    key: K,
    value: ExpenseDraft[K]
  ) => {
    setEditingExpenseDraft((prev) => {
      if (!prev) return prev;

      if (key === "category") {
        const category = value as MoneyCategory;
        return {
          ...prev,
          category,
          subcategory: subcategoryOptionsByCategory[category][0] ?? "",
        };
      }

      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const updateWishlistDraft = <K extends keyof WishlistDraft>(
    key: K,
    value: WishlistDraft[K]
  ) => {
    setWishlistDraft((prev) => {
      if (key === "category") {
        const category = value as MoneyCategory;
        return {
          ...prev,
          category,
          subcategory: subcategoryOptionsByCategory[category][0] ?? "",
        };
      }

      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const updateRecurringDraft = <K extends keyof RecurringDraft>(
    key: K,
    value: RecurringDraft[K]
  ) => {
    setRecurringDraft((prev) => {
      if (key === "category") {
        const category = value as MoneyCategory;
        return {
          ...prev,
          category,
          subcategory: getSubcategories(category)[0] ?? "",
        };
      }

      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const openMoneyDetail = (nextSection: MoneySection) => {
    setSection(nextSection);
    setDetailOpen(true);
  };

  const addExpense = (event?: FormEvent) => {
    event?.preventDefault();

    const amount = parseMoneyAmount(expenseDraft.amount);
    if (!expenseDraft.name.trim() || amount <= 0 || !expenseDraft.date) return;

    const submittedAt = Date.now();
    const subcategory = normalizeMoneyLabel(expenseDraft.subcategory);
    const store = normalizeMoneyLabel(expenseDraft.store) || "Other";
    const hashtags = normalizeMoneyHashtags(expenseDraft.hashtags);
    const expenseSignature = [
      expenseDraft.name.trim(),
      amount,
      expenseDraft.date,
      expenseDraft.category,
      subcategory,
      store,
      expenseDraft.channel,
      expenseDraft.expenseType,
      hashtags.join(","),
      expenseDraft.note.trim(),
    ].join("\u001f");
    const lastSubmit = lastExpenseSubmitRef.current;

    if (
      lastSubmit?.signature === expenseSignature &&
      submittedAt - lastSubmit.submittedAt < 1200
    ) {
      return;
    }

    lastExpenseSubmitRef.current = {
      signature: expenseSignature,
      submittedAt,
    };

    const now = new Date(submittedAt).toISOString();
    const transaction: MoneyTransaction = {
      id: createId("money-transaction"),
      name: expenseDraft.name.trim(),
      amount,
      date: expenseDraft.date,
      category: expenseDraft.category,
      subcategory: subcategory || undefined,
      store,
      channel: expenseDraft.channel,
      expenseType: expenseDraft.expenseType,
      hashtags,
      note: expenseDraft.note.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    setMoneyData((prev) => {
      /* Storage-level duplicate guard:
         If a submit event is replayed while localStorage/cloud listeners are
         refreshing state, keep only one recent identical transaction. */
      const recentDuplicate = prev.transactions.some((item) => {
        const createdAt = Date.parse(item.createdAt);
        return (
          item.name === transaction.name &&
          item.amount === transaction.amount &&
          item.date === transaction.date &&
          item.category === transaction.category &&
          (item.subcategory ?? "") === (transaction.subcategory ?? "") &&
          (item.store ?? "Other") === (transaction.store ?? "Other") &&
          (item.channel ?? "offline") === (transaction.channel ?? "offline") &&
          item.expenseType === transaction.expenseType &&
          (item.hashtags ?? []).join(",") ===
            (transaction.hashtags ?? []).join(",") &&
          (item.note ?? "") === (transaction.note ?? "") &&
          Number.isFinite(createdAt) &&
          Math.abs(submittedAt - createdAt) < 2000
        );
      });

      if (recentDuplicate) return prev;

      return {
        ...prev,
        transactions: [transaction, ...prev.transactions],
      };
    });
    setExpenseDraft(createDefaultExpenseDraft());
    setExpenseFormOpen(false);
  };

  const applyQuickTemplate = (template: (typeof quickExpenseTemplates)[number]) => {
    setExpenseDraft((prev) => ({
      ...prev,
      name: template.name,
      category: template.category,
      subcategory: template.subcategory,
      store: template.store,
      channel: template.store === "Offline" ? "offline" : "online",
      expenseType: template.expenseType,
      amount: "",
      hashtags: "",
      date: todayInput(),
    }));
    setExpenseFormOpen(true);
    openMoneyDetail("spending");
  };

  const removeTransaction = (id: string) => {
    setMoneyData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((transaction) => transaction.id !== id),
    }));
    if (editingTransactionId === id) {
      setEditingTransactionId(null);
      setEditingExpenseDraft(null);
    }
  };

  const openTransactionEditor = (transaction: MoneyTransaction) => {
    setEditingTransactionId(transaction.id);
    setEditingExpenseDraft(createExpenseDraftFromTransaction(transaction));
    setDetailOpen(true);
  };

  const closeTransactionEditor = () => {
    setEditingTransactionId(null);
    setEditingExpenseDraft(null);
  };

  const saveEditedTransaction = (event: FormEvent) => {
    event.preventDefault();
    if (!editingTransactionId || !editingExpenseDraft) return;

    const amount = parseMoneyAmount(editingExpenseDraft.amount);
    if (!editingExpenseDraft.name.trim() || amount <= 0 || !editingExpenseDraft.date) {
      return;
    }

    const subcategory = normalizeMoneyLabel(editingExpenseDraft.subcategory);
    const store = normalizeMoneyLabel(editingExpenseDraft.store) || "Other";
    const hashtags = normalizeMoneyHashtags(editingExpenseDraft.hashtags);

    setMoneyData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((transaction) =>
        transaction.id === editingTransactionId
          ? {
              ...transaction,
              name: editingExpenseDraft.name.trim(),
              amount,
              date: editingExpenseDraft.date,
              category: editingExpenseDraft.category,
              subcategory: subcategory || undefined,
              store,
              channel: editingExpenseDraft.channel,
              expenseType: editingExpenseDraft.expenseType,
              hashtags,
              note: editingExpenseDraft.note.trim() || undefined,
              updatedAt: new Date().toISOString(),
            }
          : transaction
      ),
    }));

    closeTransactionEditor();
  };

  const addWishlistItem = (event: FormEvent) => {
    event.preventDefault();
    if (!wishlistDraft.name.trim()) return;

    const item: MoneyWishlistItem = {
      id: createId("money-wishlist"),
      name: wishlistDraft.name.trim(),
      reason: wishlistDraft.reason.trim(),
      need: Math.min(5, Math.max(1, Number(wishlistDraft.need) || 3)),
      expectedPrice: wishlistDraft.expectedPrice
        ? parseMoneyAmount(wishlistDraft.expectedPrice)
        : undefined,
      category: wishlistDraft.category,
      subcategory: normalizeMoneyLabel(wishlistDraft.subcategory) || undefined,
      store: normalizeMoneyLabel(wishlistDraft.store) || undefined,
      url: wishlistDraft.url.trim() || undefined,
      images: splitImages(wishlistDraft.images),
      status: wishlistDraft.status,
      addedAt: todayInput(),
    };

    setMoneyData((prev) => ({
      ...prev,
      wishlist: [item, ...prev.wishlist],
    }));
    setSelectedWishlistId(item.id);
    setWishlistDraft(createDefaultWishlistDraft());
    setWishlistFormOpen(false);
  };

  const updateWishlistItem = (
    id: string,
    patch: Partial<MoneyWishlistItem>
  ) => {
    setMoneyData((prev) => ({
      ...prev,
      wishlist: prev.wishlist.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
            }
          : item
      ),
    }));
  };

  const removeWishlistItem = (id: string) => {
    setMoneyData((prev) => ({
      ...prev,
      wishlist: prev.wishlist.filter((item) => item.id !== id),
    }));
    setSelectedWishlistId((prev) => (prev === id ? null : prev));
  };

  const openPurchaseDialog = (item: MoneyWishlistItem) => {
    setPurchaseItemId(item.id);
    setPurchaseDraft(getDefaultPurchaseDraft(item));
  };

  const confirmPurchase = (event: FormEvent) => {
    event.preventDefault();
    if (!purchaseItem || !purchaseDraft) return;

    const amount = parseMoneyAmount(purchaseDraft.actualPrice);
    if (amount <= 0 || !purchaseDraft.purchasedDate) return;

    setMoneyData((prev) => {
      const item = prev.wishlist.find((candidate) => candidate.id === purchaseItem.id);
      if (!item) return prev;

      const existingTransactionId = item.transactionId;
      const existingTransaction = existingTransactionId
        ? prev.transactions.some((transaction) => transaction.id === existingTransactionId)
        : false;

      if (existingTransactionId && existingTransaction) {
        return {
          ...prev,
          wishlist: prev.wishlist.map((candidate) =>
            candidate.id === item.id
              ? {
                  ...candidate,
                  status: "purchased",
                  purchasedAt: purchaseDraft.purchasedDate,
                  purchasedPrice: amount,
                  store: normalizeMoneyLabel(purchaseDraft.store),
                  category: purchaseDraft.category,
                  subcategory:
                    normalizeMoneyLabel(purchaseDraft.subcategory) || undefined,
                }
              : candidate
          ),
        };
      }

      const transaction = createTransactionFromWishlist(item, {
        amount,
        date: purchaseDraft.purchasedDate,
        store:
          normalizeMoneyLabel(purchaseDraft.store) ||
          normalizeMoneyLabel(item.store ?? "") ||
          "Other",
        category: purchaseDraft.category,
        subcategory: normalizeMoneyLabel(purchaseDraft.subcategory) || undefined,
      });

      return {
        ...prev,
        transactions: [transaction, ...prev.transactions],
        wishlist: prev.wishlist.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                status: "purchased",
                purchasedAt: purchaseDraft.purchasedDate,
                purchasedPrice: amount,
                store: normalizeMoneyLabel(purchaseDraft.store),
                category: purchaseDraft.category,
                subcategory:
                  normalizeMoneyLabel(purchaseDraft.subcategory) || undefined,
                transactionId: transaction.id,
              }
            : candidate
        ),
      };
    });

    setPurchaseItemId(null);
    setPurchaseDraft(null);
    setSection("overview");
  };

  const addRecurring = (event: FormEvent) => {
    event.preventDefault();

    const amount = parseMoneyAmount(recurringDraft.amount);
    if (!recurringDraft.name.trim() || amount <= 0) return;

    const recurring: MoneyRecurringExpense = {
      id: createId("money-recurring"),
      name: recurringDraft.name.trim(),
      amount,
      category: recurringDraft.category,
      subcategory: normalizeMoneyLabel(recurringDraft.subcategory) || undefined,
      billingDay: Math.min(31, Math.max(1, Number(recurringDraft.billingDay) || 1)),
      active: recurringDraft.active,
    };

    setMoneyData((prev) => ({
      ...prev,
      recurring: [recurring, ...prev.recurring],
    }));
    setRecurringDraft(createDefaultRecurringDraft());
  };

  const updateRecurring = (
    id: string,
    patch: Partial<MoneyRecurringExpense>
  ) => {
    setMoneyData((prev) => ({
      ...prev,
      recurring: prev.recurring.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
            }
          : item
      ),
    }));
  };

  const removeRecurring = (id: string) => {
    setMoneyData((prev) => ({
      ...prev,
      recurring: prev.recurring.filter((item) => item.id !== id),
    }));
  };

  return (
    <>
      {/* Figma Component: Money Compact Widget / container 크기별 summary density Variant */}
      <GlassCard
        title="Money"
        subtitle={`${getMonthLabel(currentMonth)} · ${formatWon(totalSpent)} spent`}
        icon={<Wallet className="w-4 h-4" />}
        className="money-widget"
        actions={
          <div className="money-widget-actions">
            <button
              type="button"
              onClick={() => openMoneyDetail("spending")}
              className="glass-button money-action-button"
              title="Add expense"
              aria-label="Add expense"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>

            <button
              type="button"
              onClick={() => openMoneyDetail("overview")}
              className="glass-button money-icon-button"
              title="Open money detail"
              aria-label="Open money detail"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      >
        <div className="money-dashboard">
          {/* Figma Frame: Monthly Summary + Budget usage */}
          <section className="money-summary-panel">
            <div className="money-summary-copy">
              <span>{getMonthLabel(currentMonth)}</span>
              <strong>{formatWon(totalSpent)}</strong>
              <em>{getMonthDeltaLabel(totalSpent, previousSpent)}</em>
            </div>

            <div className="money-budget-mini">
              <span>Budget</span>
              <strong>{budgetPercent}%</strong>
            </div>
          </section>

          <section className="money-budget-panel">
            <div className="money-panel-heading">
              <span>Monthly budget</span>
              <strong>{formatWon(money.monthlyBudget)}</strong>
            </div>
            <div className="money-budget-track">
              <div
                className="money-budget-fill"
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
          </section>

          {/* Figma Frame: Category Visualization / Donut + Top Category */}
          <section className="money-visual-panel">
            <SpendingDonut
              items={categoryBreakdown}
              total={totalSpent}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />

            <div className="money-top-category">
              <span>Top category</span>
              <strong>{getTopCategoryLabel(monthTransactions)}</strong>
            </div>
          </section>

          {/* Scroll/List Frame: Recent Transaction Row instances */}
          <section className="money-recent-panel">
            <div className="money-panel-heading">
              <span>Recent spending</span>
              <button type="button" onClick={() => openMoneyDetail("spending")}>
                View all
              </button>
            </div>

            <TransactionList
              transactions={recentTransactions}
              onEdit={openTransactionEditor}
            />
          </section>
        </div>
      </GlassCard>

      {/* Figma Component: Money Detail Floating Window / 4 section Variants */}
      <FloatingWindow
        open={detailOpen}
        title="Money"
        subtitle="Personal finance, spending, wishlist, recurring"
        storageKey="glassday.money.detailWindow.rect.v1"
        defaultRect={{ x: 120, y: 72, w: 1060, h: 740 }}
        minWidth={380}
        minHeight={320}
        className="money-floating-window"
        titlebarClassName="money-floating-titlebar"
        actions={
          <button
            type="button"
            onClick={() => setSection("spending")}
            className="glass-button money-action-button"
          >
            <Plus className="w-3.5 h-3.5" />
            Expense
          </button>
        }
        onClose={() => setDetailOpen(false)}
      >
        <datalist id="money-store-defaults">
          {moneyStoreDefaults.map((store) => (
            <option key={store} value={store} />
          ))}
        </datalist>

        {/* Scroll Container: section navigation과 선택된 finance section content */}
        <div className="money-detail">
          {/* Figma Component Set: Section Tab / Default · Selected */}
          <nav className="money-section-tabs" aria-label="Money sections">
            {(["overview", "spending", "wishlist", "recurring"] as MoneySection[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSection(item)}
                  className={cn("money-section-tab", section === item && "is-active")}
                >
                  {item === "overview" && <ReceiptText className="w-3.5 h-3.5" />}
                  {item === "spending" && <ShoppingBag className="w-3.5 h-3.5" />}
                  {item === "wishlist" && <Heart className="w-3.5 h-3.5" />}
                  {item === "recurring" && <Repeat className="w-3.5 h-3.5" />}
                  <span>{item[0].toUpperCase() + item.slice(1)}</span>
                </button>
              )
            )}
          </nav>

          {section === "overview" && (
            <div className="money-overview-grid">
              <section className="money-detail-card money-overview-hero">
                <div>
                  <span className="money-kicker">Current month</span>
                  <h3>{getMonthLabel(currentMonth)}</h3>
                  <strong>{formatWon(totalSpent)}</strong>
                  <p>{getMonthDeltaLabel(totalSpent, previousSpent)}</p>
                </div>

                <label className="money-budget-editor">
                  <span>Monthly budget</span>
                  <input
                    type="number"
                    min={0}
                    value={money.monthlyBudget}
                    onChange={(event) =>
                      setMoneyData((prev) => ({
                        ...prev,
                        monthlyBudget: Number(event.target.value) || 0,
                      }))
                    }
                  />
                  <em>{budgetPercent}% used</em>
                </label>
              </section>

              <section className="money-detail-card money-chart-card">
                <div className="money-section-heading">
                  <div>
                    <span className="money-kicker">Visualization</span>
                    <h3>Spending by Category</h3>
                  </div>
                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className="money-text-button"
                    >
                      All categories
                    </button>
                  )}
                </div>

                <div className="money-chart-layout">
                  <SpendingDonut
                    items={categoryBreakdown}
                    total={totalSpent}
                    selectedCategory={selectedCategory}
                    onSelect={setSelectedCategory}
                  />
                  <CategoryLegend
                    items={categoryBreakdown}
                    selectedCategory={selectedCategory}
                    onSelect={setSelectedCategory}
                  />
                </div>
              </section>

              <section className="money-detail-card">
                <div className="money-section-heading">
                  <div>
                    <span className="money-kicker">Store</span>
                    <h3>Spending by Store</h3>
                  </div>
                </div>
                <StoreBars items={storeBreakdown} />
              </section>

              <section className="money-detail-card">
                <div className="money-section-heading">
                  <div>
                    <span className="money-kicker">
                      {selectedCategory ?? "All"} spending
                    </span>
                    <h3>Category detail</h3>
                  </div>
                </div>
                <TransactionList
                  transactions={selectedCategoryTransactions.slice(0, 8)}
                  onEdit={openTransactionEditor}
                />
              </section>
            </div>
          )}

          {section === "spending" && (
            <div className="money-spending-layout">
              <section
                className={cn(
                  "money-detail-card money-form-card money-expense-add-card",
                  !expenseFormOpen && "is-collapsed"
                )}
              >
                <div className="money-section-heading">
                  <div>
                    <span className="money-kicker">Database</span>
                    <h3>Add Expense</h3>
                    <p>
                      Keep the form closed until you are entering a new spend.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpenseFormOpen((prev) => !prev)}
                    className="money-secondary-button money-expense-toggle"
                  >
                    {expenseFormOpen ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    {expenseFormOpen ? "Hide" : "Add Expense"}
                  </button>
                </div>

                {expenseFormOpen && (
                  <>
                    <div className="money-quick-add">
                      {quickExpenseTemplates.map((template) => (
                        <button
                          key={template.label}
                          type="button"
                          onClick={() => applyQuickTemplate(template)}
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>

                    <form className="money-form" onSubmit={addExpense}>
                      <label>
                        <span>Name</span>
                        <input
                          value={expenseDraft.name}
                          onChange={(event) =>
                            updateExpenseDraft("name", event.target.value)
                          }
                          placeholder="Lunch, cafe, webtoon cookies..."
                        />
                      </label>

                      <label>
                        <span>Amount</span>
                        <input
                          type="number"
                          min={0}
                          value={expenseDraft.amount}
                          onChange={(event) =>
                            updateExpenseDraft("amount", event.target.value)
                          }
                          placeholder="0"
                        />
                      </label>

                      <label>
                        <span>Date</span>
                        <input
                          type="date"
                          value={expenseDraft.date}
                          onChange={(event) =>
                            updateExpenseDraft("date", event.target.value)
                          }
                        />
                      </label>

                      <label>
                        <span>Category</span>
                        <CategorySelect
                          value={expenseDraft.category}
                          onChange={(value) =>
                            updateExpenseDraft("category", value)
                          }
                        />
                      </label>

                      <label>
                        <span>Subcategory</span>
                        <SubcategoryInput
                          value={expenseDraft.subcategory}
                          onChange={(value) =>
                            updateExpenseDraft("subcategory", value)
                          }
                          category={expenseDraft.category}
                          options={subcategoryOptionsByCategory[expenseDraft.category]}
                          scope="expense-add"
                        />
                      </label>

                      <label>
                        <span>Store</span>
                        <StoreInput
                          value={expenseDraft.store}
                          onChange={(value) =>
                            updateExpenseDraft("store", value)
                          }
                        />
                      </label>

                      <label>
                        <span>Channel</span>
                        <select
                          value={expenseDraft.channel}
                          onChange={(event) =>
                            updateExpenseDraft(
                              "channel",
                              event.target.value as MoneyChannel
                            )
                          }
                        >
                          <option value="online">online</option>
                          <option value="offline">offline</option>
                        </select>
                      </label>

                      <label>
                        <span>Expense Type</span>
                        <select
                          value={expenseDraft.expenseType}
                          onChange={(event) =>
                            updateExpenseDraft(
                              "expenseType",
                              event.target.value as MoneyExpenseType
                            )
                          }
                        >
                          <option value="fixed">fixed</option>
                          <option value="variable">variable</option>
                          <option value="one-time">one-time</option>
                        </select>
                      </label>

                      <label className="money-form-wide">
                        <span>Hashtags</span>
                        <input
                          value={expenseDraft.hashtags}
                          onChange={(event) =>
                            updateExpenseDraft("hashtags", event.target.value)
                          }
                          placeholder="#career #coupon #refund"
                        />
                      </label>

                      <label className="money-form-wide">
                        <span>Note</span>
                        <textarea
                          value={expenseDraft.note}
                          onChange={(event) =>
                            updateExpenseDraft("note", event.target.value)
                          }
                          placeholder="Optional memo"
                        />
                      </label>

                      <button type="submit" className="money-submit-button">
                        Add Expense
                      </button>
                    </form>
                  </>
                )}
              </section>

              <section className="money-detail-card money-list-card">
                <div className="money-section-heading">
                  <div>
                    <span className="money-kicker">Transactions</span>
                    <h3>Spending</h3>
                  </div>
                </div>

                <div className="money-pill-row">
                  {spendingViews.map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setSpendingView(view)}
                      className={cn("money-pill", spendingView === view && "is-active")}
                    >
                      {view}
                    </button>
                  ))}
                </div>

                {expenseTagOptions.length > 0 && (
                  <div className="money-hashtag-filter-row" aria-label="Expense hashtag filters">
                    <button
                      type="button"
                      onClick={() => setSelectedExpenseTag(null)}
                      className={cn(
                        "money-pill",
                        selectedExpenseTag === null && "is-active"
                      )}
                    >
                      #All
                    </button>

                    {expenseTagOptions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setSelectedExpenseTag((current) =>
                            current === tag ? null : tag
                          )
                        }
                        className={cn(
                          "money-pill",
                          selectedExpenseTag === tag && "is-active"
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                <TransactionList
                  transactions={visibleSpending}
                  onDelete={removeTransaction}
                  onEdit={openTransactionEditor}
                />
              </section>
            </div>
          )}

          {section === "wishlist" && (
            <div className="money-wishlist-layout">
              <section
                className={cn(
                  "money-detail-card money-form-card money-wishlist-add-card",
                  !wishlistFormOpen && "is-collapsed"
                )}
              >
                <div className="money-section-heading">
                  <div>
                    <span className="money-kicker">Wishlist</span>
                    <h3>Add Item</h3>
                    <p>Keep the form closed until you need a new planned purchase.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWishlistFormOpen((prev) => !prev)}
                    className="money-secondary-button money-wishlist-toggle"
                  >
                    {wishlistFormOpen ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    {wishlistFormOpen ? "Hide" : "Add Wishlist"}
                  </button>
                </div>

                {wishlistFormOpen && (
                  <form className="money-form" onSubmit={addWishlistItem}>
                    <label>
                      <span>Name</span>
                      <input
                        value={wishlistDraft.name}
                        onChange={(event) =>
                          updateWishlistDraft("name", event.target.value)
                        }
                        placeholder="What do you want?"
                      />
                    </label>

                    <label>
                      <span>Need</span>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={wishlistDraft.need}
                        onChange={(event) =>
                          updateWishlistDraft("need", event.target.value)
                        }
                      />
                    </label>

                    <label>
                      <span>Expected Price</span>
                      <input
                        type="number"
                        min={0}
                        value={wishlistDraft.expectedPrice}
                        onChange={(event) =>
                          updateWishlistDraft("expectedPrice", event.target.value)
                        }
                      />
                    </label>

                    <label>
                      <span>Category</span>
                      <CategorySelect
                        value={wishlistDraft.category}
                        onChange={(value) => updateWishlistDraft("category", value)}
                      />
                    </label>

                    <label>
                      <span>Subcategory</span>
                      <SubcategoryInput
                        value={wishlistDraft.subcategory}
                        onChange={(value) =>
                          updateWishlistDraft("subcategory", value)
                        }
                        category={wishlistDraft.category}
                        options={subcategoryOptionsByCategory[wishlistDraft.category]}
                        scope="wishlist-add"
                      />
                    </label>

                    <label>
                      <span>Store</span>
                      <StoreInput
                        value={wishlistDraft.store}
                        onChange={(value) => updateWishlistDraft("store", value)}
                      />
                    </label>

                    <label>
                      <span>Status</span>
                      <select
                        value={wishlistDraft.status}
                        onChange={(event) =>
                          updateWishlistDraft(
                            "status",
                            event.target.value as MoneyWishlistStatus
                          )
                        }
                      >
                        <option value="want">want</option>
                        <option value="considering">considering</option>
                        <option value="purchased">purchased</option>
                        <option value="dropped">dropped</option>
                      </select>
                    </label>

                    <label>
                      <span>URL</span>
                      <input
                        value={wishlistDraft.url}
                        onChange={(event) =>
                          updateWishlistDraft("url", event.target.value)
                        }
                        placeholder="https://"
                      />
                    </label>

                    <label className="money-form-wide">
                      <span>Reason</span>
                      <textarea
                        value={wishlistDraft.reason}
                        onChange={(event) =>
                          updateWishlistDraft("reason", event.target.value)
                        }
                        placeholder="Why do you want it?"
                      />
                    </label>

                    <label className="money-form-wide">
                      <span>Images</span>
                      <textarea
                        value={wishlistDraft.images}
                        onChange={(event) =>
                          updateWishlistDraft("images", event.target.value)
                        }
                        placeholder="Image URLs, one per line"
                      />
                    </label>

                    <button type="submit" className="money-submit-button">
                      Add Wishlist
                    </button>
                  </form>
                )}
              </section>

              <section className="money-detail-card money-list-card">
                <div className="money-section-heading">
                  <div>
                    <span className="money-kicker">Saved items</span>
                    <h3>Wishlist</h3>
                  </div>
                </div>

                <div className="money-pill-row">
                  {wishlistViews.map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setWishlistView(view)}
                      className={cn("money-pill", wishlistView === view && "is-active")}
                    >
                      {view}
                    </button>
                  ))}
                </div>

                <div className="money-wishlist-list">
                  {filteredWishlist.length === 0 ? (
                    <div className="money-empty">No wishlist items.</div>
                  ) : (
                    filteredWishlist.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedWishlistId(item.id)}
                        className={cn(
                          "money-wishlist-card",
                          selectedWishlistId === item.id && "is-selected"
                        )}
                      >
                        <div className="money-wishlist-image">
                          {item.images[0] ? (
                            <img src={item.images[0]} alt="" />
                          ) : (
                            <Heart className="w-4 h-4" />
                          )}
                        </div>

                        <div className="money-wishlist-copy">
                          <strong>{item.name}</strong>
                          <Stars value={item.need} />
                          <span>
                            {item.expectedPrice
                              ? formatWon(item.expectedPrice)
                              : "No price"}{" "}
                            · {item.store ?? "No store"}
                          </span>
                        </div>

                        <em>{getDaysSince(item.addedAt)}d</em>
                      </button>
                    ))
                  )}
                </div>
              </section>

              <section className="money-detail-card money-wishlist-detail">
                {selectedWishlist ? (
                  <>
                    <div className="money-section-heading">
                      <div>
                        <span className="money-kicker">Wishlist detail</span>
                        <h3>{selectedWishlist.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedWishlistId(null)}
                        className="money-icon-button"
                        title="Close wishlist detail"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="money-image-gallery">
                      {selectedWishlist.images.length === 0 ? (
                        <div className="money-image-empty">No images</div>
                      ) : (
                        selectedWishlist.images.map((image) => (
                          <img key={image} src={image} alt="" />
                        ))
                      )}
                    </div>

                    <div className="money-detail-fields">
                      <label>
                        <span>Name</span>
                        <input
                          value={selectedWishlist.name}
                          onChange={(event) =>
                            updateWishlistItem(selectedWishlist.id, {
                              name: event.target.value,
                            })
                          }
                        />
                      </label>

                      <label>
                        <span>Need</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={selectedWishlist.need}
                          onChange={(event) =>
                            updateWishlistItem(selectedWishlist.id, {
                              need: Number(event.target.value) || 1,
                            })
                          }
                        />
                      </label>

                      <label>
                        <span>Expected</span>
                        <input
                          type="number"
                          min={0}
                          value={selectedWishlist.expectedPrice ?? ""}
                          onChange={(event) =>
                            updateWishlistItem(selectedWishlist.id, {
                              expectedPrice:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            })
                          }
                        />
                      </label>

                      <label>
                        <span>Store</span>
                        <StoreInput
                          value={selectedWishlist.store ?? ""}
                          onChange={(value) =>
                            updateWishlistItem(selectedWishlist.id, {
                              store: value,
                            })
                          }
                        />
                      </label>

                      <label>
                        <span>URL</span>
                        <input
                          value={selectedWishlist.url ?? ""}
                          onChange={(event) =>
                            updateWishlistItem(selectedWishlist.id, {
                              url: event.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="money-form-wide">
                        <span>Reason</span>
                        <textarea
                          value={selectedWishlist.reason}
                          onChange={(event) =>
                            updateWishlistItem(selectedWishlist.id, {
                              reason: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>

                    <div className="money-wishlist-actions">
                      {selectedWishlist.url && (
                        <a
                          href={selectedWishlist.url}
                          target="_blank"
                          rel="noreferrer"
                          className="money-secondary-button"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open URL
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => openPurchaseDialog(selectedWishlist)}
                        className="money-submit-button"
                        disabled={selectedWishlist.status === "purchased"}
                      >
                        {selectedWishlist.status === "purchased"
                          ? "Already purchased"
                          : "Purchased"}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeWishlistItem(selectedWishlist.id)}
                        className="money-danger-button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="money-empty">Select a wishlist item to edit.</div>
                )}
              </section>
            </div>
          )}

          {section === "recurring" && (
            <div className="money-recurring-layout">
              <section className="money-detail-card money-form-card">
                <div className="money-section-heading">
                  <div>
                    <span className="money-kicker">Fixed costs</span>
                    <h3>Add Recurring</h3>
                  </div>
                </div>

                <form className="money-form" onSubmit={addRecurring}>
                  <label>
                    <span>Name</span>
                    <input
                      value={recurringDraft.name}
                      onChange={(event) =>
                        updateRecurringDraft("name", event.target.value)
                      }
                      placeholder="Phone, subscription..."
                    />
                  </label>

                  <label>
                    <span>Amount</span>
                    <input
                      type="number"
                      min={0}
                      value={recurringDraft.amount}
                      onChange={(event) =>
                        updateRecurringDraft("amount", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Category</span>
                    <CategorySelect
                      value={recurringDraft.category}
                      onChange={(value) => updateRecurringDraft("category", value)}
                    />
                  </label>

                  <label>
                    <span>Subcategory</span>
                    <SubcategoryInput
                      value={recurringDraft.subcategory}
                      onChange={(value) =>
                        updateRecurringDraft("subcategory", value)
                      }
                      category={recurringDraft.category}
                      options={subcategoryOptionsByCategory[recurringDraft.category]}
                      scope="recurring-add"
                    />
                  </label>

                  <label>
                    <span>Billing day</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={recurringDraft.billingDay}
                      onChange={(event) =>
                        updateRecurringDraft("billingDay", event.target.value)
                      }
                    />
                  </label>

                  <label className="money-toggle-label">
                    <input
                      type="checkbox"
                      checked={recurringDraft.active}
                      onChange={(event) =>
                        updateRecurringDraft("active", event.target.checked)
                      }
                    />
                    <span>Active</span>
                  </label>

                  <button type="submit" className="money-submit-button">
                    Add Recurring
                  </button>
                </form>
              </section>

              <section className="money-detail-card money-list-card">
                <div className="money-section-heading">
                  <div>
                    <span className="money-kicker">Prepared model</span>
                    <h3>Recurring</h3>
                  </div>
                </div>

                <div className="money-recurring-list">
                  {money.recurring.map((item) => (
                    <article key={item.id} className="money-recurring-row">
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {item.category}
                          {item.subcategory ? ` · ${item.subcategory}` : ""} · day{" "}
                          {item.billingDay}
                        </span>
                      </div>

                      <strong>{formatWon(item.amount)}</strong>

                      <button
                        type="button"
                        onClick={() =>
                          updateRecurring(item.id, {
                            active: !item.active,
                          })
                        }
                        className={cn("money-pill", item.active && "is-active")}
                      >
                        {item.active ? "Active" : "Paused"}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeRecurring(item.id)}
                        className="money-icon-button"
                        title="Delete recurring expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {purchaseItem && purchaseDraft && (
          <div className="money-purchase-layer">
            <form className="money-purchase-dialog" onSubmit={confirmPurchase}>
              <div className="money-section-heading">
                <div>
                  <span className="money-kicker">Purchase</span>
                  <h3>{purchaseItem.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseItemId(null);
                    setPurchaseDraft(null);
                  }}
                  className="money-icon-button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <label>
                <span>Actual price</span>
                <input
                  type="number"
                  min={0}
                  value={purchaseDraft.actualPrice}
                  onChange={(event) =>
                    setPurchaseDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            actualPrice: event.target.value,
                          }
                        : prev
                    )
                  }
                />
              </label>

              <label>
                <span>Purchased date</span>
                <input
                  type="date"
                  value={purchaseDraft.purchasedDate}
                  onChange={(event) =>
                    setPurchaseDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            purchasedDate: event.target.value,
                          }
                        : prev
                    )
                  }
                />
              </label>

              <label>
                <span>Store</span>
                <StoreInput
                  value={purchaseDraft.store}
                  onChange={(value) =>
                    setPurchaseDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            store: value,
                          }
                        : prev
                    )
                  }
                />
              </label>

              <label>
                <span>Category</span>
                <CategorySelect
                  value={purchaseDraft.category}
                  onChange={(value) =>
                    setPurchaseDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            category: value,
                            subcategory: subcategoryOptionsByCategory[value][0] ?? "",
                          }
                        : prev
                    )
                  }
                />
              </label>

              <label>
                <span>Subcategory</span>
                <SubcategoryInput
                  value={purchaseDraft.subcategory}
                  onChange={(value) =>
                    setPurchaseDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            subcategory: value,
                          }
                        : prev
                    )
                  }
                  category={purchaseDraft.category}
                  options={subcategoryOptionsByCategory[purchaseDraft.category]}
                  scope="purchase"
                />
              </label>

              <button type="submit" className="money-submit-button">
                <Check className="w-3.5 h-3.5" />
                Confirm purchase
              </button>
            </form>
          </div>
        )}
      </FloatingWindow>

      <FloatingWindow
        open={Boolean(editingTransaction && editingExpenseDraft)}
        title="Edit Expense"
        subtitle={editingTransaction?.name ?? "Transaction detail"}
        storageKey="glassday.money.expenseEditor.rect.v1"
        defaultRect={{ x: 180, y: 110, w: 560, h: 620 }}
        minWidth={360}
        minHeight={420}
        className="money-floating-window money-expense-editor-window"
        titlebarClassName="money-floating-titlebar"
        onClose={closeTransactionEditor}
      >
        {editingExpenseDraft && (
          <form className="money-detail money-expense-editor-form" onSubmit={saveEditedTransaction}>
            <div className="money-section-heading">
              <div>
                <span className="money-kicker">Transaction</span>
                <h3>{editingExpenseDraft.name || "Expense"}</h3>
                <p>Click a spending row to reopen this editor.</p>
              </div>
            </div>

            <div className="money-form">
              <label>
                <span>Name</span>
                <input
                  value={editingExpenseDraft.name}
                  onChange={(event) =>
                    updateEditingExpenseDraft("name", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Amount</span>
                <input
                  type="number"
                  min={0}
                  value={editingExpenseDraft.amount}
                  onChange={(event) =>
                    updateEditingExpenseDraft("amount", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={editingExpenseDraft.date}
                  onChange={(event) =>
                    updateEditingExpenseDraft("date", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Category</span>
                <CategorySelect
                  value={editingExpenseDraft.category}
                  onChange={(value) =>
                    updateEditingExpenseDraft("category", value)
                  }
                />
              </label>

              <label>
                <span>Subcategory</span>
                <SubcategoryInput
                  value={editingExpenseDraft.subcategory}
                  onChange={(value) =>
                    updateEditingExpenseDraft("subcategory", value)
                  }
                  category={editingExpenseDraft.category}
                  options={
                    subcategoryOptionsByCategory[editingExpenseDraft.category]
                  }
                  scope="expense-edit"
                />
              </label>

              <label>
                <span>Store</span>
                <StoreInput
                  value={editingExpenseDraft.store}
                  onChange={(value) =>
                    updateEditingExpenseDraft("store", value)
                  }
                />
              </label>

              <label>
                <span>Channel</span>
                <select
                  value={editingExpenseDraft.channel}
                  onChange={(event) =>
                    updateEditingExpenseDraft(
                      "channel",
                      event.target.value as MoneyChannel
                    )
                  }
                >
                  <option value="online">online</option>
                  <option value="offline">offline</option>
                </select>
              </label>

              <label>
                <span>Expense Type</span>
                <select
                  value={editingExpenseDraft.expenseType}
                  onChange={(event) =>
                    updateEditingExpenseDraft(
                      "expenseType",
                      event.target.value as MoneyExpenseType
                    )
                  }
                >
                  <option value="fixed">fixed</option>
                  <option value="variable">variable</option>
                  <option value="one-time">one-time</option>
                </select>
              </label>

              <label className="money-form-wide">
                <span>Hashtags</span>
                <input
                  value={editingExpenseDraft.hashtags}
                  onChange={(event) =>
                    updateEditingExpenseDraft("hashtags", event.target.value)
                  }
                  placeholder="#career #coupon #refund"
                />
              </label>

              <label className="money-form-wide">
                <span>Note</span>
                <textarea
                  value={editingExpenseDraft.note}
                  onChange={(event) =>
                    updateEditingExpenseDraft("note", event.target.value)
                  }
                  placeholder="Optional memo"
                />
              </label>
            </div>

            <div className="money-editor-actions">
              {editingTransaction && (
                <button
                  type="button"
                  onClick={() => removeTransaction(editingTransaction.id)}
                  className="money-danger-button"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}

              <div>
                <button
                  type="button"
                  onClick={closeTransactionEditor}
                  className="money-secondary-button"
                >
                  Cancel
                </button>

                <button type="submit" className="money-submit-button">
                  Save Expense
                </button>
              </div>
            </div>
          </form>
        )}
      </FloatingWindow>
    </>
  );
};
