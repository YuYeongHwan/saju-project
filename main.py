# main.py

from typing import Literal

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from saju import calculate_saju, convert_lunar_to_solar
from oheng import analyze_oheng
from sipsin import analyze_sipsin
from family import build_family_analysis
from interpretation import generate_interpretation, generate_celebrity_comparison
from matching import find_celebrity_matches
from cities import CITY_LONGITUDE, DEFAULT_LONGITUDE
from database import Base, engine, get_db
from models import SajuQuery

# 앱 시작 시, models.py에 정의된 테이블이 DB에 없으면 자동으로 생성
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


class SajuRequest(BaseModel):
    year: int = Field(..., ge=1900, le=2050)
    month: int = Field(..., ge=1, le=12)
    day: int = Field(..., ge=1, le=31)
    hour: int = Field(..., ge=0, le=23)
    minute: int = Field(0, ge=0, le=59)
    gender: Literal["남성", "여성"]
    calendar_type: Literal["solar", "lunar"] = "solar"
    is_leap_month: bool = False  # calendar_type이 lunar일 때만 의미 있음
    birth_city: str | None = None  # CITY_LONGITUDE에 등록된 도시명 (진태양시 보정용)
    longitude: float | None = None  # 직접 입력한 경도. 지정 시 birth_city보다 우선


def _resolve_solar_birth(request: SajuRequest) -> tuple[int, int, int, float]:
    """요청에서 실제 사주 계산에 쓸 양력 생년월일과 경도를 확정 (음력 변환 + 도시->경도 매핑)"""
    if request.calendar_type == "lunar":
        year, month, day = convert_lunar_to_solar(request.year, request.month, request.day, request.is_leap_month)
    else:
        year, month, day = request.year, request.month, request.day

    if request.longitude is not None:
        longitude = request.longitude
    elif request.birth_city:
        if request.birth_city not in CITY_LONGITUDE:
            raise HTTPException(status_code=400, detail=f"등록되지 않은 도시입니다: {request.birth_city}")
        longitude = CITY_LONGITUDE[request.birth_city]
    else:
        longitude = DEFAULT_LONGITUDE

    return year, month, day, longitude


@app.post("/saju")
def get_saju(request: SajuRequest, db: Session = Depends(get_db)):
    year, month, day, longitude = _resolve_solar_birth(request)
    try:
        result = calculate_saju(
            year=year, month=month, day=day,
            hour=request.hour, minute=request.minute, longitude=longitude,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 날짜입니다: {e}")

    # 오행/십신/가족관계 계산과 Claude 해석 생성은 사주 계산과 분리된 함수로 각각 처리
    oheng_analysis = analyze_oheng(result)
    sipsin_analysis = analyze_sipsin(result)
    family_analysis = build_family_analysis(result, sipsin_analysis, request.gender)
    try:
        interpretation = generate_interpretation(result, oheng_analysis, request.gender)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"운세 해석 생성에 실패했습니다: {e}")

    response = {
        **result,
        "gender": request.gender,
        "calendar_type": request.calendar_type,
        "birth_city": request.birth_city,
        "oheng_analysis": oheng_analysis,
        "sipsin_analysis": sipsin_analysis,
        "family_analysis": family_analysis,
        "interpretation": interpretation,
    }

    # DB 컬럼은 실제 계산에 쓰인 양력 날짜를 저장 (성별/음양력/도시 등 부가정보는 result JSON에 포함)
    query_record = SajuQuery(
        year=year, month=month, day=day,
        hour=request.hour, minute=request.minute, longitude=longitude,
        result=response,
    )
    db.add(query_record)
    db.commit()
    db.refresh(query_record)

    return response


@app.post("/saju/celebrity-match")
def get_celebrity_match(request: SajuRequest):
    """사용자 사주와 닮은 유명인을 찾아 비교 해석과 함께 반환. Claude 호출이 여러 번 발생할 수 있어 /saju와 분리된 엔드포인트로 구성"""
    year, month, day, longitude = _resolve_solar_birth(request)
    try:
        result = calculate_saju(
            year=year, month=month, day=day,
            hour=request.hour, minute=request.minute, longitude=longitude,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 날짜입니다: {e}")

    oheng_analysis = analyze_oheng(result)
    matches = find_celebrity_matches(result, oheng_analysis)

    matched = []
    for m in matches:
        celeb = m["celebrity"]
        try:
            comparison = generate_celebrity_comparison(result, oheng_analysis, celeb)
        except Exception:
            # 비교 문장 생성 실패는 매칭 결과 자체를 막지 않고 문구만 비워둠
            comparison = None

        matched.append({
            "name": celeb["name"],
            "category": celeb["category"],
            "bio": celeb["bio"],
            "traits": celeb["traits"],
            "match_reason": m["match_reason"],
            "comparison": comparison,
        })

    return {"matches": matched}


@app.get("/history")
def get_history(limit: int = 20, db: Session = Depends(get_db)):
    """최근 조회 기록을 최신순으로 반환"""
    records = (
        db.query(SajuQuery)
        .order_by(desc(SajuQuery.created_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "year": r.year, "month": r.month, "day": r.day,
            "hour": r.hour, "minute": r.minute,
            "result": r.result,
            "created_at": r.created_at,
        }
        for r in records
    ]
