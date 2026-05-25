# 实现RAG全流程：文本向量化、向量相似度检索、PBL教案生成、学生问答、联网搜索
from openai import OpenAI
import os
from typing import List
from sqlalchemy.orm import Session #用于查询documentchunk
import models

# 初始化 OpenAI 客户端（智谱 AI）
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL")
)

def web_search(query: str, limit: int = 3) -> str:
    # 使用智谱 AI 内置联网搜索工具获取最新信息
    try:
        response = client.chat.completions.create(
            model="glm-4",
            messages=[
                {"role": "system", "content": "你是一个联网搜索助手，请搜索最新信息并给出详细总结，注明信息来源。"},
                {"role": "user", "content": f"请联网搜索以下内容并给出详细结果：{query}"}
            ],
            tools=[{
                "type": "web_search",
                "web_search": {"enable": True}
            }],
            tool_choice="auto" # 自动选择工具，根据上下文判断是否需要联网搜索
        )

        content = response.choices[0].message.content

        if content and len(content.strip()) > 20:
            return f"【AI 联网搜索总结】\n\n{content.strip()}\n\n---\n\n提示：内容由智谱 AI 实时联网搜索生成。"
        else:
            return "联网检索未返回有效结果。"

    except Exception as e:
        print(f"[WebSearch] 智谱 AI 联网搜索失败: {str(e)}")
        return f"联网搜索暂时不可用。建议直接在浏览器中搜索：{query}"

def get_embedding(text: str) -> List[float]:
    # 将文本转换为向量（Embedding），智谱 AI 的向量模型名称为 embedding-2
    text = text.replace("\n", " ") # 把换行符换成空格，避免向量模型处理时出错
    return client.embeddings.create(input=[text], model="embedding-2").data[0].embedding

def search_knowledge_base(db: Session, query: str, limit: int = 5, threshold: float = 0.8) -> List[models.DocumentChunk]:
    
    # 在知识库中进行向量检索，threshold: float = 0.8较严格，确保检索到高度相关的文档内容
    query_embedding = get_embedding(query)

    results = db.query(models.DocumentChunk).filter(
        models.DocumentChunk.embedding.cosine_distance(query_embedding) < (1 - threshold/2)
    ).order_by(
        models.DocumentChunk.embedding.cosine_distance(query_embedding)
    ).limit(limit).all()

    return results

def answer_question_from_kb(question: str, context: str) -> str:

    # 使用 glm-4 进行问答（非流式，保留给需要完整回答的场景）
    prompt = f"""
你是一名高校助教，请基于以下知识库内容回答学生的问题。

【知识库内容】
{context}

【学生问题】
{question}

【要求】
1. 只基于提供的知识库内容进行回答。
2. 如果知识库中没有相关信息，请明确回答："知识库暂无相关信息，建议咨询老师"。
"""
    response = client.chat.completions.create(
        model="glm-4",
        messages=[
            {"role": "system", "content": "你是一名专业的助教智能体。"},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

def analyze_student_code(code: str) -> str:

    # 使用 AI 分析学生提交的代码，进行学情评估
    prompt = f"""
你是一名资深编程导师，请分析以下学生提交的代码，并提供一份详细的学情分析报告。

【代码内容】
```python
{code}
```

【要求】
1. 评价代码的正确性与规范性。
2. 识别学生对哪些知识点掌握较好，哪些薄弱。
3. 提供针对性的改进建议。
4. 语气要客观、鼓励。
"""
    response = client.chat.completions.create(
        model="glm-4",
        messages=[
            {"role": "system", "content": "你是一名专业的代码分析专家。"},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content