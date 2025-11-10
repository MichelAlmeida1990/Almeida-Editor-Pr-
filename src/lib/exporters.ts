"use client";

import type { Editor } from "@tiptap/core";
import { saveAs } from "file-saver";

export type ExportFormat = "html" | "markdown";

export async function exportEditorContent(
  editor: Editor,
  format: ExportFormat
) {
  if (format === "html") {
    const html = buildHTMLDocument(editor);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    saveAs(blob, createFilename("html"));
    return;
  }

  if (format === "markdown") {
    const markdown = convertToMarkdown(editor);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, createFilename("md"));
    return;
  }

  throw new Error(`Formato de exportação não suportado: ${format}`);
}

function buildHTMLDocument(editor: Editor) {
  const content = editor.getHTML();

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Documento exportado</title>
    <style>
      body {
        font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        margin: 3rem auto;
        max-width: 840px;
        line-height: 1.6;
        color: #1f2937;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #0f172a;
      }
      blockquote {
        margin: 1rem 0;
        padding-left: 1rem;
        border-left: 4px solid #00afee;
        color: #334155;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
      }
      table th,
      table td {
        border: 1px solid #cbd5f5;
        padding: 0.75rem 0.5rem;
      }
      ul {
        list-style: disc;
        padding-left: 1.75rem;
      }
      ol {
        list-style: decimal;
        padding-left: 1.75rem;
      }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>`;
}

function convertToMarkdown(editor: Editor) {
  const text = editor.getText();
  if (!text) return "";
  return text;
}

function createFilename(extension: string) {
  const iso = new Date().toISOString().replace(/[:.]/g, "-");
  return `almeida-editor-${iso}.${extension}`;
}

