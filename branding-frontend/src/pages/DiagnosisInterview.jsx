// src/pages/DiagnosisInterview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";

import { apiRequest } from "../api/client.js";
import { userGetItem, userSetItem } from "../utils/userLocalStorage.js";

import {
  abortBrandFlow,
  upsertPipeline,
  resetBrandConsultingToDiagnosisStart,
} from "../utils/brandPipelineStorage.js";
import "../styles/DiagnosisInterview.css";
import "../styles/ConsultingUnifiedTheme.css";

const STORAGE_KEY = "diagnosisInterviewDraft_v1";
const HOME_SUMMARY_KEY = "diagnosisDraft";
const DIAGNOSIS_RESULT_KEY = "diagnosisResult_v1";

const STEP_1 = {
  title: "Identity & Foundation",
  description: "브랜드의 본질과 기반을 정의합니다",
  questions: [
    {
      id: "s1_one_line_definition",
      category: "Identity",
      question_text:
        "우리 서비스를 전혀 모르는 10살 조카에게 설명한다고 가정하고, 한 문장으로 서비스를 정의해주세요.",
      question_type: "short_answer",
      placeholder:
        "예: 바쁜 사람들이 5분 만에 건강한 식사를 주문할 수 있게 도와주는 앱이야",
      required: true,
      context_key: "service_definition",
    },
    {
      id: "s1_core_problem",
      category: "Problem Solving",
      question_text:
        "고객이 우리 서비스를 쓰지 않을 때 겪는 가장 고통스러운 문제점은 무엇인가요?",
      question_type: "long_answer",
      placeholder: "구체적인 상황과 감정을 포함해서 작성해주세요",
      required: true,
      context_key: "pain_point",
    },
    {
      id: "s1_target_persona",
      category: "Target",
      question_text: "우리 서비스의 '찐팬'이 될 핵심 고객층은 누구인가요?",
      question_type: "single_choice",
      options: [
        {
          id: "opt_2030_trendsetter",
          text: "새로운 것을 먼저 시도하는 2030 얼리어답터",
          value: "2030 Early Adopter",
          description: "트렌드에 민감하고 SNS 활동이 활발한 젊은 층",
        },
        {
          id: "opt_3040_worker",
          text: "효율을 중시하는 3040 직장인",
          value: "3040 Efficiency Seeker",
          description: "시간이 부족하고 실용성을 중요시하는 워킹맘/워킹대디",
        },
        {
          id: "opt_professional",
          text: "전문성을 추구하는 프리랜서/전문직",
          value: "Professional/Freelancer",
          description: "개인 브랜드와 전문성이 중요한 독립적인 워커",
        },
        {
          id: "opt_student",
          text: "자기계발에 진지한 대학생/취준생",
          value: "Self-improving Student",
          description: "미래를 준비하고 스펙을 쌓는 데 집중하는 청년층",
        },
        {
          id: "opt_senior",
          text: "새로운 도전을 시작하는 시니어",
          value: "Active Senior",
          description:
            "은퇴 후 제2의 인생이나 취미 활동을 적극적으로 추구하는 중장년층",
        },
        {
          id: "opt_other",
          text: "기타",
          value: "Other",
          has_text_input: true,
          text_input_placeholder: "구체적인 고객 페르소나를 설명해주세요",
        },
      ],
      required: true,
      context_key: "target_persona",
    },
    {
      id: "s1_current_alternatives",
      category: "Competition",
      question_text:
        "고객들이 현재 우리 서비스를 사용하지 않을 때 대신 사용하고 있는 대안(경쟁사, 다른 방법)은 무엇인가요?",
      question_type: "long_answer",
      placeholder: "예: 수기로 엑셀 관리, 경쟁사 A 서비스, 아예 하지 않음 등",
      required: true,
      context_key: "current_alternatives",
    },
    {
      id: "s1_differentiation",
      category: "Key Strengths",
      question_text:
        "경쟁사가 절대 따라 할 수 없는 우리 서비스만의 '무기'는 무엇인가요?",
      question_type: "long_answer",
      placeholder:
        "기술력, 데이터, 네트워크, 창업자 경험 등 구체적으로 작성해주세요",
      required: false,
      context_key: "usp",
    },
    {
      id: "s1_industry",
      category: "Market",
      question_text: "비즈니스가 속한 산업군은 어디인가요?",
      question_type: "single_choice",
      options: [
        {
          id: "opt_saas",
          text: "SaaS/B2B 플랫폼",
          value: "SaaS/B2B Platform",
          description: "기업용 소프트웨어, 업무 도구",
        },
        {
          id: "opt_commerce",
          text: "이커머스/리테일",
          value: "E-commerce/Retail",
          description: "온라인 쇼핑, 판매 플랫폼",
        },
        {
          id: "opt_fintech",
          text: "핀테크/금융",
          value: "Fintech/Finance",
          description: "결제, 투자, 대출, 자산관리",
        },
        {
          id: "opt_health",
          text: "헬스케어/웰니스",
          value: "Healthcare/Wellness",
          description: "건강, 의료, 피트니스",
        },
        {
          id: "opt_edu",
          text: "에듀테크/교육",
          value: "Edutech/Education",
          description: "온라인 교육, 학습 플랫폼",
        },
        {
          id: "opt_contents",
          text: "콘텐츠/미디어",
          value: "Contents/Media",
          description: "OTT, 음악, 웹툰, 뉴스",
        },
        {
          id: "opt_social",
          text: "소셜/커뮤니티",
          value: "Social/Community",
          description: "SNS, 커뮤니케이션, 네트워킹",
        },
        {
          id: "opt_mobility",
          text: "모빌리티/물류",
          value: "Mobility/Logistics",
          description: "배달, 운송, 차량 공유",
        },
        {
          id: "opt_proptech",
          text: "프롭테크/부동산",
          value: "Proptech/Real Estate",
          description: "부동산 중개, 임대, 관리",
        },
        {
          id: "opt_other",
          text: "기타",
          value: "Other",
          has_text_input: true,
          text_input_placeholder: "산업군을 직접 입력해주세요",
        },
      ],
      required: true,
      context_key: "industry",
    },
    {
      id: "s1_vision",
      category: "Vision",
      question_text:
        "5년 뒤, 우리 회사가 뉴스 헤드라인에 나온다면 어떤 제목일까요?",
      question_type: "short_answer",
      placeholder:
        "예: 'OO, 국내 1위 배달 플랫폼 등극', 'OO 서비스, 500만 사용자 돌파'",
      required: true,
      context_key: "vision_headline",
    },
    {
      id: "s1_revenue_model",
      category: "Revenue Model",
      question_text: "주요 수익 모델은 무엇인가요?",
      question_type: "single_choice",
      options: [
        {
          id: "opt_subscription",
          text: "구독",
          value: "Subscription",
          description: "정기적인 구독료",
        },
        {
          id: "opt_advertising",
          text: "광고",
          value: "Advertising",
          description: "광고 수익",
        },
        {
          id: "opt_commission",
          text: "수수료",
          value: "Commission",
          description: "거래 수수료",
        },
        {
          id: "opt_sales",
          text: "판매",
          value: "Sales",
          description: "제품 판매",
        },
        {
          id: "opt_other",
          text: "기타",
          value: "Other",
          has_text_input: true,
          text_input_placeholder: "수익 모델을 직접 입력해주세요",
        },
      ],
      required: true,
      context_key: "revenue_model",
    },
    {
      id: "s1_brand_priority",
      category: "Brand Goal",
      question_text:
        "향후 6~12개월 동안 브랜드가 가장 집중해야 할 목표는 무엇인가요? (최대 2개 선택)",
      question_type: "multiple_choice",
      options: [
        {
          id: "opt_brand_awareness",
          text: "브랜드 인지도",
          value: "Brand Awareness",
          description: "더 많은 사람들이 우리 브랜드를 알게 하기",
        },
        {
          id: "opt_customer_acquisition",
          text: "고객 확보",
          value: "Customer Acquisition",
          description: "신규 고객 수 증가",
        },
        {
          id: "opt_customer_retention",
          text: "유료 전환율 상승",
          value: "Conversion Rate Improvement",
          description: "무료 사용자를 유료 고객으로 전환",
        },
        {
          id: "opt_investment_attraction",
          text: "투자 유치",
          value: "Investment Attraction",
          description: "외부 투자 유치 및 펀딩",
        },
        {
          id: "opt_other",
          text: "기타",
          value: "Other",
          has_text_input: true,
          text_input_placeholder: "브랜드 목표를 직접 입력해주세요",
        },
      ],
      required: true,
      context_key: "brand_priority",
      max_select: 2,
    },
  ],
};

const SECTION_DESCRIPTIONS = {
  Identity: "우리 서비스가 무엇인지 가장 쉽게 설명합니다.",
  "Problem Solving": "고객이 실제로 겪는 문제와 불편함을 정의합니다.",
  Target: "우리 서비스를 가장 좋아할 핵심 고객을 정리합니다.",
  Competition: "고객이 우리 대신 선택하는 대안을 살펴봅니다.",
  Differentiation: "우리 서비스만의 결정적인 강점을 정리합니다.",
  Market: "우리가 경쟁하는 시장과 산업을 정의합니다.",
  Vision: "브랜드가 앞으로 나아갈 방향을 그려봅니다.",
  "Revenue Model": "비즈니스가 수익을 만드는 구조를 정리합니다.",
  "Brand Goal": "향후 브랜드가 집중해야 할 목표를 설정합니다.",
};

const getLabelByValue = (value, options) => {
  const v = String(value ?? "").trim();
  if (!v) return "";
  return options?.find((o) => o.value === v)?.text || v;
};

export default function DiagnosisInterview({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [openType, setOpenType] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  const closeModal = () => setOpenType(null);

  const [form, setForm] = useState({
    companyName: "",
    website: "",
  });

  const [saveMsg, setSaveMsg] = useState("");
  const [lastSaved, setLastSaved] = useState("-");
  const [loaded, setLoaded] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitOnceRef = useRef(false);
  const MIN_AI_LOADING_MS = 1500;

  const waitForMinAiLoading = async (startedAt) => {
    if (!startedAt) return;
    const elapsed = Date.now() - startedAt;
    const remaining = MIN_AI_LOADING_MS - elapsed;
    if (remaining > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, remaining));
    }
  };

  const TOAST_DURATION = 3200;
  const EMPTY_TOAST = {
    show: false,
    icon: "",
    title: "",
    msg: "",
    variant: "success",
  };
  const [toast, setToast] = useState(EMPTY_TOAST);
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [resultNavigateState, setResultNavigateState] = useState(null);
  const toastTimerRef = useRef(null);
  const didMountRef = useRef(false);
  const prevCanAnalyzeRef = useRef(false);

  const refBasic = useRef(null);

  const categoriesOrdered = useMemo(() => {
    const arr = [];
    STEP_1.questions.forEach((q) => {
      const key = q.category || "기타";
      if (!arr.includes(key)) arr.push(key);
    });
    return arr;
  }, []);

  const categoryRefs = useMemo(() => {
    const map = {};
    categoriesOrdered.forEach((cat) => {
      map[cat] = React.createRef();
    });
    return map;
  }, [categoriesOrdered]);

  const setValue = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const getValue = (key) => form?.[key];
  const otherKeyOf = (contextKey) => `${contextKey}__other`;
  const hasText = (v) => Boolean(String(v ?? "").trim());

  const questionsByCategory = useMemo(() => {
    const grouped = {};
    STEP_1.questions.forEach((q) => {
      const cat = q.category || "기타";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(q);
    });
    return grouped;
  }, []);

  const resolveAnswerForSend = (q) => {
    const ck = q.context_key;
    const base = getValue(ck);

    if (q.question_type === "multiple_choice") {
      const arr = Array.isArray(base) ? base : [];
      const resolved = arr
        .map((val) => {
          if (val !== "Other") return val;
          return String(getValue(otherKeyOf(ck)) || "").trim();
        })
        .filter(Boolean);
      return resolved;
    }

    if (q.question_type === "single_choice") {
      const v = String(base ?? "").trim();
      if (!v) return "";
      if (v !== "Other") return v;
      return String(getValue(otherKeyOf(ck)) || "").trim();
    }

    return String(base ?? "").trim();
  };

  const requiredKeys = useMemo(() => {
    const keys = [];
    STEP_1.questions.forEach((q) => {
      if (q.required) keys.push(q.context_key);
    });
    return keys;
  }, []);

  const requiredItems = useMemo(
    () =>
      STEP_1.questions
        .filter((q) => q.required)
        .map((q) => ({
          key: q.context_key,
          label: q.category || q.question_text || q.context_key,
        })),
    [],
  );

  const requiredStatus = useMemo(() => {
    const status = {};

    STEP_1.questions.forEach((q) => {
      if (!q.required) return;

      const ck = q.context_key;
      const raw = getValue(ck);

      if (q.question_type === "multiple_choice") {
        const arr = Array.isArray(raw) ? raw : [];
        if (!arr.length) {
          status[ck] = false;
          return;
        }
        if (arr.includes("Other") && !hasText(getValue(otherKeyOf(ck)))) {
          status[ck] = false;
          return;
        }
        status[ck] = true;
        return;
      }

      if (q.question_type === "single_choice") {
        const v = String(raw ?? "").trim();
        if (!v) {
          status[ck] = false;
          return;
        }
        if (v === "Other" && !hasText(getValue(otherKeyOf(ck)))) {
          status[ck] = false;
          return;
        }
        status[ck] = true;
        return;
      }

      status[ck] = hasText(raw);
    });

    return status;
  }, [form]);

  const completedRequired = useMemo(
    () => requiredKeys.filter((k) => Boolean(requiredStatus[k])).length,
    [requiredKeys, requiredStatus],
  );

  const progress = useMemo(() => {
    if (requiredKeys.length === 0) return 0;
    return Math.round((completedRequired / requiredKeys.length) * 100);
  }, [completedRequired, requiredKeys.length]);

  const canAnalyze = completedRequired === requiredKeys.length;
  const remainingRequired = Math.max(
    requiredKeys.length - completedRequired,
    0,
  );

  const currentSectionLabel = useMemo(() => {
    for (const q of STEP_1.questions) {
      if (q.required && !requiredStatus[q.context_key]) {
        return q.category || "진행 중";
      }
    }
    return "완료";
  }, [requiredStatus]);

  const scrollToSection = (ref) => {
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToRequiredField = (contextKey) => {
    const target = STEP_1.questions.find((q) => q.context_key === contextKey);
    if (!target) return;
    const cat = target.category || "기타";
    scrollToSection(categoryRefs[cat] || refBasic);
  };

  const showToast = (payload) => {
    const isString = typeof payload === "string";
    const text = isString
      ? String(payload || "").trim()
      : String(payload?.msg || "").trim();
    if (!text) return;

    const variantFromText = /^\s*(⚠️|❌)/.test(text) ? "warn" : "success";
    const variant = isString
      ? variantFromText
      : payload?.variant || variantFromText;
    const icon = isString
      ? variant === "warn"
        ? "⚠️"
        : "✅"
      : payload?.icon || (variant === "warn" ? "⚠️" : "✅");
    const title = isString
      ? variant === "warn"
        ? "요청 실패"
        : "알림"
      : String(payload?.title || (variant === "warn" ? "요청 실패" : "알림"));

    setToast({
      show: true,
      icon,
      title,
      msg: text,
      variant,
    });

    try {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, TOAST_DURATION);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    return () => {
      try {
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (!isSubmitting) {
      setLoadingElapsed(0);
      return;
    }

    const startedAt = Date.now();
    setLoadingElapsed(0);

    const timer = window.setInterval(() => {
      setLoadingElapsed((Date.now() - startedAt) / 1000);
    }, 100);

    return () => {
      window.clearInterval(timer);
    };
  }, [isSubmitting]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      prevCanAnalyzeRef.current = canAnalyze;
      return;
    }

    if (!prevCanAnalyzeRef.current && canAnalyze) {
      showToast({
        icon: "✅",
        title: "필수 입력 완료",
        msg: "모든 필수 입력이 완료됐어요. 이제 AI 요약 분석 요청 버튼을 눌러주세요.",
        variant: "success",
      });
    }

    prevCanAnalyzeRef.current = canAnalyze;
  }, [canAnalyze]);

  const getFirstIncompleteRef = () => {
    for (const q of STEP_1.questions) {
      if (q.required && !requiredStatus[q.context_key]) {
        const cat = q.category || "기타";
        return categoryRefs[cat] || refBasic;
      }
    }
    const lastCat = categoriesOrdered[categoriesOrdered.length - 1];
    return categoryRefs[lastCat] || refBasic;
  };

  const sections = useMemo(() => {
    const items = [{ id: "basic", label: "기본 정보(선택)", ref: refBasic }];
    categoriesOrdered.forEach((cat, idx) => {
      items.push({
        id: `cat_${cat}`,
        label: `${idx + 1}. ${cat}`,
        ref: categoryRefs[cat],
      });
    });
    return items;
  }, [categoriesOrdered, categoryRefs]);

  const saveHomeSummary = (updatedAtTs) => {
    try {
      const summary = {
        progress,
        completedRequired,
        requiredTotal: requiredKeys.length,
        stageLabel: currentSectionLabel,
        updatedAt: updatedAtTs,
      };
      userSetItem(HOME_SUMMARY_KEY, JSON.stringify(summary));
    } catch {
      return;
    }
  };

  useEffect(() => {
    const mode = location.state?.mode;

    if (mode === "start") {
      resetBrandConsultingToDiagnosisStart("start_new");
      setForm({ companyName: "", website: "" });
      setLastSaved("");
      setSaveMsg("");
      setLoaded(true);
      return;
    }

    try {
      const raw = userGetItem(STORAGE_KEY);
      if (!raw) {
        setLoaded(true);
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed?.form) setForm((prev) => ({ ...prev, ...parsed.form }));

      if (parsed?.updatedAt) {
        const d = new Date(parsed.updatedAt);
        if (!Number.isNaN(d.getTime())) setLastSaved(d.toLocaleString());
      }
    } catch {
      return;
    } finally {
      setLoaded(true);
    }
  }, [location.state?.mode]);

  useEffect(() => {
    if (!loaded) return;
    const mode = location.state?.mode;
    if (mode !== "resume") return;

    const t = setTimeout(() => {
      scrollToSection(getFirstIncompleteRef());
    }, 60);

    return () => clearTimeout(t);
  }, [loaded, location.state?.mode]);

  useEffect(() => {
    if (!loaded) return;
    setSaveMsg("");

    const t = setTimeout(() => {
      try {
        const payload = { form, updatedAt: Date.now() };
        userSetItem(STORAGE_KEY, JSON.stringify(payload));
        setLastSaved(new Date(payload.updatedAt).toLocaleString());
        setSaveMsg("자동 저장됨");
        saveHomeSummary(payload.updatedAt);
      } catch {
        return;
      }
    }, 600);

    return () => clearTimeout(t);
  }, [
    form,
    loaded,
    progress,
    completedRequired,
    requiredKeys.length,
    currentSectionLabel,
  ]);

  const toggleMulti = (contextKey, value, maxSelect = 2) => {
    setForm((prev) => {
      const cur = Array.isArray(prev[contextKey]) ? prev[contextKey] : [];
      const exists = cur.includes(value);

      if (exists) {
        const next = cur.filter((v) => v !== value);
        return { ...prev, [contextKey]: next };
      }

      if (cur.length >= maxSelect) return prev;
      return { ...prev, [contextKey]: [...cur, value] };
    });
  };

  const buildQaMap = () => {
    const qa = {
      "회사/프로젝트명(선택)": String(form.companyName || "").trim(),
      "웹사이트/소개 링크 (선택)": String(form.website || "").trim(),
    };

    STEP_1.questions.forEach((q) => {
      const ans = resolveAnswerForSend(q);
      if (q.question_type === "multiple_choice") {
        qa[q.question_text] = Array.isArray(ans) ? ans.join(", ") : "";
      } else {
        qa[q.question_text] = String(ans ?? "").trim();
      }
    });

    return qa;
  };

  const buildRawQaFields = () => {
    const fields = {
      company_name: String(form.companyName || "").trim(),
      website: String(form.website || "").trim(),
    };

    STEP_1.questions.forEach((q) => {
      const ck = q.context_key;
      const ans = resolveAnswerForSend(q);
      fields[ck] = ans;
    });

    return fields;
  };

  const toValidBrandId = (v) => {
    if (v == null) return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    const s = String(v).trim();
    if (!s) return null;
    if (/^\d+$/.test(s)) return Number(s);
    return s;
  };

  const pickBrandId = (data) => {
    const d = data || {};
    const candidates = [
      d.brandId,
      d.brand_id,
      d.id,
      d?.data?.brandId,
      d?.data?.brand_id,
      d?.interviewReport?.brandId,
      d?.interviewReport?.brand_id,
      d?.interviewReport?.id,
      d?.report?.brandId,
      d?.report?.brand_id,
      d?.report?.id,
    ];
    for (const c of candidates) {
      const bid = toValidBrandId(c);
      if (bid != null) return bid;
    }
    return null;
  };

  const asMultilineText = (v) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) {
      const arr = v.map((x) => String(x ?? "").trim()).filter(Boolean);
      return arr.length ? arr.map((t) => `- ${t}`).join("\n") : "";
    }
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  };

  const buildFoundationSummary = () => {
    const oneLine = String(form.service_definition || "").trim();
    const personaQ = STEP_1.questions.find(
      (q) => q.context_key === "target_persona",
    );
    const industryQ = STEP_1.questions.find(
      (q) => q.context_key === "industry",
    );

    const personaValue = String(resolveAnswerForSend(personaQ) || "").trim();
    const industryValue = String(resolveAnswerForSend(industryQ) || "").trim();

    const personaLabel = personaQ?.options
      ? getLabelByValue(personaValue, personaQ.options)
      : personaValue;

    const industryLabel = industryQ?.options
      ? getLabelByValue(industryValue, industryQ.options)
      : industryValue;

    const parts = [
      oneLine ? `정의: ${oneLine}` : null,
      personaLabel ? `타겟: ${personaLabel}` : null,
      industryLabel ? `산업: ${industryLabel}` : null,
    ].filter(Boolean);

    return parts.join(" | ");
  };

  const isQuestionCompleted = (q) => {
    if (!q || typeof q !== "object") return false;

    const ck = q.context_key;
    if (!ck) return false;

    const otherKey = otherKeyOf(ck);
    const value = getValue(ck);

    if (
      q.question_type === "short_answer" ||
      q.question_type === "long_answer"
    ) {
      return hasText(value);
    }

    if (q.question_type === "single_choice") {
      const selected = String(value ?? "").trim();
      if (!selected) return false;

      const selectedOpt = (q.options || []).find((o) => o.value === selected);
      if (selected === "Other" && selectedOpt?.has_text_input) {
        return hasText(getValue(otherKey));
      }
      return true;
    }

    if (q.question_type === "multiple_choice") {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) return false;
      if (arr.includes("Other")) {
        return hasText(getValue(otherKey));
      }
      return true;
    }

    return hasText(value);
  };

  const renderQuestion = (q) => {
    const ck = q.context_key;
    const otherKey = otherKeyOf(ck);
    const value = getValue(ck);
    const isComplete = isQuestionCompleted(q);

    const label = (
      <label>
        {q.question_text} {q.required ? <span className="req">*</span> : null}
      </label>
    );

    if (q.question_type === "short_answer") {
      return (
        <div
          className={`field questionField ${isComplete ? "is-complete" : ""}`}
        >
          {label}
          <input
            value={String(value ?? "")}
            onChange={(e) => setValue(ck, e.target.value)}
            placeholder={q.placeholder || ""}
          />
        </div>
      );
    }

    if (q.question_type === "long_answer") {
      return (
        <div
          className={`field questionField ${isComplete ? "is-complete" : ""}`}
        >
          {label}
          <textarea
            value={String(value ?? "")}
            onChange={(e) => setValue(ck, e.target.value)}
            placeholder={q.placeholder || ""}
            rows={5}
          />
        </div>
      );
    }

    if (q.question_type === "single_choice") {
      const opts = q.options || [];
      const selected = String(value ?? "");

      const selectedOpt = opts.find((o) => o.value === selected);
      const needsOtherInput =
        selectedOpt?.has_text_input && selected === "Other";

      return (
        <div
          className={`field questionField ${isComplete ? "is-complete" : ""}`}
        >
          {label}

          <select
            value={selected}
            onChange={(e) => setValue(ck, e.target.value)}
          >
            <option value="">선택</option>
            {opts.map((opt) => (
              <option key={opt.id || opt.value} value={opt.value}>
                {opt.text}
              </option>
            ))}
          </select>

          {selectedOpt?.description ? (
            <p className="hint" style={{ marginTop: 8 }}>
              {selectedOpt.description}
            </p>
          ) : null}

          {needsOtherInput ? (
            <input
              style={{ marginTop: 10 }}
              value={String(getValue(otherKey) ?? "")}
              onChange={(e) => setValue(otherKey, e.target.value)}
              placeholder={
                selectedOpt.text_input_placeholder || "직접 입력해주세요"
              }
            />
          ) : null}
        </div>
      );
    }

    if (q.question_type === "multiple_choice") {
      const opts = q.options || [];
      const arr = Array.isArray(value) ? value : [];
      const maxSelect = Number(q.max_select || 2);

      const otherSelected = arr.includes("Other");
      const otherOpt = opts.find((o) => o.value === "Other");

      return (
        <div
          className={`field questionField ${isComplete ? "is-complete" : ""}`}
        >
          {label}

          <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
            {opts.map((opt) => {
              const checked = arr.includes(opt.value);
              const disableNew = !checked && arr.length >= maxSelect;

              return (
                <label
                  key={opt.id || opt.value}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "22px 1fr",
                    gap: 12,
                    alignItems: "start",
                    width: "100%",
                    cursor: disableNew ? "not-allowed" : "pointer",
                    opacity: disableNew ? 0.55 : 1,
                    textAlign: "left",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disableNew}
                    onChange={() => toggleMulti(ck, opt.value, maxSelect)}
                    style={{ marginTop: 3 }}
                  />

                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 600 }}>{opt.text}</div>
                    {opt.description ? (
                      <div style={{ opacity: 0.8, fontSize: 13 }}>
                        {opt.description}
                      </div>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>

          <p className="hint" style={{ marginTop: 10 }}>
            * 최대 {maxSelect}개까지 선택할 수 있어요.
          </p>

          {otherSelected ? (
            <input
              style={{ marginTop: 10 }}
              value={String(getValue(otherKey) ?? "")}
              onChange={(e) => setValue(otherKey, e.target.value)}
              placeholder={
                otherOpt?.text_input_placeholder || "직접 입력해주세요"
              }
            />
          ) : null}
        </div>
      );
    }

    return (
      <div className={`field questionField ${isComplete ? "is-complete" : ""}`}>
        <p className="hint">지원하지 않는 질문 타입: {q.question_type}</p>
      </div>
    );
  };

  const handleRequestAnalysis = async () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    if (!canAnalyze) {
      alert("필수 항목을 모두 입력하면 AI 요약 결과를 볼 수 있어요.");
      return;
    }
    if (isSubmitting) return;
    if (submitOnceRef.current) return;
    submitOnceRef.current = true;

    try {
      const payload = {
        progress,
        completedRequired,
        requiredTotal: requiredKeys.length,
        stageLabel: currentSectionLabel,
        updatedAt: Date.now(),
      };
      userSetItem(HOME_SUMMARY_KEY, JSON.stringify(payload));
    } catch {
      return;
    }

    setAnalysisReady(false);
    setResultNavigateState(null);
    setIsSubmitting(true);
    let requestStartedAt = null;

    try {
      const qa = buildQaMap();
      const raw_qa_fields = buildRawQaFields();

      const requestBody = {
        companyName: String(form.companyName || "").trim(),
        website: String(form.website || "").trim(),
        qa,
        raw_qa_fields,
      };

      requestStartedAt = Date.now();
      const responseData = await apiRequest("/brands/interview", {
        method: "POST",
        data: requestBody,
      });

      const res = responseData?.data ?? responseData;
      const extractedBrandId = pickBrandId(res);

      const interviewReport =
        res?.interviewReport ||
        res?.interview_report ||
        res?.report ||
        res?.data?.interviewReport ||
        {};

      const legacyUserResult =
        interviewReport?.user_result ||
        interviewReport?.userResult ||
        res?.user_result ||
        res?.userResult ||
        {};

      const resultPayload = {
        brandId: extractedBrandId,
        summary: asMultilineText(
          res?.summary ??
            interviewReport?.summary ??
            interviewReport?.Summary ??
            legacyUserResult?.summary,
        ),
        analysis: asMultilineText(
          res?.analysis ??
            interviewReport?.analysis ??
            legacyUserResult?.analysis,
        ),
        key_insights: asMultilineText(
          res?.key_insights ??
            interviewReport?.key_insights ??
            interviewReport?.keyInsights ??
            legacyUserResult?.key_insights ??
            legacyUserResult?.keyInsights,
        ),
        raw_qa: qa,
        raw_qa_fields,
        receivedAt: Date.now(),
        updatedAt: new Date().toISOString(),
        _source: "diagnosisInterview",
        _schema: "step_1_json_driven",
      };

      userSetItem(DIAGNOSIS_RESULT_KEY, JSON.stringify(resultPayload));

      abortBrandFlow("new_diagnosis");

      if (extractedBrandId != null) {
        let summaryStr = buildFoundationSummary();
        if (!String(summaryStr || "").trim()) {
          summaryStr = String(resultPayload.summary || "").trim();
        }
        if (!String(summaryStr || "").trim()) {
          summaryStr = "기업진단 완료";
        }

        upsertPipeline({
          brandId: extractedBrandId,
          diagnosisSummary: summaryStr,
        });
      } else {
        upsertPipeline({
          brandId: null,
          diagnosisSummary: null,
        });
        alert(
          "서버 응답에 brandId가 없어 다음 단계 진행이 불가능해요.\n결과는 표시되지만, 브랜드 컨설팅은 시작할 수 없습니다.",
        );
      }

      await waitForMinAiLoading(requestStartedAt);

      const nextState = {
        from: "diagnosisInterview",
        next: "/brandconsulting",
        brandId: extractedBrandId,
        report: resultPayload,
      };

      setResultNavigateState(nextState);
      setAnalysisReady(true);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      showToast({
        icon: "✅",
        title: "AI 분석 완료",
        msg: "AI 분석이 완료됐어요. 아래 결과 보기 버튼을 눌러 결과 페이지로 이동하세요.",
        variant: "success",
      });
    } catch (err) {
      const msg =
        err?.userMessage ||
        err?.response?.data?.message ||
        err?.message ||
        "요청 실패";
      await waitForMinAiLoading(requestStartedAt);
      showToast({
        icon: "⚠️",
        title: "AI 분석 실패",
        msg,
        variant: "warn",
      });
    } finally {
      setIsSubmitting(false);
      submitOnceRef.current = false;
    }
  };

  const handleGoToResult = () => {
    if (!analysisReady || !resultNavigateState) return;
    navigate("/diagnosis/result", { state: resultNavigateState });
  };

  return (
    <div className="diagInterview">
      <PolicyModal
        open={openType === "privacy"}
        title="개인정보 처리방침"
        onClose={closeModal}
      >
        <PrivacyContent />
      </PolicyModal>

      <PolicyModal
        open={openType === "terms"}
        title="이용약관"
        onClose={closeModal}
      >
        <TermsContent />
      </PolicyModal>

      <SiteHeader onLogout={onLogout} />

      <main className="diagInterview__main">
        <div className="diagInterview__container">
          <section className="diagInterviewHero" aria-label="인터뷰 안내 배너">
            <div className="diagInterviewHero__inner">
              <div className="diagInterviewHero__left">
                <h1 className="diagInterview__title">
                  초기 진단 인터뷰 (Foundation)
                </h1>
                <p className="diagInterview__sub">
                  AI 팀 질문지(JSON) 기준으로 자동 렌더링됩니다. 필수 입력을
                  완료하면 백엔드로 전송하고, “진단 결과” 페이지에서 결과를
                  보여줘요.
                </p>

                <div className="diagInterviewHero__chips">
                  <span className="diagInterviewHero__chip">
                    <b>진행률</b>
                    <span>{progress}%</span>
                  </span>
                  <span className="diagInterviewHero__chip">
                    <b>필수 완료</b>
                    <span>
                      {completedRequired}/{requiredKeys.length}
                    </span>
                  </span>
                  <span
                    className={`diagInterviewHero__chip state ${canAnalyze ? "ready" : "pending"}`}
                  >
                    {canAnalyze
                      ? "다음 진행 가능"
                      : `필수 ${remainingRequired}개 남음`}
                  </span>
                </div>
              </div>

              <div className="diagInterviewHero__right">
                <div
                  className={`diagInterviewHero__status ${canAnalyze ? "ready" : "pending"}`}
                >
                  <span
                    className="diagInterviewHero__statusDot"
                    aria-hidden="true"
                  />
                  <span>
                    {canAnalyze
                      ? "모든 필수 입력이 완료되었어요"
                      : `${currentSectionLabel} 섹션 작성 중`}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="diagInterview__grid">
            <section className="diagInterview__left">
              {categoriesOrdered.map((cat, idx) => (
                <div key={cat} className="card" ref={categoryRefs[cat]}>
                  <div className="card__head">
                    <h2>
                      {idx + 1}. {cat}
                    </h2>
                    <p>{SECTION_DESCRIPTIONS[cat]}</p>
                  </div>

                  {(questionsByCategory[cat] || []).map((q) => (
                    <div key={q.id} style={{ marginTop: 14 }}>
                      {renderQuestion(q)}
                    </div>
                  ))}
                </div>
              ))}
            </section>

            <aside className="diagInterview__right">
              <div className="sideCard">
                <div className="sideCard__titleRow">
                  <h3>진행 상태</h3>
                  <span className="badge">{progress}%</span>
                </div>

                <div
                  className="progressBar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className="progressBar__fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="sideMeta">
                  <div className="sideMeta__row">
                    <span className="k">현재 단계</span>
                    <span className="v">{currentSectionLabel}</span>
                  </div>
                  <div className="sideMeta__row">
                    <span className="k">필수 완료</span>
                    <span className="v">
                      {completedRequired}/{requiredKeys.length}
                    </span>
                  </div>
                  <div className="sideMeta__row">
                    <span className="k">마지막 저장</span>
                    <span className="v">{lastSaved}</span>
                  </div>
                </div>

                {saveMsg ? <p className="saveMsg">{saveMsg}</p> : null}

                <div className="divider" />

                <h4 className="sideSubTitle">필수 입력 체크</h4>
                <ul className="checkList checkList--cards">
                  {requiredItems.map((item) => {
                    const ok = Boolean(requiredStatus[item.key]);

                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          className={`checkItemBtn ${ok ? "ok" : "todo"}`}
                          onClick={() => scrollToRequiredField(item.key)}
                          aria-label={`${item.label} 항목으로 이동`}
                        >
                          <span className="checkItemLeft">
                            <span
                              className={`checkStateIcon ${ok ? "ok" : "todo"}`}
                              aria-hidden="true"
                            >
                              {ok ? "✅" : "❗"}
                            </span>
                            <span>{item.label}</span>
                          </span>
                          <span className="checkItemState">
                            {ok ? "완료" : "필수"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="button"
                  className={`btn primary sideAnalyze ${analysisReady || canAnalyze ? "ready" : "pending"}`}
                  onClick={
                    analysisReady ? handleGoToResult : handleRequestAnalysis
                  }
                  disabled={(!canAnalyze && !analysisReady) || isSubmitting}
                >
                  {isSubmitting
                    ? "AI 분석 중..."
                    : analysisReady
                      ? "결과 보기"
                      : canAnalyze
                        ? "AI 요약 분석 요청"
                        : `AI 요약 분석 요청 (${remainingRequired}개 남음)`}
                </button>

                <p
                  className={`hint sideActionHint ${analysisReady || canAnalyze ? "ready" : ""}`}
                >
                  {analysisReady
                    ? "AI 분석이 완료됐어요. 결과 보기 버튼을 눌러 결과 페이지로 이동하세요."
                    : canAnalyze
                      ? "모든 필수 입력이 완료됐어요. AI 요약 분석 요청을 눌러주세요."
                      : `필수 항목 ${remainingRequired}개를 모두 입력하면 AI 요약 분석 요청 버튼이 활성화돼요.`}
                </p>
              </div>
            </aside>
          </div>
          {isSubmitting ? (
            <div
              className="aiToast loading"
              role="status"
              aria-live="polite"
              aria-label="AI 진단 분석 진행 중"
            >
              <div className="aiToast__loadingWrap">
                <span className="aiToast__spinner" aria-hidden="true" />
                <strong>AI 분석 중</strong>
              </div>
              <p className="aiToast__timer">
                진행 시간 {loadingElapsed.toFixed(1)}초
              </p>
            </div>
          ) : toast?.show ? (
            <div
              className={`aiToast ${toast.variant}`}
              role="status"
              aria-live="polite"
            >
              <div className="aiToast__head">
                <span className="aiToast__icon" aria-hidden="true">
                  {toast.icon}
                </span>
                <strong>{toast.title}</strong>
              </div>
              <p className="aiToast__msg">{toast.msg}</p>
            </div>
          ) : null}
        </div>
      </main>

      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
