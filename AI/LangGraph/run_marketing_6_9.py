"""
[Revised] Step 6-9 Marketing Generation Script (API Mode)
- API 호출 방식으로 변경 (debug_api.py 패턴)
- Step 1-5 결과에서 context 구성
- FastAPI 서버를 통한 정식 API 호출
"""
import requests
import json
import sys
import os

# 공통 설정
BASE_URL = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json"}

# Step 1-5 결과 디렉토리 (절대 경로)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Test 폴더는 LangGraph의 형제 폴더
BRAND_OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "Test", "Test", "outputs", "brand_01")

def load_marketing_context():
    """
    debug_api.py에서 생성한 selected_context.json 로드
    
    이 파일에는 사용자가 Step 1-5에서 선택한 정보가 포함되어 있음:
    - brand_name (Step 2 선택)
    - concept_statement (Step 3 선택)
    - brand_story (Step 4 선택)
    - core_keywords (Step 1 고정)
    - target_persona (Step 1 고정)
    - logo_color_palette (Step 5 선택)
    """
    context_file = os.path.join(BRAND_OUTPUT_DIR, "selected_context.json")
    
    if not os.path.exists(context_file):
        print(f"❌ selected_context.json 파일이 없습니다!")
        print(f"   경로: {context_file}")
        print(f"\n💡 먼저 debug_api.py를 실행하여 Step 1-5를 완료하고")
        print(f"   사용자 선택을 통해 selected_context.json을 생성해주세요.")
        sys.exit(1)
    
    with open(context_file, "r", encoding="utf-8") as f:
        context = json.load(f)
    
    print("\n✅ 선택된 Context 로드 완료:")
    print(f"   - Brand: {context.get('brand_name', 'N/A')}")
    print(f"   - Concept: {context.get('concept_statement', 'N/A')[:50]}...")
    print(f"   - Story: {context.get('brand_story', 'N/A')[:50]}...")
    print(f"   - Keywords: {context.get('core_keywords', [])}")
    print(f"   - Colors: {context.get('logo_color_palette', [])}")
    
    return context

def load_marketing_answers():
    """marketting_answers.json 로드"""
    filepath = "marketting_answers.json"
    if not os.path.exists(filepath):
        print(f"❌ {filepath} 파일을 찾을 수 없습니다.")
        sys.exit()
    
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def save_result(step_name, data):
    """결과를 파일로 저장"""
    output_dir = "Test/outputs/marketing_brand_05_api"
    os.makedirs(output_dir, exist_ok=True)
    
    filepath = os.path.join(output_dir, f"{step_name}_result.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"💾 결과 저장: {filepath}")

def main():
    print("🚀 [API Mode] Step 6~9 마케팅 생성 시작")
    print(f"📡 FastAPI 서버: {BASE_URL}")
    
    # 1. Context 로드 (debug_api.py에서 생성한 파일)
    context = load_marketing_context()
    
    # 2. 마케팅 Q&A 답변 로드
    marketing_answers = load_marketing_answers()
    
    # =================================================================
    # [Step 6] 아이콘 생성
    # =================================================================
    try:
        print("\n" + "="*60)
        print("📍 Step 6: Icon Generation (API)")
        print("="*60)
        
        payload = {
            "user_input": marketing_answers.get("step_6", {}),
            "context": context
        }
        
        url = f"{BASE_URL}/marketing/step6/icon"
        print(f"📡 API 요청: {url}")
        
        resp = requests.post(url, json=payload, headers=HEADERS)
        
        if resp.status_code == 200:
            print("✅ Step 6 성공!")
            result_data = resp.json()
            save_result("step_6", result_data)
            
            # 결과 미리보기
            result = result_data.get("result", {})
            print(f"🖼️  Icon URLs:")
            for i in range(1, 4):
                print(f"   {i}. {result.get(f'icon_{i}_url', 'N/A')[:80]}...")
        else:
            print(f"❌ Step 6 실패: {resp.text}")
            return
            
    except Exception as e:
        print(f"❌ Step 6 에러: {e}")
        return
    
    # =================================================================
    # [Step 7] 모델 생성
    # =================================================================
    try:
        print("\n" + "="*60)
        print("📍 Step 7: Model Generation (API)")
        print("="*60)
        
        payload = {
            "user_input": marketing_answers.get("step_7", {}),
            "context": context
        }
        
        url = f"{BASE_URL}/marketing/step7/model"
        print(f"📡 API 요청: {url}")
        
        resp = requests.post(url, json=payload, headers=HEADERS)
        
        if resp.status_code == 200:
            print("✅ Step 7 성공!")
            result_data = resp.json()
            save_result("step_7", result_data)
            
            result = result_data.get("result", {})
            print(f"🖼️  Model URLs:")
            for i in range(1, 4):
                print(f"   {i}. {result.get(f'model_{i}_url', 'N/A')[:80]}...")
        else:
            print(f"❌ Step 7 실패: {resp.text}")
            return
            
    except Exception as e:
        print(f"❌ Step 7 에러: {e}")
        return
    
    # =================================================================
    # [Step 8] 제품 연출 생성
    # =================================================================
    try:
        print("\n" + "="*60)
        print("📍 Step 8: Staging Generation (API)")
        print("="*60)
        
        payload = {
            "user_input": marketing_answers.get("step_8", {}),
            "context": context
        }
        
        url = f"{BASE_URL}/marketing/step8/staging"
        print(f"📡 API 요청: {url}")
        
        resp = requests.post(url, json=payload, headers=HEADERS)
        
        if resp.status_code == 200:
            print("✅ Step 8 성공!")
            result_data = resp.json()
            save_result("step_8", result_data)
            
            result = result_data.get("result", {})
            print(f"🖼️  Staging URLs:")
            for i in range(1, 4):
                print(f"   {i}. {result.get(f'staging_{i}_url', 'N/A')[:80]}...")
        else:
            print(f"❌ Step 8 실패: {resp.text}")
            return
            
    except Exception as e:
        print(f"❌ Step 8 에러: {e}")
        return
    
    # =================================================================
    # [Step 9] 광고 포스터 생성
    # =================================================================
    try:
        print("\n" + "="*60)
        print("📍 Step 9: Ad Generation (API)")
        print("="*60)
        
        payload = {
            "user_input": marketing_answers.get("step_9", {}),
            "context": context
        }
        
        url = f"{BASE_URL}/marketing/step9/ad"
        print(f"📡 API 요청: {url}")
        
        resp = requests.post(url, json=payload, headers=HEADERS)
        
        if resp.status_code == 200:
            print("✅ Step 9 성공!")
            result_data = resp.json()
            save_result("step_9", result_data)
            
            result = result_data.get("result", {})
            print(f"🖼️  Ad URLs:")
            for i in range(1, 4):
                print(f"   {i}. {result.get(f'ad_{i}_url', 'N/A')[:80]}...")
        else:
            print(f"❌ Step 9 실패: {resp.text}")
            return
            
    except Exception as e:
        print(f"❌ Step 9 에러: {e}")
        return
    
    print("\n" + "="*60)
    print("🎉 [Success] 모든 마케팅 단계(6~9) API 호출 완료!")
    print(f"📂 결과 폴더: Test/outputs/marketing_brand_05_api/")
    print("="*60)

if __name__ == "__main__":
    main()
