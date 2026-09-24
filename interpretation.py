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

_PERSONA_PROMPT = (
    "당신은 전문적이면서도 친근한 한국어 사주 상담사입니다. "
    "근거 없는 단정이나 불안을 조장하는 표현은 피하고, "
    "\"~한 경향이 있습니다\", \"~에 신경쓰면 좋습니다\"와 같이 완곡한 표현을 사용하세요."
)

# JSON 응답이 필요한 호출(운세 해석)에 사용하는 시스템 프롬프트
_JSON_SYSTEM_PROMPT = _PERSONA_PROMPT + " 다른 설명이나 인사말 없이 JSON 객체 하나만 출력하세요."

# 모델이 코드블록으로 감싸서 응답하는 경우를 대비한 방어적 파싱용 패턴
_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _build_prompt(saju_result: dict, oheng_data: dict, gender: str = "남성") -> str:
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
        f"- 일간(본인을 상징하는 글자): {day_master['hanja']} ({day_master['element']})\n"
        f"- 성별: {gender}\n\n"
        "다음 5가지 항목을 각각 3~4문장으로 해석한 뒤, "
        "아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이). "
        "특히 love 항목은 배우자/연인 관련 표현을 사용자의 성별에 자연스럽게 맞춰 작성하세요:\n"
        '{"overall": "종합운 해석", "personality": "성격 해석", "career": "직업운 해석", '
        '"love": "연애운 해석", "money": "금전운 해석"}'
    )


_INTERPRETATION_FIELDS = {"overall", "personality", "career", "love", "money"}


def _call_claude_json(prompt: str, max_tokens: int = 1024) -> dict:
    """Claude를 호출해 JSON 객체 하나를 받아 파싱. 코드블록 감싸짐 방어 + 파싱 실패 시 예외"""
    message = _client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        system=_JSON_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    raw_text = _CODE_FENCE_RE.sub("", message.content[0].text.strip()).strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Claude 응답을 JSON으로 파싱하지 못했습니다: {raw_text}") from e


def generate_interpretation(saju_result: dict, oheng_data: dict, gender: str = "남성") -> dict:
    """
    사주 4기둥과 오행 분석 결과를 바탕으로 Claude API를 1회 호출해
    종합운(overall)/성격(personality)/직업운(career)/연애운(love)/금전운(money) 해석을 JSON으로 반환.
    """
    parsed = _call_claude_json(_build_prompt(saju_result, oheng_data, gender), max_tokens=2048)

    missing = _INTERPRETATION_FIELDS - parsed.keys()
    if missing:
        raise ValueError(f"Claude 응답에 필요한 필드가 없습니다: {missing}")

    return parsed


def generate_celebrity_comparison(user_saju: dict, user_oheng: dict, celebrity: dict) -> str:
    """사용자와 매칭된 유명인의 사주 기운을 비교해 공통점/차이점을 자연스러운 문장으로 생성"""
    day_master = user_oheng["day_master"]
    distribution_text = ", ".join(f"{k} {v}개" for k, v in user_oheng["distribution"].items())

    prompt = (
        f"사용자의 일간은 {day_master['hanja']}({day_master['element']})이고, "
        f"오행 분포는 {distribution_text}입니다.\n"
        f"비교 대상 인물: {celebrity['name']} ({celebrity['category']}). {celebrity['bio']}\n\n"
        "두 사람의 사주(오행 기운)를 비교해 공통점과 차이점을 한국어 문장 2~3개로 설명해주세요. "
        "인물의 실제 삶이나 성패를 단정적으로 평가하지 말고, 사주 기운 비교에만 집중해주세요. "
        "다른 설명 없이 문장만 출력하세요 (JSON이 아닌 일반 텍스트)."
    )

    message = _client.messages.create(
        model=MODEL,
        max_tokens=512,
        system=_PERSONA_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip()


if __name__ == "__main__":
    # 실제 API 호출 없이 JSON 파싱/필드 검증 로직만 점검하는 간단한 자가 테스트
    from unittest.mock import patch, MagicMock

    fake_response = MagicMock()
    fake_response.content = [MagicMock(
        text='{"overall": "a", "personality": "b", "career": "c", "love": "d", "money": "e"}'
    )]

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
        assert result == {"overall": "a", "personality": "b", "career": "c", "love": "d", "money": "e"}
        print("OK:", result)

    fake_text_response = MagicMock()
    fake_text_response.content = [MagicMock(text="두 사람 모두 무(戊) 일간을 타고나...")]
    with patch.object(_client.messages, "create", return_value=fake_text_response):
        comparison = generate_celebrity_comparison(
            user_saju={},
            user_oheng={
                "distribution": {"목": 0, "화": 2, "토": 4, "금": 2, "수": 0},
                "day_master": {"hanja": "戊", "element": "토"},
            },
            celebrity={"name": "테스트 인물", "category": "역사적 인물", "bio": "예시 약력입니다."},
        )
        assert isinstance(comparison, str) and comparison
        print("OK:", comparison)
