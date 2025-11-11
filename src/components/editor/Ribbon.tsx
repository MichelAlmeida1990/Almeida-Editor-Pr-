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
  File as FileIcon,
  FileText as FileTextIcon,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Palette,
  Pilcrow,
  Quote,
  Redo,
  Strikethrough,
  Table as TableIcon,
  Underline,
  Undo,
  FileDown,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type LayoutMargins = "narrow" | "normal" | "wide";
export type LayoutOrientation = "portrait" | "landscape";
export type LayoutPageSize = "a4" | "letter";

export type LayoutState = {
  margins: LayoutMargins;
  orientation: LayoutOrientation;
  size: LayoutPageSize;
  columns: number;
  hyphenation: boolean;
};

export type LayoutController = {
  state: LayoutState;
  setMargins: (value: LayoutMargins) => void;
  setOrientation: (value: LayoutOrientation) => void;
  setPageSize: (value: LayoutPageSize) => void;
  setColumns: (value: number) => void;
  setHyphenation: (value: boolean) => void;
};

export type ReferenceController = {
  insertTableOfContents: () => void;
  insertFootnote: () => void;
  insertEndnote: () => void;
  insertCitation: () => void;
  insertBibliography: () => void;
  insertFigureCaption: () => void;
  insertTableCaption: () => void;
  updateFields: () => void;
};

const DEFAULT_COLOR = "#111827";

type ExportFormat = "html" | "markdown" | "pdf";

type RibbonProps = {
  editor: Editor;
  layout?: LayoutController;
  references?: ReferenceController;
  onExport?: (format: ExportFormat) => Promise<void> | void;
};

const tabs = [
  { id: "inicio", label: "Início" },
  { id: "inserir", label: "Inserir" },
  { id: "layout", label: "Layout" },
  { id: "referencias", label: "Referências" },
  { id: "revisao", label: "Revisão" },
  { id: "exibir", label: "Exibir" },
];

export function Ribbon({ editor, layout, references, onExport }: RibbonProps) {
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);

  useEffect(() => {
    if (!editor) return;

    const updateState = () => {
      const colorAttr = editor.getAttributes("textStyle")?.color as
        | string
        | undefined;
      setCurrentColor(normalizeColor(colorAttr));

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
    };

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
      <div className="flex items-center justify-between border-b border-border/40 bg-black/80 px-2 text-sm">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setIsCollapsed(false);
              }}
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
        <button
          type="button"
          className="flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <>
              <ChevronDown className="h-4 w-4" />
              Mostrar opções
            </>
          ) : (
            <>
              <ChevronUp className="h-4 w-4" />
              Recolher faixa
            </>
          )}
        </button>
      </div>

      {!isCollapsed ? (
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
              <RibbonColorPicker
                icon={Palette}
                label="Cor do texto"
                color={currentColor}
                onChange={(value) => {
                  setCurrentColor(value);
                  focusChain().setColor(value).run();
                }}
                onClear={() => {
                  setCurrentColor(DEFAULT_COLOR);
                  focusChain().unsetColor().run();
                }}
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
                  void pickImageFromDevice(editor);
                }}
              />
              <RibbonSplitButton />
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

            <RibbonGroup title="Exportar">
              <RibbonButton
                icon={FileIcon}
                label="HTML"
                tooltip="Exportar como HTML"
                onClick={() => onExport?.("html")}
              />
              <RibbonButton
                icon={FileTextIcon}
                label="Markdown"
                tooltip="Exportar como Markdown"
                onClick={() => onExport?.("markdown")}
              />
              <RibbonButton
                icon={FileDown}
                label="PDF"
                tooltip="Exportar como PDF"
                onClick={() => onExport?.("pdf")}
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
          <RibbonInserirMenu editor={editor} />
        ) : null}

        {activeTab === "layout" ? (
          <RibbonLayoutMenu layout={layout} />
        ) : null}

        {activeTab === "referencias" ? (
          <RibbonReferenciasMenu references={references} />
        ) : null}

        {activeTab === "revisao" ? (
          <RibbonRevisaoMenu />
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
      ) : null}
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

type RibbonColorPickerProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  onChange: (value: string) => void;
  onClear: () => void;
};

function RibbonColorPicker({
  icon: Icon,
  label,
  color,
  onChange,
  onClear,
}: RibbonColorPickerProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/40 bg-black/35 px-3 py-2 text-xs text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-primary focus-within:border-primary/50 focus-within:text-primary">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
        <span
          className="h-5 w-5 rounded border border-border/50"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <input
          type="color"
          value={color}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="sr-only"
        />
      </label>
      <button
        type="button"
        className="rounded-md border border-border/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onClick={onClear}
      >
        Padrão
      </button>
    </div>
  );
}

function normalizeColor(value?: string): string {
  if (!value) return DEFAULT_COLOR;

  const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      const [r, g, b] = hex.split("");
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return `#${hex.toLowerCase()}`;
  }

  const rgbMatch = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i
  );
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `#${toHex(Number(r))}${toHex(Number(g))}${toHex(Number(b))}`;
  }

  return DEFAULT_COLOR;
}

function toHex(component: number) {
  const clamped = Math.max(0, Math.min(255, component));
  return clamped.toString(16).padStart(2, "0");
}

function RibbonLayoutMenu({ layout }: { layout?: LayoutController }) {
  if (!layout) {
    return (
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
    );
  }

  const { state } = layout;

  return (
    <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
      <LayoutCard title="Margens">
        <LayoutOptionButton
          label="Estreita"
          description="1,27 cm"
          active={state.margins === "narrow"}
          onClick={() => layout.setMargins("narrow")}
        />
        <LayoutOptionButton
          label="Normal"
          description="2,54 cm"
          active={state.margins === "normal"}
          onClick={() => layout.setMargins("normal")}
        />
        <LayoutOptionButton
          label="Larga"
          description="3,81 cm"
          active={state.margins === "wide"}
          onClick={() => layout.setMargins("wide")}
        />
      </LayoutCard>

      <LayoutCard title="Orientação">
        <LayoutOptionButton
          label="Retrato"
          description="Vertical"
          active={state.orientation === "portrait"}
          onClick={() => layout.setOrientation("portrait")}
        />
        <LayoutOptionButton
          label="Paisagem"
          description="Horizontal"
          active={state.orientation === "landscape"}
          onClick={() => layout.setOrientation("landscape")}
        />
      </LayoutCard>

      <LayoutCard title="Tamanho do papel">
        <LayoutOptionButton
          label="A4"
          description="210 × 297 mm"
          active={state.size === "a4"}
          onClick={() => layout.setPageSize("a4")}
        />
        <LayoutOptionButton
          label="Carta"
          description="8,5 × 11 pol."
          active={state.size === "letter"}
          onClick={() => layout.setPageSize("letter")}
        />
      </LayoutCard>

      <LayoutCard title="Colunas">
        {[1, 2, 3].map((count) => (
          <LayoutOptionButton
            key={count}
            label={`${count} coluna${count > 1 ? "s" : ""}`}
            active={state.columns === count}
            onClick={() => layout.setColumns(count)}
          />
        ))}
      </LayoutCard>

      <LayoutCard title="Hifenização">
        <LayoutOptionButton
          label="Ativar hifenização automática"
          active={state.hyphenation}
          onClick={() => layout.setHyphenation(!state.hyphenation)}
        />
      </LayoutCard>
    </div>
  );
}

type LayoutCardProps = {
  title: string;
  children: ReactNode;
};

function LayoutCard({ title, children }: LayoutCardProps) {
  return (
    <div className="flex min-w-[220px] flex-1 flex-col gap-2 rounded-xl border border-border/40 bg-black/30 p-4 shadow-inner shadow-primary/10">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

type LayoutOptionButtonProps = {
  label: string;
  description?: string;
  active?: boolean;
  onClick: () => void;
};

function LayoutOptionButton({
  label,
  description,
  active = false,
  onClick,
}: LayoutOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start rounded-md border border-border/40 px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active && "border-primary/50 bg-primary/15 text-primary"
      )}
    >
      <span className="font-semibold">{label}</span>
      {description ? (
        <span className="text-[11px] opacity-80">{description}</span>
      ) : null}
    </button>
  );
}

function RibbonInserirMenu({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
      <InserirCard
        title="Imagens e ícones"
        description="Carregue imagens do seu computador ou use URLs, adicione formas e ícones SVG."
        actions={[
          {
            label: "Imagem do dispositivo",
            onClick: () => void pickImageFromDevice(editor),
          },
          {
            label: "Imagem por URL",
            onClick: () => insertImageFromUrl(editor),
          },
          {
            label: "Ícone (SVG)",
            onClick: () => insertSvgPlaceholder(editor),
          },
        ]}
      />
      <InserirCard
        title="Formas e gráficos"
        description="Insira rapidamente caixas, setas, fluxogramas, organogramas ou um espaço reservado para gráficos."
        actions={[
          {
            label: "Inserir forma",
            onClick: () => insertShapePlaceholder(editor),
          },
          {
            label: "Inserir gráfico (placeholder)",
            onClick: () => insertChartPlaceholder(editor),
          },
        ]}
      />
      <InserirCard
        title="Cabeçalho e rodapé"
        description="Adicione elementos fixos no topo ou rodapé do documento, com numeração de página opcional."
        actions={[
          {
            label: "Adicionar cabeçalho",
            onClick: () => insertHeader(editor),
          },
          {
            label: "Adicionar rodapé",
            onClick: () => insertFooter(editor),
          },
          {
            label: "Número de página",
            onClick: () => insertPageNumber(editor),
          },
        ]}
      />
      <InserirCard
        title="Elementos de texto"
        description="Expanda o conteúdo com caixas de texto posicionáveis, WordArt e símbolos especiais."
        actions={[
          {
            label: "Caixa de texto",
            onClick: () => insertTextBox(editor),
          },
          {
            label: "WordArt (placeholder)",
            onClick: () => insertWordArtPlaceholder(editor),
          },
          {
            label: "Símbolo especial",
            onClick: () => insertSymbol(editor),
          },
        ]}
      />
      <InserirCard
        title="Equações e objetos"
        description="Crie expressões matemáticas ou insira objetos externos, como PDFs ou planilhas."
        actions={[
          {
            label: "Equação rápida",
            onClick: () => insertEquationPlaceholder(editor),
          },
          {
            label: "Objeto incorporado",
            onClick: () => insertEmbeddedObjectPlaceholder(editor),
          },
        ]}
      />
    </div>
  );
}

type InserirCardProps = {
  title: string;
  description: string;
  actions: { label: string; onClick: () => void }[];
};

function InserirCard({ title, description, actions }: InserirCardProps) {
  return (
    <div className="flex min-w-[260px] flex-1 flex-col gap-3 rounded-xl border border-border/40 bg-black/30 p-4 shadow-inner shadow-primary/10">
      <div>
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="flex items-center justify-between rounded-md border border-border/40 bg-black/40 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span>{action.label}</span>
            <span aria-hidden="true" className="text-[10px] uppercase">
              Inserir
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

async function pickImageFromDevice(editor: Editor) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        editor
          .chain()
          .focus()
          .setImage({ src: result, alt: file.name })
          .run();
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function insertImageFromUrl(editor: Editor) {
  const url = window.prompt("URL da imagem");
  if (!url) return;
  editor.chain().focus().setImage({ src: url }).run();
}

function insertSvgPlaceholder(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent(
      '<p><svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#e2e8f0" stroke="#64748b" stroke-dasharray="6 4"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="#475569">Ícone</text></svg></p>'
    )
    .run();
}

function insertShapePlaceholder(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent(
      '<div style="height:120px; border:2px dashed #38bdf8; border-radius:16px; display:flex; align-items:center; justify-content:center; color:#0ea5e9; font-weight:600;">Arraste para redimensionar a forma</div>'
    )
    .run();
}

function insertChartPlaceholder(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent(
      '<div style="padding:16px; border:1px solid #94a3b8; border-radius:12px; background:#f8fafc; color:#1e293b;">Gráfico (placeholder). Use um gráfico real quando o módulo estiver pronto.</div>'
    )
    .run();
}

function insertHeader(editor: Editor) {
  editor
    .chain()
    .focus()
    .setTextSelection(0)
    .insertContentAt(0, '<p style="text-align:center; font-size:12px; color:#64748b;">Cabeçalho - clique para editar</p>')
    .run();
}

function insertFooter(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent('<p style="text-align:center; font-size:12px; color:#64748b;">Rodapé - clique para editar</p>')
    .run();
}

function insertPageNumber(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent('<p style="text-align:right; font-size:12px; color:#64748b;">Página 1 de 1</p>')
    .run();
}

function insertTextBox(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent(
      '<div contenteditable="true" style="min-height:80px; border:1px solid #94a3b8; border-radius:12px; padding:12px; background:#f1f5f9;">Caixa de texto - digite aqui</div>'
    )
    .run();
}

function insertWordArtPlaceholder(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent(
      '<p style="font-size:32px; font-weight:700; color:#f97316; text-shadow:2px 2px 0 #0f172a;">WordArt</p>'
    )
    .run();
}

function insertSymbol(editor: Editor) {
  const symbol = window.prompt("Símbolo (ex.: ©, ™, √, ∑)");
  if (!symbol) return;
  editor.chain().focus().insertContent(symbol).run();
}

function insertEquationPlaceholder(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent(
      '<p style="font-family: \'Times New Roman\', serif; font-style:italic; font-size:18px;">E = mc<sup>2</sup></p>'
    )
    .run();
}

function insertEmbeddedObjectPlaceholder(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent(
      '<div style="border:2px dashed #38bdf8; border-radius:12px; padding:12px; color:#0ea5e9;">Objeto incorporado (PDF, planilha etc.) — disponível em breve.</div>'
    )
    .run();
}

function RibbonSplitButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 items-center justify-center rounded-lg border border-transparent bg-black/35 px-3 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Mais...
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-10 mt-2 min-w-[180px] rounded-lg border border-border/40 bg-black/80 p-2 text-xs text-muted-foreground shadow-lg backdrop-blur">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-2 py-1 transition hover:bg-primary/20 hover:text-primary"
            onClick={() => {
              setOpen(false);
              window.alert("Placeholder: explorar modelos 3D em breve.");
            }}
          >
            <span>Modelos 3D (em breve)</span>
            <span aria-hidden="true">↗</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-2 py-1 transition hover:bg-primary/20 hover:text-primary"
            onClick={() => {
              setOpen(false);
              window.alert("Placeholder: biblioteca de objetos.");
            }}
          >
            <span>Biblioteca de objetos</span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function RibbonReferenciasMenu({ references }: { references?: ReferenceController }) {
  if (!references) {
    return (
      <RibbonPlaceholder
        title="Referências"
        items={[
          "Inserir tabela de conteúdo",
          "Inserir nota de rodapé",
          "Inserir nota de fim de documento",
          "Inserir citação",
          "Inserir bibliografia",
          "Inserir legenda de figura",
          "Inserir legenda de tabela",
          "Atualizar campos",
        ]}
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
      <InserirCard
        title="Referências"
        description="Adicione referências bibliográficas, notas de rodapé e outros elementos de referência."
        actions={[
          {
            label: "Tabela de conteúdo",
            onClick: () => references.insertTableOfContents(),
          },
          {
            label: "Inserir nota de rodapé",
            onClick: () => references.insertFootnote(),
          },
          {
            label: "Inserir nota de fim",
            onClick: () => references.insertEndnote(),
          },
          {
            label: "Inserir citação",
            onClick: () => references.insertCitation(),
          },
          {
            label: "Gerar bibliografia",
            onClick: () => references.insertBibliography(),
          },
          {
            label: "Legenda de figura",
            onClick: () => references.insertFigureCaption(),
          },
          {
            label: "Legenda de tabela",
            onClick: () => references.insertTableCaption(),
          },
          {
            label: "Atualizar campos",
            onClick: () => references.updateFields(),
          },
        ]}
      />
    </div>
  );
}

function RibbonRevisaoMenu() {
  return (
    <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
      <InserirCard
        title="Correção ortográfica e gramatical"
        description="Corrija erros de ortografia e gramática com IA (Ollama)."
        actions={[
          {
            label: "Corrigir texto",
            onClick: () => window.alert("Placeholder: correção ortográfica em breve."),
          },
          {
            label: "Verificar documentos",
            onClick: () => window.alert("Placeholder: verificação de documentos em breve."),
          },
        ]}
      />
      <InserirCard
        title="Controle de alterações"
        description="Controle e gerencie as alterações feitas no documento."
        actions={[
          {
            label: "Rastrear alterações",
            onClick: () => window.alert("Placeholder: rastreamento de alterações em breve."),
          },
          {
            label: "Comentar",
            onClick: () => window.alert("Placeholder: comentários em breve."),
          },
        ]}
      />
      <InserirCard
        title="Comparação de versões"
        description="Compare diferentes versões do documento e identifique diferenças."
        actions={[
          {
            label: "Comparar versões",
            onClick: () => window.alert("Placeholder: comparação de versões em breve."),
          },
          {
            label: "Painel de revisão",
            onClick: () => window.alert("Placeholder: painel de revisão em breve."),
          },
        ]}
      />
      <InserirCard
        title="Restrição de edição"
        description="Bloqueie partes do documento para evitar edições não autorizadas."
        actions={[
          {
            label: "Bloquear documento",
            onClick: () => window.alert("Placeholder: bloqueio de documento em breve."),
          },
          {
            label: "Permitir edição",
            onClick: () => window.alert("Placeholder: edição permitida em breve."),
          },
        ]}
      />
      <InserirCard
        title="Tradução e contagem de palavras"
        description="Traduza o documento para outros idiomas e obtenha uma contagem detalhada de palavras."
        actions={[
          {
            label: "Traduzir",
            onClick: () => window.alert("Placeholder: tradução em breve."),
          },
          {
            label: "Contar palavras",
            onClick: () => window.alert("Placeholder: contagem de palavras em breve."),
          },
        ]}
      />
    </div>
  );
}

