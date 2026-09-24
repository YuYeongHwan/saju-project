# saju.py

from datetime import datetime
from korean_saju import Saju, load_bundled_data
from korean_lunar_calendar import KoreanLunarCalendar

_lunar, _solar_terms = load_bundled_data()


def convert_lunar_to_solar(year: int, month: int, day: int, is_leap_month: bool = False) -> tuple[int, int, int]:
    """음력 생년월일(윤달 여부 포함)을 양력 생년월일로 변환"""
    calendar = KoreanLunarCalendar()
    if not calendar.setLunarDate(year, month, day, is_leap_month):
        raise ValueError(f"유효하지 않은 음력 날짜입니다: {year}-{month}-{day} (윤달: {is_leap_month})")
    return calendar.solarYear, calendar.solarMonth, calendar.solarDay

def calculate_saju(year: int, month: int, day: int, hour: int, minute: int,
                    longitude: float = 126.9784) -> dict:
    """
    양력 생년월일시를 입력받아 사주 4기둥(연주·월주·일주·시주)을 계산해 반환.
    longitude: 출생지 경도 (기본값 서울 = 126.9784)
    """
    birth = datetime(year, month, day, hour, minute)

    saju = Saju.from_birth(
        kst_moment=birth,
        solar_terms=_solar_terms,
        longitude=longitude,
        yaja_si_separated=True,
    )

    # 기둥 하나(예: year_pillar)를 한자+한글 딕셔너리로 변환하는 내부 함수.
    # 4번 반복 작성하지 않으려고 별도 함수로 뽑았습니다 (중복 제거).
    def pillar_to_dict(pillar):
        return {"hanja": pillar.hanja, "hangul": pillar.hangul}

    return {
        "year_pillar": pillar_to_dict(saju.year_pillar),
        "month_pillar": pillar_to_dict(saju.month_pillar),
        "day_pillar": pillar_to_dict(saju.day_pillar),
        "hour_pillar": pillar_to_dict(saju.hour_pillar),
    }


if __name__ == "__main__":
    result = calculate_saju(1990, 10, 10, 14, 30)
    print(result)