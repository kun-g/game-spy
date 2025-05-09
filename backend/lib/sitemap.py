import os
from datetime import datetime
from bs4 import BeautifulSoup

def find_latest_sitemap(site, sitemap_path):
    """
    查找指定站点最新的sitemap文件
    
    Args:
        site: 站点名称
        sitemap_path: sitemap文件存储路径，默认为'data/sitemap'
        
    Returns:
        最新sitemap的时间对象，如果没有找到则返回None
    """
    files = os.listdir(sitemap_path)
    last_time, last_file = None, None
    for file in files:
        if file.startswith(site):
            [_, date, time] = file.split('.')[0].split('_')
            last_file = file
            # 最新时间
            if last_time is None:
                last_time = datetime.strptime(f"{date}_{time}", "%Y%m%d_%H%M%S")
            else:
                last_time = max(last_time, datetime.strptime(f"{date}_{time}", "%Y%m%d_%H%M%S"))
    return last_file, last_time

def get_game_urls(path):
    """
    获取指定站点的所有游戏URL
    """
    with open(f"{path}", "r") as f:
        sitemap_content = f.read()
    soup = BeautifulSoup(sitemap_content, 'xml')
    # 直接匹配<url>标签下的<loc>标签
    loc_tags = soup.select('url > loc')
    return [tag.text for tag in loc_tags]