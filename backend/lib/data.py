import yaml

def load_config(config_path='data/config.yaml'):
    """
    从配置文件加载站点信息
    
    Args:
        config_path: 配置文件路径，默认为'data/config.yaml'
        
    Returns:
        包含站点信息的字典
    """
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        
        return config
    except Exception as e:
        print(f"加载配置文件失败: {e}")
        return {}




