import React from "react";
import type { UserAlert } from "./UserAlerts";

interface UserAlertPopupProps {
  alert: UserAlert;
  onFocus?: (alert: UserAlert) => void;
}

// Color palette (same semantic intent as severityStyles, but hex for inline styling)
const severityColorHex: Record<UserAlert["severity"], string> = {
  info: "#06b6d4", // cyan-500
  notice: "#10b981", // emerald-500
  warning: "#f59e0b", // amber-500
  danger: "#e11d48", // rose-600
};

const severityLabel: Record<UserAlert["severity"], string> = {
  info: "Info",
  notice: "Notice",
  warning: "Warning",
  danger: "Danger",
};

const severityIcon: Record<UserAlert["severity"], string> = {
  info: "ℹ️",
  notice: "📢",
  warning: "⚠️",
  danger: "🚨",
};

const UserAlertPopup: React.FC<UserAlertPopupProps> = ({ alert, onFocus }) => {
  const color = severityColorHex[alert.severity];
  const label = severityLabel[alert.severity];
  const icon = severityIcon[alert.severity];

  return (
    <div className="bg-gradient-to-br from-background to-surface text-text p-4 rounded-xl shadow-2xl border border-surface min-w-[320px]">
      {/* Header */}
      <div className="flex flex-row items-center gap-4 mb-4 pb-4 border-b border-muted">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${color}33 0%, ${color}18 100%)`,
            boxShadow: `0 4px 18px -4px ${color}66`,
            border: `1px solid ${color}55`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-text flex items-center gap-2">
            <span>{label} Alert</span>
          </h3>
          <p className="text-xs text-muted font-medium mt-1">
            {new Date(alert.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Title & Message */}
      <div
        className="p-4 rounded-lg mb-4 border"
        style={{
          background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
          borderColor: `${color}40`,
        }}
      >
        <div className="text-xs uppercase tracking-wide text-text font-semibold mb-2">
          Title
        </div>
        <div
          className="text-base font-bold leading-snug mb-3"
          style={{ color }}
        >
          {alert.title}
        </div>
        {alert.message && (
          <div className="text-sm text-text/90 whitespace-pre-line leading-relaxed">
            {alert.message}
          </div>
        )}
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-surface p-3 rounded-lg border border-muted">
          <div className="text-[10px] uppercase tracking-wide text-text font-semibold mb-1">
            Longitude
          </div>
          <div className="text-xs font-mono font-semibold text-text">
            {alert.lng.toFixed(5)}°
          </div>
        </div>
        <div className="bg-surface p-3 rounded-lg border border-muted">
          <div className="text-[10px] uppercase tracking-wide text-text font-semibold mb-1">
            Latitude
          </div>
          <div className="text-xs font-mono font-semibold text-text">
            {alert.lat.toFixed(5)}°
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-muted">
        <button
          onClick={() => onFocus?.(alert)}
          className="px-4 h-9 rounded-lg text-xs font-semibold bg-accent/20 hover:bg-accent/30 border border-accent/40 text-text shadow-sm transition"
          style={{
            boxShadow: `0 0 0 1px ${color}33, 0 4px 10px -2px ${color}40`,
          }}
        >
          📍 Focus Location
        </button>
      </div>
    </div>
  );
};

export default UserAlertPopup;
