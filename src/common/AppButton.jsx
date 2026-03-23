import React from "react";

const AppButton = ({
  children,
  variant = "primary",
  type = "button",
  onClick,
  fullWidth = false,
  disabled = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`app-button ${variant} ${fullWidth ? "full-width" : ""} ${
        disabled ? "disabled" : ""
      }`}
    >
      {children}
    </button>
  );
};

export default AppButton;
