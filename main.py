# main.py

from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from saju import calculate_saju
from oheng import analyze_oheng
from sipsin import analyze_sipsin
from family import build_family_analysis
from interpretation import generate_interpretation, generate_celebrity_comparison
from matching import find_celebrity_matches
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
    longitude: float = Field(126.9784)


@app.post("/saju")
def get_saju(request: SajuRequest, db: Session = Depends(get_db)):
    try:
        result = calculate_saju(
            year=request.year, month=request.month, day=request.day,
            hour=request.hour, minute=request.minute, longitude=request.longitude,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 날짜입니다: {e}")

    # 오행/십신/가족관계 계산과 Claude 해석 생성은 사주 계산과 분리된 함수로 각각 처리
    oheng_analysis = analyze_oheng(result)
    sipsin_analysis = analyze_sipsin(result)
    family_analysis = build_family_analysis(result, sipsin_analysis)
    try:
        interpretation = generate_interpretation(result, oheng_analysis)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"운세 해석 생성에 실패했습니다: {e}")

    response = {
        **result,
        "oheng_analysis": oheng_analysis,
        "sipsin_analysis": sipsin_analysis,
        "family_analysis": family_analysis,
        "interpretation": interpretation,
    }

    query_record = SajuQuery(
        year=request.year, month=request.month, day=request.day,
        hour=request.hour, minute=request.minute, longitude=request.longitude,
        result=response,
    )
    db.add(query_record)
    db.commit()
    db.refresh(query_record)

    return response


@app.post("/saju/celebrity-match")
def get_celebrity_match(request: SajuRequest):
    """사용자 사주와 닮은 유명인을 찾아 비교 해석과 함께 반환. Claude 호출이 여러 번 발생할 수 있어 /saju와 분리된 엔드포인트로 구성"""
    try:
        result = calculate_saju(
            year=request.year, month=request.month, day=request.day,
            hour=request.hour, minute=request.minute, longitude=request.longitude,
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