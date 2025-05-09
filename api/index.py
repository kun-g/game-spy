#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Flask, jsonify
import sys
import os

# 添加项目根目录到 Python 路径，以便可以导入 backend 包
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app import app as flask_app

# 启用 CORS
@flask_app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Vercel 无服务器函数处理器
def handler(event, context):
    path = event.get('path', '').lstrip('/')
    
    # 如果 path 不以 api 开头，添加上 api 前缀以匹配我们的 blueprints
    if not path.startswith('api/'):
        path = f'api/{path}'
    
    http_method = event.get('httpMethod', 'GET')
    query_string = event.get('queryStringParameters', {}) or {}
    headers = event.get('headers', {})
    body = event.get('body', '')
    
    # 创建 Flask 请求上下文
    with flask_app.test_request_context(
        path=path,
        method=http_method,
        query_string=query_string,
        headers=headers,
        data=body
    ):
        try:
            # 处理请求
            response = flask_app.full_dispatch_request()
            
            return {
                'statusCode': response.status_code,
                'headers': dict(response.headers),
                'body': response.get_data(as_text=True)
            }
        except Exception as e:
            # 处理异常
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': jsonify({'error': f'Internal Server Error: {str(e)}'}).get_data(as_text=True)
            }

# Vercel 期望的入口点函数
def app(request):
    """Vercel serverless function entry point"""
    event = {
        'path': request.get('path', ''),
        'httpMethod': request.get('method', 'GET'),
        'headers': request.get('headers', {}),
        'queryStringParameters': request.get('query', {}),
        'body': request.get('body', '')
    }
    
    return handler(event, {})

# API 路由测试
if __name__ == '__main__':
    flask_app.run(debug=True) 