import React, { useEffect, useRef, useState } from "react";

const FONT_OPTIONS = [
  { label: "기본", value: "inherit" },
  { label: "Arial", value: "Arial" },
  { label: "Verdana", value: "Verdana" },
  { label: "Georgia", value: "Georgia" },
  { label: "Tahoma", value: "Tahoma" },
  { label: "Courier New", value: "Courier New" },
];

const SIZE_OPTIONS = [
  { label: "12px", value: "12px" },
  { label: "14px", value: "14px" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
  { label: "24px", value: "24px" },
  { label: "32px", value: "32px" },
];

const RichTextEditor = ({
  value,
  onChange,
  onUploadImage,
  minHeight = 320,
  placeholder = "내용을 입력하세요.",
}) => {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);

  const [fontFamily, setFontFamily] = useState("inherit");
  const [fontSize, setFontSize] = useState("16px");
  const [fontColor, setFontColor] = useState("#111827");

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const emitChange = () => {
    onChange?.(editorRef.current?.innerHTML || "");
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const runCommand = (command, commandValue = null) => {
    focusEditor();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const applyFontFamily = (nextFont) => {
    setFontFamily(nextFont);
    focusEditor();

    if (nextFont === "inherit") {
      document.execCommand("removeFormat", false, null);
      emitChange();
      return;
    }

    document.execCommand("fontName", false, nextFont);
    emitChange();
  };

  const applyFontColor = (nextColor) => {
    setFontColor(nextColor);
    runCommand("foreColor", nextColor);
  };

  const applyFontSize = (nextSize) => {
    setFontSize(nextSize);
    focusEditor();
    document.execCommand("fontSize", false, "7");

    const editor = editorRef.current;
    if (editor) {
      editor.querySelectorAll('font[size="7"]').forEach((node) => {
        const span = document.createElement("span");
        span.style.fontSize = nextSize;
        span.innerHTML = node.innerHTML;
        node.parentNode.replaceChild(span, node);
      });
    }

    emitChange();
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!onUploadImage) return;

    try {
      const uploaded = await onUploadImage(file);
      if (!uploaded?.fileUrl) return;

      focusEditor();
      document.execCommand(
        "insertHTML",
        false,
        `<p><img src="http://localhost:8081${uploaded.fileUrl}" alt="${uploaded.originalName || "image"}" style="max-width:100%; border-radius:12px; margin:12px 0;" /></p>`
      );
      emitChange();
    } catch (error) {
      console.error(error);
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.toolbar}>
        <select
          value={fontFamily}
          onChange={(e) => applyFontFamily(e.target.value)}
          style={styles.select}
        >
          {FONT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={fontSize}
          onChange={(e) => applyFontSize(e.target.value)}
          style={styles.select}
        >
          {SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="color"
          value={fontColor}
          onChange={(e) => applyFontColor(e.target.value)}
          style={styles.colorInput}
          title="글자색"
        />

        <button type="button" onClick={() => runCommand("bold")} style={styles.toolButton}>
          B
        </button>
        <button type="button" onClick={() => runCommand("italic")} style={styles.toolButton}>
          I
        </button>
        <button type="button" onClick={() => runCommand("underline")} style={styles.toolButton}>
          U
        </button>

        <button type="button" onClick={() => runCommand("justifyLeft")} style={styles.toolButton}>
          좌
        </button>
        <button type="button" onClick={() => runCommand("justifyCenter")} style={styles.toolButton}>
          중
        </button>
        <button type="button" onClick={() => runCommand("justifyRight")} style={styles.toolButton}>
          우
        </button>

        <button type="button" onClick={() => runCommand("insertUnorderedList")} style={styles.toolButton}>
          • 목록
        </button>

        <button type="button" onClick={() => imageInputRef.current?.click()} style={styles.toolButton}>
          이미지
        </button>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadImage}
          style={{ display: "none" }}
        />
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder={placeholder}
        style={{
          ...styles.editor,
          minHeight,
        }}
      />
    </div>
  );
};

const styles = {
  wrapper: {
    border: "1px solid #d1d5db",
    borderRadius: "16px",
    overflow: "hidden",
    background: "#fff",
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  select: {
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "0 10px",
    background: "#fff",
    fontSize: "13px",
  },
  colorInput: {
    width: "42px",
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "4px",
    cursor: "pointer",
  },
  toolButton: {
    minWidth: "44px",
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  editor: {
    padding: "18px",
    outline: "none",
    fontSize: "15px",
    lineHeight: "1.8",
    textAlign: "left",
  },
};

export default RichTextEditor;