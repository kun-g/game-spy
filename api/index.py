#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os

# 添加项目根目录到 Python 路径，以便可以导入 backend 包
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app import app

# Vercel 默认会寻找名为 app 的 WSGI 应用实例
# 我们直接使用 backend/app.py 中创建的 Flask 应用实例 