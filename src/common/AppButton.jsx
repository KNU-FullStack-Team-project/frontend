import React from "react";

const AppButton = ({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  onClick,
  fullWidth = false,
  disabled = false,
  style = {},
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`app-button ${variant} ${size} ${fullWidth ? "full-width" : ""} ${
        disabled ? "disabled" : ""
      }`}
    >
      {children}
    </button>
  );
};

export default AppButton;
