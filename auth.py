# 身份认证与权限控制：密码哈希、IWT生成与验证、当前用户身份识别、角色权限检查
from datetime import datetime, timedelta, timezone # timedelta 用于计算时间差，计算JWT过期时间
from typing import Optional
from jose import JWTError, jwt # jose是python的JWT库，JWTError是JWT异常类，jwt用于编码和解码JWT令牌
from passlib.context import CryptContext # 密码加密上下文，用于配置密码加密算法
from fastapi import Depends, HTTPException, status # 用于依赖注入和异常处理
from fastapi.security import OAuth2PasswordBearer # 用于定义OAuth2密码流的认证方式，本项目用“用户密码登录，发放JWT令牌”方式
from sqlalchemy.orm import Session # 用于数据库数据库会话，用于执行数据库操作
import os
import models, database, schemas

# 密码加密配置：使用 bcrypt 算法进行加盐哈希
pwd_context = CryptContext(schemes=["bcrypt"]) # 密码加密上下文，用于配置密码加密算法，指定使用bcrypt算法。有两个核心方法：verify()和hash()。

# JWT 身份认证配置
# SECRET_KEY 是用于加密 Token 的“盐”，必须严格保密
SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256" # 加密算法
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES","1440")) # Token 有效期（分钟）

# 定义 OAuth2 密码流的认证方式
# 自动从请求头中提取 Token，若不存在则返回错误响应，和Bearer认证方式兼容
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login") # 在自动文档系统中的POST /auth/login获取token，用于后续测试其他登录后的功能

def verify_password(plain_password, hashed_password):
    # 验证用户输入的明文密码与数据库中的哈希密码是否匹配
    # 从哈希密码中提取盐值，与明文密码进行哈希比对
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # 将明文密码转换为哈希值，防止数据库泄露后密码明文可见
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    # 生成一个 JWT 访问令牌（身份卡）
    to_encode = data.copy() # 复制需要编码的数据，避免修改原始数据典
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
        # 如果调用者传了自定义过期时间
        # 用 utcnow() 获取当前 UTC 时间，加上时间差,UTC时间不考虑夏令时，确保在不同时间区的服务器上都能正常工作
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15) # 设置默认十五分钟过期
    to_encode.update({"exp": expire}) # 设置过期时间，exp在JWT中是标准字段，用于表示令牌的过期时间
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM) # 编码JWT，将数据和密钥加密成一个字符串
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    """
    依赖注入函数，用于验证用户身份
    1. 从请求头中提取 Token
    2. 解密 Token 并获取用户名
    3. 在数据库中查找该用户
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, # 401 Unauthorized 表示未授权
        detail="身份验证失败，请重新登录",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]) # 拆分传入的jwt，用密钥进行算法解密，比对是否匹配，返回解密后的字典
        username: str = payload.get("sub") # 从JWT中提取用户名，sub是JWT中标准字段，用于表示用户名
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

def check_role(role: str):
    """
    角色权限检查器
    用法示例：Depends(check_role("teacher")) 
    如果当前登录用户不是指定角色，将拒绝访问。
    """
     # check_role("teacher") 先执行，返回 role_checker 函数
    # Depends 保存 role_checker
    # 请求来时调用 role_checker()
    async def role_checker(current_user: models.User = Depends(get_current_user)): # 依赖无参数的函数，否则会报错，因为FastAPI在请求来时会调用依赖注入函数，而依赖注入函数需要有参数，只在请求时执行
        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, # 403 Forbidden 表示拒绝访问
                detail=f"您没有权限执行此操作（仅限 {role}）"
            )
        return current_user
    return role_checker # 闭包，返回一个记住role的验证角色身份函数
