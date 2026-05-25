# 实现用户注册、登录、获取当前用户信息、检查角色权限等功能
from fastapi import APIRouter, Depends, HTTPException, status
# APIrouter：FastAPI的路由分组工具，把相关接口组织在同一个路由下，最后挂载到main.py的app上
from fastapi.security import OAuth2PasswordRequestForm
# FastAPI内置的OAuth2密码流认证表单，用于接收用户密码登录请求，自动解析username和password字段
from sqlalchemy.orm import Session
import database, models, schemas, auth


router = APIRouter() # 实例化APIRouter，用于组织下方定义的接口
 # 注册接口
@router.post("/register", response_model=schemas.User) #response_model=schemas.User 表示返回的响应数据模型为 schemas.User 类型
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(new_user) # 添加新用户到数据库会话
    db.commit() # 提交数据库会话，将新用户保存到数据库
    db.refresh(new_user) # 刷新数据库，获取自动生成的id字段
    return new_user
 # 登录接口，传入表单数据
#const formData = new URLSearchParams();
#formData.append('username', '张三');
#formData.append('password', '123456');
#axios.post('/auth/login', formData, {
#    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
#})
@router.post("/login", response_model=schemas.Token)
  # OAuth2 标准规定登录必须用表单格式，FastAPI自动解析：form_data.username、form_data.password
  # OAuth2PasswordRequestForm	类型注解，告诉 FastAPI：这个参数要解析成 OAuth2 表单
  # Depends()	依赖注入：FastAPI 自动从请求体创建这个对象，让 FastAPI 自动从 HTTP 请求填充数据
  # 举例说明
  # 前端发来 POST /auth/login
  # Content-Type: application/x-www-form-urlencoded
  # Body: username=张三&password=123456
  # FastAPI 自动：
  # 1. 读取请求体的原始文本：username=张三&password=123456
  # 2. 按 & 和 = 拆分，变成字典：{"username": "张三", "password": "123456"}
  # 3. 用这些值创建 OAuth2PasswordRequestForm 实例
  # 4. 赋值给 form_data 参数
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # 登录成功生成jwt token返回给客户端，前端收到后存储在本地，后续请求在header中携带该token
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
