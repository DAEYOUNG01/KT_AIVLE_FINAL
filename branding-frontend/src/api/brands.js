// // src/api/brands.js
// // 이름은 브랜드라 했지만 기업진단&인터뷰 부분이며 백과 연동하기 위한 새로 만든 파일
// // ✅ axios 기반 공용 클라이언트 사용(프로젝트 전반과 통일)
// import { apiRequest } from "./client.js";

// export function submitBrandInterview(payload) {
//   // 백엔드: POST /brands/interview (JWT 필요)
//   return apiRequest("/brands/interview", {
//     method: "POST",
//     data: payload,
//   });
// }

// src/api/brands.js
// 이름은 브랜드라 했지만 기업진단&인터뷰 부분이며 백과 연동하기 위한 새로 만든 파일
// ✅ axios 기반 공용 클라이언트 사용(프로젝트 전반과 통일)
import { apiRequestAI } from "./client.js";

export function submitBrandInterview(payload) {
  // 백엔드: POST /brands/interview (JWT 필요)
  return apiRequestAI("/brands/interview", {
    method: "POST",
    data: payload,
  });
}
