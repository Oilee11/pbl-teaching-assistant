# 定义用户相关的请求和响应模型
# 用于前端与后端的通信，确保数据格式正确
from pydantic import BaseModel, EmailStr #  继承BaseModel的类拥有自动校验功能，EmailStr类型，确保邮箱格式正确
from typing import List, Optional #  List类型，用于定义列表，Optional类型，用于定义可选参数
from datetime import datetime #python内置时间类型，用于标记 created_at、updated_at 等时间字段
from models import UserRole #  引入用户角色枚举类型，确保角色取值一致

# Pydantic 的继承设计模式：先定义"基础"，再派生出"创建版"和"完整版"
class UserBase(BaseModel): #  用户基础模型，包含用户名、邮箱、角色等基本信息
    username: str
    email: EmailStr
    role: UserRole

class UserCreate(UserBase): #  用户创建模型，包含用户名、邮箱、角色、密码等信息；用于注册用户
    password: str

class User(UserBase): #  用户完整模型，包含用户名、邮箱、角色、密码、创建时间等信息；用于返回用户信息
    id: int
    created_at: datetime

   # 后端从数据库查询到的数据是ORM对象，接受ORM对象，pydantic自动从ORM对象的属性读取值，否则返回给前端ORM对象报错
    class Config:
        from_attributes = True

# 登录成功后返回的token模型
class Token(BaseModel):
    access_token: str # JWT 令牌字符串本身，前端拿到后存在 localStorage 或 cookie 里
    token_type: str # 令牌类型，固定值为 "bearer"

# 解码 JWT 令牌后提取的数据结构，用于验证用户身份
class TokenData(BaseModel):
    username: Optional[str] = None # 可选参数，Optional表示可能为空，默认值为 None
    role: Optional[str] = None

class DocumentBase(BaseModel):
    filename: str
    file_type: str

class Document(DocumentBase):
    id: int
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True

class LessonPlanCreate(BaseModel):
    course_name: str
    requirements: str

class LessonPlan(BaseModel):
    id: int
    course_name: str
    requirements: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class NoteCreate(BaseModel):
    title: str
    content: str

class Note(NoteCreate):
    id: int
    student_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    question: str
    answer: str
    rating: int
    comment: Optional[str] = None

class Feedback(FeedbackCreate):
    id: int
    student_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionRequest(BaseModel):
    question: str

class QuestionResponse(BaseModel):
    answer: str
    sources: List[str]
