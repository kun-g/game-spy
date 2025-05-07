from bs4 import BeautifulSoup
import requests
import json
import re
import sqlite3
from datetime import datetime, timedelta
from lib import find_latest_sitemap, SITEMAP_PATH, get_game_urls
import time
import threading

# 数据库文件路径
DB_PATH = './data/games.db'

def get_db_connection():
    """
    获取数据库连接，并设置超时和锁定处理
    """
    conn = sqlite3.connect(DB_PATH, timeout=30)  # 设置30秒超时
    conn.execute('PRAGMA journal_mode=WAL')  # 使用WAL模式减少锁冲突
    return conn

def create_database():
    """
    创建SQLite数据库和必要的表结构
    """
    conn = get_db_connection()
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
    
    # 创建游戏评分历史表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS games_rating_poki (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT,
        up_count INTEGER,
        down_count INTEGER,
        fetch_time TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games_poki(id)
    )
    ''')
    
    conn.commit()
    return conn

def save_game_to_db(conn, game_data):
    """
    将游戏数据保存到数据库
    """
    try:
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
        
        # 同时记录评分历史
        save_rating_history(conn, game_data['id'], game_data['up_count'], game_data['down_count'])
        
        conn.commit()
        print(f"成功保存游戏 '{game_data['title']}' 到数据库")
    except sqlite3.Error as e:
        print(f"保存游戏数据时发生数据库错误: {e}")
        # 避免部分提交
        conn.rollback()
        raise

def save_rating_history(conn, game_id, up_count, down_count):
    """
    保存游戏评分历史
    """
    try:
        cursor = conn.cursor()
        
        # 插入评分历史
        cursor.execute('''
        INSERT INTO games_rating_poki (game_id, up_count, down_count, fetch_time)
        VALUES (?, ?, ?, ?)
        ''', (
            game_id,
            up_count,
            down_count,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ))
        
        print(f"成功记录游戏 ID:{game_id} 的评分历史：👍 {up_count} / 👎 {down_count}")
    except sqlite3.Error as e:
        print(f"保存评分历史时发生数据库错误: {e}")
        # 不抛出异常，继续处理其他数据

def fetch_game_data(url):
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
    game_data = fetch_game_data(url)
    
    if game_data:
        try:
            save_game_to_db(db_conn, game_data)
            return True
        except Exception as e:
            print(f"保存游戏数据到数据库时出错: {e}")
            return False
    else:
        print(f"无法从 {url} 抓取游戏数据")
        return False

def is_url_in_db(url, db_conn):
    """
    检查URL是否在数据库中
    """
    try:
        cursor = db_conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM games_poki WHERE url = ?', (url,))
        result = cursor.fetchone()
        return result[0] > 0
    except sqlite3.Error as e:
        print(f"查询数据库时出错: {e}")
        return False  # 查询失败时默认返回false，允许再次尝试

def get_all_game_ids(db_conn):
    """
    获取数据库中所有游戏ID
    """
    cursor = db_conn.cursor()
    cursor.execute('SELECT id, url FROM games_poki')
    return cursor.fetchall()

def fetch_ratings_hourly():
    """
    每小时抓取一次所有游戏的评分数据
    """
    while True:
        conn = None
        try:
            print(f"开始定时抓取评分数据 - {datetime.now()}")
            # 每次抓取创建新的数据库连接
            conn = get_db_connection()
            
            # 获取所有游戏ID和URL
            games = get_all_game_ids(conn)
            
            if not games:
                print("数据库中没有游戏数据")
                if conn:
                    conn.close()
                time.sleep(3600)  # 休眠1小时
                continue
                
            success_count = 0
            for game_id, url in games:
                try:
                    # 抓取游戏数据
                    game_data = fetch_game_data(url)
                    
                    if game_data and 'up_count' in game_data and 'down_count' in game_data:
                        # 只更新评分历史
                        save_rating_history(conn, game_id, game_data['up_count'], game_data['down_count'])
                        conn.commit()  # 每处理一条数据就提交，避免长事务
                        success_count += 1
                    
                    # 避免请求过于频繁
                    time.sleep(2)
                except Exception as e:
                    print(f"抓取游戏 {game_id} 评分数据时出错: {e}")
                    # 继续处理下一条，不中断整个过程
            
            if conn:
                conn.commit()
                conn.close()
                conn = None
            
            print(f"评分数据抓取完成，成功更新 {success_count}/{len(games)} 个游戏")
            
            # 计算下次抓取时间（下一个整点）
            now = datetime.now()
            next_hour = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
            sleep_seconds = (next_hour - now).total_seconds()
            
            print(f"下次抓取时间: {next_hour}，休眠 {sleep_seconds} 秒")
            time.sleep(sleep_seconds)
        
        except Exception as e:
            print(f"定时抓取评分数据时发生错误: {e}")
            time.sleep(3600)  # 出错后休眠1小时
        finally:
            # 确保连接被关闭
            if conn:
                try:
                    conn.close()
                except:
                    pass

def main():
    """
    主函数：处理多个游戏URL
    """
    try:
        # 创建数据库连接
        db_conn = create_database()

        # 启动每小时抓取评分数据的线程
        rating_thread = threading.Thread(target=fetch_ratings_hourly, daemon=True)
        rating_thread.start()
        print("启动评分数据定时抓取线程")

        latest_sitemap, _ = find_latest_sitemap('poki', SITEMAP_PATH)
        print(f"最新sitemap: {latest_sitemap}")

        # 读取sitemap文件
        game_urls = get_game_urls(latest_sitemap, SITEMAP_PATH)

        processed_count = 0
        error_count = 0
        retry_urls = []

        for url in game_urls:
            try:
                # URL 不在数据库中，才处理
                if not is_url_in_db(url, db_conn):
                    success = process_game_url(url, db_conn)
                    if success:
                        processed_count += 1
                    else:
                        error_count += 1
                        retry_urls.append(url)
                    # 每处理10个URL提交一次，避免长事务
                    if processed_count % 10 == 0:
                        db_conn.commit()
                    # 休眠1秒
                    time.sleep(1)
            except sqlite3.Error as e:
                print(f"处理URL {url} 时数据库错误: {e}")
                # 如果数据库被锁，等待后重试
                if 'database is locked' in str(e):
                    print("数据库被锁定，等待5秒后重试...")
                    time.sleep(5)
                    retry_urls.append(url)
                else:
                    error_count += 1
                    retry_urls.append(url)
            except Exception as e:
                print(f"处理URL {url} 时未知错误: {e}")
                error_count += 1
                retry_urls.append(url)

        # 处理重试URL
        if retry_urls:
            print(f"开始处理 {len(retry_urls)} 个失败的URL...")
            for url in retry_urls:
                try:
                    if not is_url_in_db(url, db_conn):
                        success = process_game_url(url, db_conn)
                        if success:
                            processed_count += 1
                        time.sleep(2)  # 重试时增加延迟
                except Exception as e:
                    print(f"重试处理URL {url} 时错误: {e}")

        # 提交最终修改
        db_conn.commit()
        print(f"处理完成! 成功: {processed_count}, 失败: {error_count}")
        
        # 保持主线程运行，让评分抓取线程能继续工作
        try:
            while rating_thread.is_alive():
                time.sleep(60)  # 每分钟检查一次
        except KeyboardInterrupt:
            print("程序被用户中断")
        finally:
            # 关闭数据库连接
            db_conn.close()
    except Exception as e:
        print(f"主程序执行出错: {e}")
        # 确保关闭数据库连接
        try:
            if 'db_conn' in locals() and db_conn:
                db_conn.close()
        except:
            pass

# 如果直接运行脚本，则执行main函数
if __name__ == "__main__":
    main()