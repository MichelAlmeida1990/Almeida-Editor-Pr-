"use client";

function dataUriToUint8Array(dataUri: string): Uint8Array {
  const base64 = dataUri.split(",")[1] ?? "";
  const binaryString = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export async function extractPdfToHtml(dataUri: string) {
  if (typeof window === "undefined") {
    throw new Error("Extração de PDF disponível apenas no ambiente do navegador.");
  }

  const { pdfjs } = await import("react-pdf");

  if (!dataUri.startsWith("data:")) {
    throw new Error("Somente data URLs são suportadas no momento.");
  }

  const pdfData = dataUriToUint8Array(dataUri);
  const loadingTask = pdfjs.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;

  const fragments: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const lines = new Map<number, { x: number; text: string }[]>();

    for (const rawItem of textContent.items) {
      if (!("str" in rawItem)) continue;
      const text = normalizeWhitespace(rawItem.str);
      if (!text) continue;

      const transform = "transform" in rawItem ? rawItem.transform : undefined;
      const x = Array.isArray(transform) ? transform[4] ?? 0 : 0;
      const y = Array.isArray(transform) ? transform[5] ?? 0 : 0;
      const key = Math.round(y);

      if (!lines.has(key)) {
        lines.set(key, []);
      }
      lines.get(key)!.push({ x, text: escapeHtml(text) });
    }

    const sortedKeys = Array.from(lines.keys()).sort((a, b) => b - a);

    const linesArray = sortedKeys
      .map((key) => {
        const segments = lines
          .get(key)!
          .sort((a, b) => a.x - b.x)
          .map((segment) => segment.text);
        return normalizeWhitespace(segments.join(" "));
      })
      .filter(Boolean);

    if (!linesArray.length) {
      fragments.push(
        `<section data-page="${pageNumber}">\n  <p><em>Página ${pageNumber}: sem conteúdo textual legível.</em></p>\n</section>`
      );
      continue;
    }

    fragments.push(
      `<section data-page="${pageNumber}">\n  <p>${linesArray.join(
        "</p>\n  <p>"
      )}</p>\n</section>`
    );
  }

  if (!fragments.length) {
    fragments.push(
      "<p>Não foi possível extrair texto deste PDF. Tente novamente com um arquivo que contenha texto pesquisável.</p>"
    );
  }

  return `<article class="almeida-pdf-import" data-origin="pdf">\n${fragments.join("\n")}\n</article>`;
}

