"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";

type StatusBarProps = {
  editor: Editor;
};

type Counters = {
  words: number;
  characters: number;
  selection: number;
};

const INITIAL_COUNTERS: Counters = {
  words: 0,
  characters: 0,
  selection: 0,
};

export function StatusBar({ editor }: StatusBarProps) {
  const [counters, setCounters] = useState<Counters>(INITIAL_COUNTERS);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!editor) return;

    const updateCounters = () => {
      const text = editor.getText();
      const words = text
        .trim()
        .split(/\s+/)
        .filter((token) => token.length > 0).length;
      const characters = text.replace(/\s/g, "").length;
      const selection = editor.state.selection.content().size;

      setCounters({
        words,
        characters,
        selection,
      });
    };

    const handleUpdate = () => {
      updateCounters();
      setLastSaved(new Date());
    };

    updateCounters();

    editor.on("transaction", handleUpdate);
    editor.on("selectionUpdate", updateCounters);

    return () => {
      editor.off("transaction", handleUpdate);
      editor.off("selectionUpdate", updateCounters);
    };
  }, [editor]);

  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border border-t border-border/40 bg-black/60 px-6 py-3 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-6">
        <StatusChip label="Palavras" value={counters.words.toLocaleString("pt-BR")} />
        <StatusChip
          label="Caracteres"
          value={counters.characters.toLocaleString("pt-BR")}
        />
        <StatusChip
          label="Seleção"
          value={`${counters.selection.toLocaleString("pt-BR")} caract.`}
        />
      </div>

      <div className="flex items-center gap-4">
        <StatusChip label="Idioma" value="Português (Brasil)" />
        <StatusChip label="Modo" value="Edição" />
        <StatusChip
          label="Auto save"
          value={
            lastSaved
              ? `sincronizado há ${formatRelativeTime(lastSaved)}`
              : "sincronizando..."
          }
        />
      </div>
    </footer>
  );
}

type StatusChipProps = {
  label: string;
  value: string;
};

function StatusChip({ label, value }: StatusChipProps) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-border/40 bg-black/40 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="text-primary">{value}</span>
    </span>
  );
}

function formatRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime();

  if (diff < 5_000) {
    return "instantes";
  }

  if (diff < 60_000) {
    const seconds = Math.floor(diff / 1_000);
    return `${seconds}s`;
  }

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

