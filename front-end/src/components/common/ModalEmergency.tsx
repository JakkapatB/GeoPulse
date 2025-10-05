import type React from "react";
import { FiAlertTriangle } from "react-icons/fi";
interface ModalEmergencyProps {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  message?: string;
  children?: React.ReactNode;
}

const ModalEmergency: React.FC<ModalEmergencyProps> = ({
  open,
  onClose,
  title = "Emergency Alert",
  message = "This is a mock emergency alert modal. Please replace with actual content.",
  children,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="relative w-full max-w-lg mx-auto">
          <div className="animate-in fade-in zoom-in-95 duration-150 bg-surface rounded-xl shadow-xl ring-1 ring-border/50 p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text flex items-center gap-2">
                  <FiAlertTriangle className="text-warning" />
                  {title}
                </h2>
                {message && <p className="text-sm text-text/70">{message}</p>}
              </div>
              <button
                onClick={onClose}
                className="text-text/60 hover:text-text transition-colors text-sm px-2 py-1 rounded"
              >
                close
              </button>
            </div>
            {/* Content area (customizable) */}
            <div className="mt-2 text-sm text-text/80 space-y-3">
              {children ? (
                children
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-warning/10 text-warning">
                    <FiAlertTriangle />
                  </div>
                  <p className="leading-snug">
                    This is a mock emergency alert modal. Please replace with
                    actual content.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalEmergency;
