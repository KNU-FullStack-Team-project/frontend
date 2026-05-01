import React, { useMemo, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const CommunityQuillEditor = ({
  value,
  onChange,
  onUploadImage,
  placeholder = "내용을 입력하세요.",
  minHeight = 360,
}) => {
  const quillRef = useRef(null);

  const handleImageUpload = () => {
    if (!onUploadImage) {
      alert("이미지 업로드 기능이 연결되어 있지 않습니다.");
      return;
    }

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const uploaded = await onUploadImage(file);

        if (!uploaded?.fileUrl) {
          throw new Error("이미지 URL을 받아오지 못했습니다.");
        }

        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection(true);

        if (editor) {
          const insertIndex = range?.index ?? editor.getLength();
          editor.insertEmbed(insertIndex, "image", uploaded.fileUrl);
          editor.setSelection(insertIndex + 1);
        }
      } catch (error) {
        console.error(error);
        alert(error.message || "이미지 업로드에 실패했습니다.");
      }
    };
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ font: [] }, { size: ["small", false, "large", "huge"] }],
          ["bold", "italic", "underline"],
          [{ color: [] }],
          [{ align: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: handleImageUpload,
        },
      },
    }),
    [onUploadImage]
  );

  const formats = [
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "color",
    "align",
    "list",
    "link",
    "image",
  ];

  const handleWrapperClick = () => {
    const editor = quillRef.current?.getEditor();
    if (editor && !editor.hasFocus()) {
      editor.focus();
      const length = editor.getLength();
      if (length <= 1) editor.setSelection(0);
    }
  };

  return (
    <div style={styles.editorWrap} onClick={handleWrapperClick}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="community-quill-editor"
      />
    </div>
  );
};

const styles = {
  editorWrap: {
    border: "1px solid #d1d5db",
    borderRadius: "16px",
    overflow: "hidden",
    background: "#fff",
    cursor: "text", // 클릭 가능함을 시각적으로 표시
  },
};

export default CommunityQuillEditor;