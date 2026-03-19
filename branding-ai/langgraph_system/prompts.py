"""
[Prompt Management System]
생성용 프롬프트(GenerationPrompts)는 영어로, 
검증용 프롬프트(VerificationPrompts)는 한국어로 관리합니다.
"""

class GenerationPrompts:
    """
    [Generation Prompts - English]
    Used for generating high-quality content using LLMs.
    """
    
    # Step 1: Diagnosis
    DIAGNOSIS_SYSTEM = (
        "You are a Brand Strategy Consultant. "
        "You will receive Q&A data in JSON format from answers.json. "
        "Analyze it from Business, User, and Market perspectives to provide comprehensive brand diagnosis."
    )
    
    DIAGNOSIS_USER = """
    [Brand Q&A Data - JSON Format]
    {qa_data_json}
    
    [JSON Parsing Instructions]
    The above data follows this structure:
    - "questions" array contains question-answer pairs
    - Each item has: "id", "question_text" (Korean), "answer"
    - If "answer" is a dict with "value" field, use the "value" (English key)
    - If "answer" is plain text, use it as-is (Korean text is acceptable)
    - If "answer" is a list, it's multiple selections
    
    [Task]
    Analyze the business context and provide:
    
    1. Multi-Perspective Analysis:
       - Business Perspective: Revenue model, scalability, competitive strengths
       - User Perspective: Target audience needs, pain points, benefits
       - Market Perspective: Market trends, competition, differentiation
       
    2. Core Insights:
       - Diagnosis Summary: Overall brand status (Brief, Natural tone)
       - Core Keywords: 3 keywords that best represent the brand
       - Target Persona: Descriptive name for core audience
       - Brand Essence: One-sentence essence of the brand
       - Emotional Core: Primary emotional trigger point
       - Differentiation Point: Key competitive advantage summary
    
    [Output Format - JSON]
    {{
      "summary": "Overall diagnosis in Korean (Natural tone, under 300 chars)...",
      "keywords": ["Keyword1", "Keyword2", "Keyword3"],
      "persona": "Target Persona",
      "perspectives": {{
        "business_perspective": "Analysis in Korean (Natural tone, under 300 chars)...",
        "user_perspective": "Analysis in Korean (Natural tone, under 300 chars)...",
        "market_perspective": "Analysis in Korean (Natural tone, under 300 chars)..."
      }},
      "brand_essence": "One-sentence brand essence in Korean",
      "emotional_core": "Primary emotional trigger in Korean",
      "differentiation_point": "Key competitive advantage in Korean"
    }}
    
    IMPORTANT: All text outputs must be in **KOREAN**, **Natural Human-like Tone**, and **Under 300 Characters**.
    """

    # Step 2: Naming
    NAMING_SYSTEM = (
        "You are a Creative Brand Naming Expert. "
        "Generate creative and market-fit brand names based on the brand diagnosis and user preferences."
    )
    
    NAMING_USER = """
    [Brand Context]
    - Diagnosis Summary: {diagnosis_summary}
    - Core Keywords: {core_keywords}
    - Target Persona: {target_persona}
    
    [User Q&A Data - JSON Format]
    {qa_data_json}
    
    {feedback_section}
    
    [Task]
    1. First, analyze the Q&A data to extract key insights about naming preferences.
    2. Generate 3 DISTINCT brand name candidates based on the analysis.
    
    IMPORTANT CONSTRAINTS:
    - **NO HANJA (Chinese Characters)**: The name must be in **Pure Korean (Hangul)** or **English** alphabets only. Do not use Chinese characters even for "meaning".
    - If the user prefers Korean, use Hangul. If English, use Latin alphabets.
    
    For each candidate, provide:
    - Brand Name: The proposed name (Korean or English as appropriate). NO HANJA.
    - Rationale: Why this name fits the brand strategy (Korean, natural tone, max 300 chars).
    - Q&A Analysis Summary: Brief summary of how Q&A insights influenced this name (Korean, natural tone, max 300 chars).
    - Q&A Keywords: 3-5 key terms extracted from Q&A that support this naming choice.
    
    [Output Format - JSON]
    {{
      "options": [
        {{
          "brand_name": "Name1",
          "name_rationale": "Reasoning in Korean (Natural tone, <300 chars)...",
          "qa_analysis_summary": "Q&A Analysis (Natural tone, <300 chars)...",
          "qa_keywords": ["키워드1", "키워드2", "키워드3"]
        }},
        ... (3 options total)
      ]
    }}
    """

    # Step 3: Concept
    CONCEPT_SYSTEM = (
        "You are a Brand Concept Architect. "
        "Develop a compelling brand concept statement and positioning strategy."
    )
    
    CONCEPT_USER = """
    [Brand Context]
    - Diagnosis Summary: {diagnosis_summary}
    - Selected Brand Name: {brand_name}
    - Naming Rationale: {name_rationale}
    
    [User Q&A Data - JSON Format]
    {qa_data_json}
    
    {feedback_section}
    
    [Task]
    1. First, analyze the Q&A data to understand concept direction preferences.
    2. Develop 3 unique concept directions for the brand '{brand_name}'.
    
    For each direction, provide:
    - Concept Statement: A catchy slogan or concept sentence.
    - Rationale: The strategic reasoning behind this concept (Korean, natural tone, max 300 chars).
    - Brand Values: 3-5 core brand values that this concept embodies (in Korean).
    - Q&A Analysis Summary: How Q&A insights shaped this concept (Korean, natural tone, max 300 chars).
    - Q&A Keywords: 3-5 key terms from Q&A that support this concept direction.
    
    [Output Format - JSON]
    {{
      "options": [
        {{
          "concept_statement": "Concept Sentence in Korean",
          "concept_rationale": "Reasoning in Korean (Natural tone, <300 chars)...",
          "brand_values": ["가치1", "가치2", "가치3"],
          "qa_analysis_summary": "Q&A Analysis (Natural tone, <300 chars)...",
          "qa_keywords": ["키워드1", "키워드2", "키워드3"]
        }},
        ... (3 options total)
      ]
    }}
    """

    # Step 4: Story
    STORY_SYSTEM = (
        "You are a Professional Brand Storyteller. "
        "Write a captivating brand introduction story that resonates with the target audience."
    )
    
    STORY_USER = """
    [Brand Context]
    - Brand Name: {brand_name}
    - Concept: {concept_statement}
    - Target Persona: {target_persona}
    
    [User Q&A Data - JSON Format]
    {qa_data_json}
    
    {feedback_section}
    
    [Task]
    1. First, analyze the Q&A data to identify storytelling themes and emotional tones.
    2. Write 3 different brand story variations.
    
    For each story, provide:
    - Brand Story: The narrative (Korean, natural tone, max 300 chars). **IMPORTANT: Keep the brand name '{brand_name}' in ENGLISH, do not translate it to Korean.**
    - Rationale: Why this storytelling approach works (Korean, natural tone, max 300 chars).
    - Emotional Arc: The emotional journey of the story (e.g., "고민 → 발견 → 변화" in Korean).
    - Q&A Analysis Summary: How Q&A insights influenced the story direction (Korean, natural tone, max 300 chars).
    - Q&A Keywords: 3-5 key terms from Q&A that support this narrative.
    
    [Output Format - JSON]
    {{
      "options": [
        {{
          "brand_story": "Story in Korean (Natural tone, <300 chars)...",
          "story_rationale": "Reasoning in Korean (Natural tone, <300 chars)...",
          "emotional_arc": "감정 흐름 (예: 번아웃 → 자연과의 만남 → 회복)",
          "qa_analysis_summary": "Q&A Analysis (Natural tone, <300 chars)...",
          "qa_keywords": ["키워드1", "키워드2", "키워드3"]
        }},
        ... (3 options total)
      ]
    }}
    """

    # Step 5: Logo
    LOGO_SYSTEM = (
        "You are a Modern Brand Identity Specialist. "
        "Your philosophy is 'Less is More'. "
        "You prioritize LOGOTYPE (Wordmark) over symbols, following the trend of Fortune 100 companies (e.g., Samsung, Sony, Braun, FedEx). "
        "The Brand Name is the artwork. Providing a clean, timeless look is your ultimate goal."
    )
    
    LOGO_USER = """
    [Brand Context]
    - Brand Name: {brand_name}
    - Concept: {concept_statement}
    - Story Essence: {brand_story}
    - Core Keywords: {core_keywords}
    
    [User Q&A Data - JSON Format]
    {qa_data_json}
    
    {feedback_section}
    
    [Task]
    Create 3 DISTINCT **Wordmark-Centric** logo concepts for '{brand_name}'.
    
    IMPORTANT: You MUST generate 3 different LAYOUT styles as follows:
    1. **Option 1: Horizontal Layout** (Symbol on Left + Text on Right). Standard Corporate Style.
    2. **Option 2: Integrated Layout** (Text IS the Symbol). Modifying a letter slightly (e.g. A as a triangle). Keep it readable.
    3. **Option 3: Stacked Layout** (Small Symbol on Top + Text Below). Minimal vertical alignment.
    
    Output Format - JSON:
    1. **layout_type**: One of ["Horizontal", "Integrated", "Stacked"].
    2. **style_keywords**: ["Minimalist", "Flat", "Clean", "Sans-Serif", "Modern"]
    3. **color_palette**: List of hex codes.
    4. **benchmark_brand**: (e.g., "Braun", "Tesla", "Uber", "Sony")
    5. **logo_concept**: (Korean) The concept summary describing what this logo represents.
    6. **logo_rationale**: (Korean) Detailed reasoning why this layout and style fit the brand strategy.
    7. **qa_analysis_summary**: (Korean) 2-3 sentences summarizing how Q&A insights influenced this logo direction.
    8. **qa_keywords**: (Korean) 3-5 key terms from Q&A that support this logo design.
    9. **visual_instruction**: (English) Strict instruction for the graphic generation based on the LAYOUT.
       - **Horizontal**: "A tiny solid icon on the LEFT. Large text '{brand_name}' on the RIGHT."
       - **Integrated**: "The text '{brand_name}' in bold sans-serif. The letter 'i' has a square dot. No extra icons."
       - **Stacked**: "A tiny geometric shape centered ABOVE. The text '{brand_name}' centered BELOW."
    
    [Output Format - JSON]
    {{
      "options": [
        {{
          "layout_type": "Horizontal",
          "style_keywords": ["Minimalist", "Clean"],
          "color_palette": ["#0F2027"],
          "benchmark_brand": "Samsung",
          "logo_concept": "왼쪽에 견고한 심볼을 배치하여 신뢰감을 주는 구성...",
          "logo_rationale": "이 레이아웃은 심볼과 텍스트의 균형을 통해 전문성과 신뢰감을 전달합니다...",
          "qa_analysis_summary": "사용자는 Q&A에서 '전문적', '신뢰'를 강조했으며, 이를 Horizontal 레이아웃으로 표현했습니다.",
          "qa_keywords": ["전문성", "신뢰", "균형"],
          "visual_instruction": "A horizontal logo layout. On the far LEFT, a small solid blue square symbol. On the RIGHT, the brand name '{brand_name}' in bold sans-serif font. Vertically centered alignment. White background."
        }},
        {{
          "layout_type": "Integrated",
          "style_keywords": ["Modern", "Typographic"],
          "logo_concept": "글자 속에 심볼을 숨겨 일체감을 주는 구성...",
          "logo_rationale": "글자와 심볼을 통합하여 간결하고 현대적인 이미지를 구축합니다...",
          "qa_analysis_summary": "사용자는 '혁신적', '간결함'을 중시하며, Integrated 타입으로 이를 구현했습니다.",
          "qa_keywords": ["혁신", "간결", "타이포그래피"],
          "visual_instruction": "A typographic logo where the text is the main element. The brand name '{brand_name}' in black bold font. The letter 'A' is replaced by a simple triangle. No other icons. White background."
        }},
        {{
          "layout_type": "Stacked",
          "logo_concept": "심볼을 상단에 작게 배치한 모던한 구성...",
          "logo_rationale": "상하 구조로 정돈된 인상을 주며, 모바일 환경에서도 가독성이 우수합니다...",
          "qa_analysis_summary": "사용자는 '깔끔함', '정돈'을 선호하며, Stacked 레이아웃으로 표현했습니다.",
          "qa_keywords": ["정돈", "깔끔", "수직구조"],
          "visual_instruction": "A vertical stacked logo. A tiny minimalist line icon centered at the TOP. The brand name '{brand_name}' centered BELOW the icon in bold sans-serif. Balanced spacing. White background."
        }}
      ]
    }}
    
    IMPORTANT:
    - **TEXT IS KING**: The symbol size must be < 20% of the text.
    - **CLEAN**: No complex illustrations, no 3D effects, no shadows.
    - **READABLE**: The brand name must be clearly legible.
    - **DRY LANGUAGE**: In 'visual_instruction', do NOT use adjectives like "Beautiful", "Stunning", "Luxury", "Creative". Use only physical descriptions (e.g., "Solid", "Geometric", "Black", "Bold").
    - Each option must feel structurally different, not just color variations.
    """

