"use client";

import { useCallback, useMemo, useState } from "react";
import type { ComponentType } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const PDF_WORKER_SRC = "/pdf.worker.mjs";

type PageAlignment = "left" | "center" | "right";

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

  const workerSrc = useMemo(() => {
    if (typeof window === "undefined") {
      return PDF_WORKER_SRC;
    }

    return new URL(PDF_WORKER_SRC, window.location.origin).toString();
  }, []);

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
            className="text-muted-foreground hover:text-foreground"
            onClick={() =>
              toast.info(
                "Edição direta virá com o módulo pdf-lib (em desenvolvimento)."
              )
            }
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
                  options={{ workerSrc }}
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
                    <Page
                      key={`page-${index + 1}`}
                      className="rounded-lg border border-border/40 bg-white shadow-xl shadow-primary/10"
                      pageNumber={index + 1}
                      scale={scale}
                      renderAnnotationLayer
                      renderTextLayer
                    />
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

