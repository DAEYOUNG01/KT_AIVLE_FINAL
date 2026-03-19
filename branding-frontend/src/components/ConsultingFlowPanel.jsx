import React, { useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "../styles/ConsultingFlowPanel.css";
import {
  readPipeline,
  ensureStrictStepAccess,
} from "../utils/brandPipelineStorage.js";

function safeReadPipeline() {
  try {
    return readPipeline() || {};
  } catch {
    return {};
  }
}

function isStepDone(pipeline, stepKey) {
  const step = pipeline?.[stepKey];
  return Boolean(step?.selectedId || step?.selected);
}

function firstUnfinishedPrev(stepKey, order, pipeline) {
  const idx = order.indexOf(stepKey);
  if (idx <= 0) return null;

  for (let i = 0; i < idx; i++) {
    const k = order[i];
    if (!isStepDone(pipeline, k)) return k;
  }
  return null;
}

function labelOf(stepKey) {
  if (stepKey === "naming") return "네이밍";
  if (stepKey === "concept") return "컨셉";
  if (stepKey === "story") return "스토리";
  if (stepKey === "logo") return "로고";
  return stepKey;
}

/**
 * ✅ 브랜드 컨설팅 상단 단계 카드(가로)
 * - 잠금/완료 상태는 brandPipelineStorage(brandPipeline_v1) 기준
 * - 이전 단계 미완료 시 이동 차단 + ConsultingFlowMini로 경고 메시지 전달
 */
export default function ConsultingFlowPanel({ activeKey = "naming" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const steps = useMemo(
    () => [
      {
        key: "naming",
        label: "네이밍",
        desc: "3안 생성 → 1개 선택",
        path: "/brand/naming/interview",
      },
      {
        key: "concept",
        label: "컨셉",
        desc: "컨셉/키워드/톤 정리",
        path: "/brand/concept/interview",
      },
      {
        key: "story",
        label: "스토리",
        desc: "브랜드 스토리/메시지",
        path: "/brand/story",
      },
      {
        key: "logo",
        label: "로고",
        desc: "로고 방향/가이드",
        path: "/brand/logo/interview",
      },
    ],
    [],
  );

  const order = useMemo(() => steps.map((s) => s.key), [steps]);

  const emitGuard = useCallback((message) => {
    window.dispatchEvent(
      new CustomEvent("consultingFlow:guard", { detail: { message } }),
    );
  }, []);

  const onClickStep = (step) => {
    if (location?.pathname === step.path) return;

    const pipeline = safeReadPipeline();
    const blocking = firstUnfinishedPrev(step.key, order, pipeline);

    if (blocking) {
      emitGuard(
        `이전 단계(${labelOf(blocking)})가 아직 완료되지 않았어요. 먼저 ${labelOf(blocking)}에서 후보를 선택해 주세요.`,
      );
      return;
    }

    const access = ensureStrictStepAccess(step.key);
    if (!access?.ok) {
      // no_back 포함: 현재 단계로 되돌림
      const msg =
        access?.reason === "no_back"
          ? "이전 단계로는 돌아갈 수 없습니다. 현재 진행 중인 단계에서 계속 진행해 주세요."
          : "이전 단계를 먼저 완료해 주세요.";
      emitGuard(msg);
      if (access?.redirectTo) navigate(access.redirectTo);
      return;
    }

    navigate(step.path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pipeline = safeReadPipeline();

  return (
    <div className="flowPanel">
      <div className="flowPanel__head">
        <div className="flowPanel__title">브랜드 컨설팅 진행 단계</div>
        <div className="flowPanel__hint">.</div>
      </div>

      <div className="flowPanel__steps">
        {steps.map((s) => {
          const rawDone = isStepDone(pipeline, s.key);
          const locked = Boolean(firstUnfinishedPrev(s.key, order, pipeline));
          const done = rawDone && !locked;
          const active = activeKey === s.key;

          return (
            <button
              key={s.key}
              type="button"
              className={[
                "flowStep",
                active ? "isActive" : "",
                done ? "isDone" : "",
                locked ? "isLocked" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onClickStep(s)}
            >
              <div className="flowStep__text">
                <div className="flowStep__label">{s.label}</div>
                <div className="flowStep__desc">{s.desc}</div>
              </div>

              <div className="flowStep__status">
                {locked ? "잠김" : done ? "완료" : active ? "진행중" : "대기"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
