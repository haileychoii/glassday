import { useMemo } from "react";
import {
  AlertCircle,
  Bell,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  CheckCheck,
  GraduationCap,
  HeartPulse,
  Info,
  X,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import { useDashboardData } from "../../context/DashboardDataContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";
import {
  buildDashboardAlerts,
  type AlertCategory,
  type AlertSeverity,
} from "./alerts/alertUtils";

const categoryIconMap: Record<AlertCategory, JSX.Element> = {
  career: <BriefcaseBusiness className="w-3.5 h-3.5" />,
  calendar: <CalendarDays className="w-3.5 h-3.5" />,
  study: <GraduationCap className="w-3.5 h-3.5" />,
  health: <HeartPulse className="w-3.5 h-3.5" />,
  system: <Info className="w-3.5 h-3.5" />,
};

const severityLabelMap: Record<AlertSeverity, string> = {
  danger: "Urgent",
  warning: "Warning",
  info: "Info",
  success: "Done",
};

export const AlertCenterWidget = () => {
  const { calendarEvents, careerApplications } = useDashboardData();

  const { value: dismissedAlertIds, setValue: setDismissedAlertIds } =
    useLocalStorage<string[]>("glassday.alert.dismissed.v1", []);

  const alerts = useMemo(() => {
    return buildDashboardAlerts({
      calendarEvents,
      careerApplications,
    });
  }, [calendarEvents, careerApplications]);

  const visibleAlerts = alerts.filter(
    (alert) => !dismissedAlertIds.includes(alert.id)
  );

  const dangerCount = visibleAlerts.filter(
    (alert) => alert.severity === "danger"
  ).length;

  const warningCount = visibleAlerts.filter(
    (alert) => alert.severity === "warning"
  ).length;

  const dismissAlert = (id: string) => {
    setDismissedAlertIds((prev) => [...new Set([...prev, id])]);
  };

  const dismissAll = () => {
    setDismissedAlertIds((prev) => [
      ...new Set([...prev, ...alerts.map((alert) => alert.id)]),
    ]);
  };

  const restoreAll = () => {
    setDismissedAlertIds([]);
  };

  return (
    <GlassCard
      title="Alert Center"
      subtitle={
        visibleAlerts.length > 0
          ? `${visibleAlerts.length} active · ${dangerCount} urgent`
          : "All clear"
      }
      icon={
        visibleAlerts.length > 0 ? (
          <BellRing className="w-4 h-4" />
        ) : (
          <Bell className="w-4 h-4" />
        )
      }
      actions={
        <div className="flex items-center gap-1.5">
          {dismissedAlertIds.length > 0 && (
            <button
              type="button"
              onClick={restoreAll}
              className="glass-button h-8 px-3 text-xs"
              title="Restore dismissed alerts"
            >
              Restore
            </button>
          )}

          {visibleAlerts.length > 0 && (
            <button
              type="button"
              onClick={dismissAll}
              className="glass-button h-8 px-3 text-xs flex items-center gap-1.5"
              title="Dismiss all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      }
    >
      <div className="alert-center">
        <section className="alert-center-summary">
          <div className="alert-summary-card is-danger">
            <strong>{dangerCount}</strong>
            <span>Urgent</span>
          </div>

          <div className="alert-summary-card is-warning">
            <strong>{warningCount}</strong>
            <span>Warnings</span>
          </div>

          <div className="alert-summary-card is-info">
            <strong>{visibleAlerts.length}</strong>
            <span>Active</span>
          </div>
        </section>

        <section className="alert-center-list">
          {visibleAlerts.length === 0 ? (
            <div className="alert-empty-state">
              <Bell className="w-5 h-5" />
              <strong>No active alerts</strong>
              <span>지원 마감, 일정, 기록 누락이 있으면 여기에 뜰 거야.</span>
            </div>
          ) : (
            visibleAlerts.map((alert) => (
              <article
                key={alert.id}
                className={cn(
                  "alert-item",
                  `is-${alert.severity}`,
                  `is-${alert.category}`
                )}
              >
                <div className="alert-icon">
                  {alert.severity === "danger" ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    categoryIconMap[alert.category]
                  )}
                </div>

                <div className="alert-content">
                  <div className="alert-title-row">
                    <strong>{alert.title}</strong>

                    <span
                      className={cn(
                        "alert-severity-pill",
                        `is-${alert.severity}`
                      )}
                    >
                      {severityLabelMap[alert.severity]}
                    </span>
                  </div>

                  <p>{alert.message}</p>

                  {alert.actionLabel && (
                    <span className="alert-action-label">
                      {alert.actionLabel}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => dismissAlert(alert.id)}
                  className="alert-dismiss-button"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </article>
            ))
          )}
        </section>
      </div>
    </GlassCard>
  );
};