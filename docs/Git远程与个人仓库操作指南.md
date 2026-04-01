# Git 远程与个人仓库操作指南

本文说明如何将本仓库关联到你个人的 GitHub 远程、日常推送/拉取，以及用远程内容覆盖本地等操作。**请勿将个人访问令牌（PAT）写入仓库文件或提交进 Git**；下文一律用占位符或 SSH 示例。

---

## 1. 安全说明（必读）

- **不要把 Token 写在文档里、`.env` 里或提交进版本库。** 若在聊天或 Issue 中泄露过 Token，请立刻到 GitHub：**Settings → Developer settings → Personal access tokens** 中**撤销**该 Token，再新建一个。
- 推荐优先使用 **SSH**（`git@github.com:用户名/仓库名.git`）或 **Git 凭据管理器 / `gh auth login`**，避免在远程 URL 里嵌入 `https://TOKEN@github.com/...`。

---

## 2. 首次关联个人远程（`origin`）

在项目根目录执行：

```bash
cd /apps/claude-code   # 或你的实际路径

# 若还没有 origin（可先查看）
git remote -v

# 添加 origin（示例：HTTPS，不含 Token）
git remote add origin https://github.com/wyt990/claude-code-haha.git

# 若误添加或要改地址
git remote set-url origin https://github.com/wyt990/claude-code-haha.git
```

使用 **SSH**（需本机已配置 SSH 公钥到 GitHub）：

```bash
git remote add origin git@github.com:wyt990/claude-code-haha.git
```

若已存在名为 `origin` 的远程，想换成你的仓库：

```bash
git remote remove origin
git remote add origin <你的仓库 URL>
```

---

## 3. 首次推送到个人仓库

本地分支名一般为 `main`（以 `git branch` 为准）。

```bash
# 查看当前分支
git branch

# 首次推送并建立上游跟踪（将 local main 推到远程 main）
git push -u origin main
```

若远程仓库是**新建空仓库**，上述即可。

若远程已有提交（例如带 README），而本地也有独立历史，可能需要：

```bash
git pull origin main --allow-unrelated-histories
# 解决冲突后
git push -u origin main
```

（仅在确实需要合并两段无关历史时使用。）

---

## 4. 日常推送（push）

```bash
git status
git add .
git commit -m "翻译main中的一些英文为中文"

# 已设置过 -u 后可直接：
git push

# 或显式指定
git push origin main
```

---

## 5. 拉取与合并（pull）

将远程 `main` 的更新合并到当前分支：

```bash
git pull origin main
```

保持线性历史可用变基（需团队约定一致再用）：

```bash
git pull --rebase origin main
```

---

## 6. 仅获取远程更新（fetch）

不自动合并，只下载远程引用：

```bash
git fetch origin
```

查看远程分支与本地差异：

```bash
git log HEAD..origin/main --oneline
git diff HEAD origin/main
```

---

## 7. 用远程内容覆盖本地（慎用）

以下操作会**丢弃本地未推送的提交或工作区改动**，执行前请确认**无需保留**本地修改。

### 7.1 完全对齐远程 `main`（常见：强制与远程一致）

```bash
git fetch origin
git checkout main
git reset --hard origin/main
```

### 7.2 若本地还有未跟踪文件也想清掉（更彻底）

```bash
git fetch origin
git checkout main
git reset --hard origin/main
git clean -fd
```

`git clean -fd` 会删除未跟踪的文件与目录，请再三确认。

### 7.3 仅丢弃工作区与暂存区改动、不动提交历史

```bash
git restore .
git restore --staged .
# 或旧版 Git：git checkout -- .
```

---

## 8. 远程分支与跟踪关系

```bash
# 查看所有远程分支
git branch -r

# 本地新建分支并跟踪远程
git checkout -b feature/foo origin/feature/foo
```

---

## 9. 常见问题

| 现象 | 处理方向 |
|------|----------|
| `remote origin already exists` | 使用 `git remote set-url origin <URL>` 或先 `remove` 再 `add` |
| 推送被拒绝 `rejected (non-fast-forward)` | 先 `git pull` 或按上文 `fetch` + `reset --hard` 明确意图 |
| HTTPS 反复要密码 | 使用 PAT + 凭据助手，或改用 SSH / `gh auth login` |

---

## 10. 与本项目相关的忽略项

- `.env` 含密钥，应出现在 **`.gitignore`** 中，**不要推送**到公开仓库。
- 若曾误提交密钥，需在仓库中移除并**轮换**密钥，必要时使用 `git filter-repo` 等工具清理历史（超出本文范围）。

---

## 11. 命令速查

```bash
git remote -v              # 查看远程
git remote add origin URL  # 添加 origin
git remote set-url origin URL
git push -u origin main    # 首次推送并跟踪
git pull origin main       # 拉取并合并
git fetch origin           # 只抓取
git reset --hard origin/main  # 本地 main 与远程一致（丢本地提交）
```

文档版本：随仓库维护更新；实际操作以你当前分支名为准（`main` / `master` 等）。
