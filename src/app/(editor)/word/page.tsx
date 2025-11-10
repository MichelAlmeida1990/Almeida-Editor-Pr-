"use client";

import { useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { get, set } from "idb-keyval";
import { toast } from "sonner";

import { Ribbon } from "@/components/editor/Ribbon";
import { StatusBar } from "@/components/editor/StatusBar";
import { exportEditorContent } from "@/lib/exporters";
import { Card, CardContent } from "@/components/ui/card";

const AUTOSAVE_KEY = "almeida-editor-word-draft";

export default function WordEditor() {
  const lastToastRef = useRef(0);

  const starterContent = useMemo(
    () => `
      <h1>Documento em branco</h1>
      <p>Comece a digitar ou cole seu conteúdo aqui. Todas as alterações são salvas automaticamente.</p>
    `,
    []
  );

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: {
            depth: 500,
          },
          link: false,
          orderedList: false,
          bulletList: false,
        }),
        Placeholder.configure({
          placeholder: "Digite seu texto...",
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          protocols: ["http", "https", "mailto"],
        }),
        Image.configure({
          allowBase64: true,
        }),
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
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableCell,
        TableHeader,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
      ],
      content: starterContent,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        void set(AUTOSAVE_KEY, html);

        const now = Date.now();
        if (now - lastToastRef.current > 5000) {
          toast.success("Rascunho salvo automaticamente", {
            id: "autosave",
          });
          lastToastRef.current = now;
        }
      },
    },
    []
  );

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await get<string | undefined>(AUTOSAVE_KEY);
      if (draft && editor) {
        editor.commands.setContent(draft, false, {
          preserveWhitespace: "full",
        });
      }
    };

    void loadDraft();
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
          onExport={async (format) => {
            await exportEditorContent(editor, format);
          }}
        />
        <section
          className="bg-slate-100/80 px-6 pb-10 pt-6"
          role="region"
          aria-label="Área de edição do documento"
        >
          <div className="mx-auto w-full max-w-[880px] rounded-2xl border border-border/30 bg-white shadow-2xl shadow-primary/15">
            <EditorContent
              editor={editor}
              className="prose prose-slate mx-auto min-h-[920px] max-w-[780px] px-12 pb-16 pt-14 text-slate-900 outline-none [counter-reset:page] print:max-w-none print:p-12"
            />
          </div>
        </section>
        <StatusBar editor={editor} />
      </CardContent>
    </Card>
  );
}

