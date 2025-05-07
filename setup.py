#!/usr/bin/env python
# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

setup(
    name="game-spy",
    version="1.0.0",
    description="游戏数据监控平台",
    author="Game Spy Team",
    packages=find_packages(),
    install_requires=[
        "flask>=2.0.0",
        "flask-cors>=3.0.0",
    ],
    python_requires=">=3.7",
) 