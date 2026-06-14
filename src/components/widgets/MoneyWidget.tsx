import { Wallet } from "lucide-react";
import { GlassCard } from "../glass/GlassCard";

export const MoneyWidget = () => {
  const monthlyCurrent = 350000;
  const monthlyGoal = 1000000;

  const assetCurrent = 8400000;
  const assetGoal = 100000000;

  const monthlyPercent =
    (monthlyCurrent / monthlyGoal) * 100;

  const assetPercent =
    (assetCurrent / assetGoal) * 100;

  return (
    <GlassCard
      title="Wealth Tracker"
      subtitle="Long-term accumulation."
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

          <div className="text-lg font-semibold mb-2">
            ₩{monthlyCurrent.toLocaleString()}
          </div>

          <div className="h-2 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full rounded-full progress-gradient"
              style={{
                width: `${monthlyPercent}%`,
              }}
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

          <div className="text-lg font-semibold mb-2">
            ₩{assetCurrent.toLocaleString()}
          </div>

          <div className="h-2 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full rounded-full progress-gradient"
              style={{
                width: `${assetPercent}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white/30 border border-white/40 p-3">
          <div className="text-xs text-muted-foreground">
            Long-Term Goal
          </div>

          <div className="text-sm font-medium mt-1">
            ₩100,000,000
          </div>
        </div>
      </div>
    </GlassCard>
  );
};