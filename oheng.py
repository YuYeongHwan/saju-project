# oheng.py
# 천간/지지를 오행(목화토금수)으로 매핑하고, 사주 결과의 오행 분포를 분석하는 모듈

# 천간(天干) 10개 -> 오행 매핑 (갑을=목, 병정=화, 무기=토, 경신=금, 임계=수)
CHEONGAN_OHENG = {
    "甲": "목", "乙": "목",
    "丙": "화", "丁": "화",
    "戊": "토", "己": "토",
    "庚": "금", "辛": "금",
    "壬": "수", "癸": "수",
}

# 지지(地支) 12개 -> 오행 매핑 (인묘=목, 사오=화, 진술축미=토, 신유=금, 해자=수)
JIJI_OHENG = {
    "寅": "목", "卯": "목",
    "巳": "화", "午": "화",
    "辰": "토", "戌": "토", "丑": "토", "未": "토",
    "申": "금", "酉": "금",
    "亥": "수", "子": "수",
}


def analyze_oheng(saju_result: dict) -> dict:
    """
    calculate_saju()의 결과(4기둥)를 받아 오행 분포와 일간(일주 천간)을 계산.
    각 기둥의 hanja는 "천간+지지" 2글자이므로 앞글자는 천간 매핑, 뒷글자는 지지 매핑을 사용.
    """
    distribution = {"목": 0, "화": 0, "토": 0, "금": 0, "수": 0}

    for key in ("year_pillar", "month_pillar", "day_pillar", "hour_pillar"):
        cheongan, jiji = saju_result[key]["hanja"]
        distribution[CHEONGAN_OHENG[cheongan]] += 1
        distribution[JIJI_OHENG[jiji]] += 1

    # 일간: 일주의 천간, 본인을 상징하는 글자
    day_cheongan = saju_result["day_pillar"]["hanja"][0]

    return {
        "distribution": distribution,
        "day_master": {
            "hanja": day_cheongan,
            "element": CHEONGAN_OHENG[day_cheongan],
        },
    }


if __name__ == "__main__":
    sample = {
        "year_pillar": {"hanja": "庚午", "hangul": "경오"},
        "month_pillar": {"hanja": "丙戌", "hangul": "병술"},
        "day_pillar": {"hanja": "戊申", "hangul": "무신"},
        "hour_pillar": {"hanja": "己未", "hangul": "기미"},
    }
    analysis = analyze_oheng(sample)
    assert sum(analysis["distribution"].values()) == 8
    assert analysis["day_master"] == {"hanja": "戊", "element": "토"}
    print(analysis)
