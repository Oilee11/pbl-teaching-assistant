from sqlalchemy import create_engine
#  导入函数，负责创建连接，翻译python代码为SQL，管理数据库驱动
from sqlalchemy.ext.declarative import declarative_base
#  基类，表模型都要继承Base，实现将python类自动建表
from sqlalchemy.orm import sessionmaker
#  创建session，实现数据操作
import os
#  python内置模块，读取环境变量
from dotenv import load_dotenv
#  自动读取.env文件下的变量，并加载成环境变量

load_dotenv()
#  注入环境变量到python内存进程中，必须在os.getenv()之前调用

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/pbl_db")
#  获取数据库连接地址，后面地址为默认值

engine = create_engine(SQLALCHEMY_DATABASE_URL)
#  实际上创建的包括连接池
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#  自动刷新：查询数据前，会先刷新session中改动到数据库中，实现隐式更新数据

Base = declarative_base()
#  通过扫描Base的所有子类创建对应的表

def get_db():
    db = SessionLocal()
    #  创建会话，对数据的修改暂存到session中，执行commit操作一并提交到数据库中
    try:
        yield db  #  生成器函数，请求开始时执行
    finally:
        db.close()  #  请求结束后执行
