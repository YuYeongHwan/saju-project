# main.py

from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from saju import calculate_saju
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

    query_record = SajuQuery(
        year=request.year, month=request.month, day=request.day,
        hour=request.hour, minute=request.minute, longitude=request.longitude,
        result=result,
    )
    db.add(query_record)
    db.commit()
    db.refresh(query_record)

    return result


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