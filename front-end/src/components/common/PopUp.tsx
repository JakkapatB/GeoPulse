import React from "react";

interface HotspotProperties {
  instrument?: string;
  satellite?: string;
  frp?: number;
  acq_date?: string;
  acq_time?: string;
  confidence?: string;
  bright_ti4?: number;
  ct_en?: string;
  scan?: number;
  track?: number;
  version?: string;
  hotspotid?: string;
  _id?: string;
}

interface PopUpProps {
  coordinates: [number, number];
  properties: HotspotProperties;
}

const getConfidenceEmoji = (conf: string) => {
  switch (conf) {
    case "high":
      return "🔴 High";
    case "nominal":
      return "🟡 Nominal";
    case "low":
      return "🟢 Low";
    default:
      return conf;
  }
};

const getFRPLevel = (frp: number) => {
  if (frp < 2) return { level: "Very Low", color: "#16a34a" };
  if (frp < 4) return { level: "Low", color: "#84cc16" };
  if (frp < 6) return { level: "Medium", color: "#eab308" };
  if (frp < 8) return { level: "High", color: "#f97316" };
  if (frp < 12) return { level: "Very High", color: "#dc2626" };
  return { level: "Extreme", color: "#831843" };
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (timeStr: string) => {
  if (!timeStr || timeStr.length !== 4) return timeStr;
  return timeStr.slice(0, 2) + ":" + timeStr.slice(2) + " UTC";
};

const PopUp: React.FC<PopUpProps> = ({ coordinates, properties }) => {
  const frpLevel = getFRPLevel(properties.frp || 0);

  return (
    <div className="bg-gradient-to-br from-background to-surface text-text p-4 rounded-xl shadow-2xl border border-surface min-w-[320px]">
      {/* Header */}
      <div className="flex flex-row items-center gap-4 mb-4 pb-4 border-b border-muted">
        <div className="text-3xl drop-shadow-lg">🔥</div>
        <div>
          <h3 className="text-lg font-bold text-text">Hotspot Detection</h3>
          <p className="text-xs text-muted font-medium mt-1">
            {properties.instrument || "N/A"} • Satellite{" "}
            {properties.satellite || "N/A"}
          </p>
        </div>
      </div>

      {/* FRP Section */}
      <div
        className="p-4 rounded-lg mb-4 border"
        style={{
          background: `linear-gradient(135deg, ${frpLevel.color}20 0%, ${frpLevel.color}10 100%)`,
          borderColor: `${frpLevel.color}40`,
        }}
      >
        <div className="flex flex-row justify-between items-center">
          <div>
            <div className="text-xs uppercase tracking-wide text-text font-semibold mb-1">
              Fire Radiative Power
            </div>
            <div
              className="text-4xl font-extrabold leading-none"
              style={{
                color: frpLevel.color,
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              }}
            >
              {properties.frp?.toFixed(2) || "N/A"}{" "}
              <span className="text-sm font-semibold">MW</span>
            </div>
          </div>
          <div
            className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border-2"
            style={{
              background: `${frpLevel.color}30`,
              color: frpLevel.color,
              borderColor: `${frpLevel.color}60`,
            }}
          >
            {frpLevel.level}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Date */}
        <div className="bg-surface p-2 rounded-lg border border-muted">
          <div className="text-xs uppercase tracking-wide text-text font-semibold mb-1">
            📅 Date
          </div>
          <div className="text-sm font-semibold text-text">
            {formatDate(properties.acq_date || "")}
          </div>
        </div>

        {/* Time */}
        <div className="bg-surface p-2 rounded-lg border border-muted">
          <div className="text-xs uppercase tracking-wide text-text font-semibold mb-1">
            ⏰ Time
          </div>
          <div className="text-sm font-semibold text-text">
            {formatTime(properties.acq_time || "")}
          </div>
        </div>

        {/* Confidence */}
        <div className="bg-surface p-2 rounded-lg border border-muted">
          <div className="text-xs uppercase tracking-wide text-text font-semibold mb-1">
            Confidence
          </div>
          <div className="text-sm font-semibold text-text">
            {getConfidenceEmoji(properties.confidence || "N/A")}
          </div>
        </div>

        {/* Brightness */}
        <div className="bg-surface p-2 rounded-lg border border-muted">
          <div className="text-xs uppercase tracking-wide text-text font-semibold mb-1">
            🌡️ Brightness
          </div>
          <div className="text-sm font-semibold text-text">
            {properties.bright_ti4?.toFixed(1) || "N/A"}K
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-accent/20 p-4 rounded-lg mb-4 border border-accent-hover">
        <div className="text-xs uppercase tracking-wide text-text font-semibold mb-1.5">
          📍 Location
        </div>
        <div className="text-sm font-semibold text-text leading-relaxed">
          {properties.ct_en || "Unknown Country"}
          <br />
          <span className="text-muted text-xs">
            {coordinates[1].toFixed(5)}°N, {coordinates[0].toFixed(5)}°E
          </span>
        </div>
      </div>

      {/* Scan Info */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-muted">
        <div className="text-center">
          <div className="text-[9px] uppercase text-muted font-semibold mb-0.5">
            Scan
          </div>
          <div className="text-xs font-bold text-muted">
            {properties.scan?.toFixed(2) || "N/A"}km
          </div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase text-muted font-semibold mb-0.5">
            Track
          </div>
          <div className="text-xs font-bold text-muted">
            {properties.track?.toFixed(2) || "N/A"}km
          </div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase text-muted font-semibold mb-0.5">
            Version
          </div>
          <div className="text-xs font-bold text-muted">
            {properties.version || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopUp;
