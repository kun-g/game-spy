#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from pathlib import Path

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent.absolute()

# 数据库配置
DATABASE = {
    'path': os.getenv('DB_PATH', os.path.join(ROOT_DIR, 'data', 'games.db')),
}

# API 配置
API_CONFIG = {
    'host': os.getenv('API_HOST', '0.0.0.0'),
    'port': int(os.getenv('API_PORT', 5000)),
    'debug': os.getenv('API_DEBUG', 'True').lower() in ('true', '1', 't'),
    'prefix': '/api',
}

# 分页配置
PAGINATION = {
    'default_limit': int(os.getenv('DEFAULT_LIMIT', 100)),
    'max_limit': int(os.getenv('MAX_LIMIT', 500)),
}

# 游戏平台配置
PLATFORMS = os.getenv('PLATFORMS', 'poki,crazygames,gamedistribution').split(',')

# 时间范围配置
TIME_RANGES = [7, 30, 90, 180] 