"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ComponentType,
  CSSProperties,
  MouseEvent as ReactMouseEvent,
} from "react";
import dynamic from "next/dynamic";
import { pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  FileDown,
  FileUp,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { extractPdfToHtml } from "@/lib/pdf-to-html";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const PDF_WORKER_SRC = "/pdf.worker.mjs";
const IMPORT_EVENT = "almeida:import";
const IMPORT_STORAGE_KEY = "almeida-editor-word-import";

type PageAlignment = "left" | "center" | "right";

type TextField = {
  id: string;
  page: number;
  x: number;
  y: number;
  text: string;
};

const ensurePdfWorkerConfigured = () => {
  if (typeof window === "undefined") {
    return;
  }

  const resolvedSrc = new URL(PDF_WORKER_SRC, window.location.origin).toString();

  if (pdfjs.GlobalWorkerOptions.workerSrc !== resolvedSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = resolvedSrc;
  }
};

const Document = dynamic(
  async () => {
    ensurePdfWorkerConfigured();
    const mod = await import("react-pdf");
    return mod.Document;
  },
  { ssr: false }
);

const Page = dynamic(
  async () => {
    ensurePdfWorkerConfigured();
    const mod = await import("react-pdf");
    return mod.Page;
  },
  { ssr: false }
);

type LoadSuccessEvent = {
  numPages: number;
};

export default function PdfEditor() {
  const [file, setFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("sem nome.pdf");
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [pageAlignment, setPageAlignment] = useState<PageAlignment>("center");
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [textFields, setTextFields] = useState<TextField[]>([]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        toast.error("Envie um arquivo PDF válido.");
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setFile(reader.result as string);
        setPageAlignment("center");
        setIsEditingFields(false);
        setTextFields([]);
        setActiveFieldId(null);
        toast.success("PDF carregado com sucesso!");
      };
      reader.onerror = () =>
        toast.error("Não foi possível ler o arquivo selecionado.");
      reader.readAsDataURL(file);
    },
    []
  );

  const onDocumentLoadSuccess = ({ numPages }: LoadSuccessEvent) => {
    setNumPages(numPages);
  };

  const resetViewer = () => {
    setFile(null);
    setNumPages(0);
    setFileName("sem nome.pdf");
    setPageAlignment("center");
    setIsEditingFields(false);
    setTextFields([]);
    setActiveFieldId(null);
  };

  const increaseScale = () => setScale((value) => Math.min(value + 0.1, 2));
  const decreaseScale = () => setScale((value) => Math.max(value - 0.1, 0.6));

  const hasFile = useMemo(() => Boolean(file), [file]);

  const documentAlignmentClass = useMemo(() => {
    switch (pageAlignment) {
      case "left":
        return "items-start";
      case "right":
        return "items-end";
      default:
        return "items-center";
    }
  }, [pageAlignment]);

  const handleToggleEditFields = () => {
    if (!hasFile) {
      toast.info("Carregue um PDF para habilitar a edição de campos.");
      return;
    }

    setIsEditingFields((prev) => {
      const next = !prev;
      if (!next) {
        setActiveFieldId(null);
      }
      toast[next ? "success" : "info"](
        next ? "Modo de edição de campos ativado." : "Modo de edição desativado."
      );
      return next;
    });
  };

  const handleConvertToWord = async () => {
    if (!file) {
      toast.info("Carregue um PDF antes de converter.");
      return;
    }

    try {
      setIsConverting(true);
      const html = await extractPdfToHtml(file);
      window.localStorage.setItem(IMPORT_STORAGE_KEY, html);
      window.dispatchEvent(
        new CustomEvent(IMPORT_EVENT, {
          detail: { html },
        })
      );
      window.location.hash = "word";
      toast.success("PDF convertido e enviado para o editor Word.");
    } catch (error) {
      console.error("Falha ao converter PDF:", error);
      toast.error("Não foi possível converter este PDF.");
    } finally {
      setIsConverting(false);
    }
  };

  const handlePageClick = (pageNumber: number) => (
    event: ReactMouseEvent<HTMLDivElement>
  ) => {
    if (!isEditingFields) return;

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();

    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;

    const newField: TextField = {
      id: createFieldId(),
      page: pageNumber,
      x: xPercent,
      y: yPercent,
      text: "",
    };

    setTextFields((fields) => [...fields, newField]);
    setActiveFieldId(newField.id);
  };

  const handleFieldTextChange = (id: string, text: string) => {
    setTextFields((fields) =>
      fields.map((field) =>
        field.id === id
          ? {
              ...field,
              text,
            }
          : field
      )
    );
  };

  const handleFieldRemove = (id: string) => {
    setTextFields((fields) => fields.filter((field) => field.id !== id));
    setActiveFieldId((current) => (current === id ? null : current));
  };

  return (
    <Card className="border border-border/40 bg-black/40 backdrop-blur-xl">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary transition hover:bg-primary/20">
            <FileUp className="size-4" />
            <span>Selecionar PDF</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={onFileChange}
              className="sr-only"
            />
          </label>

          <Button
            type="button"
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground",
              isEditingFields && "text-primary"
            )}
            onClick={handleToggleEditFields}
          >
            <FileDown className="size-4" />
            Editar campos
          </Button>

          <div className="flex items-center gap-1 rounded-lg border border-border/30 bg-black/20 px-1 py-1">
            <AlignmentButton
              icon={AlignLeft}
              label="Alinhar à esquerda"
              isActive={pageAlignment === "left"}
              disabled={!hasFile}
              onClick={() => setPageAlignment("left")}
            />
            <AlignmentButton
              icon={AlignCenter}
              label="Centralizar página"
              isActive={pageAlignment === "center"}
              disabled={!hasFile}
              onClick={() => setPageAlignment("center")}
            />
            <AlignmentButton
              icon={AlignRight}
              label="Alinhar à direita"
              isActive={pageAlignment === "right"}
              disabled={!hasFile}
              onClick={() => setPageAlignment("right")}
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            disabled={!hasFile}
            onClick={resetViewer}
          >
            <RotateCcw className="size-4" />
            Limpar
          </Button>

          <Button
            type="button"
            className="bg-primary text-[#031f5f] hover:bg-primary/90"
            disabled={!hasFile || isConverting}
            onClick={handleConvertToWord}
          >
            {isConverting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Converter para Word
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={!hasFile}
              onClick={decreaseScale}
              aria-label="Diminuir zoom"
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={!hasFile}
              onClick={increaseScale}
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="size-4" />
            </Button>
          </div>
        </div>

        <Separator className="border-border/40" />

        <div className="rounded-xl border border-border/30 bg-slate-100/80 p-6 shadow-inner shadow-primary/10">
          {!file ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center text-muted-foreground">
              <p className="text-sm font-medium">
                Arraste um PDF para cá ou clique em “Selecionar PDF”.
              </p>
              <p className="text-xs opacity-80">
                Depois você poderá revisar páginas, marcar campos e preparar
                templates para contratos.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <header className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/70 px-4 py-2 text-xs text-slate-700 shadow">
                <span className="font-semibold">{fileName}</span>
                <span>
                  {numPages} página{numPages === 1 ? "" : "s"}
                </span>
              </header>
              <div className="flex flex-col gap-10">
                <Document
                  file={file}
                  className={cn("flex flex-col gap-10", documentAlignmentClass)}
                  loading={
                    <div className="flex min-h-[300px] items-center justify-center text-sm text-muted-foreground">
                      Renderizando PDF...
                    </div>
                  }
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={() =>
                    toast.error("Não foi possível carregar este PDF.")
                  }
                >
                  {Array.from(new Array(numPages), (_, index) => (
                    <div
                      key={`page-${index + 1}`}
                      className="relative"
                      onClick={handlePageClick(index + 1)}
                    >
                      <Page
                        className="rounded-lg border border-border/40 bg-white shadow-xl shadow-primary/10"
                        pageNumber={index + 1}
                        scale={scale}
                        renderAnnotationLayer
                        renderTextLayer
                      />
                      {textFields
                        .filter((field) => field.page === index + 1)
                        .map((field) => (
                          <TextFieldMarker
                            key={field.id}
                            field={field}
                            isEditing={isEditingFields}
                            isActive={activeFieldId === field.id}
                            onFocus={() => setActiveFieldId(field.id)}
                            onBlur={() =>
                              setActiveFieldId((current) =>
                                current === field.id ? null : current
                              )
                            }
                            onChange={(value) =>
                              handleFieldTextChange(field.id, value)
                            }
                            onRemove={() => handleFieldRemove(field.id)}
                          />
                        ))}
                    </div>
                  ))}
                </Document>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type AlignmentButtonProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function AlignmentButton({
  icon: Icon,
  label,
  isActive,
  disabled,
  onClick,
}: AlignmentButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
        isActive && "bg-primary/20 text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

type TextFieldMarkerProps = {
  field: TextField;
  isEditing: boolean;
  isActive: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (value: string) => void;
  onRemove: () => void;
};

function TextFieldMarker({
  field,
  isEditing,
  isActive,
  onFocus,
  onBlur,
  onChange,
  onRemove,
}: TextFieldMarkerProps) {
  const style: CSSProperties = {
    top: `${field.y}%`,
    left: `${field.x}%`,
  };

  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isEditing || !isActive) return;
    const element = contentRef.current;
    if (!element) return;

    element.focus();

    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }, [isEditing, isActive, field.id]);

  const handleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (isEditing) {
      onFocus();
    }
  };

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const value = (event.target as HTMLDivElement).innerText;
    onChange(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isEditing) return;

    if ((event.key === "Backspace" || event.key === "Delete") && !field.text) {
      event.preventDefault();
      onRemove();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      contentRef.current?.blur();
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      if (!field.text.trim()) {
        onRemove();
        return;
      }
      onBlur();
    }
  };

  const showPlaceholder = isEditing && !field.text && isActive;

  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={style}
    >
      <div className="pointer-events-auto relative">
        <div
          ref={contentRef}
          className={cn(
            "min-w-[80px] whitespace-pre-wrap text-xs text-slate-800 outline-none",
            isEditing
              ? "cursor-text border-b border-dashed border-primary/60 px-1"
              : "cursor-default px-1",
            isActive && isEditing ? "bg-primary/10" : "bg-transparent"
          )}
          contentEditable={isEditing}
          suppressContentEditableWarning
          spellCheck={false}
          tabIndex={isEditing ? 0 : -1}
          onClick={handleClick}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        >
          {field.text || ""}
        </div>

        {showPlaceholder ? (
          <span className="pointer-events-none absolute left-1 top-1 text-[10px] text-muted-foreground">
            Clique para digitar
          </span>
        ) : null}

        {isEditing && isActive ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            className="absolute -right-3 -top-3 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white shadow"
            title="Remover campo"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}

function createFieldId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `field-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

