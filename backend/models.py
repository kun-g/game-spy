#!/usr/bin/env python
# -*- coding: utf-8 -*-

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from backend.database import execute_query, execute_query_one

class Game:
    @staticmethod
    def get_all(platform: str, limit: int, offset: int) -> List[Dict[str, Any]]:
        """获取所有游戏"""
        if platform == 'poki':
            query = '''
                SELECT g.id, g.title, g.description, g.up_count, g.down_count, g.url, g.fetch_time
                FROM games_poki g
                ORDER BY (g.up_count * 1.0 / (g.up_count + g.down_count + 1)) DESC
                LIMIT ? OFFSET ?
            '''
            games = execute_query(query, (limit, offset))
            
            # 获取每个游戏的分类
            for game in games:
                categories_query = '''
                    SELECT category FROM game_categories_poki WHERE game_id = ?
                '''
                categories = execute_query(categories_query, (game['id'],))
                game['categories'] = [cat['category'] for cat in categories]
            
            return games
        else:
            return []

    @staticmethod
    def get_by_id(game_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取游戏详情"""
        query = '''
            SELECT g.id, g.title, g.description, g.up_count, g.down_count, g.url, g.slug, g.fetch_time
            FROM games_poki g
            WHERE g.id = ?
        '''
        game = execute_query_one(query, (game_id,))
        
        if game:
            # 获取游戏的分类
            categories_query = '''
                SELECT category FROM game_categories_poki WHERE game_id = ?
            '''
            categories = execute_query(categories_query, (game_id,))
            game['categories'] = [cat['category'] for cat in categories]
            
            # 获取相关分类
            related_query = '''
                SELECT category FROM related_categories_poki WHERE game_id = ?
            '''
            related = execute_query(related_query, (game_id,))
            game['related_categories'] = [cat['category'] for cat in related]
            
            # 获取评分历史
            history_query = '''
                SELECT up_count, down_count, fetch_time
                FROM games_rating_poki
                WHERE game_id = ?
                ORDER BY fetch_time ASC
            '''
            rating_history = execute_query(history_query, (game_id,))
            game['rating_history'] = rating_history
        
        return game


class Category:
    @staticmethod
    def get_all(platform: str) -> List[str]:
        """获取所有游戏分类"""
        if platform == 'poki':
            query = '''
                SELECT DISTINCT category
                FROM game_categories_poki
                ORDER BY category
            '''
            categories = execute_query(query)
            return [cat['category'] for cat in categories]
        else:
            return []


class Ranking:
    @staticmethod
    def get_top(platform: str, limit: int) -> List[Dict[str, Any]]:
        """获取游戏排行榜"""
        if platform == 'poki':
            query = '''
                SELECT 
                    g.id, 
                    g.title, 
                    g.url,
                    g.up_count, 
                    g.down_count,
                    (g.up_count * 1.0 / (g.up_count + g.down_count + 1)) AS positive_ratio
                FROM games_poki g
                WHERE g.up_count + g.down_count > 10  -- 至少有10个评分
                ORDER BY positive_ratio DESC, g.up_count DESC
                LIMIT ?
            '''
            return execute_query(query, (limit,))
        else:
            return []


class Statistics:
    @staticmethod
    def get_platform_stats(platform: str, days: int) -> Dict[str, Any]:
        """获取平台统计数据"""
        if platform == 'poki':
            # 获取当前游戏总数
            total_query = 'SELECT COUNT(*) as count FROM games_poki'
            total_result = execute_query_one(total_query)
            total_games = total_result['count'] if total_result else 0
            
            # 获取最近N天内新增的游戏数
            date_threshold = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')
            new_query = '''
                SELECT COUNT(*) as count 
                FROM games_poki 
                WHERE fetch_time > ?
            '''
            new_result = execute_query_one(new_query, (date_threshold,))
            new_games = new_result['count'] if new_result else 0
            
            # 获取每个分类的游戏数量
            categories_query = '''
                SELECT 
                    gc.category, 
                    COUNT(DISTINCT gc.game_id) as game_count
                FROM game_categories_poki gc
                GROUP BY gc.category
                ORDER BY game_count DESC
            '''
            categories_count = execute_query(categories_query)
            
            return {
                'total_games': total_games,
                'new_games': new_games,
                'categories_count': categories_count
            }
        else:
            return {
                'total_games': 0,
                'new_games': 0,
                'categories_count': []
            }

    @staticmethod
    def get_games_trend(platform: str, days: int) -> List[Dict[str, Any]]:
        """获取游戏增减趋势"""
        if platform == 'poki':
            date_threshold = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            query = '''
                SELECT 
                    date(fetch_time) as date, 
                    COUNT(*) as count
                FROM games_poki
                WHERE date(fetch_time) >= ?
                GROUP BY date(fetch_time)
                ORDER BY date(fetch_time)
            '''
            return execute_query(query, (date_threshold,))
        else:
            return [] 