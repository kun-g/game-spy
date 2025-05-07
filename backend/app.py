#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Flask, jsonify
from flask_cors import CORS

from backend.config import API_CONFIG
from backend.routes import api_bp
from backend.middlewares import request_logger

def create_app():
    """创建并配置Flask应用"""
    app = Flask(__name__)
    
    # 允许跨域请求
    CORS(app)
    
    # 注册中间件
    request_logger(app)
    
    # 注册蓝图
    app.register_blueprint(api_bp)
    
    # 默认路由
    @app.route('/')
    def index():
        return jsonify({
            "status": "running",
            "service": "Game Spy API",
            "version": "1.0.0"
        })
    
    # 全局错误处理
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "资源不存在"}), 404
    
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": "服务器内部错误"}), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "请求参数错误"}), 400
    
    @app.errorhandler(429)
    def too_many_requests(error):
        return jsonify({"error": "请求过于频繁，请稍后再试"}), 429
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(
        host=API_CONFIG['host'],
        port=API_CONFIG['port'],
        debug=API_CONFIG['debug']
    ) 