# matching.py
# 사용자 사주를 유명인 데이터베이스와 비교해 비슷한 사주를 가진 인물을 찾는 매칭 로직

import math

from saju import calculate_saju
from oheng import analyze_oheng
from celebrities import CELEBRITIES

_ELEMENTS = ("목", "화", "토", "금", "수")


def _celebrity_saju_and_oheng(celebrity: dict) -> tuple[dict, dict]:
    """유명인의 생년월일시로 사주/오행을 계산. 시(hour) 정보가 없으면 정오(12시)로 근사"""
    # ponytail: 시간 미상 인물은 시주가 부정확할 수 있음 (참고용 매칭이라 허용, 정확한 출처 확보 시 birth_hour 채워 넣기)
    hour = celebrity["birth_hour"] if celebrity["birth_hour"] is not None else 12
    saju_result = calculate_saju(
        year=celebrity["birth_year"], month=celebrity["birth_month"], day=celebrity["birth_day"],
        hour=hour, minute=0,
    )
    return saju_result, analyze_oheng(saju_result)


def _oheng_distance(a: dict, b: dict) -> float:
    """두 오행 분포 벡터 사이의 유클리드 거리 (작을수록 유사)"""
    return math.sqrt(sum((a[e] - b[e]) ** 2 for e in _ELEMENTS))


def find_celebrity_matches(saju_result: dict, oheng_result: dict, limit: int = 3) -> list[dict]:
    """
    사용자 사주를 유명인 데이터베이스와 비교해 유사한 인물을 유사도 순으로 반환.
    1순위: 일주(일간+일지) 완전 일치, 2순위: 일간 오행 일치, 3순위: 오행 분포 유사(유클리드 거리).
    """
    user_day_ganji = saju_result["day_pillar"]["hanja"]
    user_day_element = oheng_result["day_master"]["element"]
    user_distribution = oheng_result["distribution"]

    scored = []
    for celeb in CELEBRITIES:
        celeb_saju, celeb_oheng = _celebrity_saju_and_oheng(celeb)
        celeb_day_ganji = celeb_saju["day_pillar"]["hanja"]
        celeb_day_element = celeb_oheng["day_master"]["element"]

        if celeb_day_ganji == user_day_ganji:
            priority, match_reason = 1, "일주 일치"
        elif celeb_day_element == user_day_element:
            priority, match_reason = 2, "일간 오행 일치"
        else:
            priority, match_reason = 3, "오행 분포 유사"

        scored.append({
            "celebrity": celeb,
            "saju": celeb_saju,
            "oheng_analysis": celeb_oheng,
            "match_reason": match_reason,
            "priority": priority,
            "oheng_distance": _oheng_distance(user_distribution, celeb_oheng["distribution"]),
        })

    scored.sort(key=lambda item: (item["priority"], item["oheng_distance"]))
    return scored[:limit]


if __name__ == "__main__":
    sample = {
        "year_pillar": {"hanja": "庚午", "hangul": "경오"},
        "month_pillar": {"hanja": "丙戌", "hangul": "병술"},
        "day_pillar": {"hanja": "戊申", "hangul": "무신"},
        "hour_pillar": {"hanja": "己未", "hangul": "기미"},
    }
    oheng_result = analyze_oheng(sample)
    matches = find_celebrity_matches(sample, oheng_result)

    assert 1 <= len(matches) <= 3
    # 우선순위(priority)가 오름차순으로 정렬되어 있는지 확인
    assert all(matches[i]["priority"] <= matches[i + 1]["priority"] for i in range(len(matches) - 1))
    for m in matches:
        print(m["celebrity"]["name"], m["match_reason"], round(m["oheng_distance"], 2))
