# 从 GitHub Release 一键安装（curl / PowerShell）

发布产物为 `dist/releases/claudecode-<平台>-<版本>.tar.gz`（见 `bun run build:release`）。安装脚本会拉取 **latest 正式 Release** 中与你系统匹配的那一个包，解压到本机数据目录，并把 **`.env.example` 复制为 `.env`**（若尚不存在）。

## 行为说明

| 项目 | 说明 |
|------|------|
| **工作目录** | 你在终端里执行 `claudecode` 时的 **当前目录** 即为 Claude Code 打开的项目目录（与源码版 `bin/claudecode` 一致，**不会** `cd` 到安装目录）。 |
| **配置文件** | API Key 等写在安装目录下的 **`.env`**（与项目目录分离）。启动器会设置 `CLAUDE_CODE_INSTALL_PREFIX`，由 `preload` 在进程内加载该目录中的 `.env`。 |
| **平台** | 与 `scripts/build-release.ts` 的 `archiveSlug` 一致：`linuxX64`、`linuxX64-musl`、`linuxArm64`、`darwinX64`、`darwinArm64`、`windowsX64`。 |

## 一键安装

**先**在 GitHub 上对当前仓库打 **Release** 并上传对应 `.tar.gz`（脚本读的是 `releases/latest`，不含预发布）。

### Linux / macOS（bash）

默认仓库为 `wyt990/claude-code-haha`，可改环境变量 `GITHUB_REPO=owner/repo`：

```bash
curl -fsSL https://raw.githubusercontent.com/wyt990/claude-code-haha/main/install/install.sh | bash
```

若遇 **API 限速**，可带 Token（勿泄露、勿写入仓库）：

```bash
curl -fsSL https://raw.githubusercontent.com/wyt990/claude-code-haha/main/install/install.sh | GITHUB_TOKEN=ghp_xxx bash
```

自定义安装位置：

```bash
export CLAUDE_CODE_INSTALL_DIR="$HOME/my-claudecode"
export CLAUDE_CODE_BIN_DIR="$HOME/bin"
curl -fsSL ... | bash
```

`install.sh` 会在 **`~/.bashrc`**（以及若存在则 **`~/.zshrc`**）末尾**幂等**追加一段 `export PATH="…/.local/bin:$PATH"`（带标记块，重复执行不会叠多行）。管道执行 `curl … | bash` **无法**改变你当前已打开的终端环境变量，新终端或执行 `source ~/.bashrc` 后可直接打 `claudecode`。

- 跳过改 shell 配置：`CLAUDE_CODE_SKIP_SHELL_RC=1`
- 更详细日志：`INSTALL_VERBOSE=1`

### Windows（PowerShell）

需要 **Windows 10+** 自带 `tar`。建议 **以当前用户** 执行：

```powershell
irm https://raw.githubusercontent.com/wyt990/claude-code-haha/main/install/install.ps1 | iex
```

可选：`$env:GITHUB_TOKEN`、`$env:GITHUB_REPO`、`$env:CLAUDE_CODE_INSTALL_DIR`、`$env:CLAUDE_CODE_BIN_DIR`。

启动器默认放在 `%USERPROFILE%\.local\bin\claudecode.cmd`，请把该目录加入用户 **PATH**。

## 依赖

- **install.sh**：`curl`、`tar`；解析 JSON 需 **`jq` 或 `python3`** 其一。
- **install.ps1**：`Invoke-WebRequest`、`tar`。

## 安全与习惯用法

- **管道执行脚本前**建议先打开 URL 看一眼脚本内容，或使用 `curl -o install.sh && less install.sh && bash install.sh`。
- **不要**把 `GITHUB_TOKEN` 写进可被提交的文档或脚本。
- 若曾把密钥提交到 Git，应轮换密钥并视情况清理历史（如 `git filter-repo`）。

## 卸载（手动）

- 删除数据目录（默认 `~/.local/share/claude-code-local` 或 `$XDG_DATA_HOME/claude-code-local`，Windows 为 `%LOCALAPPDATA%\claude-code-local`）。
- 删除启动器：`~/.local/bin/claudecode` 或 `%USERPROFILE%\.local\bin\claudecode.cmd`。

## 与「源码 + bun」开发的区别

开发时仍可用仓库根目录的 `bin/claudecode`（依赖 Bun + 仓库内 `.env`）。Release 安装版为 **单文件可执行程序**，配置集中在 `CLAUDE_CODE_INSTALL_PREFIX` 目录。
