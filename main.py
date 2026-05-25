# 主程序，负责：
# 1. 创建数据库扩展和表
# 2. 启动FastAPI应用
# 3. 包含路由，用于处理API请求
# 4. 配置跨域请求
# 浏览器默认禁止前端调用不同域名的后端API，CORS允许前端跨域访问
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# 导入SQLAlchemy的text函数，用于执行原始SQL语句
from sqlalchemy import text
from database import engine, Base
from routers import auth, teacher, student

# with = 上下文管理器，自动管理连接生命周期
# engine.connect() = 从连接池拿一个连接
# 执行完后自动归还连接，不用手动 close
with engine.connect() as conn:  #连接数据库，with实现自动关闭连接
    # 创建vector扩展，text()将字符串转换为SQL语句
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    # 提交事务
    conn.commit()
 # 表里用了vector类型，必须先创建vector扩展
 # 创建数据库表，Base.metadata.create_all()根据模型创建表，bind=engine绑定数据库引擎
Base.metadata.create_all(bind=engine) # .metadata = 元数据对象，包含所有表结构信息

#title: 标题，用于在文档中显示API的名称
app = FastAPI(title="高校教师项目式教学备课智能体")

# 所有请求先经过中间件，再到路由函数
# CORS: 跨域资源分享，用于允许不同域名的请求访问API
# allow_origins: 允许的域名，*表示所有域名
# allow_credentials: 是否允许携带凭证，*表示所有方法
# allow_headers: 允许的请求头，*表示所有头
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers: 包含路由，用于处理API请求
# prefix: 路由前缀，用于在文档中显示路由的路径
# tags: 路由标签，用于在API文档中分组显示
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(teacher.router, prefix="/teacher", tags=["Teacher"])
app.include_router(student.router, prefix="/student", tags=["Student"])

# Root route: 根路由，用于返回欢迎消息
# @app.get("/") 定义根路由，返回欢迎消息
# async def root(): 定义路由处理函数，返回欢迎消息
@app.get("/")
async def root():
    return {"message": "Welcome to PBL Teaching Assistant API"}
