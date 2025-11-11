"use client";

import Link from "next/link";
import { FileDigitIcon, FileTextIcon, SparklesIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WordEditor from "./(editor)/word/page";
import PdfEditor from "./(editor)/pdf/page";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";

const highlights = [
  {
    icon: FileTextIcon,
    title: "Fluxo familiar",
    description:
      "Ferramentas alinhadas ao layout clássico de processadores de texto, sem curva de aprendizado.",
  },
  {
    icon: FileDigitIcon,
    title: "PDF avançado",
    description:
      "Visualize, faça anotações e prepare campos editáveis para contratos e formulários.",
  },
  {
    icon: SparklesIcon,
    title: "Pronto para IA",
    description:
      "Integração futura com modelos locais para revisão, resumo e comandos por voz.",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"word" | "pdf">("word");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "word" || hash === "pdf") {
        setActiveTab(hash);
      }
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const handleTabChange = (value: string) => {
    const tab = value === "pdf" ? "pdf" : "word";
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.location.hash = tab;
    }
  };

  return (
    <>
      <div className="min-h-screen w-full text-foreground">
        <header className="border-b border-border/40 bg-black/70 shadow-lg shadow-primary/10 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Suite de Escritório Offline
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Almeida Editor Pró
          </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Experiência conhecida pelos seus usuários, agora repaginada com
                recursos modernos, modo offline e integração PDF em um único
                painel.
          </p>
        </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                variant="outline"
                className="border-primary/70 text-primary transition hover:border-primary hover:text-primary"
              >
                <Link href="#roadmap">Ver roadmap</Link>
              </Button>
              <Button className="bg-accent font-semibold text-[#031f5f] shadow-lg shadow-accent/40 transition hover:bg-accent/90">
                Baixar app desktop
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
          <Card className="border border-primary/30 bg-card/90 shadow-2xl shadow-primary/20 backdrop-blur">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg font-semibold text-accent">
                Painel principal
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Alterne entre o editor Word e o módulo de PDFs mantendo a mesma
                ergonomia que o seu público já domina.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="bg-black/30 p-1">
                  <TabsTrigger
                    value="word"
                    className="data-[state=active]:bg-primary data-[state=active]:text-[#031f5f]"
                  >
                    Editor Word
                  </TabsTrigger>
                  <TabsTrigger
                    value="pdf"
                    className="data-[state=active]:bg-primary data-[state=active]:text-[#031f5f]"
                  >
                    Editor PDF
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="word" className="mt-8 space-y-4">
                  <WordEditor />
                </TabsContent>
                <TabsContent value="pdf" className="mt-8 space-y-4">
                  <PdfEditor />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <section
            id="roadmap"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {highlights.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="border border-border/40 bg-black/60 backdrop-blur"
              >
                <CardHeader className="flex flex-row items-center gap-4 border-b border-border/40 pb-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <CardTitle className="text-base font-semibold text-foreground">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-sm text-muted-foreground">
                  {description}
                </CardContent>
              </Card>
            ))}
          </section>
      </main>
    </div>
      <Toaster richColors position="bottom-center" />
    </>
  );
}
