from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas, auth
from utils import rag
import json
from utils.redis_client import redis_client   # 新增：导入 Redis 客户端
import hashlib                                 # 新增：用于生成缓存 key 的哈希
import json                                    # 新增：JSON 处理

router = APIRouter()

def get_cache_key(question: str) -> str:
    """
    根据问题生成唯一的缓存 key
    参数：
        question: 用户的问题
    返回：
        缓存 key，格式：qa:{MD5哈希值}
    
    例如：
        问题 "什么是RAG？" 
        MD5("什么是RAG？") = "a3f5c2e1b8d9f6e4c7a2b3d5e6f7g8h9"
        key = "qa:a3f5c2e1b8d9f6e4c7a2b3d5e6f7g8h9"
    """
    # 1. 去除问题首尾空格，并转为小写（避免大小写差异导致缓存不命中）
    normalized = question.strip().lower()
    
    # 2. 计算 MD5 哈希值（固定长度32字符，适合做 key）
    md5_hash = hashlib.md5(normalized.encode('utf-8')).hexdigest()
    
    # 3. 返回带前缀的 key，便于在 Redis 中区分不同类型缓存
    return f"qa:{md5_hash}"


# ========== 非流式问答（带缓存） ==========
@router.post("/qa", response_model=schemas.QuestionResponse)
def student_qa(
    request: schemas.QuestionRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.STUDENT))
):
    """
    学生智能问答 —— 带 Redis 缓存版本
    流程：
        1. 生成缓存 key
        2. 检查 Redis 是否有缓存
        3. 有缓存 → 直接返回（秒级响应）
        4. 无缓存 → 检索知识库 → 调用 AI → 存入缓存 → 返回
    """
    
    # ========== 步骤1：生成缓存 key ==========
    cache_key = get_cache_key(request.question)
    
    # ========== 步骤2：检查 Redis 缓存 ==========
    cached_answer = redis_client.get_json(cache_key)
    
    if cached_answer:
        # 缓存命中！直接从 Redis 返回
        print(f"[Cache HIT] 问题: {request.question[:50]}...")
        return schemas.QuestionResponse(
            answer=cached_answer.get("answer", ""),
            sources=cached_answer.get("sources", [])
        )
    
    # ========== 步骤3：缓存未命中，走正常流程 ==========
    print(f"[Cache MISS] 问题: {request.question[:50]}...")
    
    # 3.1 检索知识库
    search_results = rag.search_knowledge_base(db, request.question, limit=5, threshold=0.5)

    if not search_results:
        # 知识库为空时，不缓存（因为返回的是固定提示）
        return schemas.QuestionResponse(
            answer="知识库暂无相关信息，建议咨询老师。",
            sources=[]
        )

    # 3.2 拼接上下文和来源
    context = "\n---\n".join([chunk.content for chunk in search_results])
    sources = list(set([chunk.document.filename for chunk in search_results]))

    # 3.3 调用 AI 生成回答
    answer = rag.answer_question_from_kb(request.question, context)
    
    # ========== 步骤4：将结果存入 Redis 缓存 ==========
    # 准备缓存数据
    cache_data = {
        "answer": answer,
        "sources": sources
    }
    
    # 存入 Redis，过期时间 24 小时（86400 秒）
    # 注意：这里不缓存"无结果"的情况，因为知识库可能后续会更新
    redis_client.set(cache_key, cache_data, expire=86400)
    print(f"[Cache SET] 已缓存答案，过期时间 24 小时")

    return schemas.QuestionResponse(answer=answer, sources=sources)

# @router.post("/qa", response_model=schemas.QuestionResponse)
# def student_qa(
#     request: schemas.QuestionRequest,
#     db: Session = Depends(database.get_db),
#     current_user: models.User = Depends(auth.check_role(models.UserRole.STUDENT))
# ):
#     # 1. 检索知识库
#     search_results = rag.search_knowledge_base(db, request.question)
#     context = "\n---\n".join([chunk.content for chunk in search_results])
#     sources = list(set([chunk.document.filename for chunk in search_results])) # set（）去重，避免出现多个文档块来自同一个文档

#     if len(context) < 100:
#         return schemas.QuestionResponse(
#             answer="知识库暂无相关信息，建议咨询老师。",
#             sources=[]
#         )
    
#     # 3. 基于知识库回答
#     answer = rag.answer_question_from_kb(request.question, context)
#     return schemas.QuestionResponse(answer=answer, sources=sources)

# @router.get("/web-search")
# def web_search_api(
#     query: str,
#     current_user: models.User = Depends(auth.get_current_user)
# ):
#     """通用联网搜索接口"""
#     results = rag.web_search(query)
#     return {"results": results}

# @router.post("/feedback", response_model=schemas.Feedback)
# def submit_feedback(
#     feedback: schemas.FeedbackCreate,
#     db: Session = Depends(database.get_db),
#     current_user: models.User = Depends(auth.check_role(models.UserRole.STUDENT))
# ):
#     db_feedback = models.Feedback(
#         student_id=current_user.id,
#         **feedback.dict()
#     )
#     db.add(db_feedback)
#     db.commit()
#     db.refresh(db_feedback)
#     return db_feedback

@router.get("/notes", response_model=List[schemas.Note])
def get_notes(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.STUDENT))
):
    return db.query(models.Note).filter(models.Note.student_id == current_user.id).all()

@router.post("/notes", response_model=schemas.Note)
def create_note(
    note: schemas.NoteCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.STUDENT))
):
    db_note = models.Note(
        student_id=current_user.id,
        **note.dict()
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/notes/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.STUDENT))
):
    note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.student_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    return {"message": "Note deleted"}

@router.post("/code/upload")
async def upload_code(
    file: UploadFile = File(...), # File（...）表示必填参数，必须在请求体中包含文件
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.STUDENT))
):
    # 学生上传代码并自动分析学情
    content = await file.read()
    code_text = content.decode("utf-8")
    
    # AI 分析学情
    analysis = rag.analyze_student_code(code_text)
    
    db_code = models.StudentCode(
        student_id=current_user.id,
        filename=file.filename,
        content=code_text,
        analysis=analysis
    )
    db.add(db_code)
    db.commit()
    return {"message": "代码上传并分析完成", "analysis": analysis}

@router.get("/resources")
def search_resources(
    query: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.STUDENT))
):
    # 语义检索相关资源
    results = rag.search_knowledge_base(db, query)
    resources = []
    seen_docs = set()
    for chunk in results:
        # 增加相关度判断：只有匹配度较高的才返回（pgvector 距离越小越相关）
        # 这里由于 backend 没有直接返回距离，我们保持原样但修复空搜索逻辑
        if chunk.document_id not in seen_docs:
            resources.append({
                "id": chunk.document.id,
                "filename": chunk.document.filename,
                "file_type": chunk.document.file_type,
                "created_at": chunk.document.created_at
            })
            seen_docs.add(chunk.document_id)
            
    # 如果搜索词与知识库完全无关，例如检索结果为空，返回空数组而不是全部
    if not query.strip():
        return []
        
    return resources