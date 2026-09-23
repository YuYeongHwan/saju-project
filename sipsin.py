# sipsin.py
# 일간(일주 천간, "나 자신")을 기준으로 나머지 7글자의 십신(十神)을 계산하는 모듈

from oheng import CHEONGAN_OHENG, JIJI_OHENG

# 천간 음양 (갑병무경임=양, 을정기신계=음)
CHEONGAN_YINYANG = {
    "甲": "양", "丙": "양", "戊": "양", "庚": "양", "壬": "양",
    "乙": "음", "丁": "음", "己": "음", "辛": "음", "癸": "음",
}

# 지지 음양 (자인진오신술=양, 축묘사미유해=음)
JIJI_YINYANG = {
    "子": "양", "寅": "양", "辰": "양", "午": "양", "申": "양", "戌": "양",
    "丑": "음", "卯": "음", "巳": "음", "未": "음", "酉": "음", "亥": "음",
}

# 오행 상생(生): key가 value를 생함 (목생화, 화생토, 토생금, 금생수, 수생목)
SAENG = {"목": "화", "화": "토", "토": "금", "금": "수", "수": "목"}
# 오행 상극(剋): key가 value를 극함 (목극토, 토극수, 수극화, 화극금, 금극목)
GEUK = {"목": "토", "토": "수", "수": "화", "화": "금", "금": "목"}


def _get_sipsin(day_element: str, day_yinyang: str, target_element: str, target_yinyang: str) -> str:
    """일간의 오행·음양과 대상 글자의 오행·음양을 비교해 십신 이름 하나를 반환"""
    same_yinyang = day_yinyang == target_yinyang

    if target_element == day_element:
        return "비견" if same_yinyang else "겁재"
    if SAENG[target_element] == day_element:  # 대상 오행이 일간을 생함 -> 인성
        return "편인" if same_yinyang else "정인"
    if SAENG[day_element] == target_element:  # 일간이 대상 오행을 생함 -> 식상
        return "식신" if same_yinyang else "상관"
    if GEUK[target_element] == day_element:  # 대상 오행이 일간을 극함 -> 관성
        return "편관" if same_yinyang else "정관"
    return "편재" if same_yinyang else "정재"  # 일간이 대상 오행을 극함 -> 재성


def analyze_sipsin(saju_result: dict) -> dict:
    """
    일간(일주 천간)을 제외한 나머지 7글자
    (연주 천간·지지, 월주 천간·지지, 일지, 시주 천간·지지) 각각의 십신을 계산.
    """
    day_cheongan = saju_result["day_pillar"]["hanja"][0]
    day_element = CHEONGAN_OHENG[day_cheongan]
    day_yinyang = CHEONGAN_YINYANG[day_cheongan]

    sipsin = {}
    for pillar_key in ("year_pillar", "month_pillar", "day_pillar", "hour_pillar"):
        cheongan, jiji = saju_result[pillar_key]["hanja"]

        if pillar_key != "day_pillar":  # 일간 자신(일주 천간)은 비교 대상에서 제외
            sipsin[f"{pillar_key}_cheongan"] = _get_sipsin(
                day_element, day_yinyang, CHEONGAN_OHENG[cheongan], CHEONGAN_YINYANG[cheongan]
            )
        sipsin[f"{pillar_key}_jiji"] = _get_sipsin(
            day_element, day_yinyang, JIJI_OHENG[jiji], JIJI_YINYANG[jiji]
        )

    return sipsin


if __name__ == "__main__":
    # 갑(甲) 일간 기준 고전 십신표로 매핑 로직 자체를 검증
    expected = {
        "甲": "비견", "乙": "겁재",
        "丙": "식신", "丁": "상관",
        "戊": "편재", "己": "정재",
        "庚": "편관", "辛": "정관",
        "壬": "편인", "癸": "정인",
    }
    day_element = CHEONGAN_OHENG["甲"]
    day_yinyang = CHEONGAN_YINYANG["甲"]
    for cheongan, expected_sipsin in expected.items():
        actual = _get_sipsin(day_element, day_yinyang, CHEONGAN_OHENG[cheongan], CHEONGAN_YINYANG[cheongan])
        assert actual == expected_sipsin, f"{cheongan}: expected {expected_sipsin}, got {actual}"
    print("고전 십신표 검증 통과")

    sample = {
        "year_pillar": {"hanja": "庚午"}, "month_pillar": {"hanja": "丙戌"},
        "day_pillar": {"hanja": "戊申"}, "hour_pillar": {"hanja": "己未"},
    }
    print(analyze_sipsin(sample))
