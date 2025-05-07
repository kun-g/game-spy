#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Blueprint, jsonify, request
from typing import List, Dict, Any

from backend.config import PAGINATION, PLATFORMS, TIME_RANGES
from backend.models import Game, Category, Ranking, Statistics

# 创建蓝图
api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/platforms', methods=['GET'])
def get_platforms():
    """获取所有平台列表"""
    return jsonify(PLATFORMS)

@api_bp.route('/games', methods=['GET'])
def get_games():
    """获取游戏列表，支持按平台筛选"""
    platform = request.args.get('platform', PLATFORMS[0])
    limit = min(int(request.args.get('limit', PAGINATION['default_limit'])), PAGINATION['max_limit'])
    offset = int(request.args.get('offset', 0))
    
    if platform not in PLATFORMS:
        return jsonify({"error": f"不支持的平台: {platform}"}), 400
    
    games = Game.get_all(platform, limit, offset)
    return jsonify(games)

@api_bp.route('/games/<game_id>', methods=['GET'])
def get_game_detail(game_id):
    """获取单个游戏详情"""
    game = Game.get_by_id(game_id)
    
    if game:
        return jsonify(game)
    else:
        return jsonify({"error": "游戏不存在"}), 404

@api_bp.route('/categories', methods=['GET'])
def get_categories():
    """获取所有游戏分类"""
    platform = request.args.get('platform', PLATFORMS[0])
    
    if platform not in PLATFORMS:
        return jsonify({"error": f"不支持的平台: {platform}"}), 400
    
    categories = Category.get_all(platform)
    return jsonify(categories)

@api_bp.route('/rankings', methods=['GET'])
def get_rankings():
    """获取游戏排行榜"""
    platform = request.args.get('platform', PLATFORMS[0])
    limit = min(int(request.args.get('limit', 20)), 100)
    
    if platform not in PLATFORMS:
        return jsonify({"error": f"不支持的平台: {platform}"}), 400
    
    rankings = Ranking.get_top(platform, limit)
    return jsonify(rankings)

@api_bp.route('/stats', methods=['GET'])
def get_stats():
    """获取平台统计数据"""
    platform = request.args.get('platform', PLATFORMS[0])
    days = int(request.args.get('days', 30))
    
    if platform not in PLATFORMS:
        return jsonify({"error": f"不支持的平台: {platform}"}), 400
    
    if days not in TIME_RANGES:
        return jsonify({"error": f"不支持的时间范围: {days}"}), 400
    
    stats = Statistics.get_platform_stats(platform, days)
    return jsonify(stats)

@api_bp.route('/games/trend', methods=['GET'])
def get_games_trend():
    """获取游戏增减趋势"""
    platform = request.args.get('platform', PLATFORMS[0])
    days = int(request.args.get('days', 30))
    
    if platform not in PLATFORMS:
        return jsonify({"error": f"不支持的平台: {platform}"}), 400
    
    if days not in TIME_RANGES:
        return jsonify({"error": f"不支持的时间范围: {days}"}), 400
    
    trend_data = Statistics.get_games_trend(platform, days)
    return jsonify(trend_data)

# 自定义错误处理
@api_bp.errorhandler(404)
def not_found(error):
    return jsonify({"error": "资源不存在"}), 404

@api_bp.errorhandler(500)
def server_error(error):
    return jsonify({"error": "服务器内部错误"}), 500 