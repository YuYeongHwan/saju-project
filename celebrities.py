# celebrities.py
# 유명인 사주 매칭에 사용할 예시 인물 데이터베이스.
# 생년월일은 공개된 자료(위키백과 등) 기준의 예시이며, 시(時)가 불확실한 인물은 birth_hour를 None으로 둠.
# ponytail: 역사 인물(세종대왕, 이순신)의 생년월일은 음력->양력 환산에 따라 자료마다 차이가 있어
#           참고용 예시로만 사용할 것. 실서비스 전에는 출처를 직접 검증해 채워 넣을 것.

CELEBRITIES = [
    {
        "name": "스티브 잡스",
        "gender": "남성",
        "category": "역사적 인물",
        "birth_year": 1955, "birth_month": 2, "birth_day": 24, "birth_hour": None,
        "bio": "애플의 공동창업자. 개인용 컴퓨터와 스마트폰 시장에 큰 영향을 남겼다. 완벽주의적 성향과 강한 추진력으로 유명하다.",
        "traits": ["추진력", "완벽주의", "혁신"],
    },
    {
        "name": "알베르트 아인슈타인",
        "gender": "남성",
        "category": "역사적 인물",
        "birth_year": 1879, "birth_month": 3, "birth_day": 14, "birth_hour": None,
        "bio": "상대성이론을 제시한 이론물리학자. 관습에 얽매이지 않는 독창적 사고로 과학사에 큰 발자취를 남겼다.",
        "traits": ["독창성", "탐구심", "집중력"],
    },
    {
        "name": "세종대왕",
        "gender": "남성",
        "category": "역사적 인물",
        "birth_year": 1397, "birth_month": 5, "birth_day": 15, "birth_hour": None,
        "bio": "조선의 4대 왕. 훈민정음 창제를 비롯해 과학·문화·군사 전반에서 다양한 업적을 남겼다. (음력 생일의 양력 환산치, 참고용)",
        "traits": ["학구열", "애민정신", "치밀함"],
    },
    {
        "name": "오프라 윈프리",
        "gender": "여성",
        "category": "연예인",
        "birth_year": 1954, "birth_month": 1, "birth_day": 29, "birth_hour": None,
        "bio": "미국의 방송인이자 미디어 기업가. 토크쇼 진행자로 시작해 미디어 제국을 일군 것으로 유명하다.",
        "traits": ["공감능력", "카리스마", "사업수완"],
    },
    {
        "name": "마이클 조던",
        "gender": "남성",
        "category": "스포츠 스타",
        "birth_year": 1963, "birth_month": 2, "birth_day": 17, "birth_hour": None,
        "bio": "미국의 전 농구선수. NBA 역사상 최고의 선수 중 한 명으로 꼽히며, 강한 승부욕으로 유명하다.",
        "traits": ["승부욕", "리더십", "지구력"],
    },
    {
        "name": "김남준(RM)",
        "gender": "남성",
        "category": "연예인",
        "birth_year": 1994, "birth_month": 9, "birth_day": 12, "birth_hour": None,
        "bio": "방탄소년단(BTS)의 리더. 작사·작곡가로도 활동하며 팀을 이끄는 리더십으로 알려져 있다.",
        "traits": ["리더십", "감수성", "언어능력"],
    },
    {
        "name": "손흥민",
        "gender": "남성",
        "category": "스포츠 스타",
        "birth_year": 1992, "birth_month": 7, "birth_day": 8, "birth_hour": None,
        "bio": "대한민국의 축구선수. 프리미어리그에서 활약하며 성실함과 꾸준한 자기관리로 정상급 기량을 유지하고 있다.",
        "traits": ["성실함", "꾸준함", "승부근성"],
    },
    {
        "name": "이순신",
        "gender": "남성",
        "category": "역사적 인물",
        "birth_year": 1545, "birth_month": 4, "birth_day": 28, "birth_hour": None,
        "bio": "조선 중기의 무신. 임진왜란 당시 수군을 이끌어 여러 해전을 승리로 이끌었다. (음력 생일의 양력 환산치, 참고용)",
        "traits": ["책임감", "전략적 사고", "충성심"],
    },
]
