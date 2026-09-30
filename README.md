# 宝石塔防

独立游戏开发项目：一款围绕"宝石"做文章的塔防游戏。设计思路见 [docs/游戏设计草案.md](docs/游戏设计草案.md)。

**当前状态**：🚧 立项期 —— 技术栈已定 **Cocos Creator 3.8.8 + TypeScript**（一次开发，网页 / Windows exe / 手机 apk 三端发布，另可发微信小游戏）。
**远程仓库**：Gitee ✅ ｜ GitHub ✅（均已推送、均已免密）

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

## 远程仓库配置（已完成 ✅）

| 项 | 内容 |
|---|---|
| GitHub | https://github.com/BTxiaoJun/gem-tower-defense |
| Gitee | https://gitee.com/BTxiaoJun/gem-tower-defense |
| 提交署名 | `BTxiaoJun <336267444+BTxiaoJun@users.noreply.github.com>`（GitHub 隐私邮箱，不暴露真实邮箱） |
| 凭据 | 已存入 Windows 凭据管理器，推送免密 |

> 以后远程仓库相关操作全部交给 AI 或直接双击 `同步到远程.bat` 即可，无需再手动配置。

## 日常怎么用

- **干活**：直接对 ZCode 用中文说需求，它按 AGENTS.md 的流程干活并自动提交。
- **同步给朋友**：双击 `同步到远程.bat`，两个平台同时更新。
- **朋友蹭项目**：让他装好 [git](https://registry.npmmirror.com/-/binary/git-for-windows/) 后执行：
  ```bat
  git clone https://gitee.com/BTxiaoJun/gem-tower-defense.git
  ```
  国内推荐用上面的 Gitee 地址（快且稳）；GitHub 地址为 `https://github.com/BTxiaoJun/gem-tower-defense.git`。
- **后悔药**：小反悔用 ZCode 的 `/rewind`；已提交的用 `git revert 提交号`。

## 环境备忘（这台机器）

| 工具 | 位置 | 说明 |
|---|---|---|
| git 2.56 便携版 | `D:\DevTools\PortableGit` | 已加入用户 PATH，新开窗口敲 `git` 即可用 |
| Cocos Creator 3.8.8 | `D:\DevTools\CocosCreator\3.8.8` | 双击 `CocosCreator.exe` 启动；首次启动需登录 Cocos 账号 |
| Python 3.12 | `D:\百度网盘\AI编程\MMD_樱花少女\tools\Python312` | 系统已有 |
| npm/pip 缓存 | `D:\DevTools\cache\` | 环境变量已永久指向，不占 C 盘 |
| 凭据管理器 | git 自带 GCM | 首次 push 弹浏览器登录，之后免密 |

> 提示：项目位于百度网盘目录内，网盘客户端可能在 git 提交时上传 `.git` 内部文件。建议在百度网盘设置里把本项目的 `.git` 文件夹加入同步/上传排除项；至少提交时别同时开着大文件同步。
