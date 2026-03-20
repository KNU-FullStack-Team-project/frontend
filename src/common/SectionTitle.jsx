import React from "react";

const InfoCard = ({ title, value, valueClassName = "" }) => {
  return (
    <div className="summary-card">
      <p>{title}</p>
      <h3 className={valueClassName}>{value}</h3>
    </div>
  );
};

export default InfoCard;
