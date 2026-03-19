"""
유틸리티 함수
JSON 로드, 프롬프트 관리, 컨텍스트 처리 등
"""
import json
import os
from typing import Dict, Any, List, Optional
from openai import OpenAI


def load_questions(step_num: int) -> List[Dict[str, Any]]:
    """
    질문 데이터 로드
    
    Args:
        step_num: 단계 번호 (1~9)
    
    Returns:
        해당 단계의 질문 리스트
    """
    # 1~5단계: questions.json
    # 6~9단계: marketing.json
    if 1 <= step_num <= 5:
        file_path = "questions.json"
        step_key = f"step_{step_num}"
    elif 6 <= step_num <= 9:
        file_path = "marketing.json"
        step_key = f"step_{step_num}"
    else:
        raise ValueError(f"잘못된 단계 번호: {step_num}")
    
    # 파일 로드
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"질문 파일을 찾을 수 없습니다: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return data.get(step_key, [])


def get_openai_client() -> OpenAI:
    """OpenAI 클라이언트 생성"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")
    return OpenAI(api_key=api_key)


def get_gemini_client():
    """Gemini 클라이언트 생성 (google.genai 패키지 사용)"""
    from google import genai
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.")
    
    # API 키로 클라이언트 생성
    client = genai.Client(api_key=api_key)
    return client


def extract_answer_value(answers: Dict[str, Any], key: str, default: Any = None) -> Any:
    """
    questions.json 구조에서 value만 추출
    
    Args:
        answers: 사용자 답변 딕셔너리
        key: 질문 ID
        default: 기본값
    
    Returns:
        추출된 값
    """
    item = answers.get(key)
    if not item:
        return default
    
    # {"value": ...} 구조인 경우
    if isinstance(item, dict) and "value" in item:
        return item["value"]
    
    # 직접 값인 경우
    return item


def format_context_for_prompt(context: Dict[str, Any]) -> str:
    """
    누적 컨텍스트를 프롬프트용 문자열로 변환
    
    Args:
        context: 누적 컨텍스트
    
    Returns:
        포맷팅된 문자열
    """
    formatted = []
    
    for key, value in context.items():
        if key in ["brand_id", "user_id"]:
            continue
        
        if isinstance(value, dict):
            formatted.append(f"## {key}")
            formatted.append(json.dumps(value, ensure_ascii=False, indent=2))
        elif isinstance(value, list):
            formatted.append(f"## {key}")
            formatted.append(json.dumps(value, ensure_ascii=False, indent=2))
        else:
            formatted.append(f"## {key}: {value}")
    
    return "\n\n".join(formatted)


def download_image(url: str, save_path: str) -> bool:
    """
    이미지 다운로드
    
    Args:
        url: 이미지 URL
        save_path: 저장 경로
    
    Returns:
        성공 여부
    """
    import requests
    
    try:
        response = requests.get(url, stream=True, timeout=30)
        if response.status_code == 200:
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            print(f"[Image] 다운로드 완료: {save_path}")
            return True
        else:
            print(f"[Image] 다운로드 실패 (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"[Image] 다운로드 오류: {e}")
        return False


def validate_step_input(step_num: int, user_input: Dict[str, Any]) -> bool:
    """
    사용자 입력 검증
    
    Args:
        step_num: 단계 번호
        user_input: 사용자 입력
    
    Returns:
        검증 성공 여부
    """
    if not user_input or "answers" not in user_input:
        print(f"[Validation] Step {step_num} 입력 데이터가 없습니다.")
        return False
    
    # 추가 검증 로직 (필요 시)
    # 예: 필수 질문 답변 확인
    
    return True

# =================================================================
# Marketing Utils (Step 6~9)
# =================================================================

def load_marketing_context(brand_id: str) -> Dict[str, Any]:
    """
    Step 1~5의 브랜드 자산(Outputs)을 로드하여 마케팅 생성의 Context로 사용합니다.
    """
    # brand_id가 "brand_"로 시작하면 그대로 사용, 아니면 붙여줌
    folder_name = brand_id if brand_id.startswith("brand_") else f"brand_{brand_id}"
    base_path = f"C:/Users/User/Desktop/workspace/AI/Test/Test/outputs/{folder_name}"
    
    context = {}
    
    # 필요한 파일 목록
    files = {
        "naming": "naming.json",
        "concept": "concept.json",
        "story": "story.json",
        "logo": "logo.json"
    }
    
    for key, filename in files.items():
        file_path = os.path.join(base_path, filename)
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                context[key] = json.load(f)
        else:
            print(f"[Warning] {filename} not found in {base_path}")
            context[key] = {}
            
    return context

def save_marketing_output(brand_id: str, step_name: str, data: Dict[str, Any]):
    """
    마케팅 단계별 결과물을 저장합니다.
    경로: C:/Users/User/Desktop/workspace/AI/Test/Test/outputs/marketing_{brand_id}/{step_name}.json
    """
    # marketing_{id} 폴더 경로 생성
    # brand_id가 "brand_"로 시작하면 "brand_" 제거 후 사용 (marketing_05) 또는 그대로 사용 (marketing_brand_05)
    # 기존 코드에서 "marketing_brand_05"로 생성되었으므로, 일관성을 위해 "brand_"가 있으면 그대로 둠
    folder_suffix = brand_id # if it is brand_05, folder becomes marketing_brand_05
    
    output_dir = f"C:/Users/User/Desktop/workspace/AI/Test/Test/outputs/marketing_{folder_suffix}"
    os.makedirs(output_dir, exist_ok=True)
    
    file_path = os.path.join(output_dir, f"{step_name}.json")
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"[Saved] {step_name} result to {file_path}")

def upload_to_cloudinary(image_data: bytes, folder: str) -> str:
    """
    이미지 바이트 데이터를 Cloudinary에 업로드하고 URL을 반환합니다.
    """
    import cloudinary
    from cloudinary.uploader import upload
    
    # Cloudinary 설정 (환경 변수 사용 권장)
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )
    
    try:
        response = upload(image_data, folder=folder)
        return response.get("secure_url")
    except Exception as e:
        print(f"[Error] Cloudinary upload failed: {e}")
        return None
