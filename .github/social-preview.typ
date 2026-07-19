// Social preview do repositório (Open Graph card) — 1280×640.
// Regenerar: typst compile --ppi 72 .github/social-preview.typ .github/social-preview.png
// Upload manual em: Settings → General → Social preview.

#let ink       = rgb("#111111")
#let ink-mid   = rgb("#4B5563")
#let rule      = rgb("#D1D5DB")
#let accent    = rgb("#2563EB")
#let bg-warm   = rgb("#FAFAF8")

#set page(width: 1280pt, height: 640pt, margin: 0pt, fill: bg-warm)
#set text(font: "Helvetica Neue", fill: ink)
#set par(leading: 0.5em)

#place(left + top, rect(width: 18pt, height: 640pt, fill: accent))

#place(left + top, dx: 90pt, dy: 60pt, block(width: 1100pt)[
  #text(size: 17pt, fill: accent, weight: "bold", tracking: 2pt)[MÉTODO ABERTO · FONTES VERIFICÁVEIS · DADOS PROTEGIDOS]

  #v(20pt)
  #text(size: 66pt, weight: "bold")[Advocacia Aberta]

  #v(8pt)
  #text(size: 25pt, fill: ink-mid)[Método jurídico aberto, executável por agentes de IA. Direito brasileiro.]

  #v(28pt)
  #line(length: 100%, stroke: 0.75pt + rule)
  #v(26pt)

  #grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 20pt,
    ..(
      ("22.180", "dispositivos de legislação"),
      ("3.508", "teses do STJ"),
      ("11.133", "acórdãos do STJ"),
    ).map(p => box[
      #text(size: 44pt, weight: "bold", fill: ink)[#p.at(0)]
      #linebreak()
      #text(size: 19pt, fill: ink-mid)[#p.at(1)]
    ])
  )

  #v(30pt)
  #text(size: 21pt, fill: ink-mid)[
    #text(fill: ink, weight: "bold")[Claude Code · Codex]   ·   licença MIT   ·   dado legível vem antes do modelo
  ]
])
