---
name: buscar-tjpr
description: Busca acórdãos no portal de jurisprudência do TJPR via scraping e filtra os relevantes, validando via WebFetch do acórdão integral antes de citar — evita precedente forçado.
---

# Busca de Jurisprudência TJPR

Busca acórdãos no Tribunal de Justiça do Paraná e filtra os relevantes para o caso em discussão.

## Instrução

Use `$ARGUMENTS` como query de pesquisa. Se vazio, peça ao usuário que informe o tema.

---

## Princípios gerais do motor

O motor do TJPR tem comportamento não-óbvio. Regras empíricas que você deve seguir:

1. **Queries longas zeram resultado.** 8+ termos → 0 acórdãos. Use **3–5 termos por query**, nunca mais.
2. **Zero resultado não significa "não existe".** Significa que a query está muito específica. Fragmente — não amplie — quando zerar.
3. **Buscar por número de processo no motor não funciona.** Para acórdão específico, use WebFetch na URL direta.
4. **50 resultados = query genérica demais.** Sinal de que você precisa adicionar um termo discriminante (não empilhar sinônimos).
5. **A ementa parcial retornada na busca pode ocultar pontos decisivos.** Quando o acórdão parecer relevante, confirme via WebFetch na URL completa antes de citar.

---

### Passo 1 — Primeira rodada: busca ampla (3–4 termos)

```bash
uv run --project "ferramentas/pesquisa/busca-tjpr" \
  python -m busca_tjpr "$ARGUMENTS" 1 2>&1 | grep -v '\"asctime\"'
```

Se `$ARGUMENTS` tiver mais de 5 termos, **extraia 3–4 termos-chave** antes de executar. Não passe a string bruta.

### Passo 1b — Se zerar: afunile por sinônimos, não por amplitude

Quando a primeira rodada retornar 0 acórdãos, rode 3–5 queries alternativas **mais curtas**, cada uma testando um ângulo semântico diferente. Exemplos de pares úteis:

| Conceito buscado | Variações para testar |
|---|---|
| Valor a ser apurado depois | `"liquidação arbitramento"` · `"a ser apurado"` · `sentença ilíquida` · `indenização apurar` |
| Responsabilidade do profissional | `responsabilidade civil médico` · `erro profissional saúde` · `falha prestação serviço` |
| Rito do JEC | `juizado especial` · `recurso inominado` · `turma recursal` |
| Vício de serviço | `vício qualidade serviço` · `art 20 CDC` · `falha prestação` |

Rode em paralelo (várias execuções em sequência no mesmo script) para economizar tempo.

### Passo 1c — Se retornar 50 resultados: adicione um termo discriminante

Query genérica demais. Em vez de trocar sinônimos, adicione **um termo que delimite a matéria específica** (ex: adicionar `consumidor` a uma busca de `liquidação arbitramento`). Nunca empilhe muitos termos de uma vez — adicione **um de cada vez** e observe o efeito.

### Passo 2 — Confirmação pela leitura integral

Para cada acórdão que pareça relevante, **não confie apenas na ementa parcial** retornada. Use WebFetch na URL completa com prompt específico:

```text
WebFetch({
  url: "<URL do acórdão>",
  prompt: "Extraia a ementa completa e os pontos centrais. Foco: <pergunta concreta que decide a relevância>. Responda também: o acórdão faz <X específico>?"
})
```

Isso evita o erro comum de citar um acórdão cuja ementa sugere apoiar a tese, mas cujo conteúdo real trata de matéria diferente.

### Passo 3 — Analisar e filtrar

Com base no contexto do caso que está sendo discutido na conversa, leia cada acórdão e selecione apenas os que sustentam alguma das teses relevantes. Descarte os que são de matéria alheia ou não agregam à argumentação.

**Critérios de filtragem honesta:**

- **Rito compatível.** Precedente de procedimento comum pode não valer em JEC (e vice-versa). Se a lei especial do rito afasta a tese, o precedente não serve — verifique antes de citar.
- **Núcleo decisório alinhado.** Não basta a matéria ser parecida. O ponto decidido pelo precedente deve ser **o mesmo** ponto que você precisa no caso.
- **Status processual comparável.** Se a tese é "sentença ilíquida com liquidação posterior", o precedente deve ter **efetivamente** remetido à liquidação — não apenas ter tratado de indenização. Resultado importa.
- **Data e câmara.** Priorize acórdãos recentes (últimos 3 anos) e, se possível, da mesma câmara/turma que julgará eventual recurso.

**Não force.** Se os acórdãos encontrados tratam de matéria análoga mas não sustentam exatamente a tese, diga isso com clareza. Um precedente mal encaixado é pior que nenhum — o adversário o distingue e expõe a fragilidade.

### Passo 4 — Apresentar

Para cada acórdão selecionado:

```text
📋 [número do processo] | 📅 [data] | 🏛️ [câmara] | 👨‍⚖️ [relator]
🔗 [URL direta para o acórdão]
TESE APOIADA: [qual argumento do caso este acórdão sustenta]
TRECHO: "[citação direta mais útil — literal, sem paráfrase]"
USO: [onde e como usar na peça]
```

Ao final, mostre um quadro resumo com todos os selecionados, as teses que cada um apoia e os respectivos links.

Se nenhum resultado sustentar diretamente a tese pretendida, **diga isso**. Não encaixe precedente forçado. Registre também o dado negativo: "não foi encontrado precedente do TJPR diretamente sobre X" é uma conclusão útil — pode indicar que a tese é criativa/arriscada, ou que o caminho argumentativo correto é outro (por exemplo, ancorar em lei federal ou tema repetitivo do STJ).

---

## Armadilhas conhecidas

- **Ementa parcial pode enganar.** O `summary` retornado pelo motor às vezes corta em ponto crítico. Uma ementa que diz "TEORIA DA CAUSA MADURA. FALHA NA PRESTAÇÃO. DANOS MATERIAIS RECONHECIDOS" pode dar a impressão de que apoia liquidação posterior — quando na verdade o acórdão fixa valor certo na sentença. **Sempre leia o conteúdo integral antes de citar como precedente.**
- **"Danos materiais reconhecidos" ≠ "dano material futuro".** A maioria dos acórdãos em saúde/odontologia fixa danos consumados com valor certo. Dano futuro a liquidar é raro e no JEC é vedado pelo art. 38, parágrafo único da Lei 9.099/95.
- **Lei especial do rito pode afastar a tese.** Antes de formular tese processual agressiva (como liquidação posterior), verifique se o rito admite. No JEC: sentença sempre líquida.
