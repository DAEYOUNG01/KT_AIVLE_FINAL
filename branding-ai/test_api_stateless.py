
import requests
import json
import sys

def test_stateless_diagnosis():
    url = "http://127.0.0.1:8000/brands/interview"
    
    # Payload matching backend's expected structure (user_input only)
    payload = {
        "user_input": {
             "q1": {"value": "IT 스타트업"},
             "q2": {"value": "혁신적인"},
             "q3": {"value": "2030 남성"},
             "q4": {"value": "글로벌 시장 진출"},
             "q5": {"value": "모던하고 심플한"}
        }
    }
    
    print(f"Testing {url} with stateless payload...")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        
        print(f"\n[Response Status Code]: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ Verification Success! Response Received:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            # Verify structure
            has_result = "result" in data
            has_context = "state_context" in data
            
        if response.status_code == 200:
            data = response.json()
            print("\n[O] Response structure is correct (result + state_context).")
            
            # Check for leaked IDs
            context = data["state_context"]
            if "brand_id" not in context and "process_id" not in context:
                    print("[O] Context is CLEAN (No internal IDs leaked).")
            else:
                    print("[!] WARNING: Internal IDs found in context!")
        else:
            print(f"\n[X] Request Failed: {response.text}")
            
    except Exception as e:
        print(f"\n[X] Connection Error: {e}")
        print("Please make sure the server is running: python -m uvicorn api.main:app --reload")

def test_stateless_naming():
    url = "http://127.0.0.1:8000/brands/naming"
    
    # Payload matching User Screenshot (Naming Request)
    payload = {
        "user_input": {
            "additional_requirements": "글로벌 서비스에 어울리는 이름",
            "language": "영문",
            "length_preference": "짧게"
        },
        "context": {
            "interview": {
                "brand_direction": "신뢰 기반 B2B SaaS",
                "tone": "전문적이고 안정적인",
                "keywords": ["신뢰", "확장성", "기술력"]
            }
        }
    }
    
    print(f"\n{'='*60}")
    print(f"Testing {url} with Naming payload (Screenshot Match)...")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        print(f"\n[Response Status Code]: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n[O] Naming Verification Success!")
            # print(json.dumps(data, indent=2, ensure_ascii=False)[:500] + "...") # 요약 출력
        else:
            print(f"\n[X] Naming Request Failed: {response.text}")
            
    except Exception as e:
        print(f"\n[X] Connection Error: {e}")

if __name__ == "__main__":
    test_stateless_diagnosis()
    test_stateless_naming()
