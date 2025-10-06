import { useEffect, useRef, useState, useMemo } from "react";
import { useUserLocation } from "../context/UserLocationContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { FaRegUserCircle } from "react-icons/fa";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createRoot } from "react-dom/client";
import PopUp from "./common/PopUp";
import "../styles/popup.css";
import DateFilter from "./common/DateFilter";
import HotspotReport from "./common/HotspotReport";
import UserAlerts from "./common/UserAlerts";

// Basic GeoJSON typings for hotspots
interface HotspotProperties {
  acq_date?: string; // ISO or YYYY-MM-DD
  frp?: number;
  // Additional attributes from API; kept flexible
  extra?: Record<string, unknown>;
}
type HotspotFeature = GeoJSON.Feature<GeoJSON.Point, HotspotProperties>;
type HotspotCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  HotspotProperties
>;

interface MapViewProps {
  data: HotspotCollection | null;
  loading: boolean;
  error: string | null;
}
const MapView = ({ data, loading, error }: MapViewProps) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const userLocationRef = useRef<{ lng: number; lat: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const isAddingAlertRef = useRef(false);
  const hotspotMarkersRef = useRef<maplibregl.Marker[]>([]);
  const leftControlsRef = useRef<HTMLDivElement | null>(null);
  const [mobileOffsetTop, setMobileOffsetTop] = useState(0);

  const { setCoords, setPlaceName, setUpdating } = useUserLocation();

  // Filter data by date range
  const filterDataByDate = (
    data: HotspotCollection,
    start: string | null,
    end: string | null
  ): HotspotCollection => {
    if (!data || !data.features) return data;
    if (!start && !end) return data;

    const filtered = {
      ...data,
      features: data.features.filter((feature: HotspotFeature) => {
        const acqDate = feature.properties?.acq_date;
        if (!acqDate) return true;

        const featureDate = new Date(acqDate);
        const startDateTime = start ? new Date(start) : null;
        const endDateTime = end ? new Date(end) : null;

        if (startDateTime && featureDate < startDateTime) return false;
        if (endDateTime && featureDate > endDateTime) return false;

        return true;
      }),
    };

    return filtered;
  };

  const handleFilterChange = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Fly to current user location
  const flyToUserLocation = () => {
    if (!mapRef.current || !userLocationRef.current) {
      console.warn("Map or user location not available");
      return;
    }
    const { lng, lat } = userLocationRef.current;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 12,
      essential: true,
      duration: 1500,
    });
  };

  // Memo filtered data for reuse (report + map source)
  const filteredData = useMemo(() => {
    if (!data)
      return {
        type: "FeatureCollection",
        features: [] as HotspotFeature[],
      } as HotspotCollection;
    return filterDataByDate(data, startDate, endDate);
  }, [data, startDate, endDate]);

  useEffect(() => {
    if (mapRef.current) return;
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [122, -10],
      zoom: 8,
      renderWorldCopies: false, // do not render wrapped world copies
    });

    mapRef.current = map;

    map.on("load", async () => {
      setMapReady(true);
      if (data && data.features) {
        // Create fire icon via canvas (fallback if SVG fails)
        const createFireIcon = (size: number, color: string) => {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            // Draw gradient circle
            const gradient = ctx.createRadialGradient(
              size / 2,
              size / 2,
              0,
              size / 2,
              size / 2,
              size / 2
            );
            gradient.addColorStop(0, color + "FF");
            gradient.addColorStop(0.5, color + "CC");
            gradient.addColorStop(1, color + "00");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Middle solid circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
            ctx.fill();
          }

          return canvas;
        };

        // Load Fire SVG icon
        try {
          const fireImg = new Image(64, 64);
          fireImg.src = "/fire.svg";

          await new Promise<void>((resolve, reject) => {
            fireImg.onload = () => {
              try {
                map.addImage("fire-icon", fireImg as HTMLImageElement);
                console.log("✅ Fire icon loaded successfully");
                resolve();
              } catch (err) {
                reject(err);
              }
            };
            fireImg.onerror = () =>
              reject(new Error("Failed to load fire SVG"));
            setTimeout(
              () => reject(new Error("Timeout loading fire icon")),
              2000
            );
          });
        } catch (error) {
          console.warn(
            "⚠️ Fire SVG loading failed, using canvas fallback:",
            error
          );
          const canvas = createFireIcon(64, "#ff4500");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            map.addImage("fire-icon", imageData);
          }
        }

        // Load Smoke SVG icon
        try {
          const smokeImg = new Image(64, 64);
          smokeImg.src = "/smoke.svg";

          await new Promise<void>((resolve, reject) => {
            smokeImg.onload = () => {
              try {
                map.addImage("smoke-icon", smokeImg as HTMLImageElement);
                console.log("✅ Smoke icon loaded successfully");
                resolve();
              } catch (err) {
                reject(err);
              }
            };
            smokeImg.onerror = () =>
              reject(new Error("Failed to load smoke SVG"));
            setTimeout(
              () => reject(new Error("Timeout loading smoke icon")),
              2000
            );
          });
        } catch (error) {
          console.warn(
            "⚠️ Smoke SVG loading failed, using canvas fallback:",
            error
          );
          const canvas = createFireIcon(64, "#888888");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            map.addImage("smoke-icon", imageData);
          }
        }

        // (Hotspot visual styling now handled by custom HTML markers below)

        // Attempt to get current user location and place marker
        if (navigator.geolocation) {
          const createOrUpdateUserMarker = (lng: number, lat: number) => {
            const existing = userMarkerRef.current;
            if (existing) {
              existing.setLngLat([lng, lat]);
              return;
            }
            // Create a custom marker element and render React icon
            const el = document.createElement("div");
            // Fix root size and avoid translation so maplibre anchor math stays stable
            el.className = "w-10 h-10";
            const root = createRoot(el);
            root.render(
              <div className="relative flex items-center justify-center w-10 h-10">
                <span className="absolute inset-0 rounded-full bg-accent/25 animate-ping" />
                <span className="absolute inset-0 rounded-full bg-accent/30 blur-sm" />
                <span className="absolute w-6 h-6 rounded-full bg-background border border-accent/60 shadow shadow-black/40" />
                <FaRegUserCircle className="relative w-7 h-7 text-[var(--color-accent)] drop-shadow-[0_0_4px_rgba(64,196,234,0.6)]" />
              </div>
            );
            userMarkerRef.current = new maplibregl.Marker({
              element: el,
              anchor: "center",
            })
              .setLngLat([lng, lat])
              .addTo(map);
          };

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { longitude, latitude } = pos.coords;
              userLocationRef.current = { lng: longitude, lat: latitude };
              createOrUpdateUserMarker(longitude, latitude);
              setCoords(longitude, latitude);
              setUpdating(true);
              // Reverse geocode using Nominatim (public OSM) - lightweight fetch
              fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en&lat=${latitude}&lon=${longitude}`
              )
                .then((r) => r.json())
                .then((d) => {
                  const addr = d.address || {};
                  // Prefer province-level field. Fallback chain covers various countries.
                  const province =
                    addr.province ||
                    addr.state ||
                    addr.county ||
                    addr.region ||
                    addr.city ||
                    addr.town ||
                    addr.district ||
                    d.name ||
                    null;
                  setPlaceName(province);
                })
                .catch(() => setPlaceName(null))
                .finally(() => setUpdating(false));
              map.flyTo({
                center: [longitude, latitude],
                zoom: 9,
                essential: true,
              });
            },
            (err) => {
              console.warn("Geolocation error:", err.message);
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );

          // Watch position for updates
          geoWatchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              const { longitude, latitude } = pos.coords;
              userLocationRef.current = { lng: longitude, lat: latitude };
              createOrUpdateUserMarker(longitude, latitude);
              setCoords(longitude, latitude);
            },
            (err) => {
              console.warn("Geolocation watch error:", err.message);
            },
            { enableHighAccuracy: true, maximumAge: 5000 }
          );
        }
      }
    });
    return () => {
      if (mapRef.current) {
        if (geoWatchIdRef.current !== null && navigator.geolocation) {
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [data, setCoords, setPlaceName, setUpdating]); // include context setters

  // Render / re-render custom styled hotspot markers when filtered data changes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    // Clear previous markers
    hotspotMarkersRef.current.forEach((m) => m.remove());
    hotspotMarkersRef.current = [];
    if (!filteredData || !filteredData.features) return;

    const getFrpStyle = (frp?: number) => {
      if (frp === undefined || frp === null)
        return {
          color: "bg-slate-500",
          glow: "shadow-[0_0_14px_rgba(148,163,184,0.55)]",
          gradient: "from-slate-500/25 to-slate-600/30",
          icon: "❔",
        };
      if (frp < 2)
        return {
          color: "bg-green-600",
          glow: "shadow-[0_0_14px_rgba(22,163,74,0.6)]",
          gradient: "from-green-600/25 to-green-700/30",
          icon: "🌫",
        };
      if (frp < 4)
        return {
          color: "bg-lime-500",
          glow: "shadow-[0_0_14px_rgba(132,204,22,0.55)]",
          gradient: "from-lime-500/25 to-lime-600/30",
          icon: "🌫",
        };
      if (frp < 6)
        return {
          color: "bg-yellow-500",
          glow: "shadow-[0_0_16px_rgba(234,179,8,0.6)]",
          gradient: "from-yellow-500/25 to-yellow-600/30",
          icon: "🔥",
        };
      if (frp < 8)
        return {
          color: "bg-orange-500",
          glow: "shadow-[0_0_16px_rgba(249,115,22,0.65)]",
          gradient: "from-orange-500/25 to-orange-600/30",
          icon: "🔥",
        };
      if (frp < 12)
        return {
          color: "bg-red-600",
          glow: "shadow-[0_0_18px_rgba(220,38,38,0.7)]",
          gradient: "from-red-600/25 to-red-700/35",
          icon: "🔥",
        };
      return {
        color: "bg-rose-600",
        glow: "shadow-[0_0_20px_rgba(225,29,72,0.75)]",
        gradient: "from-rose-600/25 to-rose-700/35",
        icon: "🔥",
      };
    };

    filteredData.features.forEach((feature) => {
      if (feature.geometry.type !== "Point") return;
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const frp = (feature.properties as HotspotProperties | undefined)?.frp;
      const deco = getFrpStyle(frp);

      const el = document.createElement("div");
      el.className = "group relative cursor-pointer select-none w-12 h-12";
      el.innerHTML = `
        <div class="relative flex items-center justify-center w-12 h-12 pointer-events-none">
          <span class="absolute inset-0 rounded-full ${deco.color} opacity-25 animate-ping"></span>
          <span class="absolute inset-0 rounded-full ${deco.color} opacity-30 blur-md"></span>
          <div class="relative w-10 h-10 rounded-full ${deco.color} ring-2 ring-white/20 ${deco.glow} flex items-center justify-center shadow-2xl border-2 border-white/20 bg-gradient-to-br ${deco.gradient} transition-transform duration-200 ease-out group-hover:scale-110 will-change-transform pointer-events-auto">
            <span class="text-lg filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">${deco.icon}</span>
          </div>
          <div class="absolute -bottom-1 w-2 h-2 rounded-full ${deco.color} ring-1 ring-white/40 shadow-lg"></div>
        </div>`;

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(map);

      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (isAddingAlertRef.current) return; // suppress while adding alert
        // Remove existing popups
        const existingPopups =
          document.getElementsByClassName("maplibregl-popup");
        if (existingPopups.length > 0)
          Array.from(existingPopups).forEach((p) => p.remove());

        const popupNode = document.createElement("div");
        const root = createRoot(popupNode);
        root.render(
          <PopUp
            coordinates={[lng, lat]}
            properties={(feature.properties || {}) as HotspotProperties}
          />
        );
        new maplibregl.Popup({ maxWidth: "400px", className: "dark-popup" })
          .setLngLat([lng, lat])
          .setDOMContent(popupNode)
          .addTo(map);
      });

      hotspotMarkersRef.current.push(marker);
    });
  }, [filteredData, mapReady]);

  // (Previous vector layer update removed in favor of HTML markers)

  const wide770 = useBreakpoint(770); // custom breakpoint (>=770px)

  // Measure left control cluster height for mobile to position right cluster below it
  useEffect(() => {
    if (wide770) {
      setMobileOffsetTop(0);
      return;
    }
    const el = leftControlsRef.current;
    if (!el) return;
    const update = () => {
      setMobileOffsetTop(el.getBoundingClientRect().height + 8); // +8px gap
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [wide770, showReport, startDate, endDate]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const buttonBase =
    "bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 hover:border-slate-500 text-slate-200 font-medium shadow-lg shadow-black/40 transition flex items-center";
  const wide = "px-4 h-10 rounded-xl text-xs gap-2 justify-start flex-none";

  return (
    <div className="relative w-screen h-screen">
      <div
        ref={leftControlsRef}
        className={
          wide770
            ? "absolute top-6 left-4 z-20 flex flex-row items-start gap-4" /* increased top spacing */
            : "absolute top-4 left-2 right-2 z-20 flex flex-col gap-2 w-auto" /* increased top spacing on mobile */
        }
      >
        <div className={wide770 ? "w-auto" : "w-full"}>
          <DateFilter onFilterChange={handleFilterChange} floating={false} />
        </div>
        <div
          className={
            wide770
              ? "flex flex-row gap-3 "
              : "grid grid-cols-2 gap-2 w-full space-y-4"
          }
        >
          <button
            onClick={() => setShowReport((v) => !v)}
            className={`${buttonBase} ${
              wide770
                ? wide
                : "h-11 rounded-xl text-[11px] flex gap-2 justify-center"
            } bg-gradient-to-br from-slate-900/80 to-slate-800/60 hover:from-slate-800/80 hover:to-slate-700/60 ring-1 ring-white/10`}
            title={showReport ? "Hide report panel" : "Show report panel"}
            aria-label={showReport ? "Hide Report" : "Show Report"}
          >
            <span className="text-base leading-none">📈</span>
            {wide770 ? (
              <span>{showReport ? "Hide Report" : "Show Report"}</span>
            ) : null}
          </button>
          <button
            onClick={flyToUserLocation}
            className={`${buttonBase} ${
              wide770
                ? wide
                : "h-11 rounded-xl text-[11px] flex gap-2 justify-center"
            } bg-gradient-to-br from-slate-900/80 to-slate-800/60 hover:from-slate-800/80 hover:to-slate-700/60 ring-1 ring-white/10`}
            title="Go to my location"
            aria-label="Go to my location"
          >
            <span className="text-base leading-none">📍</span>
            {wide770 ? <span>My Location</span> : null}
          </button>
        </div>
      </div>
      <HotspotReport
        data={filteredData}
        visible={showReport}
        onClose={() => setShowReport(false)}
        startDate={startDate}
        endDate={endDate}
      />
      {mapReady && (
        <UserAlerts
          map={mapRef.current}
          mobileOffsetTop={mobileOffsetTop}
          onAddingChange={(isAdding) => {
            isAddingAlertRef.current = isAdding;
          }}
        />
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;
