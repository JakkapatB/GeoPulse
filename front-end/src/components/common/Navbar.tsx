import { useState } from "react";
import { LuMapPin } from "react-icons/lu";
import { Link } from "react-router-dom";
import { useUserLocation } from "../../context/UserLocationContext";
import { FiMenu, FiX } from "react-icons/fi";

const Navbar = () => {
  const { coords, placeName, updating } = useUserLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const locationDisplay = (
    <div className="flex flex-col space-y-1 min-w-[180px] max-w-[260px]">
      <span className="text-xs text-muted">Your location</span>
      <div className="flex flex-row items-center gap-2">
        <LuMapPin className="text-lg text-primary shrink-0" />
        {placeName ? (
          <span className="text-sm font-medium truncate" title={placeName}>
            {placeName}
          </span>
        ) : coords ? (
          <span className="text-sm font-mono">
            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
        ) : (
          <span className="text-sm text-muted">Locating...</span>
        )}
        {updating && (
          <span className="text-[10px] text-muted animate-pulse">
            (updating)
          </span>
        )}
      </div>
    </div>
  );

  return (
    <nav className="w-full bg-surface sticky top-0 z-40">
      <div className="mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-12 py-2 gap-4">
        {/* Left section: Logo + (desktop) location */}
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to="/map-monitor"
            className="flex items-center focus:outline-none rounded"
          >
            <img
              src="logo.svg"
              alt="GeoPulse"
              className="h-10 w-auto object-contain pr-2 border-r border-border/40 max-[768px]:border-hidden"
            />
          </Link>
          {/* Desktop Location (hidden on small) */}
          <div className="hidden md:block">{locationDisplay}</div>
        </div>

        {/* Right section: actions (placeholder) & mobile toggle */}
        <div className="flex items-center gap-3">
          {/* Placeholder for future actions (alerts, profile, filters) */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Add buttons/components here e.g. <UserAlerts /> */}
          </div>
          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {menuOpen ? (
              <FiX className="h-5 w-5" />
            ) : (
              <FiMenu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        className={`md:hidden origin-top transition-all duration-200 ease-out ${
          menuOpen ? "max-h-[240px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden border-t border-border/30 bg-surface/95 backdrop-blur`}
      >
        <div className="px-4 flex flex-col py-4">
          {locationDisplay}
          {/* Mobile actions placeholder */}
          <div className="flex flex-col gap-2">
            {/* Example placeholder buttons */}
            {/* <ActionButton label="Alerts" /> */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
