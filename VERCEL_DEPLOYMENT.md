# 在 Vercel 上部署 Game-Spy 应用

本指南将帮助您在 Vercel 上部署 Game-Spy 应用，包括 Flask 后端和 React 前端。

## 先决条件

1. 一个 [Vercel 账户](https://vercel.com/signup)
2. 已将项目推送到 GitHub、GitLab 或 Bitbucket

## 部署步骤

### 1. 创建 Vercel 项目

1. 登录您的 Vercel 账户
2. 点击 "New Project" 按钮
3. 导入您的 Git 仓库
4. 选择导入 Game-Spy 项目

### 2. 配置项目设置

在导入步骤中，您需要配置以下设置：

- **Framework Preset**: 选择 "Other"
- **Root Directory**: 保持默认值 (项目根目录)
- **Build Command**: 
  ```
  cd frontend && CI=false npm install && CI=false npm run build
  ```
- **Output Directory**: 
  ```
  frontend/build
  ```

> **注意**: 使用 `CI=false` 是为了防止 ESLint 警告导致构建失败。

### 3. 环境变量

如果您的应用需要任何环境变量，请在 "Environment Variables" 部分添加它们。例如：

- `API_CONFIG__HOST`: `0.0.0.0`
- `API_CONFIG__PORT`: `8000`
- `API_CONFIG__DEBUG`: `False`
- `CI`: `false` (防止 ESLint 警告被视为错误)

### 4. 部署

一旦完成设置，点击 "Deploy" 按钮开始部署流程。

## 验证部署

部署完成后，Vercel 将提供一个预览 URL，您可以访问该 URL 来验证部署是否成功：

1. 访问前端应用以确保 UI 正常加载
2. 测试 API 端点以确保后端正常工作（例如 `/api/platforms`）

## 故障排除

如果您遇到问题，可以检查以下几点：

### ESLint 警告导致构建失败

如果构建失败并出现 ESLint 警告，确保以下设置之一已完成：

1. 在构建命令前添加 `CI=false`：
   ```
   CI=false npm run build
   ```

2. 或在 Vercel 项目设置中添加环境变量：
   ```
   CI=false
   ```

3. 或在 `vercel.json` 文件中的 `env` 部分添加：
   ```json
   "env": {
     "CI": "false"
   }
   ```

### API 不可访问

确保 `vercel.json` 文件中的路由配置正确。如果 API 不可访问，请检查 Vercel 的日志以查看可能的错误。

### 静态文件问题

如果前端加载有问题，请确保构建输出目录设置正确，并且前端构建过程成功完成。

### CORS 问题

如果遇到 CORS 错误，检查 `api/index.py` 文件中的 CORS 设置是否正确配置。

## 自定义域名

部署成功后，您可以在 Vercel 项目设置中添加自定义域名：

1. 在 Vercel 项目仪表板中，转到 "Settings" > "Domains"
2. 添加您的自定义域名并按照说明进行配置

## 持续部署

Vercel 将自动为您的项目设置持续部署。每当您推送更改到您的 Git 仓库时，Vercel 将自动部署最新版本的应用。 