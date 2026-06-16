import { RotateCcw, Wallet } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";

type MoneyData = {
  monthlyCurrent: number;
  monthlyGoal: number;
  assetCurrent: number;
  assetGoal: number;
};

const defaultMoney: MoneyData = {
  monthlyCurrent: 350000,
  monthlyGoal: 1000000,
  assetCurrent: 8400000,
  assetGoal: 100000000,
};

const formatWon = (value: number) => {
  return "₩" + value.toLocaleString();
};

export const MoneyWidget = () => {
  const {
    value: money,
    setValue: setMoney,
    resetValue,
  } = useLocalStorage<MoneyData>("glassday.money", defaultMoney);

  const monthlyPercent =
    money.monthlyGoal <= 0
      ? 0
      : Math.min(100, (money.monthlyCurrent / money.monthlyGoal) * 100);

  const assetPercent =
    money.assetGoal <= 0
      ? 0
      : Math.min(100, (money.assetCurrent / money.assetGoal) * 100);

  const updateField = <K extends keyof MoneyData>(
    key: K,
    value: MoneyData[K]
  ) => {
    setMoney((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <GlassCard
      title="Wealth Tracker"
      subtitle="Editable money goals."
      icon={<Wallet className="w-4 h-4" />}
    >
      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span>Monthly Savings</span>
            <span className="text-muted-foreground">
              {Math.round(monthlyPercent)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="number"
              value={money.monthlyCurrent}
              onChange={(e) =>
                updateField("monthlyCurrent", Number(e.target.value))
              }
              className="w-full rounded-xl bg-white/25 border border-white/40 px-3 py-2 text-sm outline-none"
            />

            <input
              type="number"
              value={money.monthlyGoal}
              onChange={(e) =>
                updateField("monthlyGoal", Number(e.target.value))
              }
              className="w-full rounded-xl bg-white/25 border border-white/40 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="text-xs text-muted-foreground mb-2">
            {formatWon(money.monthlyCurrent)} / {formatWon(money.monthlyGoal)}
          </div>

          <div className="h-2 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full rounded-full progress-gradient transition-all duration-300"
              style={{ width: `${monthlyPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span>Future Asset Goal</span>
            <span className="text-muted-foreground">
              {Math.round(assetPercent)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="number"
              value={money.assetCurrent}
              onChange={(e) =>
                updateField("assetCurrent", Number(e.target.value))
              }
              className="w-full rounded-xl bg-white/25 border border-white/40 px-3 py-2 text-sm outline-none"
            />

            <input
              type="number"
              value={money.assetGoal}
              onChange={(e) => updateField("assetGoal", Number(e.target.value))}
              className="w-full rounded-xl bg-white/25 border border-white/40 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="text-xs text-muted-foreground mb-2">
            {formatWon(money.assetCurrent)} / {formatWon(money.assetGoal)}
          </div>

          <div className="h-2 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full rounded-full progress-gradient transition-all duration-300"
              style={{ width: `${assetPercent}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={resetValue}
          className="edit-only flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset money data
        </button>
      </div>
    </GlassCard>
  );
};