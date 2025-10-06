import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";

interface DateFilterProps {
  onFilterChange: (startDate: string | null, endDate: string | null) => void;
  /** Optional: initial preset (all | now | yesterday | 7d | 30d | custom) */
  initialPreset?: PresetKey;
  /** If true (default) component positions itself absolutely; if false it renders inline for layout composition */
  floating?: boolean;
}

type PresetKey = "all" | "now" | "yesterday" | "7d" | "30d" | "custom" | null;

// Helpers --------------------------------------------------
const toUTCStart = (d: Date) => {
  const c = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
  return c.toISOString();
};
const toUTCEnd = (d: Date) => {
  // set to 23:59:59.999 UTC
  const c = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
  return c.toISOString();
};

const DateFilter: React.FC<DateFilterProps> = ({
  onFilterChange,
  initialPreset = "all",
  floating = true,
}) => {
  // custom breakpoint (same used elsewhere). wide770 true => desktop/tablet layout
  const wide770 = useBreakpoint(770);
  const [preset, setPreset] = useState<PresetKey>(initialPreset);
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  // Compute date range from preset
  const presetRange = useMemo(() => {
    const now = new Date();
    switch (preset) {
      case "all":
        return null; // no filtering applied
      case "now": {
        return { start: toUTCStart(now), end: now.toISOString() }; // from start of today to current moment
      }
      case "yesterday": {
        const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return { start: toUTCStart(y), end: toUTCEnd(y) };
      }
      case "7d": {
        const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // inclusive today
        return { start: toUTCStart(start), end: toUTCEnd(now) };
      }
      case "30d": {
        const start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        return { start: toUTCStart(start), end: toUTCEnd(now) };
      }
      case "custom":
      default:
        return null;
    }
  }, [preset]);

  // Emit changes
  useEffect(() => {
    if (preset === "all") {
      onFilterChange(null, null);
    } else if (preset && preset !== "custom" && presetRange) {
      onFilterChange(presetRange.start, presetRange.end);
    } else if (preset === "custom") {
      if (customStart && customEnd) {
        // Convert local date input (YYYY-MM-DD) to UTC boundaries
        const start = toUTCStart(new Date(customStart + "T00:00:00Z"));
        const end = toUTCEnd(new Date(customEnd + "T00:00:00Z"));
        onFilterChange(start, end);
      } else if (customStart && !customEnd) {
        const start = toUTCStart(new Date(customStart + "T00:00:00Z"));
        onFilterChange(start, null);
      } else if (!customStart && customEnd) {
        const end = toUTCEnd(new Date(customEnd + "T00:00:00Z"));
        onFilterChange(null, end);
      } else {
        onFilterChange(null, null);
      }
    }
  }, [preset, presetRange, customStart, customEnd, onFilterChange]);

  const handlePresetClick = useCallback((key: PresetKey) => {
    setPreset(key);
  }, []);

  const activeLabel = useMemo(() => {
    switch (preset) {
      case "all":
        return "All";
      case "now":
        return "Now";
      case "yesterday":
        return "Yesterday";
      case "7d":
        return "Last 7d";
      case "30d":
        return "Last 30d";
      case "custom":
        return customStart || customEnd ? "Custom" : "Custom";
      default:
        return "None";
    }
  }, [preset, customStart, customEnd]);

  const floatingWrapper = floating ? "absolute top-4 left-4 z-10" : "";

  const handleReset = () => {
    setPreset(null);
    setCustomStart("");
    setCustomEnd("");
    onFilterChange(null, null);
  };

  const isActive = (key: PresetKey) => preset === key;

  if (!open) {
    return (
      <div
        className={`${floatingWrapper} ${
          !floating && !wide770 ? "w-full" : ""
        }`}
      >
        <button
          onClick={() => setOpen(true)}
          className={`group flex items-center gap-2 h-10 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 hover:border-slate-500 text-slate-200 text-xs font-medium shadow-lg shadow-black/40 transition ${
            !floating && !wide770 ? "w-full px-3 justify-start" : "px-4"
          }`}
        >
          <span className="text-base">🗓️</span>
          <span className="tracking-wide">Date: {activeLabel}</span>
          <span className="ml-1 text-text group-hover:text-slate-300 text-[10px]">
            (show more)
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`${floatingWrapper} ${
        !floating && !wide770 ? "w-full max-w-full z-30" : "w-72"
      } relative bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-slate-700/60 space-y-4 animate-in fade-in`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-1">
          <span>🗓️</span> Date Filter
        </h3>
        <div className="flex items-center gap-2">
          {(preset || customStart || customEnd) && (
            <button
              onClick={handleReset}
              className="text-[10px] px-2 py-1 rounded-md bg-slate-700/40 hover:bg-slate-600/40 text-slate-300 border border-slate-600 transition"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close date filter"
            className="text-[10px] px-2 py-1 rounded-md bg-slate-700/40 hover:bg-slate-600/40 text-slate-300 border border-slate-600 transition"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handlePresetClick("all")}
          className={`h-9 text-xs font-medium rounded-lg border transition flex items-center justify-center gap-1 col-span-2 ${
            isActive("all")
              ? "bg-teal-600/80 border-teal-500 text-white shadow"
              : "bg-slate-800/60 border-slate-600 hover:border-slate-500 text-slate-300"
          }`}
        >
          All Data
        </button>
        <button
          onClick={() => handlePresetClick("now")}
          className={`h-9 text-xs font-medium rounded-lg border transition flex items-center justify-center gap-1 ${
            isActive("now")
              ? "bg-emerald-600/80 border-emerald-500 text-white shadow"
              : "bg-slate-800/60 border-slate-600 hover:border-slate-500 text-slate-300"
          }`}
        >
          Now
        </button>
        <button
          onClick={() => handlePresetClick("yesterday")}
          className={`h-9 text-xs font-medium rounded-lg border transition ${
            isActive("yesterday")
              ? "bg-amber-600/80 border-amber-500 text-white shadow"
              : "bg-slate-800/60 border-slate-600 hover:border-slate-500 text-slate-300"
          }`}
        >
          Yesterday
        </button>
        <button
          onClick={() => handlePresetClick("7d")}
          className={`h-9 text-xs font-medium rounded-lg border transition ${
            isActive("7d")
              ? "bg-indigo-600/80 border-indigo-500 text-white shadow"
              : "bg-slate-800/60 border-slate-600 hover:border-slate-500 text-slate-300"
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => handlePresetClick("30d")}
          className={`h-9 text-xs font-medium rounded-lg border transition ${
            isActive("30d")
              ? "bg-fuchsia-600/80 border-fuchsia-500 text-white shadow"
              : "bg-slate-800/60 border-slate-600 hover:border-slate-500 text-slate-300"
          }`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => handlePresetClick("custom")}
          className={`col-span-2 h-9 text-xs font-semibold tracking-wide rounded-lg border transition ${
            isActive("custom")
              ? "bg-cyan-600/80 border-cyan-500 text-white shadow"
              : "bg-slate-800/60 border-slate-600 hover:border-slate-500 text-slate-300"
          }`}
        >
          Custom Range
        </button>
      </div>

      {/* Custom Inputs */}
      {preset === "custom" && (
        <div className="space-y-3 animate-in fade-in">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
              Start Date
            </label>
            <input
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
              End Date
            </label>
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            * Times are interpreted in{" "}
            <span className="text-slate-400 font-medium">
              UTC (00:00 - 23:59)
            </span>
          </p>
        </div>
      )}

      {/* Active range preview */}
      <div className="pt-2 border-t border-slate-700/60">
        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">
          Active Range
        </p>
        {preset === "all" && (
          <p className="text-[11px] text-slate-400 font-medium">
            All data (no date filter)
          </p>
        )}
        {preset && preset !== "custom" && preset !== "all" && presetRange && (
          <div className="text-[11px] text-slate-300 font-mono break-words space-y-1">
            <div>
              <span className="text-slate-500">Start:</span>{" "}
              {presetRange.start.split("T")[0]}
            </div>
            <div>
              <span className="text-slate-500">End:</span>{" "}
              {presetRange.end.split("T")[0]}
            </div>
          </div>
        )}
        {preset === "custom" && (
          <div className="text-[11px] text-slate-300 font-mono break-words space-y-1">
            <div>
              <span className="text-slate-500">Start:</span>{" "}
              {customStart || "—"}
            </div>
            <div>
              <span className="text-slate-500">End:</span> {customEnd || "—"}
            </div>
          </div>
        )}
        {!preset && !customStart && !customEnd && (
          <p className="text-[11px] text-slate-500">No filter applied</p>
        )}
      </div>
    </div>
  );
};

export default DateFilter;
