# 高校教师项目式教学 (PBL) 备课智能体

这是一个全栈应用，旨在帮助高校教师利用 RAG (检索增强生成) 技术进行项目式教学的备课，并为学生提供基于课程知识库的智能问答。

## 核心功能

### 教师端
- **知识库管理**: 上传 PDF/Word/TXT/Markdown，自动分块并向量化存储。
- **PBL 教案生成**: 输入课程需求，基于知识库生成完整的 PBL 教案。
- **反馈查看**: 查看学生对问答系统的评分和评论。

### 学生端
- **知识问答**: 基于知识库的 RAG 问答，严格限制在知识库范围内。
- **资源检索**: 语义检索知识库内容。
- **学习笔记**: 记录个人学习笔记。

## 技术栈
- **后端**: FastAPI, PostgreSQL, pgvector, SQLAlchemy, OpenAI API, LangChain
- **前端**: React, Vite, Tailwind CSS, Lucide Icons
- **部署**: Docker, Docker Compose

## 快速启动

1. **配置环境**:
   复制 `.env.example` 为 `.env` 并填入您的 `OPENAI_API_KEY`。

   ```bash
   cp .env.example .env
   ```

2. **一键启动**:
   ```bash
   docker-compose up -d
   ```

3. **访问应用**:
   - 前端: `http://localhost:3000`
   - API 文档: `http://localhost:8000/docs`

## 接口说明
- `POST /auth/register`: 用户注册
- `POST /auth/login`: 用户登录
- `POST /teacher/documents/upload`: 知识库上传
- `POST /teacher/lesson-plans/generate`: PBL 教案生成
- `POST /student/qa`: 智能问答
