import { LuMapPin } from "react-icons/lu";
import { Link } from "react-router-dom";
import { GoAlertFill } from "react-icons/go";
import ModalEmergency from "./ModalEmergency";
import { useCallback, useEffect, useState } from "react";

const Navbar = () => {
  const [showEmergency, setShowEmergency] = useState(false);

  const open = useCallback(() => setShowEmergency(true), []);
  const close = useCallback(() => setShowEmergency(false), []);

  // ปิดด้วย Escape
  useEffect(() => {
    if (!showEmergency) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showEmergency, close]);

  return (
    <nav className="flex flex-row w-screen h-full items-center justify-between bg-surface px-12 py-2 ">
      <div className="flex flex-row items-center gap-4">
        <Link to="/map-monitor">
          <img
            src="logo.svg"
            alt="GeoPulse"
            className="w-full h-12 object-contain border-r border-gray-500 pr-2 "
          />
        </Link>
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-muted">You are viewing a map of</span>
          <div className="flex flex-row items-center gap-2">
            <LuMapPin className="text-lg text-primary" />
            <span className="text-lg font-semibold">Bangkok, Thailand</span>
          </div>
        </div>
      </div>
      <button
        onClick={open}
        className="flex flex-row items-center border border-warning p-2 gap-2 text-warning hover:text-warning-hover active:scale-95 transition-all duration-150 cursor-pointer rounded-md"
        aria-haspopup="dialog"
        aria-expanded={showEmergency}
      >
        <span className="font-medium">Emergency</span>
        <GoAlertFill className="text-xl animate-pulse drop-shadow" />
      </button>
      <ModalEmergency open={showEmergency} onClose={close} />
    </nav>
  );
};

export default Navbar;
