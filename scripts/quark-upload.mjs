import { appendFileSync, readdirSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { QuarkFailure, assertCookie, deleteFiles, ensureFolder, listChildren, readCookie, uploadFile } from "./quark-api.mjs";

const FOLDER_NAME = "鹅的笔记安装包";
const NOTE_NAME = "说明.txt";
const INSTALLERS = [
  /^Goose\.Note-(\d+\.\d+\.\d+)-arm64\.dmg$/,
  /^Goose\.Note-(\d+\.\d+\.\d+)\.dmg$/,
  /^Goose\.Note-(\d+\.\d+\.\d+)-(?:x64|arm64)-setup\.exe$/,
  /^Goose\.Note-(\d+\.\d+\.\d+)\.AppImage$/,
  /^goose-note-app_(\d+\.\d+\.\d+)_amd64\.deb$/,
  /^goose-note-app-(\d+\.\d+\.\d+)\.pacman$/,
];

function installerVersion(name) {
  for (const pattern of INSTALLERS) {
    const match = pattern.exec(name);
    if (match) return match[1];
  }
  return "";
}

function compareSemver(left, right) {
  const a = left.split(".").map(Number);
  const b = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

function noteText(version) {
  return `鹅的笔记桌面版安装包。当前版本 v${version}（及上一版）。macOS 选 .dmg（Apple 芯片 arm64 / Intel x64），Windows 选 .exe（x64 / arm64），Linux 选 AppImage / deb / pacman。macOS 首次打开请看 https://github.com/eachann1024/goose-note/blob/main/docs/macos-installation.md 。源码与全部版本：https://github.com/eachann1024/goose-note/releases\n`;
}

function knownFiles(entries) {
  return entries.filter((item) => item?.fid && !item.dir && item.file !== false && (item.file_name === NOTE_NAME || installerVersion(item.file_name)));
}

async function replaceExisting(cookie, entries, name) {
  const stale = entries.filter((item) => item.file_name === name && item.fid && item.file !== false && item.dir !== true && item.file_type !== 0);
  if (stale.length === 0) return entries.filter((item) => item.file_name !== name);
  await deleteFiles(cookie, stale.map((item) => item.fid));
  console.log(`覆盖同名文件 ${name}`);
  return entries.filter((item) => item.file_name !== name);
}

async function retainLatest(cookie, folderId, version) {
  const entries = knownFiles(await listChildren(cookie, folderId)).filter((item) => installerVersion(item.file_name));
  const versions = [...new Set(entries.map((item) => installerVersion(item.file_name)))].sort(compareSemver).reverse();
  const keep = new Set(versions.slice(0, 2));
  const remove = entries.filter((item) => !keep.has(installerVersion(item.file_name)));
  await deleteFiles(cookie, remove.map((item) => item.fid));
  for (const item of remove) console.log(`删除旧版本 ${item.file_name}`);
  console.log(`保留版本 ${[...keep].join("、") || version}`);
}

async function main() {
  const cookie = readCookie();
  await assertCookie(cookie);
  const directory = resolve(process.argv[2] ?? "");
  const version = String(process.argv[3] ?? "").replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new QuarkFailure("需要安装包目录和版本号，例如 1.2.3");
  const names = readdirSync(directory).filter((name) => installerVersion(name) === version).sort();
  if (names.length === 0) throw new QuarkFailure(`目录中没有 v${version} 的安装包`);
  const folderId = await ensureFolder(cookie, FOLDER_NAME);
  let entries = await listChildren(cookie, folderId);
  for (const name of names) {
    entries = await replaceExisting(cookie, entries, name);
    console.log(`上传 ${name}`);
    await uploadFile(cookie, folderId, join(directory, name));
  }
  const noteDir = mkdtempSync(join(tmpdir(), "goose-quark-"));
  const note = join(noteDir, NOTE_NAME);
  writeFileSync(note, noteText(version));
  entries = await replaceExisting(cookie, entries, NOTE_NAME);
  console.log(`上传 ${NOTE_NAME}`);
  await uploadFile(cookie, folderId, note);
  await retainLatest(cookie, folderId, version);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) appendFileSync(summary, `夸克网盘已上传 ${names.length} 个安装包，当前版本 v${version}。\n`);
  console.log(`夸克网盘已上传 ${names.length} 个安装包，当前版本 v${version}。`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : "夸克上传失败";
    const summary = process.env.GITHUB_STEP_SUMMARY;
    if (summary && message.includes("夸克 Cookie")) appendFileSync(summary, `${message}\n`);
    console.error(message);
    process.exit(1);
  }
}
