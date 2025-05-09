#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify, Response
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

# Vercel serverless 处理函数
def handler(request):
    # 从 Vercel 请求中提取信息
    path = request.get("path", "")
    http_method = request.get("method", "GET")
    query_params = request.get("query", {})
    body = request.get("body", "")
    headers = request.get("headers", {})
    
    # 创建 Flask 请求上下文
    with flask_app.test_request_context(
        path=path,
        method=http_method,
        query_string=query_params,
        data=body,
        headers=headers
    ):
        try:
            # 处理请求
            response = flask_app.full_dispatch_request()
            return {
                "statusCode": response.status_code,
                "headers": dict(response.headers),
                "body": response.get_data(as_text=True)
            }
        except Exception as e:
            # 处理异常
            return {
                "statusCode": 500,
                "body": f"Internal Server Error: {str(e)}"
            }

# 直接调用 Flask 应用处理函数
def app(req, context):
    return handler(req)

# Enable WSGI application handler
flask_app.debug = False 