# Contexto do Projeto — Eunoia (PROJECT-CONTEXT.md)

> **Nome do Projeto:** Eunoia (εὔνοια — Flourishing System / Kinetic)  
> **Repositório Git:** `PedroDE18/Kinetic.app`  
> **Status:** Ativo / Em Produção PWA

---

## 1. Visão do Produto

O **Eunoia** é um ecossistema holístico de gestão da vida diária inspirado na filosofia estóica e na fisiologia metabólica humana, unindo:

1. **Nutrição Adaptativa:** Algoritmo dinâmico de gasto energético total diário (TDEE adaptativo) inspirado no MacroFactor, com diário de calorias e distribuição precisa de macronutrientes.
2. **Treinamento de Força:** Registro de cargas e progressão periodizada estilo Caliber.
3. **Mente & Florescimento Estóico:** Rituais de intenção matinal (diferenciação entre o que está sob nosso controle e o que é externo), reflexão noturna e monitoramento de qualidade de sono.
4. **Intervenção contra Fricções:** Identificação e diagnóstico de bloqueios comportamentais recorrentes.

---

## 2. Arquitetura & Stack Tecnológica

* **Framework Frontend:** React 19 + TypeScript empacotado via **Vite 8**.
* **Estilização & Design System:** Eunoia Dark Theme (Obsidian Monocromático Estóico, preto puro OLED `#000000`, textos neutros e bordas discretas).
* **Backend & Autenticação:** Firebase 13 (Cloud Firestore, Firebase Authentication).
* **Camada de IA:** Integração com o Google Gemini API SDK (`@google/genai`) para análise nutricional de linguagem natural e estimativas off-line via tabelas TACO/USDA.
* **Distribuição:** Progressive Web App (PWA) instalável em tela cheia no iPhone/Android com suporte offline.

---

## 3. Comandos de Operação

```bash
# Instalação de dependências
npm install

# Execução em desenvolvimento local
npm run dev

# Compilação para produção
npm run build

# Verificação de tipos
npm run lint
```

---

## 4. Oportunidades de Integração com o Segundo Cérebro

1. **Cartão no Carrossel 3D do Obsidian:** Exibir meta calórica atual, status do treino do dia e intenção estóica diária diretamente no painel inicial do Segundo Cérebro.
2. **Exportação de Diário Estóico:** Persistência automática das reflexões noturnas na pasta de planejamento pessoal em `04 - LIFE/PLANNING/`.
