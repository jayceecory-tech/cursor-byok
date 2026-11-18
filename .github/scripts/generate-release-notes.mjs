import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Conventional-commit types that never describe a user-visible change.
const hiddenTypes = new Set(["chore", "ci", "build", "test", "style", "docs"]);
const sectionTitles = ["破坏性变更", "新增", "改进", "修复", "其他"];
const typeSections = new Map([
  ["feat", "新增"],
  ["perf", "改进"],
  ["refactor", "改进"],
  ["fix", "修复"],
]);
const fallback = "请从下方 Assets 下载对应平台的安装包。";
const commitPattern = /^(?<type>[a-zA-Z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<subject>.+)$/;

function readOptions(args) {
  const options = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (!name?.startsWith("--") || value === undefined) {
      throw new Error(`invalid argument near ${name ?? "end of command"}`);
    }
    options.set(name.slice(2), value);
  }
  return options;
}

function required(options, name) {
  const value = options.get(name)?.trim();
  if (!value) throw new Error(`--${name} is required`);
  return value;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function sectionFor({ type, breaking }) {
  if (breaking) return "破坏性变更";
  const normalized = type.toLowerCase();
  if (hiddenTypes.has(normalized)) return null;
  return typeSections.get(normalized) ?? "其他";
}

function bulletFor(subject, scope) {
  const message = capitalize(subject.trim());
  return scope ? `- **${scope.trim()}**: ${message}` : `- ${message}`;
}

export function buildReleaseNotes({ version, repository, previousTag, subjects }) {
  const normalizedVersion = version.replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(normalizedVersion)) {
    throw new Error(`invalid semantic version: ${normalizedVersion}`);
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(repository)) {
    throw new Error(`invalid GitHub repository: ${repository}`);
  }

  const sections = new Map(sectionTitles.map((title) => [title, []]));
  for (const raw of subjects) {
    const subject = raw.trim();
    if (!subject) continue;
    const match = commitPattern.exec(subject);
    if (!match) {
      sections.get("其他").push(bulletFor(subject));
      continue;
    }
    const section = sectionFor(match.groups);
    if (section) {
      sections.get(section).push(bulletFor(match.groups.subject, match.groups.scope));
    }
  }

  const tag = `v${normalizedVersion}`;
  const paragraphs = [];
  if (normalizedVersion.includes("-")) {
    paragraphs.push("**Beta 版本。** 测试构建，可能存在不稳定行为。");
  }
  const rendered = sectionTitles
    .filter((title) => sections.get(title).length > 0)
    .map((title) => `## ${title}\n\n${sections.get(title).join("\n")}`);
  paragraphs.push(rendered.length > 0 ? rendered.join("\n\n") : fallback);
  paragraphs.push(
    previousTag
      ? `**完整变更记录**：https://github.com/${repository}/compare/${previousTag}...${tag}`
      : `**完整变更记录**：https://github.com/${repository}/commits/${tag}`,
  );
  return `${paragraphs.join("\n\n")}\n`;
}

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${(result.stderr || "").trim()}`);
  }
  return result.stdout;
}

function previousReleaseTag(version) {
  const result = spawnSync(
    "git",
    ["describe", "--tags", "--abbrev=0", "--match", "v[0-9]*", `v${version.replace(/^v/, "")}^`],
    { encoding: "utf8" },
  );
  return result.status === 0 ? result.stdout.trim() : null;
}

function releaseSubjects(previousTag) {
  const range = previousTag ? `${previousTag}..HEAD` : "HEAD";
  return git(["log", "--no-merges", "--pretty=format:%s", range])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

async function main() {
  const options = readOptions(process.argv.slice(2));
  const version = required(options, "version");
  const repository = required(options, "repository");
  const output = resolve(required(options, "output"));
  const previousTag = previousReleaseTag(version);
  const notes = buildReleaseNotes({
    version,
    repository,
    previousTag,
    subjects: releaseSubjects(previousTag),
  });
  await writeFile(output, notes);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}