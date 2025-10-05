import React from "react";

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  className = "",
}) => {
  const baseClasses = "rounded font-medium transition-all duration-200 ";

  const variantClasses = {
    primary:
      "bg-background text-text border-2 border-primary hover:border-primary-hover transition-all duration-300 hover:shadow-[0_0_20px_10px_rgba(22,148,53,0.45)] active:scale-95 active:shadow-[0_0_10px_5px_rgba(22,148,53,0.25)] group",
    secondary:
      "bg-background text-text border-2 border-secondary hover:border-secondary-hover transition-all duration-300 hover:shadow-[0_0_20px_10px_rgba(3,119,174,0.35)] active:scale-95 active:shadow-[0_0_10px_5px_rgba(3,119,174,0.2)] group",
    danger:
      "bg-background text-text border-2 border-danger hover:border-danger-hover transition-all duration-300 hover:shadow-[0_0_20px_10px_rgba(220,38,38,0.35)] active:scale-95 active:shadow-[0_0_10px_5px_rgba(220,38,38,0.2)] group",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default ActionButton;
