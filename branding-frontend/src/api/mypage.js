// src/api/mypage.js
// ✅ axios 기반 공용 클라이언트 사용(프로젝트 전반과 통일)
import { apiRequest } from "./client.js";

/**
 * ✅ 마이페이지 - 내 브랜드 목록 조회
 * 백엔드: GET /mypage/brands (JWT 필요)
 * 응답 예시(BrandListResponseDto):
 * [
 *   { brandId, brandName, logoUrl, concept, story, currentStep, createdAt }
 * ]
 */
export function fetchMyBrands() {
  return apiRequest("/mypage/brands", { method: "GET" });
}

/**
 * ✅ (선택) 마이페이지 - 브랜드 삭제
 * - 백엔드에 DELETE API가 이미 있을 경우 사용됩니다.
 * - 현재 백엔드에 없을 수 있으니, 프론트에서는 실패해도 "목록 숨김"으로 폴백 처리합니다.
 */
export function deleteMyBrand(brandId) {
  // ✅ 백엔드 구현: POST /mypage/brands/{brandsId}
  // (MyPageController.deleteBrand)
  return apiRequest(`/mypage/brands/${brandId}`, {
    method: "DELETE",
  });
}

function pickFirstString(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "";
}

function readLogoUrlFromDto(dto) {
  const d = dto || {};
  // ✅ 백 DTO/필드명 차이 대비: 최대한 많은 후보를 확인
  return pickFirstString(
    d.logoUrl,
    d.logoURL,
    d.logoImageUrl,
    d.logo_image_url,
    d.selectedLogoUrl,
    d.selected_logo_url,
    d.selectedByUser,
    d.selected_by_user,
    d.thumbnailUrl,
    d.imageUrl,
    d.url,
    d.logo?.url,
    d.logo?.imageUrl,
    d.logo?.logoUrl,
    d.logo?.logoImageUrl,
    d.logo?.selectedLogoUrl,
    d.logo?.selectedByUser,
    d.snapshot?.selections?.logo?.imageUrl,
    d.snapshot?.selections?.logo?.url,
    d.snapshot?.selections?.logo?.selectedLogoUrl,
    d.snapshot?.selections?.logo?.selectedByUser,
    d.selections?.logo?.imageUrl,
    d.selections?.logo?.url,
    d.selections?.logo?.selectedLogoUrl,
    d.selections?.logo?.selectedByUser,
  );
}

function readConceptTextFromDto(dto) {
  const d = dto || {};
  return pickFirstString(
    d.concept,
    d.conceptText,
    d.conceptSummary,
    d.brandConcept,
    d.snapshot?.concept?.content,
    d.snapshot?.selections?.concept?.content,
    d.snapshot?.selections?.concept?.text,
    d.selections?.concept?.content,
    d.selections?.concept?.text,
  );
}

function readStoryTextFromDto(dto) {
  const d = dto || {};
  return pickFirstString(
    d.story,
    d.storyText,
    d.storySummary,
    d.brandStory,
    d.snapshot?.story?.content,
    d.snapshot?.selections?.story?.content,
    d.snapshot?.selections?.story?.text,
    d.selections?.story?.content,
    d.selections?.story?.text,
  );
}

/**
 * ✅ 백 응답(dto)을 마이페이지 카드(UI)용 객체로 정규화
 */
export function mapBrandDtoToReport(dto) {
  const id = String(dto?.brandId ?? "");
  const brandName = String(dto?.brandName ?? "").trim() || "브랜드";

  const concept = readConceptTextFromDto(dto);
  const story = readStoryTextFromDto(dto);
  const logoUrl = readLogoUrlFromDto(dto);

  const step = String(dto?.currentStep ?? "")
    .trim()
    .toUpperCase();

  const stepToPct = (s) => {
    switch (s) {
      case "INTERVIEW":
        return 0;
      case "NAMING":
        return 25;
      case "CONCEPT":
        return 50;
      case "STORY":
        return 75;
      case "LOGO":
        return 90;
      case "FINAL":
        return 100;
      default:
        return 0;
    }
  };

  // ✅ 카드에 한줄 소개가 필요하면: concept → story 순으로 짧게 사용
  const oneLine = (concept || story || "").trim();

  return {
    id,
    kind: "brand",
    serviceLabel: "브랜드 컨설팅",
    title: brandName,
    subtitle: "",
    createdAt: dto?.createdAt || null,
    progressPercent: stepToPct(step),
    isComplete: step === "FINAL",
    backendStep: step,
    snapshot: {
      diagnosisSummary: {
        companyName: brandName,
        oneLine,
      },
      selections: {
        naming: { name: brandName },
        concept: { content: concept },
        story: { content: story },
        logo: { imageUrl: logoUrl },
      },
    },
    _raw: dto,
  };
}
