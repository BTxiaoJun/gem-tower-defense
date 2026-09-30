# 宝石塔防

独立游戏开发项目：一款围绕"宝石"做文章的塔防游戏。设计思路见 [docs/游戏设计草案.md](docs/游戏设计草案.md)。

**当前状态**：🚧 立项期 —— 工作流已就绪，技术选型待定。

## 目录结构

```
独立游戏宝石塔防/
├── AGENTS.md          # AI 工作规范（ZCode 每次开工自动遵守）
├── README.md          # 本文件
├── .gitignore         # 告诉 git 哪些文件不入库
├── 同步到远程.bat      # 双击 = 同时推送 GitHub + Gitee
├── docs/
│   ├── 开发日志.md     # 每次干了什么，一页流水账
│   └── 游戏设计草案.md  # 玩法设计草稿
└── tmp/               # 临时文件（不入库）
```

## 首次配置（只做一次）

### 1. 告诉 git 你是谁（提交记录会署名）

在新开的命令行窗口里执行（名字邮箱随意，但建议和 GitHub 一致）：

```bat
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

### 2. 创建 GitHub 远程仓库

1. 打开 https://github.com/new
2. Repository name 填 `gem-tower-defense`（或你喜欢的英文名），选 **Public**（朋友才能直接看），不要勾选任何初始化选项
3. 点 Create repository，复制给出的仓库地址，形如 `https://github.com/你的用户名/gem-tower-defense.git`

### 3. 创建 Gitee 远程仓库

1. 打开 https://gitee.com/projects/new
2. 仓库名填 `gem-tower-defense`，选 **开源（公开）**，**不要**勾选"使用 Readme 初始化"
3. 创建后复制地址，形如 `https://gitee.com/你的用户名/gem-tower-defense.git`

### 4. 在项目文件夹里绑定这两个地址并首次推送

```bat
cd /d D:\百度网盘\独立游戏宝石塔防
git remote add github https://github.com/你的用户名/gem-tower-defense.git
git remote add gitee  https://gitee.com/你的用户名/gem-tower-defense.git
git push -u github main
git push -u gitee main
```

> 首次 push 会弹出浏览器让你登录 GitHub/Gitee，登录一次以后就不用再管。
> 也可以把上面两个地址发给 AI（ZCode），说"帮我配好远程"，剩下的它来做。

## 日常怎么用

- **干活**：直接对 ZCode 用中文说需求，它按 AGENTS.md 的流程干活并自动提交。
- **同步给朋友**：双击 `同步到远程.bat`，两个平台同时更新。
- **朋友蹭项目**：让他装好 [git](https://registry.npmmirror.com/-/binary/git-for-windows/) 后执行：
  ```bat
  git clone https://gitee.com/你的用户名/gem-tower-defense.git
  ```
- **后悔药**：小反悔用 ZCode 的 `/rewind`；已提交的用 `git revert 提交号`。

## 环境备忘（这台机器）

| 工具 | 位置 | 说明 |
|---|---|---|
| git 2.56 便携版 | `D:\DevTools\PortableGit` | 已加入用户 PATH，新开窗口敲 `git` 即可用 |
| Python 3.12 | `D:\百度网盘\AI编程\MMD_樱花少女\tools\Python312` | 系统已有 |
| npm/pip 缓存 | `D:\DevTools\cache\` | 环境变量已永久指向，不占 C 盘 |
| 凭据管理器 | git 自带 GCM | 首次 push 弹浏览器登录，之后免密 |

> 提示：项目位于百度网盘目录内，网盘客户端可能在 git 提交时上传 `.git` 内部文件。建议在百度网盘设置里把本项目的 `.git` 文件夹加入同步/上传排除项；至少提交时别同时开着大文件同步。
