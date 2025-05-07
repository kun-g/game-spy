#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time
import logging
from functools import wraps
from typing import Callable, Any

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('backend')

def timing_decorator(func: Callable) -> Callable:
    """装饰器：计算函数执行时间"""
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        logger.info(f"函数 {func.__name__} 执行时间：{end_time - start_time:.4f} 秒")
        return result
    return wrapper

def validate_params(required_params: list) -> Callable:
    """装饰器：验证请求参数"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            from flask import request
            for param in required_params:
                if param not in request.args:
                    return {"error": f"缺少必需参数: {param}"}, 400
            return func(*args, **kwargs)
        return wrapper
    return decorator

def handle_exceptions(func: Callable) -> Callable:
    """装饰器：全局异常处理"""
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"函数 {func.__name__} 执行出错: {str(e)}")
            return {"error": "内部服务器错误"}, 500
    return wrapper 