import React from "react";

const AppInput = ({
  label,
  placeholder,
  icon,
  type = "text",
  value,
  onChange,
  name,
}) => {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          className="custom-input"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          name={name}
        />
      </div>
    </div>
  );
};

export default AppInput;
