#!/usr/bin/env python3
"""
Transcrever áudio/vídeo (.webm, .mp4, .m4a, .wav, ...) com whisper.cpp.

Estratégia:
1. Extrai áudio para WAV 16kHz mono (requisito do whisper.cpp) via ffmpeg.
2. Divide em blocos de N segundos (padrão: 600s = 10min) para salvar progresso
   incremental e permitir retomada se o processo for interrompido.
3. Transcreve cada bloco com whisper-cli (Metal no Apple Silicon) em PT-BR.
4. Mescla os SRTs parciais no SRT final, reaplicando o offset temporal e
   renumerando as entradas.
5. Gera um .md legal-friendly com timestamps [HH:MM:SS] e placeholder [?]
   para rotulagem manual dos interlocutores.

Uso:
  python3 transcrever.py caminho/para/audiencia.webm
  python3 transcrever.py audiencia.webm -m ~/.whisper-models/ggml-small.bin
"""
from __future__ import annotations
import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

WHISPER_BIN_CANDIDATES = [
    "/opt/homebrew/bin/whisper-cli",
    "/usr/local/bin/whisper-cli",
    "whisper-cli",
]
DEFAULT_MODEL = os.path.expanduser("~/.whisper-models/ggml-medium-q5_0.bin")
CHUNK_SECONDS = 600


def find_whisper() -> str:
    for cand in WHISPER_BIN_CANDIDATES:
        try:
            subprocess.run([cand, "--help"], capture_output=True, check=False, timeout=5)
            return cand
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    sys.exit("❌ whisper-cli não encontrado. Rode: brew install whisper-cpp")


def run(cmd, **kwargs):
    print(f"▶ {' '.join(str(c) for c in cmd)}", flush=True)
    return subprocess.run(cmd, check=True, **kwargs)


def ffprobe_duration(path: Path) -> float:
    out = subprocess.check_output([
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(path),
    ])
    return float(out.strip())


def extract_audio(src: Path, dst: Path) -> None:
    if dst.exists() and dst.stat().st_size > 0:
        print(f"↪ WAV já existe: {dst.name}")
        return
    run([
        "ffmpeg", "-y", "-i", str(src),
        "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
        str(dst),
    ])


def chunk_audio(wav: Path, chunks_dir: Path, chunk_seconds: int) -> list[Path]:
    chunks_dir.mkdir(exist_ok=True)
    existing = sorted(chunks_dir.glob("chunk_*.wav"))
    if existing:
        print(f"↪ {len(existing)} chunk(s) já segmentados")
        return existing
    pattern = chunks_dir / "chunk_%04d.wav"
    run([
        "ffmpeg", "-y", "-i", str(wav),
        "-f", "segment", "-segment_time", str(chunk_seconds),
        "-c", "copy", str(pattern),
    ])
    return sorted(chunks_dir.glob("chunk_*.wav"))


def transcribe_chunk(chunk: Path, whisper_bin: str, model: str, language: str) -> Path:
    srt = chunk.with_suffix(".srt")
    if srt.exists() and srt.stat().st_size > 0:
        print(f"↪ SRT já existe para {chunk.name}")
        return srt
    out_base = str(chunk.with_suffix(""))
    base_cmd = [
        whisper_bin,
        "-m", model,
        "-l", language,
        "-osrt",
        "-of", out_base,
        str(chunk),
    ]
    try:
        run(base_cmd)
    except subprocess.CalledProcessError as exc:
        print(
            "⚠️ whisper-cli falhou no backend padrão; tentando novamente em CPU",
            flush=True,
        )
        fallback_cmd = base_cmd[:-1] + ["-ng", "-nfa", str(chunk)]
        run(fallback_cmd)
    return srt


def fmt_ts(t: float) -> str:
    if t < 0:
        t = 0
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    ms = int(round((t - int(t)) * 1000))
    if ms == 1000:
        ms = 0
        s += 1
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


TS_RE = re.compile(
    r"(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*"
    r"(\d{2}):(\d{2}):(\d{2})[.,](\d{3})"
)


def shift_srt(text: str, offset: float, start_index: int) -> tuple[str, int]:
    """Desloca todos os timestamps do SRT em `offset` segundos e renumera
    as entradas a partir de `start_index`."""
    lines = text.splitlines()
    out: list[str] = []
    i = 0
    idx = start_index
    while i < len(lines):
        line = lines[i]
        if line.strip().isdigit() and i + 1 < len(lines) and TS_RE.search(lines[i + 1]):
            out.append(str(idx))
            idx += 1
            i += 1
            continue
        m = TS_RE.search(line)
        if m:
            t1 = (int(m.group(1)) * 3600 + int(m.group(2)) * 60
                  + int(m.group(3)) + int(m.group(4)) / 1000 + offset)
            t2 = (int(m.group(5)) * 3600 + int(m.group(6)) * 60
                  + int(m.group(7)) + int(m.group(8)) / 1000 + offset)
            out.append(f"{fmt_ts(t1)} --> {fmt_ts(t2)}")
            i += 1
            continue
        out.append(line)
        i += 1
    return "\n".join(out).rstrip() + "\n", idx


def generate_md(srt: Path, md: Path, source_name: str) -> None:
    text = srt.read_text(encoding="utf-8").strip()
    blocks = re.split(r"\n\s*\n", text)
    header = [
        f"# Transcrição — {source_name}",
        "",
        "> Substitua cada `[?]` pelo papel/pessoa real (ex.: `[Juiz]`, `[Adv. Autor]`, `[Adv. Ré]`, `[Testemunha – Nome]`).",
        "> Timestamps no formato `[HH:MM:SS]` referem-se ao início da fala no arquivo de mídia original.",
        "",
        "---",
        "",
    ]
    body: list[str] = []
    for block in blocks:
        parts = block.strip().split("\n", 2)
        if len(parts) < 3:
            continue
        _idx, timing, content = parts
        m = re.match(r"(\d{2}:\d{2}:\d{2})", timing)
        t = m.group(1) if m else "??:??:??"
        content = content.replace("\n", " ").strip()
        body.append(f"- **[{t}]** `[?]` {content}")
    md.write_text("\n".join(header + body) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Transcrever áudio/vídeo via whisper.cpp")
    ap.add_argument("input", help="arquivo de entrada (.webm, .mp4, .m4a, .wav, ...)")
    ap.add_argument("-m", "--model", default=DEFAULT_MODEL,
                    help=f"caminho do modelo GGML (padrão: {DEFAULT_MODEL})")
    ap.add_argument("-l", "--language", default="pt", help="idioma (padrão: pt)")
    ap.add_argument("--chunk", type=int, default=CHUNK_SECONDS,
                    help=f"tamanho do bloco em segundos (padrão: {CHUNK_SECONDS})")
    ap.add_argument("--keep-workdir", action="store_true",
                    help="não apagar diretório intermediário ao final")
    args = ap.parse_args()

    src = Path(args.input).resolve()
    if not src.exists():
        sys.exit(f"❌ Arquivo não encontrado: {src}")
    if not Path(args.model).exists():
        sys.exit(
            f"❌ Modelo não encontrado: {args.model}\n"
            "   Baixe com:\n"
            "   mkdir -p ~/.whisper-models && \\\n"
            "     curl -L -o ~/.whisper-models/ggml-medium-q5_0.bin \\\n"
            "     https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q5_0.bin"
        )

    whisper_bin = find_whisper()

    duration = ffprobe_duration(src)
    print(f"🎬 {src.name} — {duration/60:.1f} min")

    work = src.parent / f".{src.stem}_transcribe"
    work.mkdir(exist_ok=True)
    wav = work / "audio.wav"
    extract_audio(src, wav)

    chunks = chunk_audio(wav, work / "chunks", args.chunk)
    print(f"📦 {len(chunks)} bloco(s) de {args.chunk}s")

    merged_srt = src.with_suffix(".srt")
    idx = 1
    with merged_srt.open("w", encoding="utf-8") as out:
        for i, chunk in enumerate(chunks):
            print(f"🎙  Transcrevendo {chunk.name} ({i+1}/{len(chunks)})")
            srt_path = transcribe_chunk(chunk, whisper_bin, args.model, args.language)
            shifted, idx = shift_srt(
                srt_path.read_text(encoding="utf-8"),
                offset=i * args.chunk,
                start_index=idx,
            )
            out.write(shifted)
            out.write("\n")
            out.flush()
    print(f"✅ SRT: {merged_srt}")

    md = src.with_suffix(".md")
    generate_md(merged_srt, md, src.name)
    print(f"✅ MD:  {md}")

    if not args.keep_workdir:
        import shutil
        shutil.rmtree(work, ignore_errors=True)
        print(f"🧹 Limpou {work.name}/")


if __name__ == "__main__":
    main()
