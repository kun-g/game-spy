#!/usr/bin/env python
# -*- coding: utf-8 -*-

# 使 backend 成为一个 Python 包
from backend.app import app, create_app

__all__ = ['app', 'create_app'] 