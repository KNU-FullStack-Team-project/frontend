import React from "react";

const AppButton = ({
  children,
  variant = "primary",
  type = "button",
  onClick,
  fullWidth = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`app-button ${variant} ${fullWidth ? "full-width" : ""}`}
    >
      {children}
    </button>
  );
};

export default AppButton;
