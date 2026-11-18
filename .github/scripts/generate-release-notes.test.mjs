import assert from "node:assert/strict";
import test from "node:test";
import { buildReleaseNotes } from "./generate-release-notes.mjs";

const base = { version: "1.1.0", repository: "owner/repo", previousTag: "v1.0.2" };

test("groups conventional commits into Chinese sections", () => {
  const notes = buildReleaseNotes({
    ...base,
    subjects: [
      "feat: 在 Cursor 标签中展示模型备注",
      "feat(models): 创建时拒绝重复的模型配置",
      "fix: 启动时剪掉失效的检查点谱系",
      "perf: 数据库干净时跳过启动整理",
      "refactor: 移除广告服务及其界面",
      "chore(release): 升级到 1.1.0",
      "docs: 补充 fork 范围说明",
      "Update README.md",
    ],
  });

  assert.equal(
    notes,
    [
      "## 新增",
      "",
      "- 在 Cursor 标签中展示模型备注",
      "- **models**: 创建时拒绝重复的模型配置",
      "",
      "## 改进",
      "",
      "- 数据库干净时跳过启动整理",
      "- 移除广告服务及其界面",
      "",
      "## 修复",
      "",
      "- 启动时剪掉失效的检查点谱系",
      "",
      "## 其他",
      "",
      "- Update README.md",
      "",
      "**完整变更记录**：https://github.com/owner/repo/compare/v1.0.2...v1.1.0",
      "",
    ].join("\n"),
  );
});

test("lists breaking changes first", () => {
  const notes = buildReleaseNotes({
    ...base,
    subjects: ["feat!: 移除旧的更新清单", "fix: 保持服务端循环"],
  });

  assert.match(notes, /## 破坏性变更\n\n- 移除旧的更新清单\n\n## 修复/);
});

test("marks beta releases and falls back when nothing is user-visible", () => {
  const notes = buildReleaseNotes({
    ...base,
    version: "1.1.0-beta.1",
    subjects: ["chore: 升级依赖", "ci: 缓存 npm"],
  });

  assert.match(notes, /^\*\*Beta 版本。\*\*/);
  assert.match(notes, /请从下方 Assets 下载对应平台的安装包。/);
  assert.match(notes, /compare\/v1\.0\.2\.\.\.v1\.1\.0-beta\.1/);
});

test("links all commits when there is no previous tag", () => {
  const notes = buildReleaseNotes({
    ...base,
    previousTag: null,
    subjects: ["feat: 首次发布"],
  });

  assert.match(notes, /https:\/\/github\.com\/owner\/repo\/commits\/v1\.1\.0/);
});

test("rejects invalid version and repository", () => {
  assert.throws(() => buildReleaseNotes({ ...base, version: "latest", subjects: [] }), /semantic version/);
  assert.throws(() => buildReleaseNotes({ ...base, repository: "repo", subjects: [] }), /GitHub repository/);
});