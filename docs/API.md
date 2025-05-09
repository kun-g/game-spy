# 游戏数据监控平台 API 文档

## 基础信息

- 基础URL: `http://localhost:5000`
- 所有API路径都以`/api`开头
- 响应格式: JSON

## 认证

目前API不需要认证。

## API 接口

### 平台列表

获取所有支持的游戏平台。

- **URL**: `/api/platforms`
- **方法**: `GET`
- **参数**: 无
- **响应示例**:
  ```json
  ["poki", "crazygames"]
  ```

### 游戏列表

获取游戏列表，支持分页和按平台筛选。

- **URL**: `/api/games`
- **方法**: `GET`
- **参数**:
  - `platform` (可选): 平台名称 (默认: "poki")
  - `limit` (可选): 每页数量 (默认: 100)
  - `offset` (可选): 偏移量 (默认: 0)
- **响应示例**:
  ```json
  [
    {
      "id": "123",
      "title": "游戏标题",
      "description": "游戏描述",
      "up_count": 100,
      "down_count": 10,
      "url": "https://example.com/game",
      "fetch_time": "2023-05-01 12:00:00",
      "categories": ["动作", "冒险"]
    },
    // ...更多游戏
  ]
  ```

### 游戏详情

获取单个游戏的详细信息。

- **URL**: `/api/games/<game_id>`
- **方法**: `GET`
- **参数**: 无
- **响应示例**:
  ```json
  {
    "id": "123",
    "title": "游戏标题",
    "description": "游戏描述",
    "up_count": 100,
    "down_count": 10,
    "url": "https://example.com/game",
    "slug": "game-title",
    "fetch_time": "2023-05-01 12:00:00",
    "categories": ["动作", "冒险"],
    "related_categories": ["射击", "多人"],
    "rating_history": [
      {
        "up_count": 90,
        "down_count": 8,
        "fetch_time": "2023-04-01 12:00:00"
      },
      // ...更多历史数据
    ]
  }
  ```

### 游戏分类

获取所有游戏分类。

- **URL**: `/api/categories`
- **方法**: `GET`
- **参数**:
  - `platform` (可选): 平台名称 (默认: "poki")
- **响应示例**:
  ```json
  ["动作", "冒险", "休闲", "策略", "解谜", "射击", "体育"]
  ```

### 游戏排行榜

获取游戏排行榜，基于好评率排序。

- **URL**: `/api/rankings`
- **方法**: `GET`
- **参数**:
  - `platform` (可选): 平台名称 (默认: "poki")
  - `limit` (可选): 结果数量 (默认: 20)
- **响应示例**:
  ```json
  [
    {
      "id": "123",
      "title": "游戏标题",
      "url": "https://example.com/game",
      "up_count": 100,
      "down_count": 10,
      "positive_ratio": 0.9091
    },
    // ...更多游戏
  ]
  ```

### 平台统计数据

获取平台统计数据。

- **URL**: `/api/stats`
- **方法**: `GET`
- **参数**:
  - `platform` (可选): 平台名称 (默认: "poki")
  - `days` (可选): 天数 (默认: 30)
- **响应示例**:
  ```json
  {
    "total_games": 5000,
    "new_games": 120,
    "categories_count": [
      {
        "category": "动作",
        "game_count": 1200
      },
      // ...更多分类
    ]
  }
  ```

### 游戏增减趋势

获取平台游戏数量增减趋势。

- **URL**: `/api/games/trend`
- **方法**: `GET`
- **参数**:
  - `platform` (可选): 平台名称 (默认: "poki")
  - `days` (可选): 天数 (默认: 30)
- **响应示例**:
  ```json
  [
    {
      "date": "2023-04-01",
      "count": 15
    },
    // ...更多日期
  ]
  ```

## 错误处理

API使用标准HTTP状态码表示请求的状态：

- 200: 成功
- 400: 请求参数错误
- 404: 资源不存在
- 429: 请求频率过高
- 500: 服务器内部错误

错误响应格式：

```json
{
  "error": "错误描述"
}
``` 