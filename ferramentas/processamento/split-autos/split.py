#!/usr/bin/env python3
"""
split.py — Divide integra.pdf (PJe/Projudi) em PDFs individuais por mov. X.Y

Uso:
  python3 split.py <integra.pdf> [--output <pasta>]

  Se --output for omitido, grava na mesma pasta do integra.pdf.
"""
import sys
import re
import argparse
from pathlib import Path

import pdfplumber
from pypdf import PdfReader, PdfWriter


def sanitize_filename(name: str) -> str:
    name = name.strip()
    name = re.sub(r'[<>:"/\\|?*\n\r\t]', '', name)
    name = re.sub(r'\s+', ' ', name)
    return name[:80]


def parse_capas(pdf_path: Path) -> dict:
    """
    Lê as páginas de capa (Ref. mov. X.0) e extrai metadados de cada movimento.
    Retorna dict {mov_num: {date, action, author, files: [...]}}
    """
    capas: dict = {}
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ''
            m = re.search(r'Ref\. mov\. (\d+)\.0', text)
            if not m:
                continue

            mov_num = int(m.group(1))

            date_m = re.search(r'Data:\s*(\d{2}/\d{2}/\d{4})', text)
            action_m = re.search(r'Movimentação:\s*(.+)', text)
            author_m = re.search(r'Por:\s*(.+)', text)

            # Nomes dos arquivos anexados (bullet •), ignorando não-exportáveis
            raw_files = re.findall(r'•\s*(.+)', text)
            files = [
                f.strip() for f in raw_files
                if 'não exportável' not in f.lower()
            ]

            capas[mov_num] = {
                'page_index': i,
                'date': date_m.group(1) if date_m else '',
                'action': action_m.group(1).strip() if action_m else '',
                'author': author_m.group(1).strip() if author_m else '',
                'files': files,
            }

    return capas


def get_page_mov_key(text: str) -> tuple[int, int] | None:
    m = re.search(r'Ref\. mov\. (\d+)\.(\d+)', text)
    if m:
        return int(m.group(1)), int(m.group(2))
    return None


def split_integra(pdf_path: Path, output_dir: Path) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Lendo capas de {pdf_path.name}...")
    capas = parse_capas(pdf_path)
    print(f"  {len(capas)} movimentos detectados")

    print("Mapeando páginas por movimento...")
    reader = PdfReader(str(pdf_path))

    with pdfplumber.open(pdf_path) as pdf:
        page_texts = [p.extract_text() or '' for p in pdf.pages]

    # pages_by_mov[(X, Y)] = [índices das páginas no PDF original]
    pages_by_mov: dict[tuple, list] = {}
    for i, text in enumerate(page_texts):
        key = get_page_mov_key(text)
        if key and key[1] > 0:          # ignora capas (X.0)
            pages_by_mov.setdefault(key, []).append(i)

    print(f"  {len(pages_by_mov)} sub-documentos encontrados")
    print()

    saved = 0
    for (mov_num, sub_num), page_indices in sorted(pages_by_mov.items()):
        capa = capas.get(mov_num, {})
        files = capa.get('files', [])

        description = sanitize_filename(files[sub_num - 1]) if sub_num <= len(files) else ''

        mov_str = f"{mov_num:02d}.{sub_num}"
        filename = f"mov. {mov_str} - {description}.pdf" if description else f"mov. {mov_str}.pdf"
        output_path = output_dir / filename

        writer = PdfWriter()
        for idx in page_indices:
            writer.add_page(reader.pages[idx])

        with open(output_path, 'wb') as f:
            writer.write(f)

        print(f"  ✓ {filename}  ({len(page_indices)} pág.)")
        saved += 1

    print(f"\nConcluído: {saved} arquivos gravados em {output_dir}")
    return saved


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Divide integra.pdf do PJe em PDFs por mov. X.Y'
    )
    parser.add_argument('integra', help='Caminho para o integra.pdf')
    parser.add_argument(
        '--output', '-o',
        help='Pasta de saída (padrão: mesma pasta do integra.pdf)',
        default=None,
    )
    args = parser.parse_args()

    integra_path = Path(args.integra)
    if not integra_path.exists():
        print(f"Erro: arquivo não encontrado: {integra_path}", file=sys.stderr)
        sys.exit(1)

    output_dir = Path(args.output) if args.output else integra_path.parent
    split_integra(integra_path, output_dir)