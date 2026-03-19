// src/utils/userDataKeys.js
// ✅ 로그아웃/계정 전환 시 정리해야 하는 '사용자별 데이터' localStorage 키 목록
// - 기존 구현은 userId 스코프가 없어(user1 → logout → user2 로그인) 시
//   user2가 user1 데이터를 그대로 보는 문제가 발생할 수 있음.
// - 현재 프로젝트에서는 userLocalStorage(userKey)로 userId별 저장을 하되,
//   예전에 남아있던 레거시(스코프 없는) 키도 함께 제거하기 위해 사용.

export const USER_DATA_KEYS = [
  // ---------------- 기업 진단 ----------------
  "diagnosisInterviewDraft_v1",
  "diagnosisDraft",
  "diagnosisResult_v1",

  // (과거/호환 후보)
  "diagnosisInterview_v1",
  "diagnosisInterviewDraft",

  // ---------------- 브랜드 컨설팅 ----------------
  "brandPipeline_v1",

  // naming
  "namingConsultingInterviewDraft_v1",
  "namingConsultingInterviewResult_v1",
  "brandInterview_naming_v1",

  // concept (구 homepage 컨설팅 키 포함)
  "conceptConsultingInterviewDraft_v1",
  "conceptConsultingInterviewResult_v1",
  "conceptInterviewDraft_homepage_v7",
  "conceptInterviewResult_homepage_v7",
  "conceptInterviewDraft_homepage_v6",
  "conceptInterviewResult_homepage_v6",
  "conceptInterviewDraft_homepage_v5",
  "conceptInterviewResult_homepage_v5",
  "brandInterview_homepage_v1",
  "brandInterview_concept_v1",

  // story
  "brandStoryConsultingInterviewDraft_v1",
  "brandStoryConsultingInterviewResult_v1",
  "brandInterview_story_v1",

  // logo
  "logoConsultingInterviewDraft_v1",
  "logoConsultingInterviewResult_v1",
  "brandInterview_logo_v1",

  // ---------------- 홍보물 컨설팅 ----------------
  // (리스트/완료 표시용 legacy)
  "promoInterview_digital_v1",
  "promoInterview_offline_v1",
  "promoInterview_video_v1",

  // new interview drafts
  "promoDigitalInterviewDraft_v1",
  "promoOfflineInterviewDraft_v1",
  "promoVideoInterviewDraft_v1",

  // 통합 인터뷰(아이콘/누끼/스테이징컷/포스터)
  "promoInterviewDraft_icon_v1",
  "promoInterviewResult_icon_v1",
  "promo_icon_v1",

  "promoInterviewDraft_aicut_v1",
  "promoInterviewResult_aicut_v1",
  "promo_aicut_v1",

  "promoInterviewDraft_staging_v1",
  "promoInterviewResult_staging_v1",
  "promo_staging_v1",

  "promoInterviewDraft_poster_v1",
  "promoInterviewResult_poster_v1",
  "promo_poster_v1",

  // ---------------- 투자 게시판(작성중 draft) ----------------
  "investmentPostDraft",
];
