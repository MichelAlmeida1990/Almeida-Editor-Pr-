"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Editor } from "@tiptap/core";
import type { Level } from "@tiptap/extension-heading";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Table as TableIcon,
  Underline,
  Undo,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MenuBarProps = {
  editor: Editor;
};

const headings: Array<{
  level: Level;
  label: string;
  icon: LucideIcon;
  description: string;
}> = [
  {
    level: 1 as Level,
    label: "Título 1",
    icon: Heading1,
    description: "Utilize para títulos principais do documento",
  },
  {
    level: 2 as Level,
    label: "Título 2",
    icon: Heading2,
    description: "Ideal para subtítulos ou seções importantes",
  },
  {
    level: 3 as Level,
    label: "Título 3",
    icon: Heading3,
    description: "Bom para marcar subseções ou tópicos específicos",
  },
];

export function MenuBar({ editor }: MenuBarProps) {
  const [, setRenderSignal] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const rerender = () => setRenderSignal((value) => value + 1);

    editor.on("transaction", rerender);
    editor.on("selectionUpdate", rerender);
    editor.on("focus", rerender);
    editor.on("blur", rerender);

    return () => {
      editor.off("transaction", rerender);
      editor.off("selectionUpdate", rerender);
      editor.off("focus", rerender);
      editor.off("blur", rerender);
    };
  }, [editor]);

  const focusChain = () =>
    editor.chain().focus(undefined, { scrollIntoView: false });

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Endereço do link", previousUrl ?? "");

    if (url === null) return;
    if (url === "") {
      focusChain().unsetLink().run();
      return;
    }

    focusChain().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("URL da imagem");
    if (!url) return;
    focusChain().setImage({ src: url }).run();
  };

  const insertTable = () => {
    focusChain()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="min-w-[120px] justify-start text-left font-semibold tracking-wide text-foreground transition hover:bg-primary/10 hover:text-primary"
            title="Selecionar estilo de título"
          >
            Estilos
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 border border-primary/40 bg-black/95 text-foreground shadow-lg shadow-primary/20 backdrop-blur">
          {headings.map(({ level, label, description, icon: Icon }) => (
            <DropdownMenuItem
              key={label}
              onClick={() => focusChain().toggleHeading({ level }).run()}
              className={cn(
                "cursor-pointer flex-col items-start gap-1 rounded-md text-sm transition hover:bg-primary/15 hover:text-primary",
                editor.isActive("heading", { level }) &&
                  "border border-accent bg-accent/40 text-[#031f5f] shadow-sm shadow-accent/40"
              )}
              title={description}
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4" />
                <span>{label}</span>
              </span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex flex-wrap items-center gap-1">
        <ToolbarButton
          isActive={editor.isActive("bold")}
          label="Negrito"
          onClick={() => focusChain().toggleBold().run()}
          tooltip="Destacar texto em negrito"
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("italic")}
          label="Itálico"
          onClick={() => focusChain().toggleItalic().run()}
          tooltip="Inclinar texto em itálico"
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("underline")}
          label="Sublinhado"
          onClick={() => focusChain().toggleUnderline().run()}
          tooltip="Adicionar linha sob o texto"
        >
          <Underline className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("strike")}
          label="Tachado"
          onClick={() => focusChain().toggleStrike().run()}
          tooltip="Rasurar o texto selecionado"
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("bulletList")}
          label="Lista"
          onClick={() => focusChain().toggleBulletList().run()}
          tooltip="Criar lista com marcadores"
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("orderedList")}
          label="Lista numerada"
          onClick={() => focusChain().toggleOrderedList().run()}
          tooltip="Criar lista numerada"
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("blockquote")}
          label="Citação"
          onClick={() => focusChain().toggleBlockquote().run()}
          tooltip="Destacar citação ou comentário"
        >
          <Quote className="size-4" />
        </ToolbarButton>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <ToolbarButton
          label="Alinhar à esquerda"
          isActive={editor.isActive({ textAlign: "left" })}
          onClick={() => focusChain().setTextAlign("left").run()}
          tooltip="Alinhar texto à esquerda"
        >
          <AlignLeft className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Centralizar"
          isActive={editor.isActive({ textAlign: "center" })}
          onClick={() => focusChain().setTextAlign("center").run()}
          tooltip="Centralizar texto"
        >
          <AlignCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Alinhar à direita"
          isActive={editor.isActive({ textAlign: "right" })}
          onClick={() => focusChain().setTextAlign("right").run()}
          tooltip="Alinhar texto à direita"
        >
          <AlignRight className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Justificar"
          isActive={editor.isActive({ textAlign: "justify" })}
          onClick={() => focusChain().setTextAlign("justify").run()}
          tooltip="Justificar texto"
        >
          <AlignJustify className="size-4" />
        </ToolbarButton>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <ToolbarButton
          label="Link"
          onClick={setLink}
          tooltip="Adicionar ou editar hyperlink"
          isActive={editor.isActive("link")}
        >
          <LinkIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Imagem"
          onClick={addImage}
          tooltip="Inserir imagem por URL"
        >
          <ImageIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Tabela"
          onClick={insertTable}
          tooltip="Criar tabela 3x3 com cabeçalho"
          isActive={editor.isActive("table")}
        >
          <TableIcon className="size-4" />
        </ToolbarButton>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ToolbarButton
          label="Desfazer"
          onClick={() => focusChain().undo().run()}
          tooltip="Desfazer última ação (Ctrl+Z)"
        >
          <Undo className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Refazer"
          onClick={() => focusChain().redo().run()}
          tooltip="Refazer ação desfeita (Ctrl+Shift+Z)"
        >
          <Redo className="size-4" />
        </ToolbarButton>
      </div>
    </div>
  );
}

type ToolbarButtonProps = {
  children: ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  tooltip?: string;
};

function ToolbarButton({
  children,
  label,
  onClick,
  isActive = false,
  tooltip,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      className={cn(
        "group relative h-10 w-10 rounded-lg border border-transparent bg-transparent text-foreground/70 shadow-none transition hover:border-primary/60 hover:bg-primary/15 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/50",
        isActive &&
          "border-accent bg-accent text-[#031f5f] shadow-[0_0_0_2px_rgba(204,255,0,0.35)]"
      )}
      aria-label={label}
      title={tooltip ?? label}
    >
      {children}
      {tooltip ? (
        <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden min-w-[140px] -translate-x-1/2 rounded-md bg-black/90 px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:flex">
          {tooltip}
        </span>
      ) : null}
    </Button>
  );
}

