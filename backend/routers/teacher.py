from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas, auth
from utils import document, rag
# import json

router = APIRouter()

@router.post("/documents/upload", response_model=schemas.Document)
async def upload_document(
    file: UploadFile = File(...), # Uploadfile类型文件，file（文件对象）
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.TEACHER))
):
    content = await file.read()
    try:
        text = document.get_text_from_file(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # 创建文本表
    db_doc = models.Document(
        filename=file.filename,
        content=text,
        file_type=file.filename.split(".")[-1],
        owner_id=current_user.id
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    # 创建文本分块表
    chunks = document.chunk_text(text)
    for chunk_text in chunks:
        embedding = rag.get_embedding(chunk_text)
        db_chunk = models.DocumentChunk(
            document_id=db_doc.id,
            content=chunk_text,
            embedding=embedding
        )
        db.add(db_chunk)
    
    db.commit()
    return db_doc

@router.get("/documents", response_model=List[schemas.Document])
def get_documents(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.TEACHER))
):
    return db.query(models.Document).filter(models.Document.owner_id == current_user.id).all()

@router.delete("/documents/{doc_id}") # 路径参数doc_id，FastAPI会自动从URL提取并将其解析为int类型
# 查询参数:请求中包含的参数，用于筛选或指定请求的行为，如果函数中指明了查询参数的值，则可以不传，视为默认值，如果函数中没有指明值，则发送的请求当中必须传入值，否则报错
def delete_document(
    doc_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.TEACHER))
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id, models.Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}

@router.post("/lesson-plans/generate", response_model=schemas.LessonPlan)
def generate_lesson_plan(
    
    #const handleGenerate = async (e: React.FormEvent) => {
    #e.preventDefault();
    #const res = await api.post('/teacher/lesson-plans/generate', { 
    #    course_name: courseName,      // 课程名称
    #    requirements: requirements     // 教学要求
   # }
    
    request: schemas.LessonPlanCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.TEACHER))
):

    search_results = rag.search_knowledge_base(db, f"{request.course_name} {request.requirements}")
    context = "\n---\n".join([chunk.content for chunk in search_results])
    
    # 调用AI生成回答
    content = rag.generate_pbl_lesson_plan(request.course_name, request.requirements, context)
    
    # 保存到数据库
    db_plan = models.LessonPlan(
        teacher_id=current_user.id,
        course_name=request.course_name,
        requirements=request.requirements,
        content=content
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.get("/lesson-plans", response_model=List[schemas.LessonPlan])
def get_lesson_plans(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.TEACHER))
):
    return db.query(models.LessonPlan).filter(models.LessonPlan.teacher_id == current_user.id).all()

@router.get("/feedbacks", response_model=List[dict])
def get_feedbacks(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.TEACHER))
):
    # 教师查看所有学生对 AI 问答的反馈，并包含学生姓名
    results = db.query(models.Feedback, models.User.username).join(
        models.User, models.Feedback.student_id == models.User.id
    ).all()
    
    return [
        {
            **schemas.Feedback.from_orm(fb).dict(),# **：展开字典，将fb的所有字段添加到字典中。先将ORM对象转换为Pydantic模型，再转换为字典
            "student_name": username # 添加学生姓名字段
        } for fb, username in results
    ]

@router.get("/student-codes")
def get_student_codes(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.check_role(models.UserRole.TEACHER))
):
    # 教师查看所有学生上传的代码，并包含学生姓名
    results = db.query(models.StudentCode, models.User.username).join(
        models.User, models.StudentCode.student_id == models.User.id
    ).all()
    
    return [
        {
            "id": code.id,
            "student_id": code.student_id,
            "student_name": username,
            "filename": code.filename,
            "content": code.content,
            "analysis": code.analysis,
            "created_at": code.created_at
        } for code, username in results
    ]

# @router.post("/web-search/save")
# def save_web_resource(
#     url: str,
#     title: str,
#     content: str,
#     db: Session = Depends(database.get_db),
#     current_user: models.User = Depends(auth.check_role(models.UserRole.TEACHER))
# ):
#     """教师将联网搜索结果保存到知识库"""
#     db_doc = models.Document(
#         filename=f"联网资源: {title}",
#         content=content,
#         file_type="web",
#         owner_id=current_user.id
#     )
#     db.add(db_doc)
#     db.commit()
#     db.refresh(db_doc)
    
#     # 分块并存入向量库
    
#     chunks = document.chunk_text(content)
#     for chunk_text in chunks:
#         embedding = rag.get_embedding(chunk_text)
#         db_chunk = models.DocumentChunk(
#             document_id=db_doc.id,
#             content=chunk_text,
#             embedding=embedding
#         )
#         db.add(db_chunk)
#     db.commit()
#     return {"message": "资源已成功加入知识库"}
