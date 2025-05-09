import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

const api = {
  // 平台相关
  getPlatforms: () => {
    return axios.get(`${API_URL}/platforms`);
  },
  
  // 游戏列表
  getGames: (platform = 'poki', limit = 100, offset = 0) => {
    return axios.get(`${API_URL}/games`, {
      params: { platform, limit, offset }
    });
  },
  
  // 游戏详情
  getGameDetail: (gameId) => {
    return axios.get(`${API_URL}/games/${gameId}`);
  },
  
  // 游戏分类
  getCategories: (platform = 'poki') => {
    return axios.get(`${API_URL}/categories`, {
      params: { platform }
    });
  },
  
  // 排行榜
  getRankings: (platform = 'poki', limit = 20) => {
    return axios.get(`${API_URL}/rankings`, {
      params: { platform, limit }
    });
  },
  
  // 平台统计
  getStats: (platform = 'poki', days = 30) => {
    return axios.get(`${API_URL}/stats`, {
      params: { platform, days }
    });
  },
  
  // 游戏趋势
  getGamesTrend: (platform = 'poki', days = 30) => {
    return axios.get(`${API_URL}/games/trend`, {
      params: { platform, days }
    });
  },
  
  // 变更汇总
  getChangesSummary: (platform = 'crazygames', days = null) => {
    const params = { platform };
    if (days !== null) {
      params.days = days;
    }
    return axios.get(`${API_URL}/changes/summary`, { params });
  },
  
  // 获取原始变更数据（含URL和确切日期）
  getRawChanges: (platform = 'crazygames') => {
    return axios.get(`${API_URL}/changes/raw`, {
      params: { platform }
    });
  }
};

export default api; 