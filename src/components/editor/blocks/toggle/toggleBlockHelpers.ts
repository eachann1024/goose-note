import type { BlockNoteEditor } from "@blocknote/core";
import { createToggleFrame, mergeParagraphs } from "@blocknote/core/blocks";
import { DOMParser, Fragment, type Schema } from "prosemirror-model";
import { readToggleCollapsed } from "../../core/toggleBlocks";

/** 使用 BlockNote 原生结构/CSS，但展开状态随笔记保存，且所有 DOM 操作局限于此 frame。 */
export function createPersistentToggleFrame(
  block: any,
  editor: BlockNoteEditor<any, any, any>,
) {
  const frame = createToggleFrame(block, editor, {
    get: (current) => !readToggleCollapsed(editor.getBlock(current.id) ?? block),
    set: (current, open) => {
      const resolved = editor.getBlock(current.id);
      if (!resolved || !editor.isEditable || readToggleCollapsed(resolved) === !open) return;
      editor.updateBlock(resolved, { props: { collapsed: !open } });
    },
  });
  const button = frame.dom.querySelector<HTMLButtonElement>(".bn-toggle-button");
  if (button) {
    button.setAttribute("aria-label", "展开或收起子块");
    button.setAttribute("aria-expanded", String(!readToggleCollapsed(block)));
  }
  let renderedBlock = block;
  return {
    ...frame,
    update(updated: typeof block) {
      // Undo and external updates must also refresh the persisted fold state.
      if (readToggleCollapsed(updated) !== readToggleCollapsed(renderedBlock)) return false;
      renderedBlock = updated;
      return frame.update(updated);
    },
  };
}

/** details 的 summary 作为 inline，剩余节点作为真实 children，避免 HTML 导入拍平。 */
export function parseToggleDetailsContent(
  details: HTMLElement,
  schema: Schema,
  nodeName: "heading" | "toggleListItem",
): Fragment {
  const parser = DOMParser.fromSchema(schema);
  const summary = details.querySelector(":scope > summary");
  const summaryClone = summary?.cloneNode(true) as HTMLElement | undefined;
  if (summaryClone) mergeParagraphs(summaryClone);
  const inlineRoot = summaryClone?.childElementCount === 1
    ? (summaryClone.querySelector(":scope > h1, :scope > h2, :scope > h3, :scope > p") ?? summaryClone)
    : summaryClone;
  const inline = inlineRoot
    ? parser.parse(inlineRoot, {
        topNode: schema.nodes.paragraph.create(),
        preserveWhitespace: true,
      }).content
    : Fragment.empty;
  const children = document.createElement("div");
  children.setAttribute("data-node-type", "blockGroup");
  for (const child of Array.from(details.childNodes)) {
    if ((child as HTMLElement).tagName === "SUMMARY") continue;
    if (child.nodeType === 3 && !child.textContent?.trim()) continue;
    children.appendChild(child.cloneNode(true));
  }
  const content = schema.nodes[nodeName].create({}, inline).content;
  if (!children.childNodes.length) return content;
  const group = parser.parse(children, { topNode: schema.nodes.blockGroup.create() });
  return group.content.size ? content.addToEnd(group) : content;
}

export function createToggleExternalHTML(contentDOM: HTMLElement, collapsed: boolean) {
  const dom = document.createElement("details");
  if (!collapsed) dom.setAttribute("open", "");
  const summary = document.createElement("summary");
  summary.appendChild(contentDOM);
  dom.appendChild(summary);
  return { dom, contentDOM, childrenDOM: dom };
}
