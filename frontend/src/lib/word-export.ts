/**
 * @project AncestorTree
 * @file src/lib/word-export.ts
 * @description Word (.docx) export for family tree — cover, history, tree image, biographies
 * @version 1.0.0
 * @updated 2026-07-11
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  PageOrientation,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  convertMillimetersToTwip,
} from 'docx';
import type { ISectionOptions } from 'docx';
import { saveAs } from 'file-saver';
import type { Person, Family, ClanSettings } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FullGiaPhaWordOptions {
  includeCover: boolean;
  includeHistory: boolean;
  includeTree: boolean;
  includeBiographies: boolean;
}

export interface TreeDataInput {
  people: Person[];
  families: Family[];
  children: { family_id: string; person_id: string; sort_order: number }[];
}

export const DEFAULT_FULL_WORD_OPTIONS: FullGiaPhaWordOptions = {
  includeCover: true,
  includeHistory: true,
  includeTree: true,
  includeBiographies: true,
};

// ─── Palette (đỏ vàng cổ điển hợp gia phả) ────────────────────────────────────

const CLR = {
  AMBER: 'B45309',       // amber-700 — main accent
  AMBER_DARK: '78350F',  // amber-900 — deep title
  AMBER_LIGHT: 'FEF3C7', // amber-100 — bg tint
  BORDER: 'D97706',      // amber-600 — decorative
  DARK: '1C1917',        // stone-900 — body text
  GRAY: '78716C',        // stone-500 — labels
  MUTED: 'A8A29E',       // stone-400 — footer
  BLUE_BG: 'EFF6FF',     // male card
  BLUE_BD: '93C5FD',
  PINK_BG: 'FFF1F2',     // female card
  PINK_BD: 'FDA4AF',
  ROSE_TITLE: '9F1239',  // rose-800 for generation banner text
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(date?: string, year?: number): string {
  if (date && date.trim()) return date.trim();
  if (year) return `${year}`;
  return '—';
}

/** Data URL/blob → ArrayBuffer for docx ImageRun */
async function urlToArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return await res.arrayBuffer();
}

/**
 * Render tree SVG into a PNG data URL (same strategy as pdf-export.ts).
 * Returns null when SVG absent so caller can skip the tree section gracefully.
 */
async function svgToPng(
  svgEl: SVGSVGElement,
  treeWidth: number,
  treeHeight: number,
  offsetX: number,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  const padding = 60;
  const fullW = Math.max(treeWidth + padding * 2, 400);
  const fullH = Math.max(treeHeight + padding * 2, 300);

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(fullW));
  clone.setAttribute('height', String(fullH));
  clone.setAttribute('viewBox', `0 0 ${fullW} ${fullH}`);

  const outerG = clone.querySelector('g') as SVGGElement | null;
  if (outerG) {
    outerG.setAttribute('transform', 'translate(0,0) scale(1)');
    const innerG = outerG.querySelector('g') as SVGGElement | null;
    if (innerG) {
      innerG.setAttribute('transform', `translate(${offsetX + padding},${padding})`);
    }
  }
  clone.querySelectorAll('[data-html2canvas-ignore]').forEach((el) => el.remove());

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
  bg.setAttribute('width', String(fullW)); bg.setAttribute('height', String(fullH));
  bg.setAttribute('fill', '#ffffff');
  clone.insertBefore(bg, clone.firstChild);

  const svgStr = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const DPR = 2;
  const canvas = document.createElement('canvas');
  canvas.width = fullW * DPR;
  canvas.height = fullH * DPR;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  img.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve();
      };
      img.onerror = () => reject(new Error('Không thể render SVG.'));
      setTimeout(() => reject(new Error('Render SVG hết giờ.')), 15_000);
    });
  } finally {
    URL.revokeObjectURL(url);
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: fullW,
    height: fullH,
  };
}

// ─── Paragraph builders ───────────────────────────────────────────────────────

const spacer = (before = 120, after = 120) =>
  new Paragraph({ spacing: { before, after }, children: [new TextRun(' ')] });

/** Section title (H2 style) with amber underline */
function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 300, after: 160 },
    border: {
      bottom: { color: CLR.AMBER_LIGHT, size: 12, style: BorderStyle.SINGLE, space: 4 },
    },
    children: [
      new TextRun({
        text,
        size: 30, // half-points (15pt)
        bold: true,
        color: CLR.AMBER,
        font: 'Times New Roman',
      }),
    ],
  });
}

/** Body paragraph with justified alignment */
function bodyPara(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 60, line: 340 },
    children: [
      new TextRun({
        text,
        size: 24, // 12pt
        color: CLR.DARK,
        font: 'Times New Roman',
      }),
    ],
  });
}

/** Body paragraph that preserves \n as line breaks */
function bodyParaMultiline(text: string): Paragraph[] {
  const lines = text.split(/\r?\n/);
  return lines
    .filter((_, i, arr) => !(arr.length > 1 && arr[i] === '' && arr[i - 1] === ''))
    .map((ln) => {
      if (ln.trim() === '') {
        return new Paragraph({ children: [new TextRun('')], spacing: { before: 40, after: 40 } });
      }
      return bodyPara(ln);
    });
}

/** Info table row for cover page (label + value) */
function coverInfoRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        borders: {
          top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `${label}:`,
                bold: true,
                color: CLR.GRAY,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        borders: {
          top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: value,
                bold: true,
                color: CLR.DARK,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ─── Cover section ────────────────────────────────────────────────────────────

function buildCoverSection(cs: ClanSettings | null, date: string): (Paragraph | Table)[] {
  const clanName = cs?.clan_full_name ?? cs?.clan_name ?? 'Gia Phả Chi Tộc';
  const rows: TableRow[] = [];
  if (cs?.clan_patriarch)     rows.push(coverInfoRow('Thủy tổ', cs.clan_patriarch));
  if (cs?.clan_founding_year) rows.push(coverInfoRow('Năm thành lập', String(cs.clan_founding_year)));
  if (cs?.clan_origin)        rows.push(coverInfoRow('Nguồn gốc', cs.clan_origin));
  const contact = [cs?.contact_phone, cs?.contact_email].filter(Boolean).join(' · ');
  if (contact) rows.push(coverInfoRow('Liên hệ', contact));

  const nodes: (Paragraph | Table)[] = [
    spacer(600, 200),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '❖ ❖ ❖', size: 40, color: CLR.AMBER, font: 'Times New Roman' })],
      spacing: { after: 240 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'GIA PHẢ ĐIỆN TỬ',
          size: 22,
          color: CLR.GRAY,
          bold: true,
          characterSpacing: 60,
          font: 'Times New Roman',
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: clanName.toUpperCase(),
          size: 56, // 28pt
          bold: true,
          color: CLR.AMBER_DARK,
          font: 'Times New Roman',
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '━━━━━━━━━━', color: CLR.BORDER, size: 32 })],
      spacing: { after: 400 },
    }),
  ];

  if (rows.length > 0) {
    nodes.push(
      new Table({
        alignment: AlignmentType.CENTER,
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows,
      }),
    );
  }

  nodes.push(
    spacer(600, 100),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '❖ ❖ ❖', size: 32, color: CLR.AMBER, font: 'Times New Roman' })],
      spacing: { after: 160 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Xuất ngày ${date}`,
          italics: true,
          color: CLR.GRAY,
          size: 20,
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'AncestorTree — Gia Phả Điện Tử',
          color: CLR.MUTED,
          size: 18,
          font: 'Times New Roman',
        }),
      ],
    }),
  );

  return nodes;
}

// ─── History section ──────────────────────────────────────────────────────────

function buildHistorySection(cs: ClanSettings | null): Paragraph[] {
  const nodes: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({
          text: 'GIA PHẢ ĐIỆN TỬ',
          size: 20,
          color: CLR.GRAY,
          characterSpacing: 60,
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'LỊCH SỬ & NGUỒN GỐC',
          size: 40,
          bold: true,
          color: CLR.AMBER_DARK,
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 24, color: CLR.BORDER, space: 4 },
      },
      children: [new TextRun('')],
    }),
  ];

  const section = (title: string, body: string | undefined) => {
    if (!body || !body.trim()) return;
    nodes.push(sectionTitle(title));
    for (const p of bodyParaMultiline(body)) nodes.push(p);
  };

  section('Giới thiệu', cs?.clan_description);
  section('Lịch sử dòng họ', cs?.clan_history);
  section('Sứ mệnh & Giá trị', cs?.clan_mission);
  const hall = [cs?.ancestral_hall_address, cs?.ancestral_hall_history]
    .filter(Boolean)
    .join('\n\n');
  section('Nhà thờ họ', hall || undefined);

  return nodes;
}

// ─── Person biography card (as a bordered single-cell Table) ──────────────────

function fieldRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 28, type: WidthType.PERCENTAGE },
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: label, color: CLR.GRAY, size: 20, font: 'Times New Roman' }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 72, type: WidthType.PERCENTAGE },
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: value, color: CLR.DARK, size: 22, font: 'Times New Roman' }),
            ],
          }),
        ],
      }),
    ],
  });
}

function personCardTable(p: Person): Table {
  const isMale = p.gender === 1;
  const bg = isMale ? CLR.BLUE_BG : CLR.PINK_BG;
  const border = isMale ? CLR.BLUE_BD : CLR.PINK_BD;

  const nameSuffix: string[] = [];
  if (p.taboo_name) nameSuffix.push(`Húy: ${p.taboo_name}`);
  if (p.pen_name)   nameSuffix.push(`Tự: ${p.pen_name}`);

  const headerPara = new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: p.display_name,
        bold: true,
        size: 26,
        color: CLR.DARK,
        font: 'Times New Roman',
      }),
      ...(nameSuffix.length
        ? [
            new TextRun({
              text: `   (${nameSuffix.join(' · ')})`,
              size: 18,
              color: CLR.GRAY,
              italics: true,
              font: 'Times New Roman',
            }),
          ]
        : []),
    ],
  });

  const metaPara = new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({
        text: `Đời ${p.generation} · ${isMale ? 'Nam' : 'Nữ'} · ${p.is_living ? 'Còn sống' : '† Đã mất'}`,
        size: 18,
        color: CLR.GRAY,
        font: 'Times New Roman',
      }),
    ],
  });

  const fieldRows: TableRow[] = [];
  const push = (label: string, val?: string) => {
    if (val && val.trim() && val !== '—') fieldRows.push(fieldRow(label, val));
  };
  push('Sinh', fmtDate(p.birth_date, p.birth_year));
  push('Nơi sinh', p.birth_place);
  if (!p.is_living) {
    push('Mất', fmtDate(p.death_date, p.death_year));
    if (p.death_lunar) push('Ngày mất (âm)', p.death_lunar);
    push('Nơi mất', p.death_place);
  }
  push('Quê quán', p.hometown);
  push('Địa chỉ', p.address);
  push('Nghề nghiệp', p.occupation);

  const cellChildren: (Paragraph | Table)[] = [headerPara, metaPara];

  if (fieldRows.length > 0) {
    cellChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: fieldRows,
      }),
    );
  }

  if (p.biography && p.biography.trim()) {
    cellChildren.push(
      new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({
            text: 'Tiểu sử',
            bold: true,
            size: 20,
            color: CLR.AMBER,
            font: 'Times New Roman',
          }),
        ],
      }),
      ...bodyParaMultiline(p.biography),
    );
  }

  if (p.notes && p.notes.trim()) {
    cellChildren.push(
      new Paragraph({
        spacing: { before: 100, after: 40 },
        children: [
          new TextRun({
            text: 'Ghi chú',
            bold: true,
            size: 20,
            color: CLR.AMBER,
            font: 'Times New Roman',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({
            text: p.notes,
            size: 20,
            italics: true,
            color: CLR.GRAY,
            font: 'Times New Roman',
          }),
        ],
      }),
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 8, color: border },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: border },
      left:   { style: BorderStyle.SINGLE, size: 8, color: border },
      right:  { style: BorderStyle.SINGLE, size: 8, color: border },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: bg, color: 'auto' },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: cellChildren,
          }),
        ],
      }),
    ],
  });
}

// ─── Biographies section ──────────────────────────────────────────────────────

function buildBiographySection(
  people: Person[],
  families: Family[],
  clanName: string,
): (Paragraph | Table)[] {
  const sorted = [...people].sort((a, b) => {
    if (a.generation !== b.generation) return a.generation - b.generation;
    return a.display_name.localeCompare(b.display_name, 'vi');
  });

  const byGen = new Map<number, Person[]>();
  for (const p of sorted) {
    const g = p.generation ?? 0;
    if (!byGen.has(g)) byGen.set(g, []);
    byGen.get(g)!.push(p);
  }
  const generations = Array.from(byGen.entries()).sort(([a], [b]) => a - b);

  const nodes: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({
          text: 'GIA PHẢ ĐIỆN TỬ',
          size: 20,
          color: CLR.GRAY,
          characterSpacing: 60,
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'LÝ LỊCH THÀNH VIÊN',
          size: 40,
          bold: true,
          color: CLR.AMBER_DARK,
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: clanName,
          italics: true,
          size: 22,
          color: CLR.GRAY,
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 24, color: CLR.BORDER, space: 4 },
      },
      children: [new TextRun('')],
    }),
  ];

  // Statistics table
  const statCell = (label: string, value: number | string) =>
    new TableCell({
      width: { size: 20, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: CLR.AMBER_LIGHT, color: 'auto' },
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 4, color: CLR.BORDER },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: CLR.BORDER },
        left:   { style: BorderStyle.SINGLE, size: 4, color: CLR.BORDER },
        right:  { style: BorderStyle.SINGLE, size: 4, color: CLR.BORDER },
      },
      margins: { top: 160, bottom: 160, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: String(value),
              bold: true,
              size: 32,
              color: CLR.AMBER_DARK,
              font: 'Times New Roman',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: label,
              size: 18,
              color: CLR.GRAY,
              font: 'Times New Roman',
            }),
          ],
        }),
      ],
    });

  nodes.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideVertical:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
      rows: [
        new TableRow({
          children: [
            statCell('Tổng thành viên', people.length),
            statCell('Còn sống', people.filter((p) => p.is_living).length),
            statCell('Đã mất', people.filter((p) => !p.is_living).length),
            statCell('Số đời', generations.length),
            statCell('Số gia đình', families.length),
          ],
        }),
      ],
    }),
    spacer(200, 200),
  );

  for (const [gen, members] of generations) {
    // Generation banner
    nodes.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 4, color: CLR.AMBER_DARK },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: CLR.AMBER_DARK },
          left:   { style: BorderStyle.SINGLE, size: 4, color: CLR.AMBER_DARK },
          right:  { style: BorderStyle.SINGLE, size: 4, color: CLR.AMBER_DARK },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.CLEAR, fill: CLR.AMBER, color: 'auto' },
                margins: { top: 120, bottom: 120, left: 200, right: 200 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Đời thứ ${gen}   `,
                        bold: true,
                        size: 26,
                        color: 'FFFFFF',
                        font: 'Times New Roman',
                      }),
                      new TextRun({
                        text: `(${members.length} người)`,
                        size: 20,
                        color: 'FFF7ED',
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      spacer(80, 80),
    );

    for (const person of members) {
      nodes.push(personCardTable(person), spacer(80, 120));
    }
  }

  return nodes;
}

// ─── Header / Footer builders ─────────────────────────────────────────────────

function makeHeader(clanName: string): Header {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: CLR.BORDER, space: 4 },
        },
        children: [
          new TextRun({
            text: clanName,
            size: 18,
            color: CLR.AMBER,
            italics: true,
            font: 'Times New Roman',
          }),
        ],
      }),
    ],
  });
}

function makeFooter(date: string): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: CLR.AMBER_LIGHT, space: 4 },
        },
        children: [
          new TextRun({
            text: `AncestorTree · Gia Phả Điện Tử · Xuất ngày ${date}   |   Trang `,
            size: 16,
            color: CLR.MUTED,
            font: 'Times New Roman',
          }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: CLR.MUTED, font: 'Times New Roman' }),
          new TextRun({ text: ' / ', size: 16, color: CLR.MUTED, font: 'Times New Roman' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: CLR.MUTED, font: 'Times New Roman' }),
        ],
      }),
    ],
  });
}

// ─── Main entry ───────────────────────────────────────────────────────────────

/**
 * Export a complete genealogy document to Word (.docx).
 *
 * Layout choices (fits A4):
 *  - Cover / History / Biographies: A4 portrait, 20mm margins
 *  - Tree image: A4 landscape (image fits within margins, kept in aspect ratio)
 */
export async function exportFullGiaPhaWord(
  containerElement: HTMLElement | null,
  treeWidth: number,
  treeHeight: number,
  offsetX: number,
  treeData: TreeDataInput,
  clanSettings: ClanSettings | null,
  sectionOptions: FullGiaPhaWordOptions = DEFAULT_FULL_WORD_OPTIONS,
): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const clanName = clanSettings?.clan_full_name ?? clanSettings?.clan_name ?? 'Gia Phả';
  const filename = `gia-pha-day-du-${date}.docx`;

  const { includeCover, includeHistory, includeTree, includeBiographies } = sectionOptions;

  // A4 = 210 × 297 mm
  const A4_W_MM = 210;
  const A4_H_MM = 297;
  const MARGIN_MM = 20;

  // Common margin config (twips)
  const marginTwipsPortrait = {
    top: convertMillimetersToTwip(MARGIN_MM),
    right: convertMillimetersToTwip(MARGIN_MM),
    bottom: convertMillimetersToTwip(MARGIN_MM),
    left: convertMillimetersToTwip(MARGIN_MM),
  };

  const marginTwipsLandscape = {
    top: convertMillimetersToTwip(15),
    right: convertMillimetersToTwip(15),
    bottom: convertMillimetersToTwip(15),
    left: convertMillimetersToTwip(15),
  };

  const sections: ISectionOptions[] = [];

  // ── Cover section (portrait, no header/footer) ──────────────────────────────
  if (includeCover) {
    sections.push({
      properties: {
        page: {
          size: {
            width: convertMillimetersToTwip(A4_W_MM),
            height: convertMillimetersToTwip(A4_H_MM),
            orientation: PageOrientation.PORTRAIT,
          },
          margin: marginTwipsPortrait,
        },
      },
      children: buildCoverSection(clanSettings, date),
    });
  }

  // ── History section ──────────────────────────────────────────────────────
  const hasHistoryContent = !!(
    clanSettings?.clan_description ||
    clanSettings?.clan_history ||
    clanSettings?.clan_mission ||
    clanSettings?.ancestral_hall_address ||
    clanSettings?.ancestral_hall_history
  );

  if (includeHistory && hasHistoryContent) {
    sections.push({
      properties: {
        page: {
          size: {
            width: convertMillimetersToTwip(A4_W_MM),
            height: convertMillimetersToTwip(A4_H_MM),
            orientation: PageOrientation.PORTRAIT,
          },
          margin: marginTwipsPortrait,
        },
      },
      headers: { default: makeHeader(clanName) },
      footers: { default: makeFooter(date) },
      children: buildHistorySection(clanSettings),
    });
  }

  // ── Tree section (landscape) ─────────────────────────────────────────────
  if (includeTree && containerElement) {
    const svgEl = containerElement.querySelector('svg') as SVGSVGElement | null;
    if (svgEl) {
      const png = await svgToPng(svgEl, treeWidth, treeHeight, offsetX);
      if (png) {
        // A4 landscape usable area ≈ 267×180 mm ≈ 1010×680 px @ 96dpi
        const MAX_W_PX = 1010;
        const MAX_H_PX = 640;
        const ratio = png.width / png.height;
        let drawW = MAX_W_PX;
        let drawH = MAX_W_PX / ratio;
        if (drawH > MAX_H_PX) {
          drawH = MAX_H_PX;
          drawW = MAX_H_PX * ratio;
        }

        const imgArrayBuffer = await urlToArrayBuffer(png.dataUrl);

        sections.push({
          properties: {
            page: {
              size: {
                width: convertMillimetersToTwip(A4_H_MM),  // swapped for landscape
                height: convertMillimetersToTwip(A4_W_MM),
                orientation: PageOrientation.LANDSCAPE,
              },
              margin: marginTwipsLandscape,
            },
          },
          headers: { default: makeHeader(clanName) },
          footers: { default: makeFooter(date) },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 120 },
              children: [
                new TextRun({
                  text: 'CÂY GIA PHẢ',
                  bold: true,
                  size: 32,
                  color: CLR.AMBER_DARK,
                  font: 'Times New Roman',
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: imgArrayBuffer,
                  type: 'png',
                  transformation: { width: drawW, height: drawH },
                }),
              ],
            }),
          ],
        });
      }
    }
  }

  // ── Biographies section ──────────────────────────────────────────────────
  if (includeBiographies && treeData.people.length > 0) {
    sections.push({
      properties: {
        page: {
          size: {
            width: convertMillimetersToTwip(A4_W_MM),
            height: convertMillimetersToTwip(A4_H_MM),
            orientation: PageOrientation.PORTRAIT,
          },
          margin: marginTwipsPortrait,
        },
      },
      headers: { default: makeHeader(clanName) },
      footers: { default: makeFooter(date) },
      children: buildBiographySection(treeData.people, treeData.families, clanName),
    });
  }

  if (sections.length === 0) {
    throw new Error('Không có phần nào được chọn để xuất.');
  }

  const doc = new Document({
    creator: 'AncestorTree',
    title: `Gia Phả — ${clanName}`,
    description: 'Gia Phả Điện Tử xuất từ AncestorTree',
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 24 },
        },
      },
    },
    sections,
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}
