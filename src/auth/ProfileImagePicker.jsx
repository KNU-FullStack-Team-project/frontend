import React, { useRef } from "react";
import "./ProfileImagePicker.css";

const ProfileImagePicker = ({
  profilePreview,
  onChangeImage,
  onResetImage,
}) => {
  const fileInputRef = useRef(null);

  const handleClickChange = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="profile-picker">
      <div className="profile-picker__preview-wrap">
        <img
          src={profilePreview}
          alt="프로필 미리보기"
          className="profile-picker__preview"
        />
      </div>

      <div className="profile-picker__actions">
        <button
          type="button"
          className="profile-picker__button profile-picker__button--primary"
          onClick={handleClickChange}
        >
          프로필 변경
        </button>

        <button
          type="button"
          className="profile-picker__button profile-picker__button--secondary"
          onClick={onResetImage}
        >
          기본으로 되돌리기
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onChangeImage}
        className="profile-picker__file-input"
      />
    </div>
  );
};

export default ProfileImagePicker;
