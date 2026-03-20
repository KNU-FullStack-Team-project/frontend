import React from "react";

const ContestCard = ({
  image,
  category,
  title,
  description,
  teams,
  tag,
  status,
}) => {
  return (
    <article className="contest-card-v2">
      <div className="contest-card-image-wrap">
        <img src={image} alt={title} className="contest-card-image" />
        <div className="contest-card-badge">K</div>
      </div>

      <div className="contest-card-body">
        <div className="contest-card-category-row">
          <span className="contest-card-category">🏆 {category}</span>
          <button type="button" className="contest-card-menu">
            ⋮
          </button>
        </div>

        <h3 className="contest-card-title">{title}</h3>
        <p className="contest-card-description">{description}</p>
        <p className="contest-card-teams">{teams} Teams</p>
      </div>

      <div className="contest-card-footer">
        <span className="contest-card-tag">{tag}</span>
        <span className="contest-card-status">{status}</span>
      </div>
    </article>
  );
};

export default ContestCard;
