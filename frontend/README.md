# Game Spy 前端开发指南

## 项目概述

Game Spy 前端是一个使用 React 构建的单页应用，用于展示游戏数据监控平台的数据。

## 安装和运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

服务器将在 http://localhost:3000 上运行。

## 项目结构

```
frontend/
├── public/                # 静态文件
├── src/                   # 源代码
│   ├── components/        # 可复用组件
│   │   ├── shared/        # 共享组件
│   │   └── ...
│   ├── pages/             # 页面组件
│   ├── services/          # API服务
│   ├── utils/             # 工具函数
│   ├── App.jsx            # 应用入口
│   └── main.jsx           # 主渲染入口
├── package.json           # 项目配置
└── vite.config.js         # Vite 配置
```

## API 集成示例

游戏数据监控平台的API基础URL是 `http://localhost:5000`。以下是如何在前端中集成API的示例：

### API服务示例 (src/services/api.js)

```javascript
/**
 * 游戏数据API服务
 */
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * 通用请求方法
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '请求失败');
  }
  
  return response.json();
}

/**
 * 获取平台列表
 */
export async function getPlatforms() {
  return fetchAPI('/platforms');
}

/**
 * 获取游戏列表
 */
export async function getGames(platform = 'poki', limit = 100, offset = 0) {
  return fetchAPI(`/games?platform=${platform}&limit=${limit}&offset=${offset}`);
}

/**
 * 获取游戏详情
 */
export async function getGameDetail(gameId) {
  return fetchAPI(`/games/${gameId}`);
}

/**
 * 获取游戏分类
 */
export async function getCategories(platform = 'poki') {
  return fetchAPI(`/categories?platform=${platform}`);
}

/**
 * 获取游戏排行榜
 */
export async function getRankings(platform = 'poki', limit = 20) {
  return fetchAPI(`/rankings?platform=${platform}&limit=${limit}`);
}

/**
 * 获取平台统计数据
 */
export async function getStats(platform = 'poki', days = 30) {
  return fetchAPI(`/stats?platform=${platform}&days=${days}`);
}

/**
 * 获取游戏增减趋势
 */
export async function getGamesTrend(platform = 'poki', days = 30) {
  return fetchAPI(`/games/trend?platform=${platform}&days=${days}`);
}

export default {
  getPlatforms,
  getGames,
  getGameDetail,
  getCategories,
  getRankings,
  getStats,
  getGamesTrend,
};
```

### 组件集成示例 (src/components/GamesList.jsx)

```jsx
import React, { useState, useEffect } from 'react';
import { getGames } from '../services/api';

function GamesList({ platform = 'poki' }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        const data = await getGames(platform);
        setGames(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchGames();
  }, [platform]);
  
  if (loading) {
    return <div>加载中...</div>;
  }
  
  if (error) {
    return <div className="error">错误: {error}</div>;
  }
  
  return (
    <div className="games-list">
      <h2>{platform} 游戏列表</h2>
      <div className="games-grid">
        {games.map((game) => (
          <div key={game.id} className="game-card">
            <h3>{game.title}</h3>
            <p>{game.description}</p>
            <div className="game-stats">
              <span>👍 {game.up_count}</span>
              <span>👎 {game.down_count}</span>
            </div>
            <div className="game-categories">
              {game.categories.map((category) => (
                <span key={category} className="category-tag">
                  {category}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GamesList;
```

## 常见问题

### 跨域问题

API服务器已配置CORS，允许前端应用从任何源访问API。如果遇到跨域问题，请确保：

1. 后端服务器正在运行
2. API基础URL配置正确
3. 后端`flask_cors`配置正确

### 生产部署

构建生产版本：

```bash
npm run build
```

生成的文件将位于`dist`目录中，可以部署到任何静态网站托管服务。 