import { useState } from "react";
import { Lock, Pencil, RotateCcw, Wallet } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";

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

const formatWon = (value: number) => "₩" + value.toLocaleString();

export const MoneyWidget = () => {
  const [editing, setEditing] = useState(false);

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
      subtitle={editing ? "Editing money goals" : "Monthly & asset goals"}
      icon={<Wallet className="w-4 h-4" />}
      actions={
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          className={cn(
            "h-8 px-3 rounded-full text-xs border transition flex items-center gap-1.5",
            editing
              ? "bg-foreground text-background border-foreground"
              : "bg-white/35 border-white/50 text-muted-foreground hover:text-foreground"
          )}
        >
          {editing ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Pencil className="w-3.5 h-3.5" />
          )}
          {editing ? "Done" : "Edit"}
        </button>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span>Monthly Savings</span>
            <span className="text-muted-foreground">
              {Math.round(monthlyPercent)}%
            </span>
          </div>

          {editing ? (
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
          ) : (
            <div className="text-lg font-semibold mb-2">
              {formatWon(money.monthlyCurrent)}
              <span className="text-xs text-muted-foreground ml-1">
                / {formatWon(money.monthlyGoal)}
              </span>
            </div>
          )}

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

          {editing ? (
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
                onChange={(e) =>
                  updateField("assetGoal", Number(e.target.value))
                }
                className="w-full rounded-xl bg-white/25 border border-white/40 px-3 py-2 text-sm outline-none"
              />
            </div>
          ) : (
            <div className="text-lg font-semibold mb-2">
              {formatWon(money.assetCurrent)}
              <span className="text-xs text-muted-foreground ml-1">
                / {formatWon(money.assetGoal)}
              </span>
            </div>
          )}

          <div className="h-2 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full rounded-full progress-gradient transition-all duration-300"
              style={{ width: `${assetPercent}%` }}
            />
          </div>
        </div>

        {editing && (
          <button
            type="button"
            onClick={resetValue}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset money data
          </button>
        )}
      </div>
    </GlassCard>
  );
};