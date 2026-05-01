import { useState, useEffect, useCallback } from "react";

const useInquiryCount = (user) => {
  const [unreadInquiryCount, setUnreadInquiryCount] = useState(0);

  const fetchInquiryCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/inquiries/unread-count");
      if (res.ok) {
        const count = await res.json();
        setUnreadInquiryCount(count);
      }
    } catch (e) {
      console.error("Failed to fetch inquiry count", e);
    }
  }, [user]);

  useEffect(() => {
    fetchInquiryCount();
  }, [fetchInquiryCount]);

  return { unreadInquiryCount, refreshInquiryCount: fetchInquiryCount };
};

export default useInquiryCount;
