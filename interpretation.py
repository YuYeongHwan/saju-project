# interpretation.py
# 사주 4기둥 + 오행 분석 결과를 바탕으로 Claude API를 호출해 운세 해석 텍스트를 생성하는 모듈

import json
import os
import re

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MODEL = "claude-sonnet-4-5-20250929"

_SYSTEM_PROMPT = (
    "당신은 전문적이면서도 친근한 한국어 사주 상담사입니다. "
    "근거 없는 단정이나 불안을 조장하는 표현은 피하고, "
    "\"~한 경향이 있습니다\", \"~에 신경쓰면 좋습니다\"와 같이 완곡한 표현을 사용하세요. "
    "다른 설명이나 인사말 없이 JSON 객체 하나만 출력하세요."
)

# 모델이 코드블록으로 감싸서 응답하는 경우를 대비한 방어적 파싱용 패턴
_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _build_prompt(saju_result: dict, oheng_data: dict) -> str:
    """4기둥 정보와 오행 분포를 Claude에게 전달할 프롬프트 텍스트로 조립"""
    pillars = (
        f"연주 {saju_result['year_pillar']['hanja']}({saju_result['year_pillar']['hangul']}), "
        f"월주 {saju_result['month_pillar']['hanja']}({saju_result['month_pillar']['hangul']}), "
        f"일주 {saju_result['day_pillar']['hanja']}({saju_result['day_pillar']['hangul']}), "
        f"시주 {saju_result['hour_pillar']['hanja']}({saju_result['hour_pillar']['hangul']})"
    )
    distribution = oheng_data["distribution"]
    oheng_text = ", ".join(f"{k} {v}개" for k, v in distribution.items())
    day_master = oheng_data["day_master"]

    return (
        "아래 사주 정보를 바탕으로 운세를 해석해주세요.\n\n"
        f"- 사주 4기둥: {pillars}\n"
        f"- 오행 분포: {oheng_text}\n"
        f"- 일간(본인을 상징하는 글자): {day_master['hanja']} ({day_master['element']})\n\n"
        "다음 3가지 항목을 각각 3~4문장으로 해석한 뒤, "
        "아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):\n"
        '{"overall": "종합운 해석", "love": "연애운 해석", "money": "금전운 해석"}'
    )


def generate_interpretation(saju_result: dict, oheng_data: dict) -> dict:
    """
    사주 4기둥과 오행 분석 결과를 바탕으로 Claude API를 호출해
    종합운(overall)/연애운(love)/금전운(money) 해석 텍스트를 JSON으로 반환.
    """
    message = _client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _build_prompt(saju_result, oheng_data)}],
    )

    raw_text = _CODE_FENCE_RE.sub("", message.content[0].text.strip()).strip()

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Claude 응답을 JSON으로 파싱하지 못했습니다: {raw_text}") from e

    missing = {"overall", "love", "money"} - parsed.keys()
    if missing:
        raise ValueError(f"Claude 응답에 필요한 필드가 없습니다: {missing}")

    return parsed


if __name__ == "__main__":
    # 실제 API 호출 없이 JSON 파싱/필드 검증 로직만 점검하는 간단한 자가 테스트
    from unittest.mock import patch, MagicMock

    fake_response = MagicMock()
    fake_response.content = [MagicMock(text='{"overall": "a", "love": "b", "money": "c"}')]

    with patch.object(_client.messages, "create", return_value=fake_response):
        result = generate_interpretation(
            saju_result={
                "year_pillar": {"hanja": "庚午", "hangul": "경오"},
                "month_pillar": {"hanja": "丙戌", "hangul": "병술"},
                "day_pillar": {"hanja": "戊申", "hangul": "무신"},
                "hour_pillar": {"hanja": "己未", "hangul": "기미"},
            },
            oheng_data={
                "distribution": {"목": 0, "화": 2, "토": 4, "금": 2, "수": 0},
                "day_master": {"hanja": "戊", "element": "토"},
            },
        )
        assert result == {"overall": "a", "love": "b", "money": "c"}
        print("OK:", result)
