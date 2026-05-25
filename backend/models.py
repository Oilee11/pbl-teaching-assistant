#  数据库模型，使用SQLAlchemy定义数据库表结构，后续根据模型创建数据库表
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, Enum
from sqlalchemy.orm import relationship  #  关联关系，用于定义表之间的多对多关系
from sqlalchemy.sql import func  #  函数，用于在SQL语句中使用数据库函数，如 now()
from database import Base  #  数据库基类，所有模型都继承自它
from pgvector.sqlalchemy import Vector  #  向量类型，用于存储向量数据，如文本的嵌入向量
import enum  #  枚举类型，用于定义常量，如用户角色，取值被限制在预定义的范围内，防止错误值

class UserRole(str, enum.Enum): # enum.Enum 定义枚举类型，用于定义用户角色,str类型，确保角色值是字符串
    """
    用户角色枚举
    """
    #  教师角色
    TEACHER = "teacher"
    STUDENT = "student"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=UserRole.STUDENT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())  #  创建时间，默认值为数据库当前时间,timezone=True 表示支持时区，如 UTC

    documents = relationship("Document", back_populates="owner",cascade="all,delete-orphan")  #  ORM级联：文档关联关系，用于定义用户与文档之间的多对多关系，Document表中用owner_id字段关联用户表
    lesson_plans = relationship("LessonPlan", back_populates="teacher",cascade="all,delete-orphan")  #  资源关联关系，用于定义用户与资源之间的多对多关系，LessonPlan表中用teacher_id字段关联用户表
    notes = relationship("Note", back_populates="student",cascade="all,delete-orphan")  #  笔记关联关系，用于定义用户与笔记之间的多对多关系，Note表中用student_id字段关联用户表
    codes = relationship("StudentCode", back_populates="student",cascade="all,delete-orphan")

    # 执行Python类的操作删除时，触发ORM级联，先删除级联的子表中的数据，再删除父表中的数据；单只执行SQL语句删除父表，不会触发ORM级联删除
    # 例如：db.delete(user)
    # db.commit()
    # 会触发ORM级联删除，先删除user.documents中的数据，再删除user
    # 例如：db.execute("DELETE FROM users WHERE id = :id", {"id": user.id})
    # db.commit()
    # 不会触发ORM级联删除
    # 数据库级联删除操作两种都可以执行

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    content = Column(Text)
    file_type = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id",ondelete="CASCADE")) # 数据库级联删除，当用户被删除时，所有关联的文档也会被删除
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan") #cascade="all, delete-orphan" 表示当文档被删除时，所有关联的文档块也会被删除

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id",ondelete="CASCADE")) # 当文档被删除时，所有关联的文档块也会被删除
    content = Column(Text)
    embedding = Column(Vector(1024)) # 智谱 AI embedding-2 的维度是 1024

    document = relationship("Document", back_populates="chunks")

class LessonPlan(Base):
    __tablename__ = "lesson_plans"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id",ondelete="CASCADE")) # 当教师被删除时，所有关联的教案也会被删除
    course_name = Column(String)
    requirements = Column(Text)
    content = Column(Text) # JSON or Markdown
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    teacher = relationship("User", back_populates="lesson_plans")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id",ondelete="CASCADE")) # 当学生被删除时，所有关联的笔记也会被删除
    title = Column(String)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("User", back_populates="notes")

class StudentCode(Base):
    __tablename__ = "student_codes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id",ondelete="CASCADE")) # 当学生被删除时，所有关联的代码也会被删除
    filename = Column(String)
    content = Column(Text)
    analysis = Column(Text) # AI 学情分析结果
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="codes")

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id",ondelete="CASCADE")) # 当学生被删除时，所有关联的反馈也会被删除
    question = Column(Text)
    answer = Column(Text)
    rating = Column(Integer) # 1-5
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
