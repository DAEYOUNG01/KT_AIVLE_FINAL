"""
Marketing Nodes (Steps 6-9)
홍보물 생성: 아이콘, 모델, 연출, 광고
"""
from langgraph_system.state import BrandConsultingState
from langgraph_system.utils import get_gemini_client
from langgraph_system.prompts import GenerationPrompts
import json
import os
from pathlib import Path
from google.genai import types
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# .env 로드
load_dotenv()

# Cloudinary 설정
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


def extract_brand_context(state: BrandConsultingState) -> dict:
    """
    State에서 브랜드 context 추출
    
    **중요**: AI 서버는 Stateless (DB 없음)
    - BE가 API 요청 시 context를 payload에 포함하여 전달
    - marketing_context를 무조건 사용 (파일 읽기 X)
    """
    marketing_context = state.get("marketing_context", {})
    
    if not marketing_context:
        print("⚠️  경고: marketing_context가 비어있습니다. 기본값 사용.")
    
    # API payload에서 전달받은 context 그대로 사용
    return {
        "brand_name": marketing_context.get("brand_name", "Brand"),
        "concept_statement": marketing_context.get("concept_statement", ""),
        "brand_story": marketing_context.get("brand_story", ""),
        "core_keywords": marketing_context.get("core_keywords", []),
        "target_persona": marketing_context.get("target_persona", "")
    }



def create_image_prompt(step_type: str, concept: str, rationale: str, brand_context: dict, colors: list = None) -> str:
    """
    GPT의 concept + rationale 기반으로 Gemini용 이미지 프롬프트 자동 생성
    
    Args:
        colors: 사용할 색상 목록 (Step에서 전달, 없으면 기본값)
    """
    brand_name = brand_context.get("brand_name", "Brand")
    color_desc = ", ".join(colors[:2]) if colors else "brand colors"
    
    prompts = {
        "icon": f"Corporate brand symbol mark for {brand_name}. {rationale} Design concept: {concept}. Fortune 500 quality, flat vector design, white background, NO TEXT, geometric precision, minimalist, professional, timeless. Color: {color_desc}. Single clean symbol.",
        
        "model": f"Professional brand persona photo for {brand_name}. {rationale} Concept: {concept}. Raw photo, 8k resolution, shot on 35mm film, natural sunlight, depth of field, detailed skin texture, imperfections, no heavy retouching. Candid style, authentic moment.",
        
        "staging": f"Product photography for {brand_name}. {rationale} Theme: {concept}. Commercial product photography, studio lighting, hyper-realistic, 8k, sharp focus, clean composition. Brand colors: {color_desc}.",
        
        "ad": f"SNS advertisement poster for {brand_name}. {rationale} Campaign: {concept}. Advertisement poster design, professional graphic design, clear hierarchy, high resolution, balanced composition. MUST prominently display brand name '{brand_name}' as text within the design. Brand colors: {color_desc}. Instagram post format, 1080x1080px."
    }
    
    return prompts.get(step_type, f"{concept}. {rationale}")


def generate_image_with_gemini(prompt: str, output_folder: Path, filename: str, step_name: str) -> tuple:
    """
    Gemini 3 Pro Image Preview로 이미지 생성 및 저장
    
    Returns:
        (image_url, local_path): Cloudinary URL과 로컬 경로
    """
    try:
        gemini_client = get_gemini_client()
        
        print(f"    🚀 Gemini 이미지 생성 요청 중...")
        print(f"    📝 Prompt: {prompt[:150]}...")
        
        response = gemini_client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_modalities=['Image'],
                image_config=types.ImageConfig(
                    aspect_ratio="1:1",
                    image_size="2K"
                )
            )
        )
        
        # 이미지 추출
        image_bytes = None
        if response.parts:
            for part in response.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    image_data = part.inline_data.data
                    if isinstance(image_data, str):
                        import base64
                        image_bytes = base64.b64decode(image_data)
                    else:
                        image_bytes = image_data
                    break
        
        if not image_bytes:
            raise Exception("Gemini 응답에서 이미지를 찾을 수 없습니다.")
        
        # 로컬 저장
        output_folder.mkdir(parents=True, exist_ok=True)
        local_path = output_folder / filename
        with open(local_path, "wb") as f:
            f.write(image_bytes)
        print(f"    💾 로컬 저장: {local_path}")
        
        # Cloudinary 업로드
        try:
            upload_result = cloudinary.uploader.upload(
                str(local_path),
                folder=f"{output_folder.parent.name}/{step_name}",
                public_id=filename.replace(".png", ""),
                overwrite=True,
                resource_type="image"
            )
            image_url = upload_result.get("secure_url")
            print(f"    ☁️ Cloudinary 업로드: {image_url}")
            return (image_url, str(local_path))
        except Exception as e:
            print(f"    ⚠️ Cloudinary 업로드 실패: {e}")
            # 로컬 경로로 대체
            return (str(local_path).replace("\\", "/"), str(local_path))
    
    except Exception as e:
        print(f"    ❌ 이미지 생성 실패: {e}")
        return (None, None)


# =================================================================
# [Step 6] 아이콘 생성
# =================================================================
def icon_node(state: BrandConsultingState) -> BrandConsultingState:
    """
    Step 6: 앱 아이콘 생성
    """
    print(f"\n{'='*60}")
    print(f"[Step 6: Icon] 실행 시작")
    print(f"{'='*60}")
    
    # 1. 브랜드 Context 추출
    context = extract_brand_context(state)
    
    # 2. Step 6 답변 가져오기
    marketing_answers = state.get("marketing_answers", {})
    step_6_answers = marketing_answers.get("step_6", {})
    
    # 2-1. Step 6에서 색상 추출 (dict 배열 → 문자열 배열)
    icon_colors_raw = step_6_answers.get("s6_icon_colors", [])
    if icon_colors_raw and isinstance(icon_colors_raw, list) and len(icon_colors_raw) > 0 and isinstance(icon_colors_raw[0], dict):
        # dict 배열에서 value 필드만 추출
        icon_colors = [c.get("value", c.get("text", "")) for c in icon_colors_raw]
    else:
        # 이미 문자열 배열이거나 비어있음
        icon_colors = icon_colors_raw if icon_colors_raw else ["brand colors"]
    
    # 3. GPT로 아이콘 컨셉 생성
    try:
        from langgraph_system.utils import get_openai_client
        client = get_openai_client()
        
        system_prompt = GenerationPrompts.ICON_SYSTEM
        user_prompt = GenerationPrompts.ICON_USER.format(
            brand_name=context["brand_name"],
            concept_statement=context["concept_statement"],
            brand_story=context["brand_story"],
            core_keywords=str(context["core_keywords"]),
            answers=json.dumps(step_6_answers, ensure_ascii=False, indent=2)
        )
        
        print("[Step 6] GPT 컨셉 생성 중...")
        resp = client.chat.completions.create(
            model="gpt-5.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        icon_response = json.loads(resp.choices[0].message.content)
        candidates_raw = icon_response.get("candidates", [])
        
    except Exception as e:
        print(f"[Step 6] ❌ 컨셉 생성 실패: {e}")
        state["step_6_output"] = {"error": str(e)}
        return state
    
    # 4. 이미지 생성 (3개)
    brand_id = state.get("brand_id", "unknown")
    output_folder = Path(f"Test/outputs/marketing_{brand_id}/step_6")
    
    candidates = []
    for i, cand in enumerate(candidates_raw[:3]):
        # GPT 응답에서 concept, rationale 추출 → 이미지 프롬프트 생성
        concept = cand.get("concept", "")
        rationale = cand.get("rationale", "")
        prompt_text = create_image_prompt("icon", concept, rationale, context, colors=icon_colors)
        
        image_url, local_path = generate_image_with_gemini(
            prompt_text,
            output_folder,
            f"candidate_{i+1}.png",
            "icon"
        )
        
        candidates.append({
            "id": i,
            "image_url": image_url,
            "concept": concept,
            "rationale": rationale
        })
    
    # 5. 결과 저장
    result_json = {
        "result": {
            "icon_1_url": candidates[0]["image_url"] if len(candidates) > 0 else None,
            "icon_2_url": candidates[1]["image_url"] if len(candidates) > 1 else None,
            "icon_3_url": candidates[2]["image_url"] if len(candidates) > 2 else None
        },
        "state_context": {
            "candidates": candidates
        }
    }
    
    state["step_6_output"] = result_json
    
    # JSON 파일 저장 (디버깅용)
    json_file = output_folder / "step_6_result.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)
    print(f"📄 JSON 저장: {json_file}")
    
    print(f"[Step 6] ✅ 아이콘 생성 완료")
    print(f"{'='*60}\n")
    return state


# =================================================================
# [Step 7] 모델 이미지 생성
# =================================================================
def model_node(state: BrandConsultingState) -> BrandConsultingState:
    """
    Step 7: 브랜드 페르소나 모델 이미지 생성
    """
    print(f"\n{'='*60}")
    print(f"[Step 7: Model] 실행 시작")
    print(f"{'='*60}")
    
    context = extract_brand_context(state)
    marketing_answers = state.get("marketing_answers", {})
    step_7_answers = marketing_answers.get("step_7", {})
    
    try:
        from langgraph_system.utils import get_openai_client
        client = get_openai_client()
        
        system_prompt = GenerationPrompts.PERSONA_SYSTEM
        user_prompt = GenerationPrompts.PERSONA_USER.format(
            brand_name=context["brand_name"],
            concept_statement=context["concept_statement"],
            brand_story=context["brand_story"],
            core_keywords=str(context["core_keywords"]),
            target_persona=context["target_persona"],
            answers=json.dumps(step_7_answers, ensure_ascii=False, indent=2)
        )
        
        print("[Step 7] GPT 컨셉 생성 중...")
        resp = client.chat.completions.create(
            model="gpt-5.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        model_response = json.loads(resp.choices[0].message.content)
        candidates_raw = model_response.get("candidates", [])
        
    except Exception as e:
        print(f"[Step 7] ❌ 컨셉 생성 실패: {e}")
        state["step_7_output"] = {"error": str(e)}
        return state
    
    brand_id = state.get("brand_id", "unknown")
    output_folder = Path(f"Test/outputs/marketing_{brand_id}/step_7")
    
    candidates = []
    for i, cand in enumerate(candidates_raw[:3]):
        concept = cand.get("concept", "")
        rationale = cand.get("rationale", "")
        prompt_text = create_image_prompt("model", concept, rationale, context)
        
        image_url, local_path = generate_image_with_gemini(
            prompt_text,
            output_folder,
            f"candidate_{i+1}.png",
            "model"
        )
        
        candidates.append({
            "id": i,
            "image_url": image_url,
            "concept": concept,
            "rationale": rationale
        })
    
    result_json = {
        "result": {
            "model_1_url": candidates[0]["image_url"] if len(candidates) > 0 else None,
            "model_2_url": candidates[1]["image_url"] if len(candidates) > 1 else None,
            "model_3_url": candidates[2]["image_url"] if len(candidates) > 2 else None
        },
        "state_context": {
            "candidates": candidates
        }
    }
    
    state["step_7_output"] = result_json
    
    # JSON 파일 저장
    json_file = output_folder / "step_7_result.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)
    print(f"📄 JSON 저장: {json_file}")
    
    print(f"[Step 7] ✅ 모델 이미지 생성 완료")
    print(f"{'='*60}\n")
    return state


# =================================================================
# [Step 8] 제품 연출 이미지 생성
# =================================================================
def staging_node(state: BrandConsultingState) -> BrandConsultingState:
    """
    Step 8: 제품 연출 이미지 생성
    """
    print(f"\n{'='*60}")
    print(f"[Step 8: Staging] 실행 시작")
    print(f"{'='*60}")
    
    context = extract_brand_context(state)
    marketing_answers = state.get("marketing_answers", {})
    step_8_answers = marketing_answers.get("step_8", {})
    
    try:
        from langgraph_system.utils import get_openai_client
        client = get_openai_client()
        
        system_prompt = GenerationPrompts.STAGING_SYSTEM
        user_prompt = GenerationPrompts.STAGING_USER.format(
            brand_name=context["brand_name"],
            concept_statement=context["concept_statement"],
            brand_story=context["brand_story"],
            core_keywords=str(context["core_keywords"]),
            answers=json.dumps(step_8_answers, ensure_ascii=False, indent=2)
        )
        
        print("[Step 8] GPT 컨셉 생성 중...")
        resp = client.chat.completions.create(
            model="gpt-5.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        staging_response = json.loads(resp.choices[0].message.content)
        candidates_raw = staging_response.get("candidates", [])
        
    except Exception as e:
        print(f"[Step 8] ❌ 컨셉 생성 실패: {e}")
        state["step_8_output"] = {"error": str(e)}
        return state
    
    brand_id = state.get("brand_id", "unknown")
    output_folder = Path(f"Test/outputs/marketing_{brand_id}/step_8")
    
    candidates = []
    for i, cand in enumerate(candidates_raw[:3]):
        concept = cand.get("concept", "")
        rationale = cand.get("rationale", "")
        prompt_text = create_image_prompt("staging", concept, rationale, context)
        
        image_url, local_path = generate_image_with_gemini(
            prompt_text,
            output_folder,
            f"candidate_{i+1}.png",
            "staging"
        )
        
        candidates.append({
            "id": i,
            "image_url": image_url,
            "concept": concept,
            "rationale": rationale
        })
    
    result_json = {
        "result": {
            "staging_1_url": candidates[0]["image_url"] if len(candidates) > 0 else None,
            "staging_2_url": candidates[1]["image_url"] if len(candidates) > 1 else None,
            "staging_3_url": candidates[2]["image_url"] if len(candidates) > 2 else None
        },
        "state_context": {
            "candidates": candidates
        }
    }
    
    state["step_8_output"] = result_json
    
    # JSON 파일 저장
    json_file = output_folder / "step_8_result.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)
    print(f"📄 JSON 저장: {json_file}")
    
    print(f"[Step 8] ✅ 제품 연출 이미지 생성 완료")
    print(f"{'='*60}\n")
    return state


# =================================================================
# [Step 9] 광고 포스터 생성
# =================================================================
def ad_node(state: BrandConsultingState) -> BrandConsultingState:
    """
    Step 9: 광고 포스터 생성
    """
    print(f"\n{'='*60}")
    print(f"[Step 9: Ad] 실행 시작")
    print(f"{'='*60}")
    
    context = extract_brand_context(state)
    marketing_answers = state.get("marketing_answers", {})
    step_9_answers = marketing_answers.get("step_9", {})
    
    # Step 8 결과물 가져오기 (옵션)
    step_8_output = state.get("step_8_output", {})
    staging_options = json.dumps(step_8_output.get("state_context", {}), ensure_ascii=False)
    
    try:
        from langgraph_system.utils import get_openai_client
        client = get_openai_client()
        
        system_prompt = GenerationPrompts.AD_SYSTEM
        user_prompt = GenerationPrompts.AD_USER.format(
            brand_name=context["brand_name"],
            concept_statement=context["concept_statement"],
            brand_story=context["brand_story"],
            core_keywords=str(context["core_keywords"]),
            answers=json.dumps(step_9_answers, ensure_ascii=False, indent=2),
            staging_options=staging_options
        )
        
        print("[Step 9] GPT 컨셉 생성 중...")
        resp = client.chat.completions.create(
            model="gpt-5.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        ad_response = json.loads(resp.choices[0].message.content)
        candidates_raw = ad_response.get("candidates", [])
        
    except Exception as e:
        print(f"[Step 9] ❌ 컨셉 생성 실패: {e}")
        state["step_9_output"] = {"error": str(e)}
        return state
    
    brand_id = state.get("brand_id", "unknown")
    output_folder = Path(f"Test/outputs/marketing_{brand_id}/step_9")
    
    candidates = []
    for i, cand in enumerate(candidates_raw[:3]):
        concept = cand.get("concept", "")
        rationale = cand.get("rationale", "")
        prompt_text = create_image_prompt("ad", concept, rationale, context)
        
        image_url, local_path = generate_image_with_gemini(
            prompt_text,
            output_folder,
            f"candidate_{i+1}.png",
            "ad"
        )
        
        candidates.append({
            "id": i,
            "image_url": image_url,
            "concept": concept,
            "rationale": rationale
        })
    
    result_json = {
        "result": {
            "ad_1_url": candidates[0]["image_url"] if len(candidates) > 0 else None,
            "ad_2_url": candidates[1]["image_url"] if len(candidates) > 1 else None,
            "ad_3_url": candidates[2]["image_url"] if len(candidates) > 2 else None
        },
        "state_context": {
            "candidates": candidates
        }
    }
    
    state["step_9_output"] = result_json
    
    # JSON 파일 저장
    json_file = output_folder / "step_9_result.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)
    print(f"📄 JSON 저장: {json_file}")
    
    print(f"[Step 9] ✅ 광고 포스터 생성 완료")
    print(f"{'='*60}\n")
    return state
