from bs4 import BeautifulSoup
import requests
import json
import re
import sqlite3
from datetime import datetime
from lib import find_latest_sitemap, SITEMAP_PATH, get_game_urls
import time

def create_database():
    """
    创建SQLite数据库和必要的表结构
    """
    conn = sqlite3.connect('./data/games.db')
    cursor = conn.cursor()
    
    # 创建游戏基本信息表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS games_poki (
        id TEXT PRIMARY KEY,
        url TEXT,
        slug TEXT,
        title TEXT,
        description TEXT,
        up_count INTEGER,
        down_count INTEGER,
        fetch_time TIMESTAMP
    )
    ''')
    
    # 创建游戏分类关系表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS game_categories_poki (
        game_id TEXT,
        category TEXT,
        PRIMARY KEY (game_id, category),
        FOREIGN KEY (game_id) REFERENCES games_poki(id)
    )
    ''')
    
    # 创建相关分类表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS related_categories_poki (
        game_id TEXT,
        category TEXT,
        PRIMARY KEY (game_id, category),
        FOREIGN KEY (game_id) REFERENCES games_poki(id)
    )
    ''')
    
    conn.commit()
    return conn

def save_game_to_db(conn, game_data):
    """
    将游戏数据保存到数据库
    """
    cursor = conn.cursor()
    
    # 插入游戏基本信息
    cursor.execute('''
    INSERT OR REPLACE INTO games_poki (id, url, slug, title, description, up_count, down_count, fetch_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        game_data['id'],
        game_data['url'],
        game_data['slug'],
        game_data['title'],
        game_data['description'],
        game_data['up_count'],
        game_data['down_count'],
        datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    ))
    
    # 插入游戏分类前，删除旧的分类关系
    cursor.execute('DELETE FROM game_categories_poki WHERE game_id = ?', (game_data['id'],))
    # 插入新的分类关系
    for category in game_data['categories']:
        cursor.execute('''
        INSERT INTO game_categories_poki (game_id, category)
        VALUES (?, ?)
        ''', (game_data['id'], category))
    
    # 插入相关分类前，删除旧的相关分类
    cursor.execute('DELETE FROM related_categories_poki WHERE game_id = ?', (game_data['id'],))
    # 插入新的相关分类
    for category in game_data['relatedCategories']:
        cursor.execute('''
        INSERT INTO related_categories_poki (game_id, category)
        VALUES (?, ?)
        ''', (game_data['id'], category))
    
    conn.commit()
    print(f"成功保存游戏 '{game_data['title']}' 到数据库")

def fetch_vote_from_scripts(url):
    """
    专门从页面的script标签中提取投票数据，
    查找window.INITIAL_STATE中的数据
    """
    res = requests.get(url)
    res.raise_for_status()
    
    soup = BeautifulSoup(res.text, 'html.parser')
    scripts = soup.find_all('script')
    
    for script in scripts:
        script_content = script.string
        if not script_content:
            continue
        
        # 查找window.INITIAL_STATE对象
        if 'window.INITIAL_STATE' in script_content:
            # 提取INITIAL_STATE对象的内容
            try:
                # 使用正则表达式提取window.INITIAL_STATE = {...} 之间的JSON内容
                pattern = r'window\.INITIAL_STATE\s*=\s*\{[\s\S]*'#?\s*<\/script>'
                matches = re.search(pattern, script_content, re.DOTALL)
                if matches is None:
                    print("未找到window.INITIAL_STATE")
                    return {}

                json_str = matches.group(0)[len("window.INITIAL_STATE = "):-4]

                state_data = json.loads(json_str)
                api_key = None
                for key in state_data["api"]['queries'].keys():
                    if key.startswith("getGame"):
                        api_key = key
                        break
                if api_key is None:
                    print("未找到getGame")
                    return {}
                body = state_data["api"]['queries'][api_key]['data']
                data = {
                    "id": body['id'],
                    "url": url,
                    "slug": body['slug'],
                    "title": body['title'],
                    "description": body['description'],
                    "categories": list(map(lambda x: x['title'], body['categories'])),
                    "up_count": body['rating']['up_count'],
                    "down_count": body['rating']['down_count'],
                    "relatedCategories": list(map(lambda x: x['title'], body['relatedCategories']))
                }

                return data
                
            except Exception as e:
                print(f"提取INITIAL_STATE时出错: {e}")
    
    print("未找到window.INITIAL_STATE数据")
    return {}

def process_game_url(url, db_conn):
    """
    处理单个游戏URL：抓取数据并保存到数据库
    """
    # print(f"处理游戏URL: {url}")
    game_data = fetch_vote_from_scripts(url)
    
    if game_data:
        save_game_to_db(db_conn, game_data)
        return True
    else:
        print(f"无法从 {url} 抓取游戏数据")
        return False

def is_url_in_db(url, db_conn):
    """
    检查URL是否在数据库中
    """
    cursor = db_conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM games_poki WHERE url = ?', (url,))
    result = cursor.fetchone()
    return result[0] > 0

def main():
    """
    主函数：处理多个游戏URL
    """
    # 创建数据库连接
    db_conn = create_database()

    latest_sitemap = find_latest_sitemap('poki', SITEMAP_PATH)
    print(f"最新sitemap: {latest_sitemap}")

    # 读取sitemap文件
    game_urls = get_game_urls('poki', SITEMAP_PATH)

    while True:
        try:
            for url in game_urls:
                # URL 不在数据库中，才处理
                if not is_url_in_db(url, db_conn):
                    process_game_url(url, db_conn)
                    # 休眠1秒
                    time.sleep(1)
            break
        except Exception as e:
            print(f"处理游戏URL时出错: {e}")
            # 休眠1秒
            time.sleep(1)

    
    # 关闭数据库连接
    db_conn.close()

# 如果直接运行脚本，则执行main函数
if __name__ == "__main__":
    main()