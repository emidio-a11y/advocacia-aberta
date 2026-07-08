// ════════════════════════════════════════════════════════════════════
// TEMPLATE DE PARECER JURÍDICO — Legal Design (autocontido)
// Tema: TRÁFICO DE DROGAS (Lei 11.343/2006)
// ────────────────────────────────────────────────────────────────────
// COMO USAR
//   1. Compile:  typst compile templates/parecer-trafico-drogas.typ
//   2. Preencha cada bloco marcado «PREENCHER» com o conteúdo do seu caso.
//   3. Os blocos de jurisprudência já trazem precedentes REAIS e verificados
//      (busca_delfus). São EXEMPLOS — mantenha os que sustentarem sua tese,
//      apague os demais. Não há nenhuma conclusão jurídica pré-escrita:
//      relatório, análise e parecer final são placeholders.
//
// Paleta e componentes inlinados do design system "template-af.typ"
// (Souza Neto Advocacia) — sem dependência de import externo.
// ════════════════════════════════════════════════════════════════════

// ─── PALETA — MÍNIMA ──────────────────────────────────────────
#let ink        = rgb("#111111")  // corpo — preto tipográfico
#let ink-mid    = rgb("#6B7280")  // secundário: refs, metadata
#let rule       = rgb("#D1D5DB")  // bordas e filetes — cinza claro
#let header-bg  = rgb("#1F2937")  // cabeçalho de tabela — carvão neutro
#let accent     = rgb("#2563EB")  // azul: APENAS links e barra H4
#let bg-subtle  = rgb("#F7F7F7")  // fundo de blocos
#let bg-warm    = rgb("#FAFAF8")  // capa — creme muito sutil
#let bg-alt     = bg-warm
#let neutral-500 = ink-mid
#let neutral-300 = rule
#let accent-blue = accent
#let primary     = header-bg

// ─── COMPONENTES ──────────────────────────────────────────────

// Badge processual / referência a peça ou movimento
#let mov(ref) = box(
  fill: white,
  stroke: 0.5pt + rule,
  inset: (x: 4pt, y: 1pt),
  radius: 2pt,
  outset: (y: 1pt),
  text(font: "Helvetica Neue", size: 9pt, fill: ink-mid)[mov.\u{00A0}#ref],
)

// Silogismo — premissa fática + normativa + conclusão
#let silogismo(fatica, normativa, conclusao) = {
  set par(first-line-indent: 0pt, leading: 0.65em)
  block(
    fill: white,
    stroke: 0.5pt + rule,
    inset: (x: 16pt, y: 12pt),
    width: 100%,
    breakable: false,
    above: 1.5em, below: 1.5em,
  )[
    #text(font: "Helvetica Neue", weight: "bold", size: 9pt, fill: ink, tracking: 1pt)[SILOGISMO]
    #v(8pt)
    #grid(
      columns: (auto, 1fr),
      column-gutter: 16pt,
      row-gutter: 7pt,
      text(font: "Helvetica Neue", weight: "bold", size: 9pt, fill: ink)[Premissa fática],
      text(font: "Georgia", size: 12pt, fill: ink)[#fatica],
      text(font: "Helvetica Neue", weight: "bold", size: 9pt, fill: ink)[Premissa normativa],
      text(font: "Georgia", size: 12pt, fill: ink)[#normativa],
      text(font: "Helvetica Neue", weight: "bold", size: 9pt, fill: ink)[Conclusão],
      text(font: "Georgia", size: 12pt, fill: ink, weight: "bold")[#conclusao],
    )
  ]
}

// Callout de jurisprudência — tribunal, ementa, relator
// `forca` aceita: "vinculante" | "persuasiva" | "orientativa" (rótulo opcional)
#let callout-juris(tribunal: "", orgao: "", processo: "", url: "", relator: "", data: "", forca: "", ementa) = {
  set par(first-line-indent: 0pt, leading: 0.68em, justify: true)
  block(
    fill: white,
    stroke: (left: 2pt + rule, rest: 0.4pt + rule),
    inset: (x: 14pt, y: 10pt),
    width: 100%,
    breakable: true,
    above: 1.5em, below: 1.5em,
  )[
    #text(font: "Helvetica Neue", weight: "bold", size: 9pt, fill: ink, tracking: 0.8pt)[
      #upper(tribunal)
      #if orgao != "" [ · #orgao]
      #if processo != "" [ · #if url != "" { link(url)[#processo] } else { processo }]
      #if forca != "" [#h(1fr) #text(fill: accent)[#upper(forca)]]
    ]
    #v(5pt)
    #text(font: "Georgia", size: 12pt, fill: ink, style: "italic")[#ementa]
    #if relator != "" or data != "" [
      #v(4pt)
      #align(right)[
        #text(font: "Helvetica Neue", size: 9pt, fill: ink-mid)[
          #if relator != "" [Rel. #relator]
          #if relator != "" and data != "" [ · ]
          #if data != "" [#data]
        ]
      ]
    ]
  ]
}

// Blockquote de literalidade legal — dispositivo transcrito
#let blockquote-lei(dispositivo: "", conteudo) = {
  set par(first-line-indent: 0pt, leading: 0.62em, justify: true)
  block(
    fill: bg-subtle,
    stroke: (left: 2pt + ink, rest: 0.4pt + rule),
    inset: (x: 14pt, y: 10pt),
    width: 100%,
    breakable: true,
    above: 1.2em, below: 1.2em,
  )[
    #if dispositivo != "" [
      #text(font: "Helvetica Neue", weight: "bold", size: 8.5pt, fill: ink, tracking: 0.8pt)[#upper(dispositivo)]
      #v(4pt)
    ]
    #text(font: "Georgia", size: 11pt, fill: ink)[#conteudo]
  ]
}

// Depoimento — aspas literais com identificação do declarante
#let depoimento(nome: "", tipo: "", mov-ref: "", timestamp: "", aspa) = {
  set par(first-line-indent: 0pt, leading: 0.7em)
  block(
    fill: bg-subtle,
    stroke: (left: 2pt + rule, rest: 0.4pt + rule),
    inset: (x: 14pt, y: 10pt),
    width: 100%,
    breakable: true,
    above: 1.5em, below: 1.5em,
  )[
    #grid(
      columns: (1fr, auto),
      column-gutter: 10pt,
      text(font: "Helvetica Neue", weight: "bold", size: 9pt, fill: ink)[#nome]
        + text(font: "Helvetica Neue", size: 9pt, fill: ink-mid)[ · #tipo],
      text(font: "Helvetica Neue", size: 9pt, fill: ink-mid)[mov.\u{00A0}#mov-ref · #timestamp],
    )
    #v(5pt)
    #text(font: "Georgia", size: 12pt, fill: ink, style: "italic")["#aspa"]
  ]
}

// Marcador argumentativo — REGRA / EXPLICAÇÃO / APLICAÇÃO / CONCLUSÃO
#let marcador(label) = text(
  font: "Helvetica Neue", weight: "bold", size: 9pt,
  fill: ink, tracking: 0.8pt,
)[#upper(label).]

// Quadro de quesitos — pergunta → resposta sintética
// linhas: array de (quesito, resposta)
#let quadro-quesitos(linhas) = {
  let cells = ()
  for (i, lin) in linhas.enumerate() {
    let (q, r) = lin
    cells.push(text(font: "Helvetica Neue", size: 9pt, fill: ink, weight: "bold")[#(i + 1)])
    cells.push(text(size: 10pt, fill: ink)[#q])
    cells.push(text(font: "Helvetica Neue", size: 10pt, fill: ink, weight: "semibold")[#r])
  }
  table(
    columns: (0.9cm, 1fr, 3.8cm),
    stroke: 0.3pt + rule,
    inset: (x: 8pt, y: 7pt),
    fill: (_, y) => if y == 0 { header-bg } else if calc.odd(y) { white } else { rgb("#F9FAFB") },
    align: (center + horizon, left + top, left + top),
    table.header(
      text(fill: white, font: "Helvetica Neue", size: 9pt, weight: "bold")[\#],
      text(fill: white, font: "Helvetica Neue", size: 9pt, weight: "bold")[Quesito],
      text(fill: white, font: "Helvetica Neue", size: 9pt, weight: "bold")[Resposta],
    ),
    ..cells,
  )
}

// Item de conclusão letrado — a/b/c/d
#let conclusao-item(letra, conteudo) = {
  set par(first-line-indent: 0pt)
  grid(
    columns: (1.2cm, 1fr),
    align: (left + top, left + top),
    text(font: "Helvetica Neue", weight: "bold", fill: ink)[#upper(letra))],
    conteudo,
  )
  v(0.6em)
}

// Ementa — cabeçalho-resumo do parecer
#let ementa(corpo) = {
  set par(first-line-indent: 0pt, leading: 0.68em, justify: true)
  block(
    fill: bg-subtle,
    stroke: (left: 3pt + accent, rest: 0.4pt + rule),
    inset: (x: 16pt, y: 14pt),
    width: 100%,
    breakable: true,
    above: 0.5em, below: 1.5em,
  )[
    #text(font: "Helvetica Neue", weight: "bold", size: 9pt, fill: accent, tracking: 1.5pt)[EMENTA]
    #v(8pt)
    #text(font: "Georgia", size: 11pt, fill: ink)[#corpo]
  ]
}

// Assinatura — encerramento
#let assinatura(nome, oab, local-data) = {
  set par(first-line-indent: 0pt)
  v(2em)
  align(center)[
    #text(font: "Helvetica Neue", size: 9pt, fill: ink-mid)[#local-data]
    #v(2em)
    #line(length: 50%, stroke: 0.5pt + rule)
    #v(0.6em)
    #text(font: "Helvetica Neue", size: 12pt, weight: "bold", fill: ink, tracking: 1.5pt)[#upper(nome)]
    #v(0.3em)
    #text(font: "Helvetica Neue", size: 9pt, fill: ink-mid)[#oab]
  ]
}

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────
#set document(title: "Parecer Jurídico — Tráfico de Drogas", author: "«PREENCHER»")
#set page(paper: "a4", margin: (top: 3cm, bottom: 2.5cm, left: 3cm, right: 2cm), fill: white)
#set text(font: ("Georgia",), size: 12pt, fill: ink, lang: "pt", region: "br", hyphenate: true)
#set par(justify: true, leading: 0.75em, spacing: 1.1em, first-line-indent: (amount: 1.25cm, all: true))

#show heading.where(level: 1): it => {
  set text(font: "Helvetica Neue", size: 12pt, weight: "bold", fill: ink, tracking: 1pt)
  set par(first-line-indent: 0pt)
  v(1.4em); it; v(0.25em)
  line(length: 100%, stroke: 0.5pt + rule)
  v(0.6em)
}
#show heading.where(level: 2): it => {
  set text(font: "Helvetica Neue", size: 12pt, weight: "semibold", fill: ink)
  set par(first-line-indent: 0pt)
  v(0.8em); it; v(0.25em)
}
#show heading.where(level: 3): it => {
  set text(font: "Helvetica Neue", size: 12pt, weight: "semibold", fill: ink)
  set par(first-line-indent: 0pt)
  v(0.5em); it; v(0.1em)
}
#show heading.where(level: 4): it => {
  set text(font: "Helvetica Neue", size: 12pt, weight: "bold", fill: ink)
  set par(first-line-indent: 0pt)
  v(1em)
  stack(dir: ltr, spacing: 8pt,
    rect(width: 3pt, height: 0.85em, fill: accent, radius: 1pt),
    it,
  )
  v(0.35em)
}
#show link: set text(fill: accent)

// ════════════════════════════════════════════════════════════════════
// CAPA
// ════════════════════════════════════════════════════════════════════
#page(margin: (x: 3cm, y: 3cm), fill: bg-alt, header: none, footer: none, numbering: none)[
  #set par(first-line-indent: 0pt, leading: 0.7em)
  #v(1.2fr)

  #align(center)[
    #text(font: "Helvetica Neue", size: 10pt, weight: "bold", fill: primary, tracking: 2pt)[PARECER JURÍDICO]
    #v(4pt)
    #text(font: "Helvetica Neue", size: 9pt, fill: neutral-500, tracking: 0.5pt)[MATÉRIA PENAL — LEI Nº 11.343/2006 (TRÁFICO DE DROGAS)]
  ]

  #v(1fr)

  // Card de identificação
  #align(center)[
    #block(
      stroke: 0.6pt + accent-blue,
      inset: (x: 24pt, y: 18pt),
      width: 82%,
      fill: white,
      radius: 2pt,
    )[
      #set par(first-line-indent: 0pt, leading: 0.7em)
      #align(center)[
        #text(font: "Helvetica Neue", size: 8pt, fill: neutral-500, tracking: 1.2pt)[PARECER Nº]
        #v(2pt)
        #text(font: "Menlo", size: 12pt, fill: primary, weight: "bold")[«nº»/«ano»]
        #v(12pt)
        #line(length: 30%, stroke: 0.4pt + accent-blue)
        #v(12pt)
        #grid(columns: (auto, 1fr), column-gutter: 16pt, row-gutter: 8pt, align: (right + horizon, left + horizon),
          text(font: "Helvetica Neue", size: 7.5pt, fill: neutral-500, tracking: 0.8pt)[CONSULENTE],
          text(font: "Georgia", size: 10pt, fill: ink)[«Nome do consulente»],
          text(font: "Helvetica Neue", size: 7.5pt, fill: neutral-500, tracking: 0.8pt)[ASSUNTO],
          text(font: "Georgia", size: 10pt, fill: ink)[«Síntese da consulta»],
          text(font: "Helvetica Neue", size: 7.5pt, fill: neutral-500, tracking: 0.8pt)[REFERÊNCIA],
          text(font: "Menlo", size: 9pt, fill: ink)[«nº do processo / procedimento»],
        )
      ]
    ]
  ]

  #v(1.6fr)

  #align(center)[
    #text(font: "Helvetica Neue", size: 9pt, fill: neutral-500, tracking: 0.5pt)[«Banca / Parecerista»  ·  «Cidade/UF»  ·  «data»]
  ]

  #v(1fr)
]

// ════════════════════════════════════════════════════════════════════
// HEADER / FOOTER
// ════════════════════════════════════════════════════════════════════
#set page(
  fill: white,
  header: context {
    if counter(page).get().first() > 1 [
      #set text(font: "Helvetica Neue", size: 8.5pt, fill: neutral-500)
      #grid(columns: (1fr, auto),
        align(left)[Parecer Jurídico · Tráfico de Drogas],
        align(right)[#text(font: "Menlo", size: 8pt)[Parecer nº «nº»/«ano»]],
      )
      #v(-0.5em)
      #line(length: 100%, stroke: 0.3pt + neutral-300)
    ]
  },
  footer: context {
    if counter(page).get().first() > 1 [
      #line(length: 100%, stroke: 0.3pt + neutral-300)
      #v(-0.3em)
      #set text(font: "Helvetica Neue", size: 8.5pt, fill: neutral-500)
      #grid(columns: (1fr, auto),
        align(left)[«Banca» · «OAB/UF nº»],
        align(right)[Página #counter(page).display() de #context counter(page).final().first()],
      )
    ]
  },
)
#counter(page).update(1)

// ─── SUMÁRIO ──────────────────────────────────────────────────
#outline(title: [Sumário], depth: 3, indent: 1.5em)
#pagebreak()

// ════════════════════════════════════════════════════════════════════
// EMENTA
// ════════════════════════════════════════════════════════════════════
#ementa[
  // «PREENCHER» — resumo dogmático do parecer em uma frase-tese, no estilo de
  // ementa de acórdão (TÓPICOS EM CAIXA-ALTA. Conclusão ao final.). Ex. de forma:
  *DIREITO PENAL. TRÁFICO DE DROGAS (ART. 33 DA LEI 11.343/2006). «TÓPICO 1». «TÓPICO 2». «CONCLUSÃO SINTÉTICA».*
]

// ════════════════════════════════════════════════════════════════════
// I — RELATÓRIO
// ════════════════════════════════════════════════════════════════════
= I — RELATÓRIO

// «PREENCHER» — descreva os fatos da consulta de forma objetiva e neutra:
// quem consulta, o que se pergunta, qual o quadro fático e probatório relevante.
// Use #mov("X.Y") para referenciar peças/laudos. Não antecipe conclusões aqui.
«Exposição objetiva do caso e da consulta. Identifique o flagrante, a apreensão, o
laudo toxicológico #mov("__"), os antecedentes do agente e a imputação.»

São, em síntese, os quesitos submetidos a parecer:

#quadro-quesitos((
  ([«Primeiro quesito — ex.: a materialidade está comprovada?»], [«PREENCHER»]),
  ([«Segundo quesito — ex.: incide o tráfico privilegiado (§ 4º)?»], [«PREENCHER»]),
  ([«Terceiro quesito — ex.: o regime e a substituição da pena?»], [«PREENCHER»]),
))

É o relatório. Passa-se à fundamentação.

// ════════════════════════════════════════════════════════════════════
// II — FUNDAMENTAÇÃO
// ════════════════════════════════════════════════════════════════════
= II — FUNDAMENTAÇÃO

==== II.A — Marco normativo

// Transcreva o(s) dispositivo(s) aplicável(is). NÃO confie em memória: copie do
// texto oficial (Planalto). Substitua o conteúdo abaixo pela letra exata da lei.
#blockquote-lei(dispositivo: "Lei nº 11.343/2006 — Art. 33, caput")[
  «PREENCHER — transcrever a redação oficial do dispositivo a partir do texto do Planalto.»
]

#marcador("regra") «Enuncie a regra jurídica que governa o ponto.» #marcador("explicação") «Explique seu alcance e requisitos.» #marcador("aplicação") «Aplique ao caso concreto da consulta.» #marcador("conclusão") «Feche o raciocínio do tópico.»

==== II.B — Jurisprudência aplicável

// EXEMPLOS REAIS E VERIFICADOS (busca_delfus, jun/2026). Mantenha os que
// sustentarem a tese da consulta e APAGUE os demais. Confira sempre o status
// e o teor atualizado antes de citar em peça definitiva.

#callout-juris(
  tribunal: "STF", orgao: "Plenário", processo: "Súmula Vinculante 63",
  forca: "vinculante",
  data: "26/09/2025",
  url: "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp",
)[
  O tráfico privilegiado (art. 33, § 4º, da Lei 11.343/2006) não configura crime
  hediondo, afastando-se a aplicação dos parâmetros mais rigorosos de progressão de
  regime e de livramento condicional.
]

#callout-juris(
  tribunal: "STF", orgao: "Plenário", processo: "Súmula Vinculante 59",
  forca: "vinculante",
  data: "19/10/2023",
  url: "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp",
)[
  É impositiva a fixação do regime aberto e a substituição da pena privativa de
  liberdade por restritiva de direitos quando reconhecida a figura do tráfico
  privilegiado (art. 33, § 4º, da Lei 11.343/06) e ausentes vetores negativos na
  primeira fase da dosimetria (art. 59 do CP), observados os requisitos do art. 33,
  § 2º, alínea c, e do art. 44, ambos do Código Penal.
]

#callout-juris(
  tribunal: "STJ", orgao: "3ª Seção", processo: "Tema Repetitivo 1206",
  forca: "vinculante (art. 1.036 CPC)",
  data: "22/11/2023",
  url: "https://processo.stj.jus.br/repetitivos/temas_repetitivos/",
)[
  A simples falta de assinatura do perito encarregado pela lavratura do laudo
  toxicológico definitivo constitui mera irregularidade e não tem o condão de anular a
  prova pericial na hipótese de existirem outros elementos que comprovem a sua
  autenticidade, notadamente quando o expert estiver devidamente identificado e for
  constatada a existência de substância ilícita.
]

#callout-juris(
  tribunal: "STJ", orgao: "Terceira Seção", processo: "Súmula 587",
  forca: "persuasiva",
  data: "13/09/2017",
  url: "https://www.stj.jus.br/sites/portalp/Jurisprudencia/Sumulas",
)[
  Para a incidência da majorante prevista no art. 40, V, da Lei n. 11.343/2006, é
  desnecessária a efetiva transposição de fronteiras entre estados da Federação, sendo
  suficiente a demonstração inequívoca da intenção de realizar o tráfico interestadual.
]

// ⚠ NÃO CITAR (defasada): Súmula 512/STJ foi CANCELADA — seu teor foi superado
//    pela SV 63 e pelo Tema 600. Mantida aqui apenas como advertência.

==== II.C — Análise dedutiva

// «PREENCHER» — articule a premissa fática do caso com a premissa normativa
// (lei + precedentes acima) para chegar à conclusão de cada quesito.
#silogismo(
  [«Premissa fática — o que os autos provam sobre a conduta do agente.»],
  [«Premissa normativa — a regra do art. 33 / § 4º e o precedente vinculante aplicável.»],
  [«Conclusão — a consequência jurídica para a consulta.»],
)

// Repita o componente #silogismo() ou #marcador() para cada quesito, conforme
// a estrutura do seu parecer.

// ════════════════════════════════════════════════════════════════════
// III — CONCLUSÃO
// ════════════════════════════════════════════════════════════════════
= III — CONCLUSÃO

Ante o exposto, responde-se aos quesitos formulados:

#conclusao-item("a")[«PREENCHER» — resposta fundamentada ao primeiro quesito.]
#conclusao-item("b")[«PREENCHER» — resposta fundamentada ao segundo quesito.]
#conclusao-item("c")[«PREENCHER» — resposta fundamentada ao terceiro quesito.]

É o parecer, salvo melhor juízo.

#assinatura(
  "«Nome do parecerista»",
  "OAB/«UF» nº «000.000»",
  "«Cidade/UF», «data por extenso».",
)
