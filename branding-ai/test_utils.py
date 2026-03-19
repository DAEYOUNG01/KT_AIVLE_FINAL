from langgraph_system.utils import flatten_context
import json

def test_flatten_context():
    # Case 1: Candidates List with Output Wrapper (Standard)
    context_1 = {
        "candidates": [
            {
                "candidate_id": 0,
                "output": {
                    "brand_name": "Name1",
                    "rationale": "Reason1"
                }
            },
            {
                "candidate_id": 1,
                "output": {
                    "brand_name": "Name2",
                    "rationale": "Reason2"
                }
            }
        ],
        "output_id": "out_1"
    }
    qa_1 = {"s3_current_name": "Name1"}
    
    print("Test 1 (Standard Wrapper):", flatten_context(context_1, qa_1))
    
    # Case 2: Candidates List Flattened (Backend Actual)
    context_2 = {
        "candidates": [
            {
                "brand_name": "NameA",
                "rationale": "ReasonA"
            },
            {
                "brand_name": "NameB",
                "rationale": "ReasonB"
            }
        ],
        "output_id": "out_2"
    }
    qa_2 = {"s3_current_name": "NameB"}
    
    print("\nTest 2 (Flattened List):", flatten_context(context_2, qa_2))

    # Case 3: No Candidates (Already Flat)
    context_3 = {
        "brand_name": "NameSingle",
        "rationale": "ReasonSingle"
    }
    print("\nTest 3 (Already Flat):", flatten_context(context_3))
    
    # Case 4: Fallback (No QA Selection)
    print("\nTest 4 (Fallback - No QA):", flatten_context(context_2))

if __name__ == "__main__":
    test_flatten_context()
