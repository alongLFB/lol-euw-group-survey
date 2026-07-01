# LOL EUW Group Survey (欧服英雄联盟群友资料采集系统)

这是一个专为“英雄联盟 (League of Legends)”微信/Discord 玩家群设计的**群友资料收集系统与动态数据看板**。通过现代且极具质感的玻璃拟物化 (Glassmorphism) UI，快速收集群友的游戏信息，帮助大家更方便地寻找开黑队友。

## ✨ 核心特性 (Features)

* 🔮 **极致视觉体验**：全站采用暗黑高级风与玻璃拟物化 (Glassmorphism) 设计，附带极其顺滑的微交互动画。
* 📝 **多维度资料收集**：精细收集群友的微信名片、游戏 ID、英雄联盟段位（黑铁到王者）、活跃时间段等。
* ⚔️ **智能英雄分路选单**：
    * 完美支持多项选择（擅长位置、游戏偏好等）。
    * 内置**双重极速英雄过滤系统**（A-Z 首字母筛选 + 中英双语实时搜索框），彻底告别找英雄难的问题。
* 📊 **动态可视化数据大屏 (Dashboard)**：基于 Chart.js 实现的炫酷数据仪表盘，管理员或群友可以随时查看群内的段位分布、英雄偏好和位置占比。
* 🛡️ **轻量化数据存储**：直接利用 JSON 文件进行轻量级本地持久化存储，无需配置复杂的 MySQL/Redis 数据库，部署极其简单。

## 🛠️ 技术栈 (Tech Stack)

* **前端**：HTML5, 原生 CSS (CSS Variables + Flexbox 布局), Vanilla JavaScript
* **可视化**：[Chart.js](https://www.chartjs.org/)
* **后端**：Node.js, [Express.js](https://expressjs.com/)
* **接口拉取**：官方 [Riot Data Dragon API](https://developer.riotgames.com/docs/lol)

## 🚀 快速启动 (Quick Start)

### 1. 克隆与安装依赖
```bash
git clone <your-repo-url>
cd lol-euw-group-survey
npm install
```

### 2. 环境配置
将根目录下的 `.env.example` 复制一份并重命名为 `.env`：
```bash
cp .env.example .env
```
然后在 `.env` 中配置你的服务器端口以及用于登录数据看板的管理员密码：
```env
PORT=3030
ADMIN_KEY=your_secure_password
```

### 3. 本地运行
```bash
node server.js
```
启动后即可在浏览器中访问：`http://localhost:3030`
如果要在服务器端进行生产环境部署，强烈推荐使用 `pm2`：
```bash
pm2 start server.js --name euwlol-survey
```

## 🪄 维护指南：更新游戏最新英雄

随着英雄联盟版本的更新，会有新的英雄加入峡谷。本项目自带了一个自动化脚本，一键即可拉取 Riot 官方最新版本的全英雄数据，并自动完成智能分路归类。

只需在项目根目录运行：
```bash
node fetch_champs.js
```
脚本会自动探测当前的最新游戏版本（例如 `16.13.1`），并将数百位英雄数据更新至前端的 `js/champions.js` 中。网页刷新后即可生效！

## 📄 协议与免责声明

本项目用于玩家社群内部的非商业性交流与娱乐组队。收集的游戏 ID 与联络方式应遵循当地隐私保护政策，且绝不用于盈利或向第三方共享。
