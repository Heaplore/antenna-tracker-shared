"""Agnes API 客户端封装

使用 OpenAI 兼容接口调用 Agnes 2.0 Flash。
环境变量: AGNES_API_KEY
"""

import os
import json
import re
from typing import Optional

try:
    from openai import OpenAI
except ImportError:
    raise ImportError("openai SDK is required. Install with: pip install openai")


class AgnesClient:
    BASE_URL = "https://apihub.agnes-ai.com/v1"
    DEFAULT_MODEL = "agnes-2.0-flash"

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.environ.get("AGNES_API_KEY")
        if not self.api_key:
            raise ValueError(
                "AGNES_API_KEY environment variable not set. "
                "Set it in CI/CD secrets or pass api_key directly."
            )
        self.model = model or self.DEFAULT_MODEL
        self.client = OpenAI(
            base_url=self.BASE_URL,
            api_key=self.api_key,
        )

    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = 0.3,
        max_tokens: int = 2000,
    ) -> str:
        """调用 Agnes-2.0-Flash，返回原始响应文本。"""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        kwargs = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        response = self.client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content

        # Strip thinking blocks if present
        content = re.sub(r'<think[^>]*>.*?</think>', '', content, flags=re.DOTALL).strip()

        # Strip markdown code fence
        content = re.sub(r'^```(?:json)?\s*', '', content).strip()
        content = re.sub(r'\s*```$', '', content).strip()

        return content
