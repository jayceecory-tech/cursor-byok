<div align="center">

# cursor-byok

cursor-byok 是一个运行在本机的 Cursor 模型网关，帮助你在 Cursor 中使用自己配置的模型服务。

[English](./README.en.md) · [上游项目](https://github.com/leookun/cursor-byok) · [提交问题](https://github.com/jayceecory-tech/cursor-byok/issues) · [MIT License](./LICENSE)

</div>

> [!WARNING]
> **这是个人 fork，不是上游项目。**
> 上游 [leookun/cursor-byok](https://github.com/leookun/cursor-byok) 目前不再维护，也不再跟进 Cursor 的协议变化。本仓库由个人维护，只做自用性质的修复，**不提供官方安装包、不提供社区支持**（上游的文档站、QQ 群、Telegram 群均属上游项目，与本仓库无关）。
> 本仓库**没有发布 Releases**，需要按下方[从源码构建](#从源码构建)自行生成可执行文件。

## 支持的 Cursor 版本

Cursor 的 Agent 协议没有公开规范，客户端每次发版都可能改变请求格式。本 fork 的适配情况：

| Cursor 版本 | 状态 | 说明 |
| --- | --- | --- |
| **3.30.x**（本 fork 在 3.30.14 / Windows 上修复） | 已适配 | 3.30 起 `BidiAppend` 的请求体改放在二进制字段 `data_binary` 中，本 fork 已支持，同时保留旧版本使用的十六进制 `data` 字段 |
| ≤ 3.29 | 兼容 | 仍使用十六进制 `data`，解析分支保留，但未逐个版本验证 |
| 3.31 及以后 | 未验证 | Cursor 再次改动协议后可能需要重新适配 |

适配范围仅限 Windows + 自行构建的版本，macOS 与 Linux 未验证。

如果对话报 `Connection stalled`、`Connection failed`，或日志里出现 `BidiAppend` 相关错误，说明 Cursor 的协议又变了，请带上该版本号提 Issue：

```text
%USERPROFILE%\.cursor-byok-v3\logs\cursor-byok.<日期>.log
```

## 项目简介

cursor-byok 是一个开源的本地模型网关。它在你的设备上运行服务，接收 Cursor 发出的 Agent 请求，将请求转发到你配置的模型服务，并尽可能保留 Cursor Agent 的工具调用、Skills、MCP 和多轮对话能力。

你可以连接兼容 OpenAI 或 Anthropic 协议的服务，自定义服务地址、模型 ID、API Key 和请求参数，也可以使用 Cursor 平台默认选项之外的模型通道。

> [!IMPORTANT]
> cursor-byok 免费且开源，但你连接的模型服务商可能会按用量收费。本项目是独立项目，与 Cursor 或其开发者没有关联，也未获得其认可。

## 主要功能

- **自定义模型通道**：配置自己的 API 地址、凭据和模型 ID。
- **多种 API 协议**：支持 OpenAI Responses API、OpenAI Chat Completions API 和 Anthropic Messages API 兼容服务。
- **模型管理**：添加、复制、编辑、排序模型配置，并批量测试连接。
- **连接性能测试**：查看首字延迟、生成速度、总耗时和原始服务商响应。
- **Agent 工作流**：继续使用工具调用、Skills、MCP 和多轮对话。
- **会话指标**：查看 Token 用量、缓存命中率、对话轮次和估算价值。
- **TAB 补全服务**：在公益服务、官方直连和自定义服务之间选择连接方式。
- **跨平台运行**：代码支持 macOS、Windows 和 Linux（本 fork 只在 Windows 上构建验证）。

![将 cursor-byok 连接到多种模型 API](./images/en-brand-1.png)

## 快速开始

1. 按[从源码构建](#从源码构建)生成 `cursor-byok-desktop` 可执行文件并启动。
2. 打开 **Cursor 配置**，按提示初始化本地 CA（证书颁发机构）。
3. 在模型设置中添加模型，填写服务地址、API Key 和模型名称，然后保存并运行 **测试**。
4. 确认测试通过后，保持 cursor-byok 运行。
5. **首次升级 Cursor 或首次配置模型后，完全退出并重新启动 Cursor，然后新开一个对话**。在模型列表中选择已配置的模型，开始使用 Agent。

> [!TIP]
> 首次升级 Cursor 或首次完成配置后，必须完全退出并重新启动 Cursor，再新开一个对话。配置前已经打开的对话不会加载新连接；使用自定义模型时，请在模型列表中手动选择该模型，不要选择 **Auto**。

另有一个容易误解的现象：模型配置页的「调用」列表里出现 `completed` 记录，并不代表 Cursor 里的对话能用 —— 那是「模型配置」页的测试按钮打出来的直连请求，不经过 Cursor 的 Agent 通道。判断对话是否正常，看 Cursor 那边是否有回复。

## 模型配置

每个模型配置都是独立的上游通道，可以单独设置服务商、协议、凭据和生成参数。

![模型设置页面](./images/en-model-1.png)

### 类型与协议选择

| 模型系列 | 模型类型 | 请求协议 |
| --- | --- | --- |
| Claude 系列 | **Anthropic** | Messages API |
| GPT / OpenAI 系列 | **OpenAI** | **Responses API** |
| 其他模型 | **OpenAI** | **Chat Completions API** |

GPT 系列建议使用 **Responses API**。如果使用 Chat Completions，可能无法保留提示词缓存，导致速度变慢和费用增加。

### 常用字段

- **模型类型**：选择 OpenAI 或 Anthropic，决定上游接口格式。
- **请求协议**：OpenAI 类型需要继续选择 Responses API 或 Chat Completions API。
- **服务器地址**：可以填写服务商基础地址，让应用按协议追加标准端点，也可以填写完整请求 URL 并原样使用。
- **API Key**：填写上游服务要求的访问密钥。密钥保存在本机，用于发送模型请求。
- **模型名称**：填写服务商接口接受的模型标识，也可以使用 **获取模型** 读取服务商返回的模型列表。
- **显示名称**：Cursor 模型列表中显示的名称，**同时参与模型唯一标识的计算**。若需要为同一模型建立第二条通道（例如不同的上下文窗口），修改显示名称即可；与已有配置完全一致时会提示 `model "xxx" already exists`。
- **备注**：显示在 Cursor 的模型说明中。

还可以根据模型能力设置上下文窗口 Token、最大输出 Token、推理或思考强度、自定义 Headers，以及 OpenAI 或 Anthropic 的额外参数。自定义 Headers 和额外参数必须是 JSON 对象，只应填写服务商明确支持的字段。

保存配置后运行 **测试**，确认地址、协议、API Key、模型标识和流式响应都正常，再在 Cursor 中使用该模型。

## TAB 补全服务

Cursor 的 Tab 补全由独立的 TAB 服务处理，不经过模型通道。你可以在 **系统设置 → TAB 设置** 中选择以下模式：

- **使用公益服务（默认）**：使用上游作者部署的公共服务，无需额外配置。该服务属上游项目，可用性由上游决定，本 fork 不做任何承诺。
- **直连**：直接连接当前 Cursor 账号对应的官方 TAB 服务，适合账号拥有官方额度的情况。
- **自定义**：自行部署 `cursor-tab-server`（见上游仓库的 `v0.0.49` 归档标签），然后填写 TAB 服务地址。

修改 TAB 设置后，建议重启 Cursor 并新开一个对话，确保新的连接方式生效。

## 与官方账号并存

- 直接在 Cursor 中登录自己的账号。
- 账号拥有官方额度时，官方模型和本地模型可以随时切换混用。
- **Auto 只使用官方模型**，不会自动使用你配置的本地模型。账号没有官方额度时，请手动选择自己配置的模型。
- 插件、代码库索引等 Cursor 功能可以继续使用。

## 数据流转

```text
Cursor 客户端
    │
    │ Agent 请求与工具结果
    ▼
cursor-byok 本地服务
    │
    │ OpenAI / Anthropic 兼容请求
    ▼
你配置的模型 API
```

API Key、模型配置和应用设置保存在本机。模型请求仍会发送到你选择的上游服务商，请根据对应服务商的隐私政策和计费规则使用。

数据库位于 `%USERPROFILE%\.cursor-byok-v3\cursor-byok.db`。开启详细日志时，每次模型调用的完整请求体与响应分片都会落库，长期使用后可能增长到数 GB，可参考[与上游的差异](#与上游的差异)中的清理说明处理。

## 项目结构

```text
cursor-byok/
├── apps/
│   ├── desktop/
│   │   ├── src/
│   │   │   ├── features/ # 首页、模型、调用记录与设置
│   │   │   ├── shell/    # 窗口框架、页面布局与广告外壳
│   │   │   ├── shared/   # UI、虚拟列表、状态、API 与平台能力
│   │   │   ├── i18n/     # 本地化运行时与语言目录
│   │   │   └── styles/   # 全局主题与排版令牌
│   │   └── src-tauri/    # Tauri 桌面生命周期
├── server/
│   ├── src/
│   │   ├── cursor/    # Cursor 协议适配
│   │   ├── run/       # 通用 Agent Runtime 与内部 Port
│   │   ├── provider/  # 模型供应商适配
│   │   ├── model/     # 聚合领域模型
│   │   ├── store/     # SQLite Repository
│   │   ├── control/   # 管理面 API
│   │   ├── local_app/ # Cursor 本地集成（CA、代理、接管）
│   │   └── search/    # Web 与 Semble 搜索接入
│   ├── prompt/
│   └── migrations/
├── crates/
│   └── semble-core/   # 本地代码索引与搜索核心库
├── protocols/
│   └── cursor/        # Cursor 协议定义的唯一来源
├── support/                     # 仓库辅助设施
│   ├── cursor-protocol-extractor/ # Cursor 协议提取与 Go 代码生成工具
│   ├── cursor-capture/            # Cursor 协议抓取和调试工具
│   └── benchmarks/                # 代码搜索和索引基准测试
├── images/            # README 展示图片
├── Cargo.toml         # Rust 工作区配置
└── Makefile           # 常用开发、检查和构建命令
```

## 从源码构建

本仓库不发布安装包，只能自行构建。环境要求：Rust 工具链、Node.js 与 npm、Tauri 2 的系统构建依赖（Windows 上还需要 C++ 构建工具或 MinGW 工具链）。

```bash
# 1. 前端依赖与产物
npm --prefix apps/desktop ci
npm --prefix apps/desktop run build

# 2. 桌面端可执行文件
cargo build --release -p cursor-byok-desktop --features tauri/custom-protocol
```

产物为 `target/release/cursor-byok-desktop.exe`，同目录下还需要 `WebView2Loader.dll`（见下方第 2 条）。

三个实际会踩到的坑：

1. **必须带 `--features tauri/custom-protocol`**。Tauri 用 `dev = !custom_protocol` 决定是否内嵌前端；漏掉这个 feature 会编出开发模式程序，界面黑屏并提示 `frontend development server is unavailable`。
2. **`WebView2Loader.dll` 需要手工补**。MinGW 目标下 `tauri-build` 的这一拷贝分支会因路径推算错误而跳过，可从 `target/release/build/webview2-com-sys/*/out/x64/` 复制到 exe 同级目录。
3. **Cargo 1.100+ 下 `tauri-build` 可能直接失败**（`os error 3`）。原因是 Cargo 把 build 目录改成了 `build/<包名>/<哈希>/out` 嵌套布局，而 `tauri-build` 按“往上三级”推算 `target_dir`，会去读不存在的 `target/release/build/build`。建一个空目录即可绕过：

   ```bash
   mkdir -p target/release/build/build
   ```

另外，`crates.io` 下载在国内网络下经常超时，可在 `~/.cargo/config.toml` 配置镜像后重试。

## 与上游的差异

本 fork 在 `1.0.1` 基础上只做了修复，没有新增功能：

- **`fix(bidi)`**：接受 Cursor 3.30+ 的二进制 `BidiAppend` 请求体（`data_binary`），为空时回退到十六进制 `data`。上游版本在 3.30 上会把每个对话请求以 `400` 拒绝，客户端表现为 `Connection stalled`。
- **`fix(models)`**：新增模型时若与已有配置计算出的标识相同，返回 `model "xxx" already exists`，而不是把 SQLite 的 `UNIQUE constraint failed` 直接抛到界面。
- **`fix(desktop)`**：控制台首屏并行拉取多个接口时，单个接口失败不再导致整批数据作废（原先会让模型列表清空成“还没有可供 Cursor 使用的模型”）。

已知未处理的问题：

- 应用内置的「检查更新」仍然指向上游 Releases。**自行构建的版本不要用它升级**，否则可能被替换成上游程序。
- 详细日志开关打开时，`llm_call_requests`、`llm_call_response_chunks`、`cursor_run_traces` 及其 blob 会持续膨胀，本 fork 没有改动这一行为，可自行清理这几张表的行，但不要删除表结构本身（管理界面仍会查询它们）。

## 开发

```bash
make check          # cargo fmt / clippy / test + 前端类型检查与构建
make dev-web        # 启动桌面前端
make dev-desktop    # 启动 Tauri 桌面应用
make build-web      # 构建桌面前端
make build-server   # 构建 Rust 本地服务
make build-desktop  # 构建 Tauri 安装包（需要签名密钥）
make build-docker   # 构建 Docker 镜像
```

## 反馈

只接受本仓库的 Issue。提交时请附上操作系统、Cursor 版本、cursor-byok 版本、模型类型、请求协议、已脱敏的服务地址、错误信息和复现步骤。**请勿公开 API Key 或其他凭据。**

## 许可证

本项目采用 [MIT License](./LICENSE) 开源，版权归属上游作者及贡献者。
