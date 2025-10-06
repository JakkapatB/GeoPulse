import React, { useMemo, useState, useCallback } from "react";

interface HotspotProperties {
  acq_date?: string;
  frp?: number;
  extra?: Record<string, unknown>;
}
interface HotspotReportProps {
  data: GeoJSON.FeatureCollection<GeoJSON.Point, HotspotProperties> | null;
  visible: boolean;
  onClose: () => void;
  startDate: string | null;
  endDate: string | null;
}

interface DayBucket {
  date: string; // YYYY-MM-DD
  count: number;
}

// Utility: format date range label
const formatRange = (start: string | null, end: string | null) => {
  if (!start && !end) return "All Data";
  const s = start ? start.split("T")[0] : "…";
  const e = end ? end.split("T")[0] : "…";
  return `${s} → ${e}`;
};

const HotspotReport: React.FC<HotspotReportProps> = ({
  data,
  visible,
  onClose,
  startDate,
  endDate,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Aggregate counts per acquisition date
  const buckets: DayBucket[] = useMemo(() => {
    if (!data || !data.features) return [];
    const map: Record<string, number> = {};
    for (const f of data.features) {
      const d = f.properties?.acq_date;
      if (!d) continue;
      // assume already in YYYY-MM-DD (else slice)
      const key = d.length > 10 ? d.slice(0, 10) : d;
      map[key] = (map[key] || 0) + 1;
    }
    const arr = Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    return arr;
  }, [data]);

  const stats = useMemo(() => {
    if (!buckets.length) return null;
    const total = buckets.reduce((s, b) => s + b.count, 0);
    const max = buckets.reduce(
      (m, b) => (b.count > m.count ? b : m),
      buckets[0]
    );
    const avg = total / buckets.length;
    return { total, days: buckets.length, avg, max };
  }, [buckets]);

  // Build SVG path
  const chart = useMemo(() => {
    if (!buckets.length) {
      return {
        path: "",
        points: [] as { x: number; y: number }[],
        maxY: 0,
        w: 560,
        h: 180,
        padX: 32,
        padY: 20,
      };
    }
    const w = 560;
    const h = 180;
    const padX = 32;
    const padY = 20;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    const maxY = Math.max(...buckets.map((b) => b.count));
    const stepX = buckets.length > 1 ? innerW / (buckets.length - 1) : 0;
    const points = buckets.map((b, i) => {
      const x = padX + i * stepX;
      const yRatio = maxY === 0 ? 0 : b.count / maxY;
      const y = padY + (1 - yRatio) * innerH;
      return { x, y };
    });
    let path = "";
    points.forEach((p, i) => {
      path += i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`;
    });
    return { path, points, maxY, w, h, padX, padY };
  }, [buckets]);

  const handleMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!chart.points.length) return;
      const rect = (e.target as SVGElement)
        .closest("svg")
        ?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      // find nearest point
      let nearest = 0;
      let minDist = Infinity;
      chart.points.forEach((p, i) => {
        const d = Math.abs(p.x - mx);
        if (d < minDist) {
          minDist = d;
          nearest = i;
        }
      });
      setHoverIndex(nearest);
    },
    [chart.points]
  );

  const handleLeave = () => setHoverIndex(null);

  if (!visible) return null;

  return (
    <div className="absolute bottom-4 left-4 z-20 w-[620px] max-w-[95vw] bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/50 p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 flex items-center gap-2">
            <span className="text-base">📈</span> Hotspot Frequency Report
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Range:{" "}
            <span className="text-slate-300">
              {formatRange(startDate, endDate)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-[11px] px-2 py-1 rounded-md bg-slate-700/40 hover:bg-slate-600/40 text-slate-300 border border-slate-600 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-2">
            <p className="text-[10px] uppercase text-slate-500 font-semibold">
              Total
            </p>
            <p className="text-sm font-semibold text-primary">{stats.total}</p>
          </div>
          <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-2">
            <p className="text-[10px] uppercase text-slate-500 font-semibold">
              Days
            </p>
            <p className="text-sm font-semibold text-secondary">{stats.days}</p>
          </div>
          <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-2">
            <p className="text-[10px] uppercase text-slate-500 font-semibold">
              Avg/Day
            </p>
            <p className="text-sm font-semibold text-accent">
              {stats.avg.toFixed(1)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-2">
            <p className="text-[10px] uppercase text-slate-500 font-semibold">
              Peak
            </p>
            <p className="text-sm font-semibold text-warning">
              {stats.max.count}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 text-sm">
          No data to display
        </div>
      )}

      {/* Chart */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3">
        {buckets.length ? (
          <div className="relative">
            <svg
              width={chart.w}
              height={chart.h}
              className="block max-w-full"
              onMouseMove={handleMove}
              onMouseLeave={handleLeave}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-accent)"
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-accent)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="60%" stopColor="var(--color-accent)" />
                  <stop offset="100%" stopColor="var(--color-warning)" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {chart.points.map((p, idx) => (
                <line
                  key={idx}
                  x1={p.x}
                  x2={p.x}
                  y1={chart.padY}
                  y2={chart.h - chart.padY}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={1}
                />
              ))}
              {/* Horizontal lines */}
              {Array.from({ length: 4 }).map((_, i) => {
                const y = chart.padY + (i / 3) * (chart.h - chart.padY * 2);
                return (
                  <line
                    key={`h-${i}`}
                    x1={chart.padX}
                    x2={chart.w - chart.padX}
                    y1={y}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={1}
                  />
                );
              })}
              {/* Area fill */}
              <path
                d={`${chart.path} L ${
                  chart.points[chart.points.length - 1].x
                } ${chart.h - chart.padY} L ${chart.points[0].x} ${
                  chart.h - chart.padY
                } Z`}
                fill="url(#lineGradient)"
                stroke="none"
              />
              {/* Line */}
              <path
                d={chart.path}
                fill="none"
                stroke="url(#lineStroke)"
                strokeWidth={2.2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Points */}
              {chart.points.map((p, i) => (
                <circle
                  key={`pt-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={hoverIndex === i ? 5 : 3}
                  fill={
                    hoverIndex === i
                      ? "var(--color-warning)"
                      : "var(--color-accent)"
                  }
                  className="transition-all duration-150"
                />
              ))}
              {/* Hover line & tooltip anchor */}
              {hoverIndex !== null && (
                <g>
                  <line
                    x1={chart.points[hoverIndex].x}
                    x2={chart.points[hoverIndex].x}
                    y1={chart.padY}
                    y2={chart.h - chart.padY}
                    stroke="var(--color-warning)"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                </g>
              )}
            </svg>
            {hoverIndex !== null && (
              <div
                className="absolute pointer-events-none px-2 py-1 rounded-md bg-slate-900/90 border border-slate-600 text-[11px] text-slate-200 shadow-lg"
                style={{
                  left: chart.points[hoverIndex].x - 30,
                  top: chart.points[hoverIndex].y - 46,
                }}
              >
                <div className="font-semibold text-accent">
                  {buckets[hoverIndex].count}
                </div>
                <div className="text-[10px] text-slate-400">
                  {buckets[hoverIndex].date}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-500 text-sm py-8">
            No frequency data
          </div>
        )}
        {stats && (
          <p className="mt-3 text-[10px] text-slate-500">
            Peak day {stats.max.date} with {stats.max.count} hotspots.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600 text-slate-200 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default HotspotReport;
