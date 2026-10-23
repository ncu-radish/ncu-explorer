import logging
from typing import TypeVar

import httpx
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

NCU_SYSTEM_PROMPT = """你是一個專屬於「國立中央大學（NCU）」的智慧校園模擬器與選課顧問 AI。
【嚴格輸出規範】
1. 語言要求：必須全程使用「台灣繁體中文（zh-TW）」與台灣大學生自然口語（如：早八、學餐、宵夜街、系學會、通識課、衝堂、報告、百花川、松果、依仁堂）。嚴禁出現任何簡體字、中國大陸用語或無故夾雜英文段落。
2. 事實依據：只能根據系統提供的【校園背景知識】、【課程大綱】與【突發事件指令】進行描寫，嚴禁自行捏造不存在的館舍或課程。
3. 格式要求：必須嚴格遵循指定的 JSON Schema 結構輸出，不要包含任何額外的解釋文字或 Markdown 標籤。
"""

async def call_ollama_structured(
    user_prompt: str,
    response_schema: type[T],
    model_name: str | None = None,
    system_prompt: str | None = None,
    timeout: float = 30.0,
    fallback_instance: T | None = None,
) -> T:
    """
    呼叫本地 Ollama API，利用 format JSON Schema 強制輸出結構化資料。
    若 Ollama 連線異常或逾時，則自動返回 fallback_instance 或引發結構化處理。
    """
    model = model_name or settings.DEFAULT_LLM_MODEL
    sys_prompt = system_prompt or NCU_SYSTEM_PROMPT

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "format": response_schema.model_json_schema(),
        "stream": False,
        "options": {
            "temperature": 0.6,
            "num_ctx": 4096,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json=payload
            )
            response.raise_for_status()
            result_json = response.json()["message"]["content"]
            return response_schema.model_validate_json(result_json)
    except Exception as e:
        logger.warning(f"Ollama call failed or timed out ({e}). Using fallback.")
        if fallback_instance is not None:
            return fallback_instance
        raise e
