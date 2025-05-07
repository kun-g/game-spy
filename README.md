# 游戏数据监控平台 (Game Spy)

一个用于监控和分析游戏数据的平台，包括游戏排名、评分和统计信息。

## 项目结构

```
game-spy/
├── backend/             # 后端API服务
│   ├── __init__.py      # 包初始化
│   ├── app.py           # 应用入口
│   ├── config.py        # 配置管理
│   ├── database.py      # 数据库操作
│   ├── middlewares.py   # 中间件
│   ├── models.py        # 数据模型
│   ├── routes.py        # API路由
│   ├── schemas.py       # 数据模式
│   └── utils.py         # 通用工具
├── frontend/            # 前端React应用
│   ├── public/          # 静态文件
│   ├── src/             # 源代码
│   ├── package.json     # 前端依赖
│   └── ...
├── data/                # 数据目录
│   └── games.db         # SQLite数据库
├── run_server.py        # 后端服务器启动脚本
├── setup.py             # Python包配置
├── pyproject.toml       # 项目配置
└── requirements.txt     # Python依赖
```

## 功能特点

- 游戏数据监控和分析
- 多平台支持（目前包括poki, crazygames等）
- 游戏排行榜和评分系统
- 类别和标签浏览
- 数据趋势分析
- 响应式前端设计

## 安装和运行

### 安装依赖

```bash
# 安装后端依赖
pip install -e .

# 安装前端依赖
cd frontend
npm install
```

### 运行服务

#### 后端服务

```bash
# 使用Python运行
python run_server.py

# 或者使用uv运行（如果已安装）
uv run run_server.py
```

#### 前端服务

```bash
cd frontend
npm run dev
```

## API接口

- `/api/platforms` - 获取支持的游戏平台
- `/api/games` - 获取游戏列表
- `/api/games/<game_id>` - 获取单个游戏详情
- `/api/categories` - 获取游戏分类
- `/api/rankings` - 获取游戏排行榜
- `/api/stats` - 获取平台统计数据
- `/api/games/trend` - 获取游戏增减趋势

## Docker部署

可以使用Docker Compose来部署完整应用：

```bash
docker-compose up -d
```

这将启动后端API服务器、前端服务和Nginx代理服务器。

## 开发

### 数据库迁移

SQLite数据库位于`data/games.db`，包含了游戏信息和统计数据。

### 测试

项目中包含了API测试用例，可以通过以下方式运行：

```bash
cd backend
pytest
```