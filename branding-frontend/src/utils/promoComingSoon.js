// src/utils/promoComingSoon.js
export const PROMO_INTERVIEW_COMING_SOON_MESSAGE =
  "해당 홍보물 컨설팅 인터뷰는 추후 개발 예정입니다.";

export function notifyPromoInterviewComingSoon() {
  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(PROMO_INTERVIEW_COMING_SOON_MESSAGE);
  }
}
