// src/App.jsx
import { lazy, Suspense, useEffect, useRef } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import FindID from "./pages/FindID.jsx";
import FindPassword from "./pages/FindPassword.jsx";
import EasyLogin from "./pages/EasyLogin.jsx";

import {
  isBrandFlowRoute,
  isBrandWorkInProgress,
} from "./utils/brandPipelineStorage.js";
import { notifyPromoInterviewComingSoon } from "./utils/promoComingSoon.js";

// ✅ 무거운 라우트는 필요 시점에만 로드
const MainPage = lazy(() => import("./pages/MainPage.jsx"));

const DiagnosisInterview = lazy(() => import("./pages/DiagnosisInterview.jsx"));
const DiagnosisResult = lazy(() => import("./pages/DiagnosisResult.jsx"));

const BrandConsulting = lazy(() => import("./pages/BrandConsulting.jsx"));
const NamingConsultingInterview = lazy(
  () => import("./pages/NamingConsultingInterview.jsx"),
);
const LogoConsultingInterview = lazy(
  () => import("./pages/LogoConsultingInterview.jsx"),
);
const ConceptConsultingInterview = lazy(
  () => import("./pages/ConceptConsultingInterview.jsx"),
);
const BrandStoryConsultingInterview = lazy(
  () => import("./pages/BrandStoryConsultingInterview.jsx"),
);
const BrandConsultingResult = lazy(
  () => import("./pages/BrandConsultingResult.jsx"),
);
const BrandAllResults = lazy(() => import("./pages/BrandAllResults.jsx"));

const PromotionPage = lazy(() => import("./pages/Promotion.jsx"));
const PromotionResult = lazy(() => import("./pages/PromotionResult.jsx"));
const PromotionAllResults = lazy(() => import("./pages/PromotionAllResults.jsx"));

const MyPage = lazy(() => import("./pages/MyPage.jsx"));
const BrandReportDetail = lazy(() => import("./pages/BrandReportDetail.jsx"));
const PromoReportDetail = lazy(() => import("./pages/PromoReportDetail.jsx"));

const InvestmentBoard = lazy(() => import("./pages/InvestmentBoard.jsx"));
const InvestmentPostCreate = lazy(
  () => import("./pages/InvestmentPostCreate.jsx"),
);
const InvestmentPostDetail = lazy(
  () => import("./pages/InvestmentPostDetail.jsx"),
);
const InvestmentPostEdit = lazy(() => import("./pages/InvestmentPostEdit.jsx"));

const CurrentUserWidget = lazy(() => import("./components/CurrentUserWidget.jsx"));

function PromoInterviewBlocked() {
  const navigate = useNavigate();

  useEffect(() => {
    notifyPromoInterviewComingSoon();
    navigate("/promotion", { replace: true });
  }, [navigate]);

  return null;
}

function withSuspense(element) {
  return <Suspense fallback={null}>{element}</Suspense>;
}

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const prevPathRef = useRef(pathname);

  // ✅ 브랜드 컨설팅(네이밍~로고) 진행 중 이탈 방지
  // - 새로고침은 허용(진행 데이터 유지)
  // - 단계 중 '뒤로가기/다른 메뉴 이동'만 경고/차단(취소 시 원래 단계로 복귀)
  useEffect(() => {
    const prev = prevPathRef.current;
    if (prev === pathname) return;

    const leavingFlow = isBrandFlowRoute(prev) && !isBrandFlowRoute(pathname);

    if (leavingFlow && isBrandWorkInProgress()) {
      const ok = window.confirm(
        "브랜드 컨설팅이 진행 중입니다.\n\n지금 나가도 진행 내용(brandId/단계/작성 중 입력/선택 결과)은 저장되어 있어요.\n다시 들어오면 ‘이어하기’로 계속 진행할 수 있습니다.\n\n정말 나가시겠어요?",
      );

      if (!ok) {
        // ✅ 즉시 원래 단계로 복귀(이탈 취소)
        navigate(prev, { replace: true });
        return;
      }
    }

    prevPathRef.current = pathname;
  }, [pathname, navigate]);

  // ✅ 로그인/회원가입 관련 페이지에서는 숨김
  const hideWidgetPaths = [
    "/",
    "/login",
    "/signup",
    "/findid",
    "/findpw",
    "/easylogin",
  ];
  const shouldHideUserWidget = hideWidgetPaths.includes(pathname);

  return (
    <>
      <Routes>
        {/* ✅ 기본 진입: 로그인 */}
        <Route path="/" element={<Login />} />

        {/* ✅ 로그인/계정 */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/findid" element={<FindID />} />
        <Route path="/findpw" element={<FindPassword />} />
        <Route path="/easylogin" element={<EasyLogin />} />

        {/* ✅ 메인 */}
        <Route path="/main" element={withSuspense(<MainPage />)} />

        {/* ✅ 기업 진단 */}
        <Route
          path="/diagnosis"
          element={<Navigate to="/brandconsulting" replace />}
        />
        <Route
          path="/diagnosisinterview"
          element={withSuspense(<DiagnosisInterview />)}
        />
        {/* ✅ alias (레거시 경로 대응) */}
        <Route
          path="/diagnosis/interview"
          element={<Navigate to="/diagnosisinterview" replace />}
        />
        <Route
          path="/diagnosis/result"
          element={withSuspense(<DiagnosisResult />)}
        />
        <Route
          path="/diagnosisresult"
          element={<Navigate to="/diagnosis/result" replace />}
        />

        {/* ✅ 브랜드 컨설팅 메인 */}
        <Route
          path="/brandconsulting"
          element={withSuspense(<BrandConsulting />)}
        />

        {/* ✅ 브랜드 컨설팅 인터뷰(권장 표준 라우트) */}
        <Route
          path="/brand/naming/interview"
          element={withSuspense(<NamingConsultingInterview />)}
        />
        <Route
          path="/brand/concept/interview"
          element={withSuspense(<ConceptConsultingInterview />)}
        />
        <Route
          path="/brand/story"
          element={withSuspense(<BrandStoryConsultingInterview />)}
        />
        <Route
          path="/brand/story/interview"
          element={withSuspense(<BrandStoryConsultingInterview />)}
        />
        {/* ✅ alias */}
        <Route
          path="/brand/logo/interview"
          element={withSuspense(<LogoConsultingInterview />)}
        />

        {/* ✅ 기존 라우트(alias) 유지 */}
        <Route
          path="/nameconsulting"
          element={withSuspense(<NamingConsultingInterview />)}
        />
        <Route
          path="/namingconsulting"
          element={withSuspense(<NamingConsultingInterview />)}
        />
        <Route
          path="/conceptconsulting"
          element={withSuspense(<ConceptConsultingInterview />)}
        />
        <Route
          path="/homepageconsulting"
          element={withSuspense(<ConceptConsultingInterview />)}
        />
        <Route
          path="/brand/homepage/interview"
          element={withSuspense(<ConceptConsultingInterview />)}
        />
        {/* legacy */}
        <Route
          path="/brandstoryconsulting"
          element={withSuspense(<BrandStoryConsultingInterview />)}
        />
        <Route
          path="/logoconsulting"
          element={withSuspense(<LogoConsultingInterview />)}
        />

        {/* ✅ 브랜드/홍보물 결과 단일 페이지 */}
        <Route
          path="/brand/result"
          element={withSuspense(<BrandConsultingResult />)}
        />
        <Route
          path="/promotion/result"
          element={withSuspense(<PromotionResult />)}
        />

        {/* ✅ 통합 결과 페이지 */}
        <Route
          path="/mypage/brand-results"
          element={withSuspense(<BrandAllResults />)}
        />
        <Route
          path="/mypage/promotion-results"
          element={withSuspense(<PromotionAllResults />)}
        />

        {/* ✅ 홍보물 컨설팅 */}
        <Route path="/promotion" element={withSuspense(<PromotionPage />)} />
        <Route
          path="/promotion/icon/interview"
          element={<PromoInterviewBlocked />}
        />
        <Route
          path="/promotion/aicut/interview"
          element={<PromoInterviewBlocked />}
        />
        <Route
          path="/promotion/staging/interview"
          element={<PromoInterviewBlocked />}
        />
        <Route
          path="/promotion/poster/interview"
          element={<PromoInterviewBlocked />}
        />

        {/* ✅ 마이페이지 */}
        <Route path="/mypage" element={withSuspense(<MyPage />)} />
        <Route
          path="/mypage/brand-report/:id"
          element={withSuspense(<BrandReportDetail />)}
        />
        <Route
          path="/mypage/promo-report/:id"
          element={withSuspense(<PromoReportDetail />)}
        />

        {/* ✅ 투자 라운지 */}
        <Route
          path="/investment"
          element={withSuspense(<InvestmentBoard />)}
        />
        <Route
          path="/investment/new"
          element={withSuspense(<InvestmentPostCreate />)}
        />
        <Route
          path="/investment/:id"
          element={withSuspense(<InvestmentPostDetail />)}
        />
        <Route
          path="/investment/edit/:id"
          element={withSuspense(<InvestmentPostEdit />)}
        />

        {/* ✅ 없는 경로는 메인으로 */}
        <Route path="*" element={<Navigate to="/main" replace />} />
      </Routes>

      {/* ✅ 우측 하단 유저 위젯(현재 로그인 계정) */}
      {!shouldHideUserWidget && withSuspense(<CurrentUserWidget />)}
    </>
  );
}
