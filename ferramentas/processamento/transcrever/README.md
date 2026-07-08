# transcrever

Transcreve áudio/vídeo (`.webm`, `.mp4`, `.m4a`, `.wav`, ...) usando
[whisper.cpp](https://github.com/ggml-org/whisper.cpp) local, com Metal no
Apple Silicon. Pensado para audiências forenses (PT-BR) em Mac mini M2 8GB.

Saídas geradas ao lado do arquivo original:
- `<nome>.srt` — legendas com timestamps
- `<nome>.md` — transcrição legal-friendly com `[HH:MM:SS]` e placeholder `[?]`
  para rotulagem manual dos interlocutores

## Setup (uma vez)

```bash
brew install ffmpeg whisper-cpp

mkdir -p ~/.whisper-models
curl -L -o ~/.whisper-models/ggml-medium-q5_0.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q5_0.bin
```

Modelos alternativos (mais leves / mais pesados):
- `ggml-small.bin` (~488MB) — mais rápido, qualidade razoável
- `ggml-medium-q5_0.bin` (~539MB) — **padrão**, quantizado, bom PT-BR em 8GB
- `ggml-medium.bin` (~1.5GB) — medium cheio, melhor qualidade, mais memória
- `ggml-large-v3.bin` (~3GB) — **não recomendado** para 8GB

## Uso

```bash
python3 ferramentas/processamento/transcrever/transcrever.py \
  casos/SeuCaso/_notas_audiencia/audiencia.webm
```

Opções:
- `-m PATH` — caminho para outro modelo GGML
- `-l LANG` — idioma (padrão `pt`)
- `--chunk N` — tamanho do bloco em segundos (padrão 600)
- `--keep-workdir` — mantém o diretório intermediário `.<stem>_transcribe/`

## Como funciona

1. `ffmpeg` extrai áudio para WAV 16kHz mono.
2. Divide em blocos (`ffmpeg -f segment`) para salvar progresso incremental.
3. Cada bloco é transcrito por `whisper-cli`; se o processo morrer, blocos já
   transcritos não são refeitos.
4. SRTs parciais são mesclados com offset de tempo e renumeração.
5. Gera `.md` rotulável.

## Tempo esperado (Mac mini M2 8GB, modelo medium-q5)

| Duração do áudio | Tempo de transcrição |
|---|---|
| 15 min | ~4–7 min |
| 1h | ~15–25 min |
| 1h30 | ~25–40 min |

## Rotulagem manual de interlocutores

Em audiências o elenco é conhecido (juiz, advogados, partes, testemunhas).
Abra o `.md` e substitua os `[?]`:

```diff
- **[00:02:15]** `[?]` Declaro aberta a audiência...
+ **[00:02:15]** `[Juiz]` Declaro aberta a audiência...
```

Se precisar de diarização automática (identificação de "falante 1, 2, 3" sem
conhecer o contexto), o caminho é WhisperX + pyannote — não incluído aqui por
custo de memória em 8GB.
