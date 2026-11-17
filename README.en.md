<div align="center">

# cursor-byok

A local model gateway for Cursor: run the service on your machine and use the model APIs you configure.

[中文说明](./README.md) · [Upstream project](https://github.com/leookun/cursor-byok) · [Issues](https://github.com/jayceecory-tech/cursor-byok/issues) · [MIT License](./LICENSE)

</div>

> [!WARNING]
> **This is a personal fork, not the upstream project.**
> Upstream [leookun/cursor-byok](https://github.com/leookun/cursor-byok) is no longer maintained and no longer tracks Cursor protocol changes. This fork is maintained by one person and contains self-use fixes only: it ships **no official installers** and **no community support** (the upstream documentation site, QQ groups and Telegram channel belong to upstream and are unrelated to this repository).
> There are **no Releases here** — build the binary yourself as described in [Build from source](#build-from-source).

## Supported Cursor versions

Cursor does not publish its agent protocol, and every client release may change the request format. Status of this fork:

| Cursor version | Status | Notes |
| --- | --- | --- |
| **3.30.x** (fixed on 3.30.14 / Windows) | Adapted | Since 3.30 the `BidiAppend` body is sent in the binary `data_binary` field. This fork accepts it and still keeps the legacy hex `data` path |
| ≤ 3.29 | Compatible | Uses hex `data`; the code path is retained but has not been verified version by version |
| 3.31 and later | Unverified | A further protocol change may require another fix |

Only Windows with a self-built binary has been exercised; macOS and Linux are unverified.

If a chat fails with `Connection stalled` / `Connection failed`, or the log mentions `BidiAppend`, the protocol has changed again — open an issue with the Cursor version and the log file:

```text
%USERPROFILE%\.cursor-byok-v3\logs\cursor-byok.<date>.log
```

## About

cursor-byok is an open-source local model gateway. It runs a service on your machine, receives the agent requests Cursor emits, forwards them to the model API you configure, and preserves Cursor agent capabilities such as tool calling, Skills, MCP and multi-turn conversations.

> [!IMPORTANT]
> cursor-byok is free and open source, but the model APIs you connect may charge for usage. This is an independent project and is not affiliated with or endorsed by Cursor or its developers.

## Features

- **Bring your own model channels:** configure your own API endpoint, credentials and model IDs.
- **Multiple API protocols:** OpenAI Responses API, OpenAI Chat Completions API and Anthropic Messages API compatible services.
- **Model management:** add, duplicate, edit, reorder and batch-test model configurations.
- **Connection benchmarks:** time to first token, generation speed, total duration and raw provider responses.
- **Agent workflows:** tool calling, Skills, MCP and multi-turn conversations stay available.
- **Session metrics:** token usage, cache hit rate, turns and estimated value.
- **Tab completion:** choose between the public service, direct official access, or your own endpoint.
- **Cross-platform:** the code targets macOS, Windows and Linux (this fork is only built and verified on Windows).

![Connect cursor-byok to a wide range of model APIs](./images/en-brand-1.png)

## Quick start

1. Build `cursor-byok-desktop` yourself as described in [Build from source](#build-from-source) and launch it.
2. Open **Cursor settings** and initialize the local CA when prompted.
3. Add a model: endpoint, API key, model ID. Save and run **Test**.
4. Keep cursor-byok running once the test passes.
5. **After upgrading Cursor, or after configuring a model for the first time, quit Cursor completely and restart it, then start a new conversation.** Pick the configured model from the model list.

> [!TIP]
> Conversations opened before the configuration will not pick up the new route. Do not select **Auto** when you want a locally configured model.

One misleading signal: a `completed` entry in the console's call list does not mean the Cursor chat works. Those records come from the **Test** button on the model settings page, which talks to the provider directly and never goes through Cursor's agent channel.

## Model configuration

Each model configuration is an independent upstream channel with its own provider, protocol, credentials and generation parameters.

![Model settings](./images/en-model-1.png)

| Model family | Model type | Request protocol |
| --- | --- | --- |
| Claude | **Anthropic** | Messages API |
| GPT / OpenAI | **OpenAI** | **Responses API** |
| Others | **OpenAI** | **Chat Completions API** |

Prefer **Responses API** for GPT models; Chat Completions may lose prompt caching, which costs speed and money.

Notable fields:

- **Server address**: either the provider base URL (the app appends the standard endpoint) or a complete request URL used verbatim.
- **API key**: stored locally and attached to upstream requests.
- **Model name**: the identifier your provider expects; **Fetch models** reads the provider's model list.
- **Display name**: shown in Cursor's model list **and part of the computed model identity**. To create a second channel for the same model (for example with a different context window), change the display name; an exact duplicate is rejected with `model "xxx" already exists`.
- **Note**: appears in Cursor's model tooltip.

Context window tokens, max output tokens, reasoning effort, custom headers and extra OpenAI/Anthropic parameters are optional; custom headers and extra parameters must be JSON objects containing only fields your provider documents.

## How it works

```text
Cursor client
    │  agent requests and tool results
    ▼
cursor-byok local service
    │  OpenAI / Anthropic compatible requests
    ▼
Your model API
```

API keys, model configurations and application settings stay on your machine; model requests still go to the provider you configure. The database lives at `%USERPROFILE%\.cursor-byok-v3\cursor-byok.db`. With detailed logging enabled, every request body and response chunk is persisted and the file can grow to several GB — see [Differences from upstream](#differences-from-upstream).

## Build from source

No installers are published; build it yourself. Requirements: a Rust toolchain, Node.js with npm, and the Tauri 2 system dependencies (on Windows a C++ build toolchain or MinGW).

```bash
npm --prefix apps/desktop ci
npm --prefix apps/desktop run build
cargo build --release -p cursor-byok-desktop --features tauri/custom-protocol
```

The binary is `target/release/cursor-byok-desktop.exe`; it also needs `WebView2Loader.dll` next to it.

Three problems you will actually hit:

1. **`--features tauri/custom-protocol` is mandatory.** Tauri computes `dev = !custom_protocol`; without it you get a development build that shows a black window reading `frontend development server is unavailable`.
2. **`WebView2Loader.dll` must be copied by hand.** On the MinGW target the `tauri-build` branch that copies it derives the path incorrectly and silently skips; copy it from `target/release/build/webview2-com-sys/*/out/x64/` next to the executable.
3. **`tauri-build` may fail outright under Cargo 1.100+** (`os error 3`). Cargo switched to a nested `build/<package>/<hash>/out` layout, while `tauri-build` walks three levels up and tries to read `target/release/build/build`. An empty directory works around it:

   ```bash
   mkdir -p target/release/build/build
   ```

`crates.io` downloads often time out on Chinese networks; configure a registry mirror in `~/.cargo/config.toml`.

## Differences from upstream

This fork only fixes things on top of `1.0.1` and adds no features:

- **`fix(bidi)`**: accept Cursor 3.30+ binary `BidiAppend` bodies (`data_binary`), falling back to hex `data`. Upstream rejects every chat request with `400`, which the client surfaces as `Connection stalled`.
- **`fix(models)`**: creating a model that collides with an existing configuration now returns `model "xxx" already exists` instead of leaking SQLite's `UNIQUE constraint failed`.
- **`fix(desktop)`**: one failing request no longer discards the whole console bootstrap, which used to blank the model list into “no models available”.

Known gaps:

- The in-app “check for updates” still points at upstream Releases. **Do not use it on a self-built fork** — it may replace your binary with the upstream build.
- With detailed logging on, `llm_call_requests`, `llm_call_response_chunks`, `cursor_run_traces` and their blobs keep growing. This fork does not change that; you can delete rows from those tables, but do not drop the tables themselves — the console still queries them.

## Development

```bash
make check          # cargo fmt / clippy / test + frontend typecheck and build
make dev-web        # desktop frontend in the browser
make dev-desktop    # Tauri desktop app
make build-web      # frontend bundle
make build-server   # Rust local service
make build-desktop  # Tauri installer (needs a signing key)
make build-docker   # Docker image
```

## Feedback

Issues in this repository only. Include OS, Cursor version, cursor-byok version, model type, request protocol, a redacted endpoint, the error and reproduction steps. **Never post API keys or other credentials.**

## License

[MIT](./LICENSE). Copyright belongs to the upstream author and contributors.
