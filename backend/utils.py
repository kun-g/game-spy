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

def summarize_changelog(platform, days=None):
    """
    汇总指定平台的变更日志
    
    Args:
        platform (str): 平台名称，如 'crazygames'
        days (int, optional): 只汇总最近几天的数据，None表示所有数据
        
    Returns:
        dict: 汇总信息
    """
    import json
    import os
    from datetime import datetime, timedelta
    from collections import Counter, defaultdict
    from pathlib import Path
    
    # 项目根目录
    root_dir = Path(__file__).parent.parent.absolute()
    changelog_path = os.path.join(root_dir, 'data', 'change_log', f'{platform}.jsonl')
    
    if not os.path.exists(changelog_path):
        return {"error": f"平台 {platform} 的变更日志不存在"}
    
    # 设置日期过滤
    cutoff_date = None
    if days is not None:
        cutoff_date = datetime.now() - timedelta(days=days)
    
    # 统计数据
    stats = {
        "total_added": 0,
        "total_deleted": 0,
        "changes_by_date": defaultdict(lambda: {"added": 0, "deleted": 0}),
        "game_urls_added": Counter(),
        "game_urls_deleted": Counter(),
        "other_urls_added": Counter(),
        "other_urls_deleted": Counter(),
    }
    
    # 读取并解析 JSONL 文件
    with open(changelog_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                entry = json.loads(line.strip())
                
                # 解析日期
                entry_date = datetime.strptime(entry['datetime'], "%Y%m%dT%H%M%S")
                
                # 日期过滤
                if cutoff_date and entry_date < cutoff_date:
                    continue
                
                # 日期格式化为YYYY-MM-DD
                date_str = entry_date.strftime("%Y-%m-%d")
                
                # 添加的URLs
                for url in entry.get('added_urls', []):
                    stats["total_added"] += 1
                    stats["changes_by_date"][date_str]["added"] += 1
                    
                    # 区分游戏URL和其他URL
                    if '/game/' in url:
                        game_name = url.split('/game/')[1]
                        stats["game_urls_added"][game_name] += 1
                    else:
                        stats["other_urls_added"][url] += 1
                
                # 删除的URLs
                for url in entry.get('deleted_urls', []):
                    stats["total_deleted"] += 1
                    stats["changes_by_date"][date_str]["deleted"] += 1
                    
                    # 区分游戏URL和其他URL
                    if '/game/' in url:
                        game_name = url.split('/game/')[1]
                        stats["game_urls_deleted"][game_name] += 1
                    else:
                        stats["other_urls_deleted"][url] += 1
                    
            except (json.JSONDecodeError, KeyError) as e:
                continue
    
    # 转换计数器对象为有序列表
    stats["game_urls_added"] = [{"name": k, "count": v} for k, v in stats["game_urls_added"].most_common()]
    stats["game_urls_deleted"] = [{"name": k, "count": v} for k, v in stats["game_urls_deleted"].most_common()]
    stats["other_urls_added"] = [{"url": k, "count": v} for k, v in stats["other_urls_added"].most_common()]
    stats["other_urls_deleted"] = [{"url": k, "count": v} for k, v in stats["other_urls_deleted"].most_common()]
    
    # 转换日期计数
    stats["changes_by_date"] = [{"date": date, **counts} for date, counts in sorted(stats["changes_by_date"].items())]
    
    return stats 