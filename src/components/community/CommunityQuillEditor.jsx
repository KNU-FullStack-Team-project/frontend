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
        if (!uploaded?.fileUrl) throw new Error("이미지 URL을 받아오지 못했습니다.");

        const editor = quillRef.current?.getEditor();
        if (editor) {
          // getSelection(true)는 에디터에 포커스를 주면서 현재 선택 영역을 가져옵니다.
          const range = editor.getSelection(true);
          const insertIndex = range ? range.index : editor.getLength();

          // 이미지 삽입
          editor.insertEmbed(insertIndex, "image", uploaded.fileUrl, "user");
          
          // 삽입 후 커서 이동을 비동기로 처리하여 브라우저의 addRange 오류 방지
          setTimeout(() => {
            const nextIndex = Math.min(insertIndex + 1, editor.getLength());
            editor.setSelection(nextIndex, 0, "user");
          }, 0);
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

  const handleWrapperClick = (e) => {
    // 클릭된 요소가 실제 텍스트 입력창이 아닐 때만(예: 박스 하단 빈 공간) 강제 포커스 실행
    if (e.target.closest(".ql-editor")) return;

    const editor = quillRef.current?.getEditor();
    if (editor && !editor.hasFocus()) {
      editor.focus();
      const length = editor.getLength();
      // 내용이 아예 없을 때만 맨 앞으로, 내용이 있으면 마지막 위치 유지
      if (length <= 1) {
        setTimeout(() => editor.setSelection(0), 0);
      }
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