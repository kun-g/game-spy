import requests
import os
import json
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from backend.lib.data import load_config
from backend.lib.sitemap import find_latest_sitemap, get_game_urls

config = load_config()
SITEMAP_PATH = config['sitemap_path']

def fetch_sitemap(url):
    res = requests.get(url)
    res.raise_for_status()
    return res.text

def parse_urls(sitemap_xml):
    soup = BeautifulSoup(sitemap_xml, 'xml')
    urls = [loc.text.strip() for loc in soup.find_all('loc')]
    return urls

def clean_duplicate_sitemaps(site, sitemap_path):
    """
    对比相邻日期的sitemap文件，如果内容相同则删除最新的文件
    
    Args:
        site: 站点名称
        sitemap_path: sitemap文件存储路径
        
    Returns:
        删除的文件数量
    """
    # 获取指定站点的所有sitemap文件
    files = [f for f in os.listdir(sitemap_path) if f.startswith(site) and f.endswith('.xml')]
    
    # 按时间排序文件（从旧到新）
    def extract_datetime(filename):
        parts = filename.split('.')[0].split('_')
        if len(parts) >= 3:
            date, time = parts[1], parts[2]
            return datetime.strptime(f"{date}_{time}", "%Y%m%d_%H%M%S")
        return datetime.min
    
    files.sort(key=extract_datetime)
    
    # 如果文件数量小于2，无需比较
    if len(files) < 2:
        print(f"站点 {site} 的sitemap文件少于2个，无需清理")
        return 0
    
    deleted_count = 0
    
    # 对比最新的两个文件
    new_urls = sorted(get_game_urls(os.path.join(sitemap_path, files[-1])))
    old_urls = sorted(get_game_urls(os.path.join(sitemap_path, files[-2])))
    added_urls = [url for url in new_urls if url not in old_urls]
    deleted_urls = [url for url in old_urls if url not in new_urls]

    if len(deleted_urls) == 0 and len(added_urls) == 0:
        print(f"文件内容相同: {files[-1]} 和 {files[-2]}，删除较新的文件")
        os.remove(os.path.join(sitemap_path, files[-1]))
        deleted_count += 1
    else:
        timestr = files[-1].split('.')[0].split('_')
        with open(os.path.join(config['change_log_path'], f"{site}.jsonl"), 'a') as f:
            f.write(json.dumps({
                'datetime': f"{timestr[1]}T{timestr[2]}",
                'deleted_urls': deleted_urls,
                'added_urls': added_urls
            }) + '\n')
    
    return deleted_count

def main():
    for target in config['sites']:
        name, url = target['name'], target['url']
        # 获取最新的sitemap时间
        _, last_time = find_latest_sitemap(name, config['sitemap_path'])
        
        # 如果时间在1小时内，则不抓取
        if last_time and datetime.now() - last_time < timedelta(hours=1):
            print(f"Last fetch time for {name} is less than 1 hour, skipping...")
            continue

        print(f"Fetching sitemap for {name}...")
        sitemap = fetch_sitemap(url)

        # 保存到文件
        with open(f'{SITEMAP_PATH}/{name}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xml', 'w') as f:
            f.write(sitemap)

    # 清理重复的sitemap文件
    for target in config['sites']:
        deleted = clean_duplicate_sitemaps(target['name'], config['sitemap_path'])
        if deleted > 0:
            print(f"清理了 {deleted} 个重复的sitemap文件")

if __name__ == '__main__':
    main()