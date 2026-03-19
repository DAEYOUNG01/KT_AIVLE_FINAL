"""
Step 5: Logo Node
로고 디자인 가이드 생성 + 이미지 자동 생성 + Brand Consulting Report 생성
"""
from langgraph_system.state import BrandConsultingState
from langgraph_system.utils import get_openai_client, validate_step_input, flatten_context
from langgraph_system.prompts import GenerationPrompts
import json
import os

def logo_node(state: BrandConsultingState) -> BrandConsultingState:
    """
    Step 5: 로고 디자인 가이드 생성 + 이미지 자동 생성 + Report
    
    [Process]
    1. GPT-5.1: 로고 컨셉 및 DALL-E 프롬프트 3가지 생성
    2. Gemini 3 Pro: 생성된 3가지 프롬프트로 즉시 이미지 생성
    3. Brand Consulting Report: 최종 리포트 생성
    
    [Output]
    - logo_candidates: logo_concept, logo_image_url
    """
    print(f"\n{'='*60}")
    print(f"[Step 5: Logo] 실행 시작")
    print(f"{'='*60}")
    
    # 1. 입력 검증
    step_5_qa = state.get("step_5_qa")
    if not validate_step_input(5, {"answers": step_5_qa} if step_5_qa else None):
        state["error_occurred"] = True
        state["error_message"] = "Step 5 Q&A 데이터가 없습니다."
        return state
    
    # 2. Context 확인
    naming_context = state.get("naming_context")
    concept_context = state.get("concept_context")
    story_context = state.get("story_context")
    diagnosis_context = state.get("diagnosis_context")

    # [수정] Context Flattening (Backend 리스트 대응)
    if naming_context:
        naming_context = flatten_context(naming_context, step_5_qa)
    if concept_context:
        concept_context = flatten_context(concept_context, step_5_qa)
    if story_context:
        story_context = flatten_context(story_context, step_5_qa)

    if not all([naming_context, concept_context, story_context, diagnosis_context]):
        print("⚠️ [Step 5] 일부 이전 단계 Context가 누락되었습니다.")

    
    # 4. OpenAI 클라이언트
    try:
        client = get_openai_client()
    except Exception as e:
        state["error_occurred"] = True
        state["error_message"] = f"Client Error: {e}"
        return state
    
    # 5. 프롬프트 구성 (JSON 직접 전달)
    feedback_section = ""  # 재생성 기능 제거됨

    # 6. 프롬프트 생성
    system_prompt = GenerationPrompts.LOGO_SYSTEM
    user_prompt = GenerationPrompts.LOGO_USER.format(
        brand_name=naming_context.get("brand_name", "") if naming_context else "Brand",
        concept_statement=concept_context.get("concept_statement", "") if concept_context else "",
        brand_story=story_context.get("brand_story", "") if story_context else "",
        core_keywords=str(diagnosis_context.get("core_keywords", [])) if diagnosis_context else "",
        qa_data_json=json.dumps(step_5_qa, ensure_ascii=False, indent=2),
        feedback_section=feedback_section
    )
    
    # 6. GPT-5.1 로고 컨셉 및 프롬프트 생성
    logo_options = []
    try:
        print("[Step 5] 1단계: GPT-5.1 로고 프롬프트 작성 중...")
        resp = client.chat.completions.create(
            model="gpt-5.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        logo_response = json.loads(resp.choices[0].message.content)
        logo_options = logo_response.get("options", [])
        
        if len(logo_options) < 3:
            while len(logo_options) < 3:
                logo_options.append({
                    "logo_concept": f"Logo {len(logo_options)+1}",
                    "dalle_prompt": "Create a modern logo",
                    "color_palette": []
                })
        
    except Exception as e:
        print(f"[Step 5] ❌ 컨셉 생성 실패: {e}")
        state["error_occurred"] = True
        state["error_message"] = str(e)
        return state

    output_id = state.get("output_id", "unknown")
    brand_name = naming_context.get("brand_name", "Brand")
    
    # 로컬 저장 디렉토리 설정 (각 브랜드 폴더 내부)
    import requests
    from pathlib import Path
    
    # output_id를 폴더명으로 사용 (예: output_01)
    logo_images_dir = Path(f"Test/outputs/{output_id}")
    logo_images_dir.mkdir(parents=True, exist_ok=True)
    
    # Wordmark 중심 프롬프트 생성 함수
    def create_gemini_prompt(brand_name, style_keywords, color_palette,
                            benchmark_brand, visual_instruction, layout_type):
        """
        글로벌 기업 느낌의 로고 프롬프트 생성
        """
        colors_str = ", ".join(color_palette) if color_palette else "Black"

        if layout_type == "Horizontal":
            layout_directive = "LAYOUT: Small geometric symbol on LEFT, brand name text on RIGHT."
        elif layout_type == "Integrated":
            layout_directive = "LAYOUT: Text itself becomes symbol by modifying one letter."
        elif layout_type == "Stacked":
            layout_directive = "LAYOUT: Small symbol ABOVE, brand name BELOW."
        else:
            layout_directive = "LAYOUT: Clean horizontal."

        prompt = f"""
{layout_directive}

{visual_instruction}

Create a GLOBAL CORPORATE LOGOTYPE logo.

STYLE:
- Minimal
- Flat vector
- Corporate
- Custom sans-serif typography
- Inspired by {benchmark_brand}

TYPOGRAPHY:
- Custom modified sans-serif
- Slight geometric cuts or extensions
- NOT default system font

TEXT:
- "{brand_name}" only

SYMBOL:
- Simple geometric shape allowed
- Dot, square, line, triangle, or circle
- Must feel intentional

COLOR:
- Solid {colors_str}

BACKGROUND:
- White

FORBIDDEN:
- Mockups
- Shadows
- 3D
- Gradients
- Extra text

The logo must look like a Fortune 100 brand identity.
"""
        return prompt.strip()

    
    candidates = []
    print(f"\n[Step 5] 2단계: DALL-E 3 이미지 생성 시작 (총 {len(logo_options)}장)")
    
    for idx, opt in enumerate(logo_options):
        # GPT에서 받은 변수 추출
        style_keywords = opt.get("style_keywords", ["Corporate"])
        color_palette = opt.get("color_palette", ["#000000"])
        benchmark_brand = opt.get("benchmark_brand", "Apple")
        layout_type = opt.get("layout_type", "Horizontal") # 기획 단계에서 결정된 레이아웃
        
        # [수정] visual_instruction을 가져오되, 없으면 기본값 설정
        visual_instruction = opt.get("visual_instruction", f"The brand name '{brand_name}' written in bold sans-serif font. A small dot accent in the brand color.")
        
        # [수정] create_dalle_prompt 호출 (layout_type 추가)
        gemini_prompt = create_gemini_prompt(
            brand_name, 
            style_keywords, 
            color_palette, 
            benchmark_brand, 
            visual_instruction,
            layout_type
        )
        
        print(f"  - [Image {idx+1}/{len(logo_options)}] 생성 중...")
        print(f"    Style: {', '.join(style_keywords)}")
        print(f"    Colors: {', '.join(color_palette)}")
        print(f"    Benchmark: {benchmark_brand}")
        
        image_url = None
        local_image_path = None
        
        try:
            # Gemini 3 Pro Image Preview API 호출
            import base64
            from io import BytesIO
            from PIL import Image
            from dotenv import load_dotenv
            from langgraph_system.utils import get_gemini_client
            
            # .env 로드
            load_dotenv()
            
            # Gemini 클라이언트 생성
            gemini_client = get_gemini_client()
            
            print(f"    🚀 Gemini 3 Pro Image Preview 요청 중...")
            
            # Gemini API 호출 (문서 기준)
            from google.genai import types
            
            response = gemini_client.models.generate_content(
                model="gemini-3-pro-image-preview",
                contents=[gemini_prompt],
                config=types.GenerateContentConfig(
                    response_modalities=['Image'],  # 이미지만 반환
                    image_config=types.ImageConfig(
                        aspect_ratio="1:1",  # 정사각형 로고
                        image_size="2K"      # 고해상도
                    )
                )
            )
            
            # 이미지 추출 및 저장
            image_saved = False
            
            # Gemini 응답에서 이미지 추출
            if response.parts:
                for part in response.parts:
                    # inline_data 또는 file_data 확인
                    if hasattr(part, 'inline_data') and part.inline_data:
                        image_data = part.inline_data.data
                    elif hasattr(part, 'text'):
                        # 텍스트 응답인 경우 건너뛰기
                        continue
                    else:
                        continue
                    
                    # 이미지 데이터가 base64 문자열인 경우 디코딩
                    if isinstance(image_data, str):
                        import base64
                        image_bytes = base64.b64decode(image_data)
                    else:
                        image_bytes = image_data
                    
                    # 1. 로컬에 이미지 저장 (base64 확인용)
                    filename = f"logo_{idx+1}.png"
                    filepath = logo_images_dir / filename
                    
                    with open(filepath, "wb") as f:
                        f.write(image_bytes)
                    
                    local_image_path = str(filepath)
                    print(f"    💾 로컬 저장 완료: {filepath}")
                    
                    # 2. Cloudinary 업로드 (Public URL 생성)
                    try:
                        import cloudinary
                        import cloudinary.uploader
                        
                        # Cloudinary 설정 (.env에서 로드)
                        cloudinary.config(
                            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
                            api_key=os.getenv("CLOUDINARY_API_KEY"),
                            api_secret=os.getenv("CLOUDINARY_API_SECRET")
                        )
                        
                        # 이미지 업로드
                        upload_result = cloudinary.uploader.upload(
                            str(filepath),
                            folder=f"logos/{output_id}",
                            public_id=f"logo_{idx+1}",
                            overwrite=True,
                            resource_type="image"
                        )
                        
                        # Public URL 추출
                        image_url = upload_result.get("secure_url")
                        print(f"    ☁️ Cloudinary 업로드 완료: {image_url}")
                        
                    except Exception as cloudinary_error:
                        # Cloudinary 업로드 실패 시 로컬 경로로 대체
                        print(f"    ⚠️ Cloudinary 업로드 실패: {cloudinary_error}")
                        print(f"    📍 로컬 경로로 대체됩니다.")
                        image_url = str(filepath).replace("\\", "/")
                    
                    image_saved = True
                    break
            
            if not image_saved:
                raise Exception("Gemini 응답에서 이미지를 찾을 수 없습니다.")

        except Exception as e:
            print(f"    ❌ 이미지 생성 실패: {e}")
            image_url = None
        
        candidates.append({
            "candidate_id": idx,
            "output": {
                "logo_concept": opt.get("logo_concept", ""),
                "logo_image_url": image_url,
                "logo_rationale": opt.get("logo_rationale", ""),
                "qa_analysis_summary": opt.get("qa_analysis_summary", ""),
                "qa_keywords": opt.get("qa_keywords", []),
                "color_palette": opt.get("color_palette", [])
            }
        })
    
    state["logo_candidates"] = candidates
    state["current_step"] = 6 # Human Review로 이동
    
    print(f"\n[Step 5] ✅ 로고 후보(이미지 포함) 생성 완료")
    print(f"{'='*60}\n")
    
    return state
