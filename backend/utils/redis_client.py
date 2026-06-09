# backend/utils/redis_client.py
"""
Redis 客户端封装模块
作用：提供统一的缓存读写接口，其他模块只需调用即可
"""

import redis
import json
import os
from typing import Optional, Any, Union

# ========== 1. 读取配置 ==========
# 从环境变量获取 Redis 连接地址，如果不存在则使用默认值
# REDIS_URL 格式：redis://[用户名:密码@]主机:端口/数据库编号
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# ========== 2. 连接池配置 ==========
# 创建连接池，复用连接，避免每次操作都新建连接
pool = redis.ConnectionPool.from_url(
    REDIS_URL,
    max_connections=20,           # 最大连接数
    decode_responses=True,        # 自动将返回的 bytes 解码为字符串
    socket_timeout=5,             # socket 超时时间（秒）
    socket_connect_timeout=5,     # 连接超时时间（秒）
    retry_on_timeout=True,        # 超时后自动重试
)

# ========== 3. 创建 Redis 客户端实例 ==========
class RedisClient:
    
    # 构造函数：创建对象时自动执行初始化操作，自动连接redis
    def __init__(self):
        """初始化：从连接池获取连接"""
        self.client = redis.Redis(connection_pool=pool)
    
    # ---------- 3.1 获取缓存 ----------
    def get(self, key: str) -> Optional[str]:
        """
        根据 key 获取缓存值
        参数：
            key: 缓存键名
        返回：
            缓存值（字符串），如果不存在则返回 None
        """
        try:
            return self.client.get(key)
        except redis.RedisError as e:
            # Redis 出错时打印日志，但不抛出异常，避免影响主流程
            print(f"[Redis Error] get failed: {e}")
            return None
    
    # ---------- 3.2 设置缓存 ----------
    def set(self, key: str, value: Union[str, dict, list], expire: int = 3600) -> bool:
        """
        设置缓存
        参数：
            key: 缓存键名
            value: 缓存值（可以是字符串、字典、列表）
            expire: 过期时间（秒），默认 3600 秒 = 1 小时
        返回：
            是否设置成功
        """
        try:
            # 如果 value 是字典或列表，先转为 JSON 字符串
            if isinstance(value, (dict, list)):
                value = json.dumps(value, ensure_ascii=False)
            
            # 设置缓存，带过期时间
            self.client.setex(key, expire, value)
            return True
        except redis.RedisError as e:
            print(f"[Redis Error] set failed: {e}")
            return False
    
    # ---------- 3.3 删除缓存 ----------
    def delete(self, key: str) -> bool:
        """
        删除缓存
        参数：
            key: 缓存键名
        返回：
            是否删除成功
        """
        try:
            self.client.delete(key)
            return True
        except redis.RedisError as e:
            print(f"[Redis Error] delete failed: {e}")
            return False
    
    # ---------- 3.4 检查是否存在 ----------
    def exists(self, key: str) -> bool:
        """
        检查 key 是否存在
        参数：
            key: 缓存键名
        返回：
            存在返回 True，否则 False
        """
        try:
            return self.client.exists(key) > 0
        except redis.RedisError as e:
            print(f"[Redis Error] exists failed: {e}")
            return False
    
    # ---------- 3.5 获取 JSON 格式的缓存 ----------
    def get_json(self, key: str) -> Optional[Union[dict, list]]:
        """
        获取 JSON 格式的缓存，自动解析为 Python 对象
        参数：
            key: 缓存键名
        返回：
            解析后的 Python 对象，失败返回 None
        """
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except (redis.RedisError, json.JSONDecodeError) as e:
            print(f"[Redis Error] get_json failed: {e}")
            return None

# ========== 4. 创建全局单例实例 ==========
# 整个应用只创建一个实例，避免重复创建连接
redis_client = RedisClient()