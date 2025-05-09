#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Blueprint, jsonify, request
from typing import List, Dict, Any

from backend.config import PAGINATION, PLATFORMS, TIME_RANGES
from backend.models import Game, Category, Ranking, Statistics
from backend.utils import summarize_changelog

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

@api_bp.route('/changes/summary', methods=['GET'])
def get_changes_summary():
    """获取平台变更汇总"""
    platform = request.args.get('platform', PLATFORMS[0])
    days = request.args.get('days')
    
    if platform not in PLATFORMS:
        return jsonify({"error": f"不支持的平台: {platform}"}), 400
    
    # 如果提供了天数，转换为整数
    if days:
        try:
            days = int(days)
        except ValueError:
            return jsonify({"error": "天数必须是整数"}), 400
    
    summary = summarize_changelog(platform, days)
    
    # 检查是否有错误
    if isinstance(summary, dict) and "error" in summary:
        return jsonify(summary), 404
        
    return jsonify(summary)

@api_bp.route('/changes/raw', methods=['GET'])
def get_raw_changes():
    """获取平台变更原始数据（含URL和对应日期）"""
    import json
    import os
    from pathlib import Path
    from datetime import datetime
    
    platform = request.args.get('platform', PLATFORMS[0])
    days = request.args.get('days')
    
    if platform not in PLATFORMS and platform != 'all':
        return jsonify({"error": f"不支持的平台: {platform}"}), 400
    
    # 项目根目录
    root_dir = Path(__file__).parent.parent.absolute()
    
    # 获取所有需要处理的平台
    target_platforms = PLATFORMS if platform == 'all' else [platform]
    
    # 结果集
    result = []
    
    # 处理每个平台的日志
    for p in target_platforms:
        changelog_path = os.path.join(root_dir, 'data', 'change_log', f'{p}.jsonl')
        
        if not os.path.exists(changelog_path):
            continue  # 跳过不存在的日志文件
        
        try:
            with open(changelog_path, 'r', encoding='utf-8') as f:
                for line in f:
                    entry = json.loads(line.strip())
                    
                    # 解析日期时间为ISO格式
                    dt = entry['datetime']
                    date_str = f"{dt[0:4]}-{dt[4:6]}-{dt[6:8]}"
                    time_str = f"{dt[9:11]}:{dt[11:13]}:{dt[13:15]}"
                    datetime_str = f"{date_str} {time_str}"
                    
                    # 存储处理后的记录
                    record = {
                        'platform': p,
                        'date': date_str,
                        'time': time_str,
                        'datetime': datetime_str,
                        'added_urls': entry.get('added_urls', []),
                        'deleted_urls': entry.get('deleted_urls', [])
                    }
                    result.append(record)
        except Exception as e:
            # 记录错误但继续处理其他平台
            print(f"处理平台 {p} 日志时出错: {str(e)}")
    
    # 按日期时间倒序排序
    result.sort(key=lambda x: x['datetime'], reverse=True)
    
    return jsonify(result)

# 自定义错误处理
@api_bp.errorhandler(404)
def not_found(error):
    return jsonify({"error": "资源不存在"}), 404

@api_bp.errorhandler(500)
def server_error(error):
    return jsonify({"error": "服务器内部错误"}), 500 