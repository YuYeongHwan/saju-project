# family.py
# 십신 분석 결과와 사주 기둥 위치를 결합해 전통 명리학의 가족관계 해석(참고용)을 구성하는 모듈
# ⚠️ 아래 매핑은 전통 명리학 통설을 간략화한 참고용 콘텐츠이며, 단정적 사실이 아님

# 십신별 가족 라벨 (간략화된 전통 통설, 참고용)
SIPSIN_FAMILY_LABEL = {
    "정인": "어머니",
    "편인": "계모/이모",
    "정관": "배우자(여성 기준)/직장",
    "편관": "배우자(여성 기준 외)/자녀(남성 기준)",
    "정재": "아내(남성 기준)/재물",
    "편재": "아버지/애인",
    "식신": "자녀(여성 기준)/장모",
    "상관": "자녀",
    "비견": "형제자매",
    "겁재": "이복형제",
}

# 기둥 위치별 기본 의미
PILLAR_POSITION_MEANING = {
    "year_pillar": "조상궁",
    "month_pillar": "부모/형제궁",
    "day_pillar": "배우자궁(본인)",
    "hour_pillar": "자녀궁",
}

PILLAR_LABEL = {
    "year_pillar": "연주",
    "month_pillar": "월주",
    "day_pillar": "일주",
    "hour_pillar": "시주",
}


def build_family_analysis(saju_result: dict, sipsin_data: dict) -> dict:
    """
    기둥(연/월/일/시)의 천간·지지 글자마다 십신 + 가족 라벨을 매핑한 구조화 데이터를 반환.
    일주 천간(일간)은 십신 계산 대상이 아니므로 "본인"으로 표기.
    """
    pillars = {}
    for key in ("year_pillar", "month_pillar", "day_pillar", "hour_pillar"):
        cheongan_hanja, jiji_hanja = saju_result[key]["hanja"]

        if key == "day_pillar":
            cheongan_info = {"hanja": cheongan_hanja, "sipsin": None, "family_label": "본인(일간)"}
        else:
            sipsin = sipsin_data[f"{key}_cheongan"]
            cheongan_info = {"hanja": cheongan_hanja, "sipsin": sipsin, "family_label": SIPSIN_FAMILY_LABEL[sipsin]}

        jiji_sipsin = sipsin_data[f"{key}_jiji"]
        jiji_info = {"hanja": jiji_hanja, "sipsin": jiji_sipsin, "family_label": SIPSIN_FAMILY_LABEL[jiji_sipsin]}

        pillars[key] = {
            "label": PILLAR_LABEL[key],
            "position_meaning": PILLAR_POSITION_MEANING[key],
            "cheongan": cheongan_info,
            "jiji": jiji_info,
        }

    return {
        "disclaimer": "아래 가족관계 해석은 전통 명리학 통설을 간략화한 참고용 콘텐츠이며, 단정적 사실이 아닙니다.",
        "pillars": pillars,
    }


if __name__ == "__main__":
    from sipsin import analyze_sipsin

    sample = {
        "year_pillar": {"hanja": "庚午", "hangul": "경오"},
        "month_pillar": {"hanja": "丙戌", "hangul": "병술"},
        "day_pillar": {"hanja": "戊申", "hangul": "무신"},
        "hour_pillar": {"hanja": "己未", "hangul": "기미"},
    }
    sipsin_data = analyze_sipsin(sample)
    analysis = build_family_analysis(sample, sipsin_data)

    assert analysis["pillars"]["day_pillar"]["cheongan"]["family_label"] == "본인(일간)"
    assert set(analysis["pillars"].keys()) == {"year_pillar", "month_pillar", "day_pillar", "hour_pillar"}
    print(analysis)
