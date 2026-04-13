# DESIGN.md — faro. Design System

Arquivo de referência visual para o Claude Code. Leia antes de qualquer decisão de UI/frontend.

---

## Identidade

**Nome:** faro.  
**Conceito:** Farol. A IA que ilumina o caminho das suas campanhas.  
**Tipografia display:** Syne 800 (headlines, logotipo)  
**Tipografia UI:** DM Mono 400/500 (labels, dados, body)

> O ponto final em **faro.** faz parte da marca — usar sempre, sem exceção.

---

## Fontes

Carregar via Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Família   | Peso       | Uso                              |
|-----------|------------|----------------------------------|
| Syne      | 700 / 800  | Headlines, logotipo, títulos     |
| DM Mono   | 400 / 500  | Body, labels, dados, UI geral    |

---

## Light Mode

**Personalidade:** Quente, preciso, confiante. Papel e tinta com um ponto de fogo.

### Paleta

| Token       | Hex       | Uso                                        |
|-------------|-----------|--------------------------------------------|
| Ember       | `#e85d26` | Cor principal, CTAs, destaques, ícone      |
| Deep Ember  | `#c94d1e` | Hover de botões, estados ativos            |
| Obsidian    | `#1a1208` | Texto principal, botão primário            |
| Parchment   | `#f5f2ec` | Background principal                       |
| Sand        | `#ede7de` | Background de cards, bordas suaves         |
| Muted       | `#999999` | Texto secundário, placeholders             |

### Componentes

| Elemento         | Estilo                                                                 |
|------------------|------------------------------------------------------------------------|
| Background       | `#f5f2ec`                                                              |
| Card             | `background: white` · `border: 1px solid #ede7de` · `border-radius: 12px` |
| Botão primário   | `background: #1a1208` · `color: #f5f2ec`                              |
| Botão secundário | `border: 1px solid rgba(232,93,38,0.3)` · `color: #e85d26`            |
| Badge ativo      | `background: rgba(232,93,38,0.1)` · `color: #e85d26`                  |
| Progress track   | `#f0ebe3`                                                              |
| Progress fill    | `#e85d26`                                                              |
| Divisores        | `border: 1px solid #e8e0d4`                                            |

---

## Dark Mode

**Personalidade:** Brasa no escuro. Quente, profundo, focado. Não é azul — é orgânico.

### Paleta

| Token   | Hex       | Uso                                        |
|---------|-----------|--------------------------------------------|
| Ember   | `#e85d26` | Cor principal, CTAs, destaques, ícone      |
| Cream   | `#f0ead8` | Texto principal                            |
| Pitch   | `#0f0d09` | Background principal                       |
| Carbon  | `#16120b` | Background de cards                        |
| Bark    | `#2a2215` | Bordas, divisores, progress track          |
| Muted   | `#4a4030` | Texto secundário, placeholders             |

### Componentes

| Elemento         | Estilo                                                                       |
|------------------|------------------------------------------------------------------------------|
| Background       | `#0f0d09`                                                                    |
| Card             | `background: #16120b` · `border: 1px solid #2a2215` · `border-radius: 12px` |
| Botão primário   | `background: #e85d26` · `color: #0f0d09`                                    |
| Botão secundário | `border: 1px solid #2a2215` · `color: #f0ead8`                              |
| Badge ativo      | `background: rgba(232,93,38,0.12)` · `color: #e85d26`                       |
| Progress track   | `#2a2215`                                                                    |
| Progress fill    | `#e85d26`                                                                    |
| Divisores        | `border: 1px solid #1e1a12`                                                  |

---

## Ícone / Logo

SVG de farol estilizado dentro de um círculo.

| Parte           | Light Mode  | Dark Mode   |
|-----------------|-------------|-------------|
| Raios de luz    | `#e85d26`   | `#e85d26`   |
| Corpo do farol  | `#1a1208`   | `#f0ead8`   |
| Lente interna   | `#e85d26` opacity 0.9–0.95 | `#e85d26` opacity 0.9–0.95 |

---

## Bordas e Espaçamento

| Elemento | Valor         |
|----------|---------------|
| Botões   | `border-radius: 8px`  |
| Cards    | `border-radius: 12px` |
| Modais   | `border-radius: 16px` |

- Espaçamento generoso — o produto deve respirar
- Evitar compressão de elementos; padding interno mínimo de `16px` em cards

---

## O que NÃO fazer

- Nunca omitir o ponto final em **faro.**
- Nunca usar azuis ou roxos — a identidade é intencionalmente quente (laranja + preto/creme)
- Nunca usar fonte diferente de Syne (display) ou DM Mono (UI)
- Nunca usar `border-radius` acima de `16px` em qualquer componente
- Nunca usar branco puro (`#ffffff`) como background no dark mode — usar `#0f0d09` ou `#16120b`
- Nunca usar preto puro (`#000000`) — usar Obsidian (`#1a1208`) ou Pitch (`#0f0d09`)
