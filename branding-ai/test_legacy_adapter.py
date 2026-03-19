
import requests
import json

def test_legacy_adapter():
    url = "http://127.0.0.1:8000/brands/interview"
    
    # Legacy Payload Structure (mimicking Backend before refactoring)
    payload = {
        "brand_id": "legacy_brand_123",  # Should be ignored/handled
        "qa_answers": {                  # Should be mapped to user_input
            "q1": {"value": "AI 스타트업"},
            "q2": {"value": "혁신적인"},
            "q3": {"value": "2030 남성"},
            "q4": {"value": "글로벌 시장 진출"},
            "q5": {"value": "심플한"}
        }
    }
    
    print(f"Testing Legacy Adapter: {url}")
    print("Sending Legacy Payload:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    
    try:
        response = requests.post(url, json=payload)
        
        print(f"\n[Response Status]: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ Adapter Success! Response Received:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            if "result" in data and "state_context" in data:
                print("\n✅ Response structure valid.")
            else:
                print("\n⚠️ Response structure might be missing keys.")
        else:
            print(f"\n❌ Request Failed: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Connection Error: {e}")

if __name__ == "__main__":
    test_legacy_adapter()
