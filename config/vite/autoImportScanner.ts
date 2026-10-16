import path from "node:path";
import { readFile } from "node:fs/promises";
import { parseSync } from "oxc-parser";
import { scanDirExports, type Import } from "unimport";

/** unimport 会忽略混合 export 列表中的 type 项；补回公开入口原有类型。 */
export async function scanPublicImports(
  entries: string[],
  root: string,
): Promise<Import[]> {
  const imports = await scanDirExports(entries, { cwd: root });
  const known = new Set(
    imports.map((item) => `${item.from}:${item.name}:${Boolean(item.type)}`),
  );
  for (const entry of entries) {
    // 与 unimport 的正斜杠路径保持一致，避免 Windows 同一入口重复判重。
    const from = path.resolve(root, entry).replaceAll("\\", "/");
    const source = parseSync(from, await readFile(from, "utf8"));
    if (source.errors.length) {
      throw new Error(`[auto-import] ${from}: ${source.errors[0].message}`);
    }
    for (const statement of source.program.body) {
      if (statement.type !== "ExportNamedDeclaration") continue;
      for (const item of statement.specifiers) {
        if (statement.exportKind !== "type" && item.exportKind !== "type") continue;
        const name = item.exported.type === "Identifier"
          ? item.exported.name
          : item.exported.value;
        const key = `${from}:${name}:true`;
        if (known.has(key)) continue;
        known.add(key);
        imports.push({ from, name, as: name, type: true });
      }
    }
  }
  return imports;
}
