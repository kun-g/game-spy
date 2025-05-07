#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
数据验证模式
用于验证API请求数据和响应数据
"""

# 游戏数据模式
game_schema = {
    "id": {"type": "string", "required": True},
    "title": {"type": "string", "required": True},
    "description": {"type": "string", "required": False},
    "url": {"type": "string", "required": True},
    "up_count": {"type": "integer", "required": True},
    "down_count": {"type": "integer", "required": True},
    "categories": {"type": "list", "required": False},
    "platform": {"type": "string", "required": True},
    "fetch_time": {"type": "string", "required": True},
}

# 游戏详情数据模式
game_detail_schema = {
    **game_schema,
    "voting_history": {
        "type": "list",
        "schema": {
            "type": "dict",
            "schema": {
                "date": {"type": "string", "required": True},
                "up_count": {"type": "integer", "required": True},
                "down_count": {"type": "integer", "required": True},
            }
        },
        "required": False,
    },
}

# 排行榜数据模式
ranking_schema = {
    "games": {
        "type": "list",
        "schema": {
            "type": "dict",
            "schema": {
                "id": {"type": "string", "required": True},
                "title": {"type": "string", "required": True},
                "up_count": {"type": "integer", "required": True},
                "down_count": {"type": "integer", "required": True},
                "ratio": {"type": "float", "required": True},
            }
        },
        "required": True,
    }
}

# 平台统计数据模式
stats_schema = {
    "total_games": {"type": "integer", "required": True},
    "new_games": {"type": "integer", "required": True},
    "removed_games": {"type": "integer", "required": True},
    "avg_up_votes": {"type": "float", "required": True},
    "avg_down_votes": {"type": "float", "required": True},
    "top_categories": {
        "type": "list",
        "schema": {
            "type": "dict",
            "schema": {
                "name": {"type": "string", "required": True},
                "count": {"type": "integer", "required": True},
            }
        },
        "required": True,
    }
} 