import React, { useState } from "react";

const ContestCreatePage = ({ currentUser, onBack, onSuccess }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    startAt: "",
    endAt: "",
    initialSeedMoney: "",
    maxParticipants: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser?.userId) {
      alert("관리자 정보가 없습니다.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        startAt: form.startAt,
        endAt: form.endAt,
        initialSeedMoney: Number(form.initialSeedMoney),
        maxParticipants: form.maxParticipants
          ? Number(form.maxParticipants)
          : null,
      };

      const res = await fetch(
        `/api/admin/competitions?adminUserId=${currentUser.userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const text = await res.text();

      if (!res.ok) {
        alert(text || "대회 생성에 실패했습니다.");
        return;
      }

      alert(text || "대회 생성 완료");
      onSuccess();
    } catch (error) {
      console.error("대회 생성 오류:", error);
      alert("대회 생성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "24px 20px 60px",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: "20px",
          cursor: "pointer",
          border: "none",
          background: "transparent",
          fontSize: "14px",
          color: "#555",
        }}
      >
        ← 목록으로 돌아가기
      </button>

      <div
        style={{
          background: "linear-gradient(135deg, #3ab5f0 0%, #3186d1 100%)",
          color: "#fff",
          borderRadius: "24px",
          padding: "32px",
          boxShadow: "0 18px 40px rgba(58, 181, 240, 0.15)",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "32px",
            fontWeight: "800",
          }}
        >
          대회 생성
        </h1>

        <p
          style={{
            margin: 0,
            color: "rgba(255,255,255,0.82)",
            fontSize: "16px",
            lineHeight: "1.7",
          }}
        >
          관리자만 새로운 모의투자 대회를 생성할 수 있습니다.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#fff",
          border: "1px solid #ececec",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        }}
      >
        <FormRow label="대회명" required>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="대회명을 입력하세요"
            required
            style={inputStyle}
          />
        </FormRow>

        <FormRow label="설명">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="대회 설명을 입력하세요"
            rows={5}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </FormRow>

        <FormRow label="시작일시" required>
          <input
            type="datetime-local"
            name="startAt"
            value={form.startAt}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </FormRow>

        <FormRow label="종료일시" required>
          <input
            type="datetime-local"
            name="endAt"
            value={form.endAt}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </FormRow>

        <FormRow label="초기 시드머니" required>
          <input
            type="number"
            name="initialSeedMoney"
            value={form.initialSeedMoney}
            onChange={handleChange}
            placeholder="예: 1000000"
            min="1"
            required
            style={inputStyle}
          />
        </FormRow>

        <FormRow label="최대 참가자 수">
          <input
            type="number"
            name="maxParticipants"
            value={form.maxParticipants}
            onChange={handleChange}
            placeholder="미입력 시 제한 없음"
            min="1"
            style={inputStyle}
          />
        </FormRow>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              border: "1px solid #ddd",
              backgroundColor: "#fff",
              color: "#111",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            취소
          </button>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#111",
              color: "#fff",
              cursor: submitting ? "default" : "pointer",
              fontWeight: "700",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "생성 중..." : "대회 생성"}
          </button>
        </div>
      </form>
    </section>
  );
};

const FormRow = ({ label, required, children }) => {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div
        style={{
          marginBottom: "8px",
          fontSize: "14px",
          fontWeight: "700",
          color: "#222",
        }}
      >
        {label} {required && <span style={{ color: "#e03131" }}>*</span>}
      </div>
      {children}
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #ddd",
  fontSize: "14px",
  boxSizing: "border-box",
};

export default ContestCreatePage;
