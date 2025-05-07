#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sqlite3
from contextlib import contextmanager
from typing import Dict, List, Any, Generator, Optional

from backend.config import DATABASE

def dict_factory(cursor, row):
    """将 SQLite 查询结果转换为字典格式"""
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """获取数据库连接，使用上下文管理器自动关闭连接"""
    conn = sqlite3.connect(DATABASE['path'])
    conn.row_factory = dict_factory
    try:
        yield conn
    finally:
        conn.close()

def execute_query(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """执行数据库查询并返回结果"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        return cursor.fetchall()

def execute_query_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """执行数据库查询并返回单个结果"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        result = cursor.fetchone()
        return result if result else None

def execute_insert(query: str, params: tuple = ()) -> int:
    """执行插入操作并返回最后插入的ID"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.lastrowid

def execute_update(query: str, params: tuple = ()) -> int:
    """执行更新操作并返回影响的行数"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.rowcount

def execute_transaction(queries: List[tuple]) -> bool:
    """执行事务，每个元组包含(query, params)"""
    with get_db_connection() as conn:
        try:
            conn.execute("BEGIN TRANSACTION")
            for query, params in queries:
                conn.execute(query, params)
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"事务执行失败: {str(e)}")
            return False 