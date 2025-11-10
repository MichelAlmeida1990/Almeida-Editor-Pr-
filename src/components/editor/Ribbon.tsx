"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Clipboard,
  ClipboardPaste,
  Eraser,
  Image as ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo,
  Strikethrough,
  Table as TableIcon,
  Underline,
  Undo,
} from "lucide-react";

import { cn } from "@/lib/utils";

type RibbonProps = {
  editor: Editor;
};

const tabs = [
  { id: "inicio", label: "Início" },
  { id: "inserir", label: "Inserir" },
  { id: "layout", label: "Layout" },
  { id: "referencias", label: "Referências" },
  { id: "revisao", label: "Revisão" },
  { id: "exibir", label: "Exibir" },
];

export function Ribbon({ editor }: RibbonProps) {
  const [activeTab, setActiveTab] = useState<string>("inicio");
  const [activeState, setActiveState] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    bulletList: false,
    orderedList: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    blockquote: false,
    link: false,
    table: false,
  });

  useEffect(() => {
    if (!editor) return;

    const updateState = () =>
      setActiveState({
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        underline: editor.isActive("underline"),
        strike: editor.isActive("strike"),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        alignLeft: editor.isActive({ textAlign: "left" }),
        alignCenter: editor.isActive({ textAlign: "center" }),
        alignRight: editor.isActive({ textAlign: "right" }),
        alignJustify: editor.isActive({ textAlign: "justify" }),
        blockquote: editor.isActive("blockquote"),
        link: editor.isActive("link"),
        table: editor.isActive("table"),
      });

    updateState();

    editor.on("transaction", updateState);
    editor.on("selectionUpdate", updateState);
    editor.on("focus", updateState);
    editor.on("blur", updateState);

    return () => {
      editor.off("transaction", updateState);
      editor.off("selectionUpdate", updateState);
      editor.off("focus", updateState);
      editor.off("blur", updateState);
    };
  }, [editor]);

  const focusChain = () =>
    editor.chain().focus(undefined, { scrollIntoView: false });

  return (
    <div className="rounded-t-xl border border-border/40 bg-black/60 shadow-inner shadow-primary/20">
      <div className="flex border-b border-border/40 bg-black/80 px-2 text-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative rounded-t-md px-4 py-2 font-medium tracking-wide text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              activeTab === tab.id &&
                "bg-primary/15 text-primary shadow-[0_-2px_0_0_rgba(0,175,238,0.5)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 px-4 py-3">
        {activeTab === "inicio" ? (
          <div className="flex flex-wrap items-start gap-6">
            <RibbonGroup title="Área de Transferência">
              <RibbonButton
                icon={Clipboard}
                label="Copiar"
                tooltip="Copiar (Ctrl+C)"
                onClick={() => document.execCommand("copy")}
              />
              <RibbonButton
                icon={ClipboardPaste}
                label="Colar"
                tooltip="Colar (Ctrl+V)"
                onClick={() => document.execCommand("paste")}
              />
              <RibbonButton
                icon={Eraser}
                label="Limpar"
                tooltip="Limpar formatação"
                onClick={() => focusChain().unsetAllMarks().run()}
              />
            </RibbonGroup>

            <RibbonGroup title="Fonte">
              <RibbonButton
                isActive={activeState.bold}
                icon={Bold}
                label="Negrito"
                tooltip="Negrito (Ctrl+B)"
                onClick={() => focusChain().toggleBold().run()}
              />
              <RibbonButton
                isActive={activeState.italic}
                icon={Italic}
                label="Itálico"
                tooltip="Itálico (Ctrl+I)"
                onClick={() => focusChain().toggleItalic().run()}
              />
              <RibbonButton
                isActive={activeState.underline}
                icon={Underline}
                label="Sublinhado"
                tooltip="Sublinhado (Ctrl+U)"
                onClick={() => focusChain().toggleUnderline().run()}
              />
              <RibbonButton
                isActive={activeState.strike}
                icon={Strikethrough}
                label="Tachado"
                tooltip="Rasurar texto"
                onClick={() => focusChain().toggleStrike().run()}
              />
            </RibbonGroup>

            <RibbonGroup title="Parágrafo">
              <RibbonButton
                icon={List}
                label="Lista"
                tooltip="Lista com marcadores"
                isActive={activeState.bulletList}
                onClick={() => focusChain().toggleBulletList().run()}
              />
              <RibbonButton
                icon={ListOrdered}
                label="Lista numerada"
                tooltip="Lista numerada"
                isActive={activeState.orderedList}
                onClick={() => focusChain().toggleOrderedList().run()}
              />
              <div className="flex items-center gap-1">
                <RibbonButton
                  icon={AlignLeft}
                  label="Esquerda"
                  tooltip="Alinhar à esquerda"
                  isActive={activeState.alignLeft}
                  onClick={() => focusChain().setTextAlign("left").run()}
                />
                <RibbonButton
                  icon={AlignCenter}
                  label="Centro"
                  tooltip="Centralizar"
                  isActive={activeState.alignCenter}
                  onClick={() => focusChain().setTextAlign("center").run()}
                />
                <RibbonButton
                  icon={AlignRight}
                  label="Direita"
                  tooltip="Alinhar à direita"
                  isActive={activeState.alignRight}
                  onClick={() => focusChain().setTextAlign("right").run()}
                />
                <RibbonButton
                  icon={AlignJustify}
                  label="Justificar"
                  tooltip="Justificar texto"
                  isActive={activeState.alignJustify}
                  onClick={() => focusChain().setTextAlign("justify").run()}
                />
              </div>
              <RibbonButton
                icon={Quote}
                label="Citação"
                tooltip="Bloco de citação"
                isActive={activeState.blockquote}
                onClick={() => focusChain().toggleBlockquote().run()}
              />
              <RibbonButton
                icon={Pilcrow}
                label="Mostrar ¶"
                tooltip="Mostrar caracteres invisíveis (em breve)"
                disabled
              />
            </RibbonGroup>

            <RibbonGroup title="Inserir">
              <RibbonButton
                icon={LinkIcon}
                label="Link"
                tooltip="Inserir hyperlink"
                isActive={activeState.link}
                onClick={() => {
                  const previousUrl = editor.getAttributes("link")
                    .href as string | undefined;
                  const url = window.prompt(
                    "Endereço do link",
                    previousUrl ?? ""
                  );
                  if (url === null) return;
                  if (url === "") {
                    focusChain().unsetLink().run();
                    return;
                  }
                  focusChain().setLink({ href: url }).run();
                }}
              />
              <RibbonButton
                icon={ImageIcon}
                label="Imagem"
                tooltip="Inserir imagem por URL"
                onClick={() => {
                  const url = window.prompt("URL da imagem");
                  if (!url) return;
                  focusChain().setImage({ src: url }).run();
                }}
              />
              <RibbonButton
                icon={TableIcon}
                label="Tabela"
                tooltip="Inserir tabela 3x3"
                isActive={activeState.table}
                onClick={() =>
                  focusChain()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
                }
              />
            </RibbonGroup>

            <RibbonGroup title="Edição">
              <RibbonButton
                icon={Undo}
                label="Desfazer"
                tooltip="Desfazer (Ctrl+Z)"
                onClick={() => focusChain().undo().run()}
              />
              <RibbonButton
                icon={Redo}
                label="Refazer"
                tooltip="Refazer (Ctrl+Shift+Z)"
                onClick={() => focusChain().redo().run()}
              />
            </RibbonGroup>
          </div>
        ) : null}

        {activeTab === "inserir" ? (
          <RibbonPlaceholder
            title="Inserir"
            items={[
              "Imagens locais e online, formas e ícones",
              "Desenho, SmartArt e gráficos (interativos)",
              "Cabeçalho, rodapé e número de página",
              "Caixa de texto, WordArt e símbolos",
              "Equações e objetos incorporados",
            ]}
          />
        ) : null}

        {activeTab === "layout" ? (
          <RibbonPlaceholder
            title="Layout"
            items={[
              "Margens predefinidas e personalizadas",
              "Orientação (Retrato/Paisagem)",
              "Tamanho do papel (A4, Carta, etc.)",
              "Colunas, quebras e recuos avançados",
              "Hifenização automática",
            ]}
          />
        ) : null}

        {activeTab === "referencias" ? (
          <RibbonPlaceholder
            title="Referências"
            items={[
              "Sumário automático baseado em títulos",
              "Notas de rodapé e notas de fim",
              "Gerenciamento de citações e bibliografia",
              "Inserção de legendas e índice de figuras",
              "Atualização de campos",
            ]}
          />
        ) : null}

        {activeTab === "revisao" ? (
          <RibbonPlaceholder
            title="Revisão"
            items={[
              "Correção ortográfica e gramatical com IA (Ollama)",
              "Controle de alterações e comentários",
              "Comparação de versões e painel de revisão",
              "Restrição de edição / bloqueio de documento",
              "Tradução e contagem de palavras detalhada",
            ]}
          />
        ) : null}

        {activeTab === "exibir" ? (
          <RibbonPlaceholder
            title="Exibir"
            items={[
              "Modos de exibição (Impressão, Leitura, Web)",
              "Mostrar/ocultar régua, linhas de grade e painéis",
              "Zoom e visão em várias páginas",
              "Painel de navegação por títulos",
              "Modo foco / tela cheia",
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}

type RibbonGroupProps = {
  title: string;
  children: ReactNode;
};

function RibbonGroup({ title, children }: RibbonGroupProps) {
  return (
    <div className="flex min-w-[160px] flex-col items-center gap-3 rounded-xl border border-border/40 bg-black/40 px-5 py-4 shadow-sm shadow-primary/10">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {children}
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </span>
    </div>
  );
}

type RibbonButtonProps = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip?: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

function RibbonButton({
  label,
  icon: Icon,
  tooltip,
  isActive = false,
  disabled = false,
  onClick,
}: RibbonButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={tooltip ?? label}
      aria-pressed={isActive}
      data-active={isActive ? "true" : "false"}
      className={cn(
        "group flex h-11 w-11 flex-col items-center justify-center rounded-lg border border-transparent bg-black/35 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
        isActive &&
          "border-[#3dff92] bg-[#3dff92] text-[#032415] font-semibold shadow-[0_0_0_3px_rgba(61,255,146,0.35)] hover:border-[#3dff92] hover:bg-[#3dff92] hover:text-[#032415]"
      )}
    >
      <Icon className="mb-1 h-4 w-4" />
      <span className="text-[10px] leading-none tracking-wide">{label}</span>
    </button>
  );
}

type PlaceholderSectionProps = {
  title: string;
  items: string[];
};

function RibbonPlaceholder({ title, items }: PlaceholderSectionProps) {
  return (
    <div className="max-w-md rounded-xl border border-dashed border-border/50 bg-black/30 p-4 shadow-inner shadow-primary/10">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 before:mt-[6px] before:h-1.5 before:w-1.5 before:flex-none before:rounded-full before:bg-primary"
          >
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

