import React, { useCallback, useEffect, useRef, useState } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import maplibregl from "maplibre-gl";
import { createRoot } from "react-dom/client";
import UserAlertPopup from "./UserAlertPopup";

export interface UserAlert {
  id: string;
  lng: number;
  lat: number;
  title: string;
  message?: string;
  severity: "info" | "warning" | "danger" | "notice";
  createdAt: string; // ISO
}

interface UserAlertsProps {
  map: maplibregl.Map | null;
  onAddingChange?: (isAdding: boolean) => void;
  /** Dynamic top offset (px) for mobile layout to avoid overlapping left controls */
  mobileOffsetTop?: number;
}

interface DraftLocation {
  lng: number;
  lat: number;
}

// Color mapping for severities with icons
const severityStyles: Record<
  UserAlert["severity"],
  {
    label: string;
    icon: string;
    color: string;
    ring: string;
    glow: string;
    bgGradient: string;
  }
> = {
  info: {
    label: "Info",
    icon: "ℹ️",
    color: "bg-cyan-500",
    ring: "ring-cyan-400/50",
    glow: "shadow-[0_0_12px_rgba(34,211,238,0.7)]",
    bgGradient: "from-cyan-500/20 to-cyan-600/30",
  },
  notice: {
    label: "Notice",
    icon: "📢",
    color: "bg-emerald-500",
    ring: "ring-emerald-400/50",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.65)]",
    bgGradient: "from-emerald-500/20 to-emerald-600/30",
  },
  warning: {
    label: "Warning",
    icon: "⚠️",
    color: "bg-amber-500",
    ring: "ring-amber-400/50",
    glow: "shadow-[0_0_14px_rgba(245,158,11,0.7)]",
    bgGradient: "from-amber-500/20 to-amber-600/30",
  },
  danger: {
    label: "Danger",
    icon: "🚨",
    color: "bg-rose-600",
    ring: "ring-rose-400/50",
    glow: "shadow-[0_0_16px_rgba(225,29,72,0.75)]",
    bgGradient: "from-rose-600/25 to-rose-700/35",
  },
};

const UserAlerts: React.FC<UserAlertsProps> = ({
  map,
  onAddingChange,
  mobileOffsetTop = 0,
}) => {
  const [adding, setAdding] = useState(false);
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [showList, setShowList] = useState(false);
  const [draftLoc, setDraftLoc] = useState<DraftLocation | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<UserAlert["severity"]>("info");
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});

  // Notify parent when adding state changes
  useEffect(() => {
    onAddingChange?.(adding);
  }, [adding, onAddingChange]);

  // Attach map click for placing draft when adding
  useEffect(() => {
    if (!map) return;
    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (!adding) return;
      // Stop propagation to prevent hotspot popup from opening
      e.preventDefault();
      const originalEvent = e.originalEvent;
      if (originalEvent) {
        originalEvent.stopPropagation();
      }
      // Prevent placing if clicking on popup or control area
      setDraftLoc({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    };
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, adding]);

  // Render markers for alerts
  useEffect(() => {
    if (!map) return;

    // Remove markers that no longer exist
    Object.keys(markersRef.current).forEach((id) => {
      if (!alerts.find((a) => a.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add new markers
    alerts.forEach((alert) => {
      if (markersRef.current[alert.id]) return;
      const deco = severityStyles[alert.severity];
      const el = document.createElement("div");
      // NOTE: Avoid adding hover:scale on the root element because maplibre
      // calculates position once at creation (from initial size). If the root size changes
      // the visual position appears to "jump" and becomes harder to click.
      // We fix width/height on the root and move scaling animation to the inner circle.
      el.className = `group relative cursor-pointer select-none w-12 h-12`;
      el.innerHTML = `
        <div class="relative flex items-center justify-center w-12 h-12 pointer-events-none">
          <!-- Outer pulse ring -->
          <span class="absolute inset-0 rounded-full ${deco.color} opacity-20 animate-ping"></span>
          <!-- Glow layer -->
          <span class="absolute inset-0 rounded-full ${deco.color} opacity-30 blur-md"></span>
          <!-- Main marker circle with gradient -->
          <div class="relative w-10 h-10 rounded-full ${deco.color} ring-3 ${deco.ring} ${deco.glow} flex items-center justify-center shadow-2xl border-2 border-white/20 bg-gradient-to-br ${deco.bgGradient} transition-transform duration-200 ease-out group-hover:scale-110 will-change-transform pointer-events-auto">
            <span class="text-lg filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">${deco.icon}</span>
          </div>
          <!-- Bottom indicator dot -->
          <div class="absolute -bottom-1 w-2 h-2 rounded-full ${deco.color} ring-1 ring-white/30 shadow-lg"></div>
        </div>
      `;
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([alert.lng, alert.lat])
        .addTo(map);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const popupNode = document.createElement("div");
        const root = createRoot(popupNode);
        const handleFocus = () => {
          map.flyTo({
            center: [alert.lng, alert.lat],
            zoom: 11,
            duration: 1200,
            essential: true,
          });
          popup.remove();
        };
        root.render(<UserAlertPopup alert={alert} onFocus={handleFocus} />);
        const popup = new maplibregl.Popup({
          closeButton: true,
          maxWidth: "400px",
          className: "dark-popup",
        })
          .setLngLat([alert.lng, alert.lat])
          .setDOMContent(popupNode)
          .addTo(map);
      });
      markersRef.current[alert.id] = marker;
    });

    return () => {
      // cleanup on unmount
      if (!map) return;
    };
  }, [alerts, map]);

  const cancelDraft = useCallback(() => {
    setDraftLoc(null);
    setTitle("");
    setMessage("");
    setSeverity("info");
    setAdding(false);
  }, []);

  const saveDraft = () => {
    if (!draftLoc || !title.trim()) return;
    const newAlert: UserAlert = {
      id: crypto.randomUUID(),
      lng: draftLoc.lng,
      lat: draftLoc.lat,
      title: title.trim(),
      message: message.trim() || undefined,
      severity,
      createdAt: new Date().toISOString(),
    };
    setAlerts((prev) => [...prev, newAlert]);
    cancelDraft();
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const wide770 = useBreakpoint(770);

  const baseBtn =
    "backdrop-blur-xl border font-medium shadow-lg shadow-black/40 transition flex items-center";
  const wideBtn = "flex-none px-4 h-10 rounded-xl text-xs gap-2 justify-start";

  return (
    <div
      style={!wide770 ? { top: mobileOffsetTop } : undefined}
      className={
        wide770
          ? "absolute top-6 right-4 z-20 flex flex-col items-end gap-3" /* increased top spacing to align with DateFilter */
          : "absolute right-2 z-20 flex flex-col items-end gap-2 w-[calc(100%-1rem)]" /* mobile top handled by dynamic offset */
      }
    >
      {/* Primary controls */}
      <div className={wide770 ? "flex gap-2" : "grid grid-cols-2 gap-2 w-full"}>
        <button
          onClick={() => {
            if (adding) {
              cancelDraft();
            } else {
              setAdding(true);
              setShowList(false);
            }
          }}
          className={`${baseBtn} ${
            wide770
              ? wideBtn
              : "h-11 rounded-xl text-[11px] gap-2 justify-center"
          } ${
            adding
              ? "bg-gradient-to-br from-rose-600/80 to-rose-500/70 border-rose-400 text-white hover:from-rose-600 hover:to-rose-500"
              : "bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-slate-600 hover:from-slate-800/80 hover:to-slate-700/60 text-slate-200"
          } ring-1 ring-white/10`}
          title={adding ? "Cancel marking alert" : "Add a new alert marker"}
          aria-label={adding ? "Cancel Mark" : "Mark Alert"}
        >
          <span className="text-base leading-none">{adding ? "✕" : "➕"}</span>
          {wide770 ? (
            <span>{adding ? "Cancel Mark" : "Mark Alert"}</span>
          ) : null}
        </button>
        <button
          onClick={() => setShowList((v) => !v)}
          className={`${baseBtn} ${
            wide770
              ? wideBtn
              : "h-11 rounded-xl text-[11px] gap-2 justify-center"
          } bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-slate-600 hover:from-slate-800/80 hover:to-slate-700/60 text-slate-200 ring-1 ring-white/10`}
          title={showList ? "Hide alert list" : "Show alert list"}
          aria-label={showList ? "Hide Alerts" : "Show Alerts"}
        >
          <span className="text-base leading-none">🔔</span>
          {wide770 ? (
            <span>
              {showList ? "Hide Alerts" : `Alerts (${alerts.length})`}
            </span>
          ) : null}
        </button>
      </div>

      {/* Hint bubble */}
      {adding && !draftLoc && (
        <div className="px-4 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-[11px] text-cyan-200 shadow shadow-black/40 animate-in fade-in">
          Click on the map to place a new alert
        </div>
      )}

      {/* Draft modal (inline floating panel) */}
      {adding && draftLoc && (
        <div
          className={
            wide770
              ? "w-80 bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/60 shadow-2xl shadow-black/50 space-y-4 animate-in fade-in"
              : "w-full max-w-full bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/60 shadow-2xl shadow-black/50 space-y-4 animate-in fade-in"
          }
        >
          <div className="flex items-start justify-between">
            <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
              New Alert
            </h3>
            <button
              onClick={cancelDraft}
              className="text-[10px] px-2 py-1 rounded-md bg-slate-700/40 hover:bg-slate-600/40 text-slate-300 border border-slate-600 transition"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fire spreading rapidly"
                className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Additional details..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                Severity
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    "info",
                    "notice",
                    "warning",
                    "danger",
                  ] as UserAlert["severity"][]
                ).map((s) => {
                  const st = severityStyles[s];
                  const active = severity === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`h-10 rounded-lg text-[11px] font-semibold tracking-wide border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                        active
                          ? `${st.color} border-white/30 text-white shadow-lg ${st.glow} scale-105`
                          : "bg-slate-800/60 border-slate-600 hover:border-slate-500 text-slate-300 hover:scale-102"
                      }`}
                    >
                      <span className="text-base">{st.icon}</span>
                      <span className="text-[9px]">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              lng: {draftLoc.lng.toFixed(4)} | lat: {draftLoc.lat.toFixed(4)}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={cancelDraft}
                className="px-3 h-8 rounded-lg text-[11px] bg-slate-700/40 border border-slate-600 hover:bg-slate-600/40 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                disabled={!title.trim()}
                onClick={saveDraft}
                className="px-4 h-8 rounded-lg text-[11px] font-semibold bg-cyan-600/80 hover:bg-cyan-500/80 disabled:opacity-40 disabled:hover:bg-cyan-600/80 border border-cyan-400 text-white shadow shadow-cyan-500/30 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List panel */}
      {showList && !adding && (
        <div
          className={
            wide770
              ? "w-80 max-h-[60vh] overflow-hidden bg-slate-900/85 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-2xl shadow-black/50 flex flex-col animate-in fade-in"
              : "w-full max-w-full max-h-[60vh] overflow-hidden bg-slate-900/85 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-2xl shadow-black/50 flex flex-col animate-in fade-in"
          }
        >
          <div className="p-4 pb-3 border-b border-slate-700/60 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
              Alerts ({alerts.length})
            </h3>
            <button
              onClick={() => setShowList(false)}
              className="text-[10px] px-2 py-1 rounded-md bg-slate-700/40 hover:bg-slate-600/40 text-slate-300 border border-slate-600 transition"
            >
              ✕
            </button>
          </div>
          <div className="overflow-y-auto scrollbar-thin scrollbar-track-slate-800/40 scrollbar-thumb-slate-600/60">
            {alerts.length === 0 && (
              <p className="px-4 py-6 text-[11px] text-slate-500 text-center">
                (No alert markers yet)
              </p>
            )}
            <ul className="divide-y divide-slate-700/40">
              {alerts
                .slice()
                .reverse()
                .map((a) => {
                  const deco = severityStyles[a.severity];
                  return (
                    <li
                      key={a.id}
                      className="px-4 py-3 hover:bg-slate-800/40 transition group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold tracking-wide ${deco.color} text-white shadow-md flex items-center gap-1`}
                            >
                              <span>{deco.icon}</span>
                              <span>{deco.label}</span>
                            </span>
                            <span className="text-[9px] text-slate-500">
                              {new Date(a.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="text-[11px] font-semibold text-slate-200 leading-snug line-clamp-2">
                            {a.title}
                          </h4>
                          {a.message && (
                            <p className="text-[10px] text-slate-400 line-clamp-2">
                              {a.message}
                            </p>
                          )}
                          <div className="text-[9px] font-mono text-slate-500">
                            {a.lng.toFixed(4)}, {a.lat.toFixed(4)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() =>
                              map?.flyTo({
                                center: [a.lng, a.lat],
                                zoom: 11,
                                duration: 1100,
                                essential: true,
                              })
                            }
                            className="text-[10px] px-2 py-1 rounded-md bg-slate-700/40 hover:bg-slate-600/40 text-cyan-300 border border-slate-600 transition"
                          >
                            Focus
                          </button>
                          <button
                            onClick={() => removeAlert(a.id)}
                            className="text-[10px] px-2 py-1 rounded-md bg-slate-700/40 hover:bg-rose-600/50 text-rose-300 border border-slate-600 hover:border-rose-400 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAlerts;
