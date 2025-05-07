#!/usr/bin/env python
# -*- coding: utf-8 -*-

from backend.app import app
from backend.config import API_CONFIG

if __name__ == '__main__':
    print(f"Starting Game Spy API server at http://{API_CONFIG['host']}:{API_CONFIG['port']}")
    app.run(
        host=API_CONFIG['host'],
        port=API_CONFIG['port'],
        debug=API_CONFIG['debug']
    ) 