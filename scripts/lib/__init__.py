"""MiniMax API 客户端封装

使用 OpenAI 兼容接口调用 MiniMax-M3。
环境变量: MINIMAX_API_KEY
"""

import os
import json
from typing import Optional

try:
    from openai import OpenAI
except ImportError:
    raise ImportError("openai SDK is required. Install with: pip install openai")


class MiniMaxClient:
    BASE_URL = "https://api.minimaxi.com/v1"
    DEFAULT_MODEL = "MiniMax-M3"

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.environ.get("MINIMAX_API_KEY")
        if not self.api_key:
            raise ValueError(
                "MINIMAX_API_KEY environment variable not set. "
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
        max_tokens: int = 4000,
        response_format_json: bool = False,
    ) -> str:
        """调用 MiniMax-M3，返回原始响应文本。

        Args:
            prompt: 用户 prompt
            system_prompt: 系统提示
            temperature: 温度参数（越低越确定）
            max_tokens: 最大输出 token
            response_format_json: 是否强制 JSON 输出

        Returns:
            LLM 返回的文本内容
        """
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

        if response_format_json:
            kwargs["response_format"] = {"type": "json_object"}

        response = self.client.chat.completions.create(**kwargs)
        return response.choices[0].message.content

    def generate_json(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = 0.3,
        max_tokens: int = 4000,
    ) -> dict:
        """调用 MiniMax-M3，返回解析后的 JSON 对象。"""
        text = self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format_json=True,
        )
        return json.loads(text)
