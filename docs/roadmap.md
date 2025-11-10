## Roadmap do Projeto

- [ ] Exportações avançadas  
  - [ ] Gerar HTML e Markdown direto do Tiptap  
  - [ ] Pipeline inicial para DOCX (mammoth + docx)  
  - [ ] Exportar PDF unificando Word e módulo PDF

- [ ] Integração IA (Ollama)  
  - [ ] Configurar ambiente local e hook `useOllama`  
  - [ ] Fluxos de correção gramatical e resumo  
  - [ ] Painel lateral do assistente (UX + prompts)

- [ ] Módulo PDF aprimorado  
  - [ ] Anotações com `pdf-lib` (markup, destaque, comentários)  
  - [ ] Campos editáveis e templates com `@pdfme/ui`  
  - [ ] Exportação/mesclagem de PDFs e assinaturas

- [x] Layout & UX (Fase 1)  
  - [x] Ribbon estilo Word (grupos Área de Transferência, Fonte, Parágrafo, Inserir, Edição)  
  - [x] Estados visuais persistentes nos botões (efeito de “interruptor”)  
  - [x] Canvas centralizado com folha única e listas estilizadas  
  - [ ] Responsividade completa (mobile/tablet)  
  - [ ] Modo claro/escuro automático e personalização de temas  
  - [ ] Galeria de modelos (chips “Lista de tarefas”, “Notas”, etc.)

- [ ] Build e distribuição  
  - [ ] Scripts `pnpm build` / `pnpm tauri build` e documentação  
  - [ ] Ajustar `turbopack.root` e configurar CI (lint + testes)  
  - [ ] Empacotamento desktop com Tauri (Windows/Mac/Linux) e manifesto de permissões

- [ ] Colaboração e backup  
  - [ ] Histórico de versões e snapshots no IndexedDB  
  - [ ] Sincronização opcional com Drive/Dropbox via WebDAV/SDK  
  - [ ] Planejamento para colaboração em tempo real (Y.js ou Liveblocks)


