"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { toast } from "sonner";

import {
  Ribbon,
  type LayoutController,
  type ReferenceController,
  type ReviewController,
  type LayoutMargins,
  type LayoutOrientation,
  type LayoutPageSize,
} from "@/components/editor/Ribbon";
import { StatusBar } from "@/components/editor/StatusBar";
import { exportEditorContent } from "@/lib/exporters";
import { Card, CardContent } from "@/components/ui/card";

const IMPORT_EVENT = "almeida:import";
const IMPORT_STORAGE_KEY = "almeida-editor-word-import";

type LayoutState = {
  margins: LayoutMargins;
  orientation: LayoutOrientation;
  size: LayoutPageSize;
  columns: number;
  hyphenation: boolean;
};

const PAGE_SIZES: Record<LayoutPageSize, { portrait: number; landscape: number }> = {
  a4: { portrait: 793, landscape: 1122 },
  letter: { portrait: 816, landscape: 1056 },
};

const MARGIN_PRESETS: Record<
  LayoutMargins,
  { top: number; right: number; bottom: number; left: number }
> = {
  narrow: { top: 36, right: 36, bottom: 48, left: 36 },
  normal: { top: 64, right: 64, bottom: 72, left: 64 },
  wide: { top: 96, right: 96, bottom: 96, left: 96 },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function convertPlainTextToHtml(text: string) {
  const lines = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return "<p>&nbsp;</p>";
  }

  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

export default function WordEditor() {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<LayoutState>({
    margins: "normal",
    orientation: "portrait",
    size: "a4",
    columns: 1,
    hyphenation: false,
  });
  const [, setIsTrackChangesEnabled] = useState(false);
  const [isSpellchecking, setIsSpellchecking] = useState(false);

  const footnoteCounterRef = useRef(1);
  const endnoteCounterRef = useRef(1);
  const figureCounterRef = useRef(1);
  const tableCounterRef = useRef(1);

  const starterContent = useMemo(
    () => `
      <h1>Documento em branco</h1>
      <p>Comece a digitar ou cole seu conteúdo aqui. Use os botões do ribbon para salvar ou exportar quando quiser.</p>
    `,
    []
  );

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          link: false,
          underline: false,
          orderedList: false,
          bulletList: false,
        }),
        History.configure({
          depth: 500,
        }),
        Placeholder.configure({ placeholder: "Digite seu texto..." }),
        Underline,
        Link.configure({ openOnClick: false, protocols: ["http", "https", "mailto"] }),
        Image.configure({ allowBase64: true }),
        TextStyle,
        Color.configure({ types: ["textStyle"] }),
        OrderedList.configure({
          HTMLAttributes: {
            class: "list-decimal list-outside pl-6 marker:text-accent",
          },
        }),
        BulletList.configure({
          HTMLAttributes: {
            class: "list-disc list-outside pl-6 marker:text-accent",
          },
        }),
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
      ],
      content: starterContent,
      immediatelyRender: false,
    },
    []
  );

  const appendAtEnd = useCallback(
    (html: string) => {
      if (!editor) return;
      const end = editor.state.doc.content.size;
      editor.chain().focus().insertContentAt(end, html).run();
    },
    [editor]
  );

  const removeExistingToc = useCallback(() => {
    if (!editor) return;
    const doc = editor.state.doc;
    let start: number | null = null;
    let end: number | null = null;

    doc.descendants((node, pos) => {
      if (start === null && node.type.name === "heading" && node.textContent === "Sumário") {
        start = pos;
        return true;
      }
      if (start !== null && end === null && node.type.name === "heading" && node.textContent !== "Sumário") {
        end = pos;
        return false;
      }
      return true;
    });

    if (start !== null) {
      if (end === null) end = doc.content.size;
      editor.chain().focus("start").deleteRange({ from: start, to: end }).run();
    }
  }, [editor]);

  const buildTableOfContents = useCallback(() => {
    if (!editor) return;
    const headings: { level: number; text: string }[] = [];

    editor.state.doc.descendants((node) => {
      if (node.type.name === "heading") {
        const text = node.textContent.trim();
        if (text) headings.push({ level: node.attrs.level ?? 1, text });
      }
      return true;
    });

    if (!headings.length) {
      toast.info("Nenhum título foi encontrado para gerar o sumário.");
      return;
    }

    removeExistingToc();

    const items = headings
      .map(({ level, text }) => `<li style="margin-left:${(level - 1) * 16}px">${escapeHtml(text)}</li>`)
      .join("\n");

    const tocHtml = `<section data-generated="toc"><h2>Sumário</h2><ul>${items}</ul></section>`;
    editor.chain().focus("start").insertContentAt(0, tocHtml).run();
  }, [editor, removeExistingToc]);

  const insertFootnote = useCallback(() => {
    if (!editor) return;
    const index = footnoteCounterRef.current++;
    const text = window.prompt("Texto da nota de rodapé:", "Comentário");
    const safeText = escapeHtml(text?.trim() || `Nota ${index}`);

    editor.chain().focus().insertContent(`<sup class="footnote-ref">[${index}]</sup>`).run();
    appendAtEnd(`<p class="footnote-item"><sup>[${index}]</sup> ${safeText}</p>`);
  }, [editor, appendAtEnd]);

  const insertEndnote = useCallback(() => {
    if (!editor) return;
    const index = endnoteCounterRef.current++;
    const text = window.prompt("Texto da nota de fim:", "Comentário final");
    const safeText = escapeHtml(text?.trim() || `Nota de fim ${index}`);

    editor.chain().focus().insertContent(`<sup class="endnote-ref">(${index})</sup>`).run();
    appendAtEnd(`<p class="endnote-item"><sup>(${index})</sup> ${safeText}</p>`);
  }, [editor, appendAtEnd]);

  const insertCitation = useCallback(() => {
    if (!editor) return;
    const content = window.prompt("Detalhes da citação", "Autor, Título, Ano");
    if (!content) return;
    editor.chain().focus().insertContent(`(${escapeHtml(content.trim())})`).run();
  }, [editor]);

  const insertBibliography = useCallback(() => {
    if (!editor) return;
    const entry = window.prompt("Entrada da bibliografia", "AUTOR. Título. Ano.");
    if (!entry) return;

    const doc = editor.state.doc;
    let headingExists = false;
    doc.descendants((node) => {
      if (node.type.name === "heading" && node.textContent === "Bibliografia") {
        headingExists = true;
        return false;
      }
      return true;
    });

    if (!headingExists) appendAtEnd("<h2>Bibliografia</h2>");
    appendAtEnd(`<p class="bibliography-item">${escapeHtml(entry.trim())}</p>`);
  }, [editor, appendAtEnd]);

  const insertFigureCaption = useCallback(() => {
    if (!editor) return;
    const index = figureCounterRef.current++;
    const caption = window.prompt("Legenda da figura", "Descrição da figura");
    const safeText = escapeHtml(caption?.trim() || `Figura ${index}`);
    editor.chain().focus().insertContent(`<p class="figure-caption">Figura ${index} - ${safeText}</p>`).run();
  }, [editor]);

  const insertTableCaption = useCallback(() => {
    if (!editor) return;
    const index = tableCounterRef.current++;
    const caption = window.prompt("Legenda da tabela", "Descrição da tabela");
    const safeText = escapeHtml(caption?.trim() || `Tabela ${index}`);
    editor.chain().focus().insertContent(`<p class="table-caption">Tabela ${index} - ${safeText}</p>`).run();
  }, [editor]);

  const referencesController = useMemo<ReferenceController | undefined>(() => {
    if (!editor) return undefined;
    return {
      insertTableOfContents: buildTableOfContents,
      insertFootnote,
      insertEndnote,
      insertCitation,
      insertBibliography,
      insertFigureCaption,
      insertTableCaption,
      updateFields: buildTableOfContents,
    };
  }, [editor, buildTableOfContents, insertBibliography, insertCitation, insertEndnote, insertFigureCaption, insertFootnote, insertTableCaption]);

  const reviewController = useMemo<ReviewController | undefined>(() => {
    if (!editor) return undefined;
    return {
      runSpellcheck: async () => {
        if (isSpellchecking) return;
        const { from, to, empty } = editor.state.selection;
        if (empty) {
          toast.info("Selecione o trecho que deseja corrigir.");
          return;
        }
        const text = editor.state.doc.textBetween(from, to, " ");
        if (!text.trim()) {
          toast.info("Selecione o trecho que deseja corrigir.");
          return;
        }

        setIsSpellchecking(true);
        try {
          const response = await fetch("/api/review/spellcheck", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error((payload as { error?: string }).error ?? "Falha ao se comunicar com a IA.");
          }

          const { corrected } = (await response.json()) as { corrected: string };
          const html = convertPlainTextToHtml(corrected);
          editor.chain().focus().insertContentAt({ from, to }, html).run();
          toast.success("Correção aplicada.");
        } catch (error) {
          console.error("Spellcheck error:", error);
          toast.error("Erro ao aplicar correção ortográfica.");
        } finally {
          setIsSpellchecking(false);
        }
      },
      toggleTrackChanges: () => {
        setIsTrackChangesEnabled((prev) => {
          const next = !prev;
          toast.success(`Controle de alterações ${next ? "ativado" : "desativado"}.`);
          return next;
        });
      },
      insertComment: () => {
        const { from, to, empty } = editor.state.selection;
        if (empty) {
          toast.info("Selecione o trecho que receberá o comentário.");
          return;
        }
        const selectionText = editor.state.doc.textBetween(from, to, " ");
        const comment = window.prompt("Comentário", selectionText || "Comentário");
        if (comment === null) return;
        const safe = escapeHtml(comment.trim() || "Comentário");
        editor
          .chain()
          .focus()
          .insertContentAt(
            { from, to },
            `<span class="comment" data-comment="${safe}">${escapeHtml(selectionText)}</span>`
          )
          .run();
        toast.success("Comentário inserido.");
      },
      compareVersions: () => {
        toast.info("Comparação de versões estará disponível após ativarmos o histórico de documentos.");
      },
      restrictEditing: () => {
        toast.info("Bloqueio de edição estará disponível quando as permissões forem configuradas.");
      },
      translateSelection: () => {
        const selection = editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to,
          " "
        );
        if (!selection.trim()) {
          toast.info("Selecione o texto a traduzir.");
          return;
        }
        toast.info(`Tradução automática ficará disponível em breve. Trecho selecionado: "${selection.trim()}".`);
      },
    };
  }, [editor, isSpellchecking]);

  const containerStyle = useMemo<CSSProperties>(
    () => ({ maxWidth: `${PAGE_SIZES[layout.size][layout.orientation]}px` }),
    [layout.size, layout.orientation]
  );

  const marginPreset = MARGIN_PRESETS[layout.margins];
  const editorStyle = useMemo<CSSProperties>(
    () => ({
      paddingTop: `${marginPreset.top}px`,
      paddingRight: `${marginPreset.right}px`,
      paddingBottom: `${marginPreset.bottom}px`,
      paddingLeft: `${marginPreset.left}px`,
      columnCount: layout.columns > 1 ? layout.columns : undefined,
      columnGap: layout.columns > 1 ? "48px" : undefined,
      hyphens: layout.hyphenation ? "auto" : "manual",
      MozHyphens: layout.hyphenation ? "auto" : "manual",
      WebkitHyphens: layout.hyphenation ? "auto" : "manual",
      minHeight: layout.orientation === "landscape" ? "720px" : "880px",
    }),
    [marginPreset, layout.columns, layout.hyphenation, layout.orientation]
  );

  const layoutController = useMemo<LayoutController>(
    () => ({
      state: layout,
      setMargins: (value) => setLayout((prev) => ({ ...prev, margins: value })),
      setOrientation: (value) => setLayout((prev) => ({ ...prev, orientation: value })),
      setPageSize: (value) => setLayout((prev) => ({ ...prev, size: value })),
      setColumns: (value) => setLayout((prev) => ({ ...prev, columns: Math.max(1, value) })),
      setHyphenation: (value) => setLayout((prev) => ({ ...prev, hyphenation: value })),
    }),
    [layout]
  );

  useEffect(() => {
    if (!editor) return;

    const handleImportEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ html: string }>;
      const html = customEvent.detail?.html;
      if (!html) return;
      window.localStorage.removeItem(IMPORT_STORAGE_KEY);

      editor.commands.setContent(html, {
        preserveWhitespace: "full",
      });
      toast.success("Conteúdo importado do PDF.");
    };

    const handleStorageImport = () => {
      const html = window.localStorage.getItem(IMPORT_STORAGE_KEY);
      if (!html) return;
      window.localStorage.removeItem(IMPORT_STORAGE_KEY);
      editor.commands.setContent(html, {
        preserveWhitespace: "full",
      });
      toast.success("Conteúdo importado do PDF.");
    };

    window.addEventListener(IMPORT_EVENT, handleImportEvent);
    handleStorageImport();

    return () => {
      window.removeEventListener(IMPORT_EVENT, handleImportEvent);
    };
  }, [editor]);

  if (!editor) {
    return (
      <Card className="border border-border/40 bg-black/40 backdrop-blur">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Carregando editor...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/40 bg-black/30 shadow-inner shadow-primary/10 backdrop-blur-xl">
      <CardContent className="space-y-4 p-0">
        <Ribbon
          editor={editor}
          layout={layoutController}
          references={referencesController}
          review={reviewController}
          onExport={async (format) => {
            await exportEditorContent(editor, format, {
              container: editorContainerRef.current,
            });
          }}
        />
        <section
          className="bg-slate-100/80 px-4 pb-12 pt-8"
          role="region"
          aria-label="Área de edição do documento"
        >
          <div
            className="mx-auto w-full rounded-2xl border border-border/30 bg-white shadow-2xl shadow-primary/15"
            style={containerStyle}
            ref={editorContainerRef}
          >
            <EditorContent
              editor={editor}
              className="w-full text-slate-900 outline-none print:max-w-none"
              style={editorStyle}
            />
          </div>
        </section>
        <StatusBar editor={editor} />
      </CardContent>
    </Card>
  );
}

