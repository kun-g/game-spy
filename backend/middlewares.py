#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time
from functools import wraps
from typing import Callable, Any

from flask import request, g, jsonify

def request_logger(app):
    """请求日志记录中间件"""
    @app.before_request
    def before_request():
        g.start_time = time.time()
        app.logger.info(f"请求开始: {request.method} {request.path}")
    
    @app.after_request
    def after_request(response):
        diff = time.time() - g.start_time
        app.logger.info(f"请求结束: {request.method} {request.path} - 状态: {response.status_code} - 耗时: {diff:.4f}秒")
        return response

def rate_limit(max_requests: int, window: int = 60) -> Callable:
    """简单的请求速率限制装饰器"""
    request_history = {}
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # 获取客户端IP
            client_ip = request.remote_addr
            current_time = time.time()
            
            # 清理过期的记录
            request_history[client_ip] = [t for t in request_history.get(client_ip, []) if current_time - t < window]
            
            # 检查请求频率
            if len(request_history.get(client_ip, [])) >= max_requests:
                return jsonify({"error": "请求过于频繁，请稍后再试"}), 429
            
            # 记录本次请求
            if client_ip in request_history:
                request_history[client_ip].append(current_time)
            else:
                request_history[client_ip] = [current_time]
                
            return func(*args, **kwargs)
        return wrapper
    return decorator

def api_key_auth(func: Callable) -> Callable:
    """API 密钥认证装饰器
    当需要在将来添加认证机制时使用
    """
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        # 在这里实现 API 密钥认证逻辑
        # api_key = request.headers.get('X-API-Key')
        # if not api_key or api_key != 'your-secret-key':
        #     return jsonify({"error": "无效的 API 密钥"}), 401
        return func(*args, **kwargs)
    return wrapper 