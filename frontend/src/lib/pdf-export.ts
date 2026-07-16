/**
 * @project AncestorTree
 * @file src/lib/pdf-export.ts
 * @description PDF export for family tree — SVG serialisation + html2canvas for text pages
 * @version 3.0.0
 * @updated 2026-03-13
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { Person, Family, ClanSettings } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PdfExportOptions {
  filename?: string;
  orientation?: 'landscape' | 'portrait';
  pageSize?: 'a4' | 'a3' | 'a2';
}

/** Which sections to include in the full genealogy PDF */
export interface FullGiaPhaOptions {
  includeCover: boolean;
  includeHistory: boolean;
  includeTree: boolean;
  includeBiographies: boolean;
}

export interface TreeData {
  people: Person[];
  families: Family[];
  children: { family_id: string; person_id: string; sort_order: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZES = {
  a4: { width: 297, height: 210 },
  a3: { width: 420, height: 297 },
  a2: { width: 594, height: 420 },
} as const;

// A4 portrait pixel dimensions at 96dpi (210mm × 297mm)
const A4_W_PX = 794;
const A4_H_PX = 1123;
const HTML2CANVAS_SCALE = 2;

// Brand color palette
const COLOR_AMBER  = '#b45309';
const COLOR_DARK   = '#1c1917';
const COLOR_GRAY   = '#78716c';
const COLOR_LIGHT  = '#fef3c7';
const COLOR_BORDER = '#d97706';
const COLOR_BLUE_BG  = '#eff6ff';
const COLOR_BLUE_BD  = '#93c5fd';
const COLOR_PINK_BG  = '#fff1f2';
const COLOR_PINK_BD  = '#fda4af';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Warn user when the tree is very large */
export function getExportWarning(nodeCount: number): string | null {
  if (nodeCount > 100) {
    return 'Cây quá lớn (>100 người). Vui lòng lọc theo nhánh trước khi xuất để đảm bảo chất lượng.';
  }
  if (nodeCount > 50) {
    return 'Cây khá lớn (>50 người). Chất lượng PDF có thể bị giảm.';
  }
  return null;
}

function fmt(v: string | number | undefined | null): string {
  return v != null && String(v).trim() !== '' ? String(v).trim() : '—';
}

function fmtDate(date?: string, year?: number): string {
  if (date && date.trim()) return date.trim();
  if (year) return `${year}`;
  return '—';
}

/**
 * Render an HTML string into a full-content canvas (may be taller than A4).
 *
 * Uses an isolated <iframe> so html2canvas only sees our clean inline styles
 * and does NOT parse the parent page's Tailwind CSS 4 stylesheet — which uses
 * modern color functions (lab(), oklch()) that html2canvas v1.4.x cannot parse.
 */
async function htmlToCanvas(html: string, widthPx: number): Promise<HTMLCanvasElement> {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position:fixed;left:-99999px;top:0;width:${widthPx}px;height:200px;border:none;pointer-events:none;`;
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
          color: #1c1917;
          width: ${widthPx}px;
        }
      </style>
    </head><body>${html}</body></html>`);
    doc.close();

    // Wait for the iframe to lay out its content
    await new Promise<void>((r) => setTimeout(r, 150));

    const fullH = doc.body.scrollHeight;
    iframe.style.height = `${fullH}px`;

    // One more tick for resize to propagate
    await new Promise<void>((r) => setTimeout(r, 50));

    return await html2canvas(doc.body, {
      scale: HTML2CANVAS_SCALE,
      useCORS: false,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: widthPx,
      height: fullH,
      windowWidth: widthPx,
      windowHeight: fullH,
    });
  } finally {
    document.body.removeChild(iframe);
  }
}

/**
 * Slice a tall canvas into A4-portrait-sized pages and add each to the PDF.
 * @param isFirst - if true the very first slice is added without addPage()
 */
function sliceCanvasToPages(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  isFirst: boolean,
): void {
  const pageW = A4_W_PX * HTML2CANVAS_SCALE;
  const pageH = A4_H_PX * HTML2CANVAS_SCALE;
  const totalSlices = Math.ceil(canvas.height / pageH);

  for (let i = 0; i < totalSlices; i++) {
    const srcY  = i * pageH;
    const srcH  = Math.min(pageH, canvas.height - srcY);

    // Draw slice onto a new A4-sized canvas (white background for partial last page)
    const slice = document.createElement('canvas');
    slice.width  = pageW;
    slice.height = pageH;
    const ctx = slice.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageW, pageH);
    ctx.drawImage(canvas, 0, srcY, pageW, srcH, 0, 0, pageW, srcH);

    if (!isFirst || i > 0) pdf.addPage('a4', 'portrait');
    pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
  }
}

// ─── HTML templates ───────────────────────────────────────────────────────────

function coverPageHtml(cs: ClanSettings | null, date: string): string {
  const clanName     = cs?.clan_full_name ?? cs?.clan_name ?? 'Gia Phả Chi Tộc';
  const patriarch    = cs?.clan_patriarch  ?? '';
  const foundingYear = cs?.clan_founding_year ?? '';
  const origin       = cs?.clan_origin     ?? '';
  const contact      = [cs?.contact_phone, cs?.contact_email].filter(Boolean).join(' · ');

  const statRow = (label: string, value: string | number) =>
    value
      ? `<tr>
           <td style="padding:6px 16px 6px 0;color:${COLOR_GRAY};white-space:nowrap;">${label}:</td>
           <td style="padding:6px 0;font-weight:600;color:${COLOR_DARK};">${value}</td>
         </tr>`
      : '';

  return `
<div style="width:${A4_W_PX}px;height:${A4_H_PX}px;background:#ffffff;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            padding:60px;box-sizing:border-box;border:0;">

  <!-- Decorative outer border -->
  <div style="width:100%;height:100%;border:12px double ${COLOR_BORDER};
              display:flex;flex-direction:column;align-items:center;justify-content:center;
              padding:40px;box-sizing:border-box;position:relative;">

    <!-- Top ornament -->
    <div style="font-size:40px;color:${COLOR_AMBER};letter-spacing:6px;margin-bottom:24px;">
      &#10022; &#10022; &#10022;
    </div>

    <!-- Main title -->
    <div style="font-size:13px;letter-spacing:6px;color:${COLOR_GRAY};text-transform:uppercase;margin-bottom:8px;">
      GIA PHẢ ĐIỆN TỬ
    </div>
    <h1 style="font-size:32px;font-weight:900;color:${COLOR_DARK};text-align:center;
               margin:0 0 4px 0;line-height:1.2;">
      ${clanName}
    </h1>
    <div style="width:120px;height:3px;background:${COLOR_BORDER};margin:20px auto;"></div>

    <!-- Info table -->
    <table style="border-collapse:collapse;margin-top:24px;font-size:15px;">
      ${statRow('Thủy tổ', patriarch)}
      ${statRow('Năm thành lập', foundingYear)}
      ${statRow('Nguồn gốc', origin)}
      ${contact ? statRow('Liên hệ', contact) : ''}
    </table>

    <!-- Bottom ornament -->
    <div style="margin-top:40px;font-size:11px;color:${COLOR_GRAY};letter-spacing:2px;text-align:center;">
      &#10022; &nbsp; Xuất ngày ${date} &nbsp; &#10022;
    </div>
    <div style="font-size:10px;color:#d4d4d4;margin-top:8px;">AncestorTree v3.0</div>
  </div>
</div>`;
}

function historyPageHtml(cs: ClanSettings | null): string {
  const description = cs?.clan_description ?? '';
  const history     = cs?.clan_history     ?? '';
  const mission     = cs?.clan_mission     ?? '';
  const hallAddr    = cs?.ancestral_hall_address ?? '';
  const hallHist    = cs?.ancestral_hall_history ?? '';

  const section = (title: string, body: string) =>
    body
      ? `<div style="margin-bottom:28px;">
           <h2 style="font-size:15px;font-weight:700;color:${COLOR_AMBER};
                      border-bottom:2px solid ${COLOR_LIGHT};padding-bottom:6px;margin:0 0 12px 0;">
             ${title}
           </h2>
           <p style="margin:0;line-height:1.8;color:${COLOR_DARK};white-space:pre-wrap;">${body}</p>
         </div>`
      : '';

  return `
<div style="width:${A4_W_PX}px;min-height:${A4_H_PX}px;background:#ffffff;
            padding:60px;box-sizing:border-box;font-size:13px;">

  <!-- Page header -->
  <div style="text-align:center;margin-bottom:36px;padding-bottom:20px;
              border-bottom:3px solid ${COLOR_BORDER};">
    <div style="font-size:11px;letter-spacing:4px;color:${COLOR_GRAY};margin-bottom:6px;">GIA PHẢ ĐIỆN TỬ</div>
    <h1 style="font-size:24px;font-weight:800;color:${COLOR_DARK};margin:0;">
      Lịch Sử &amp; Nguồn Gốc
    </h1>
  </div>

  ${section('Giới thiệu', description)}
  ${section('Lịch sử dòng họ', history)}
  ${section('Sứ mệnh &amp; Giá trị', mission)}
  ${hallAddr || hallHist ? section('Nhà thờ họ', [hallAddr, hallHist].filter(Boolean).join('\n\n')) : ''}

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:12px;border-top:1px solid #e5e7eb;
              font-size:10px;color:#d4d4d4;text-align:center;">
    AncestorTree · Gia Phả Điện Tử
  </div>
</div>`;
}

function personCard(p: Person): string {
  const isMale   = p.gender === 1;
  const bg       = isMale ? COLOR_BLUE_BG  : COLOR_PINK_BG;
  const border   = isMale ? COLOR_BLUE_BD  : COLOR_PINK_BD;
  const genderLabel = isMale ? 'Nam' : 'Nữ';
  const statusBadge = p.is_living
    ? `<span style="background:#dcfce7;color:#166534;padding:1px 8px;border-radius:99px;font-size:10px;">Còn sống</span>`
    : `<span style="background:#fee2e2;color:#991b1b;padding:1px 8px;border-radius:99px;font-size:10px;">† Đã mất</span>`;

  const row = (label: string, value: string | undefined | null) =>
    value && value !== '—'
      ? `<tr>
           <td style="width:130px;color:${COLOR_GRAY};padding:3px 8px 3px 0;vertical-align:top;font-size:11px;">${label}:</td>
           <td style="color:${COLOR_DARK};padding:3px 0;font-size:11px;">${value}</td>
         </tr>`
      : '';

  const names: string[] = [];
  if (p.taboo_name) names.push(`Húy: ${p.taboo_name}`);
  if (p.pen_name)   names.push(`Tự: ${p.pen_name}`);

  return `
<div style="background:${bg};border:1.5px solid ${border};border-radius:8px;
            padding:14px 16px;margin-bottom:14px;break-inside:avoid;">

  <!-- Header row -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;">
    <div>
      <span style="font-size:15px;font-weight:700;color:${COLOR_DARK};">
        ${p.display_name}
      </span>
      ${names.length ? `<span style="font-size:10px;color:${COLOR_GRAY};margin-left:8px;">(${names.join(' · ')})</span>` : ''}
    </div>
    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;margin-left:12px;">
      ${statusBadge}
      <span style="font-size:10px;color:${COLOR_GRAY};">Đời ${p.generation} · ${genderLabel}</span>
    </div>
  </div>

  <!-- Details -->
  <table style="border-collapse:collapse;width:100%;">
    ${row('Sinh', fmtDate(p.birth_date, p.birth_year))}
    ${row('Nơi sinh', p.birth_place)}
    ${!p.is_living ? row('Mất', fmtDate(p.death_date, p.death_year)) : ''}
    ${!p.is_living && p.death_lunar ? row('Ngày mất âm', p.death_lunar) : ''}
    ${!p.is_living ? row('Nơi mất', p.death_place) : ''}
    ${row('Quê quán', p.hometown)}
    ${row('Địa chỉ', p.address)}
    ${row('Nghề nghiệp', p.occupation)}
  </table>

  ${p.biography ? `
  <div style="margin-top:8px;padding-top:8px;border-top:1px solid ${border};">
    <div style="font-size:10px;font-weight:600;color:${COLOR_GRAY};margin-bottom:4px;">Tiểu sử:</div>
    <p style="margin:0;font-size:11px;line-height:1.7;color:${COLOR_DARK};">${p.biography}</p>
  </div>` : ''}

  ${p.notes ? `
  <div style="margin-top:6px;">
    <div style="font-size:10px;font-weight:600;color:${COLOR_GRAY};margin-bottom:2px;">Ghi chú:</div>
    <p style="margin:0;font-size:10px;color:${COLOR_GRAY};font-style:italic;">${p.notes}</p>
  </div>` : ''}
</div>`;
}

function biographyPageHtml(people: Person[], families: Family[], clanName: string): string {
  // Sort by generation, then sort_order within same generation
  const sorted = [...people].sort((a, b) => {
    if (a.generation !== b.generation) return a.generation - b.generation;
    return a.display_name.localeCompare(b.display_name, 'vi');
  });

  // Group by generation
  const byGen = new Map<number, Person[]>();
  for (const p of sorted) {
    const g = p.generation ?? 0;
    if (!byGen.has(g)) byGen.set(g, []);
    byGen.get(g)!.push(p);
  }

  const generations = Array.from(byGen.entries()).sort(([a], [b]) => a - b);

  const stats = [
    { label: 'Tổng thành viên', value: people.length },
    { label: 'Còn sống', value: people.filter((p) => p.is_living).length },
    { label: 'Đã mất', value: people.filter((p) => !p.is_living).length },
    { label: 'Số đời', value: generations.length },
    { label: 'Số gia đình', value: families.length },
  ];

  return `
<div style="width:${A4_W_PX}px;min-height:${A4_H_PX}px;background:#ffffff;
            padding:50px 48px;box-sizing:border-box;font-size:13px;">

  <!-- Page header -->
  <div style="text-align:center;margin-bottom:28px;padding-bottom:16px;
              border-bottom:3px solid ${COLOR_BORDER};">
    <div style="font-size:11px;letter-spacing:4px;color:${COLOR_GRAY};margin-bottom:4px;">GIA PHẢ ĐIỆN TỬ</div>
    <h1 style="font-size:22px;font-weight:800;color:${COLOR_DARK};margin:0;">
      Lý Lịch Thành Viên
    </h1>
    <div style="font-size:12px;color:${COLOR_GRAY};margin-top:4px;">${clanName}</div>
  </div>

  <!-- Summary stats -->
  <div style="display:flex;gap:0;margin-bottom:28px;border:1.5px solid ${COLOR_LIGHT};border-radius:8px;overflow:hidden;">
    ${stats.map((s) => `
    <div style="flex:1;text-align:center;padding:12px 8px;border-right:1px solid ${COLOR_LIGHT};">
      <div style="font-size:20px;font-weight:700;color:${COLOR_AMBER};">${s.value}</div>
      <div style="font-size:10px;color:${COLOR_GRAY};margin-top:2px;">${s.label}</div>
    </div>`).join('')}
  </div>

  <!-- Members by generation -->
  ${generations.map(([gen, members]) => `
  <div style="margin-bottom:24px;">
    <div style="background:${COLOR_AMBER};color:#ffffff;padding:8px 16px;border-radius:6px;
                font-size:13px;font-weight:700;margin-bottom:12px;">
      Đời thứ ${gen} &nbsp;&nbsp; <span style="font-weight:400;font-size:11px;">(${members.length} người)</span>
    </div>
    ${members.map(personCard).join('')}
  </div>
  `).join('')}

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;
              font-size:10px;color:#d4d4d4;text-align:center;">
    AncestorTree · Gia Phả Điện Tử
  </div>
</div>`;
}

// ─── Tree-only PDF export (existing functionality) ────────────────────────────

/**
 * Export the visible family-tree SVG to PDF.
 *
 * Strategy:
 *  1. Clone the container's <svg>, reset pan/zoom transform, set full-tree viewBox.
 *  2. Serialise to a Blob URL and draw via HTMLImageElement onto an off-screen canvas.
 *  3. Convert canvas to PNG and embed in jsPDF.
 *
 * This avoids html2canvas's known inability to render SVG <foreignObject> content.
 */
export async function exportTreeToPdf(
  containerElement: HTMLElement,
  treeWidth: number,
  treeHeight: number,
  offsetX: number,
  options: PdfExportOptions = {},
): Promise<void> {
  const {
    filename,
    orientation = 'landscape',
    pageSize = 'a3',
  } = options;

  const date = new Date().toISOString().slice(0, 10);
  const name = filename || `gia-pha-cay-${date}.pdf`;

  // ── 1. Find the SVG inside the container ─────────────────────────────────
  const svgEl = containerElement.querySelector('svg') as SVGSVGElement | null;
  if (!svgEl) throw new Error('Không tìm thấy phần tử SVG để xuất.');

  const svgCanvas = await svgToCanvas(svgEl, treeWidth, treeHeight, offsetX);

  // ── 5. Build PDF ──────────────────────────────────────────────────────────
  const imgData = svgCanvas.toDataURL('image/png');
  const dims = PAGE_SIZES[pageSize];
  const pdf = new jsPDF({ orientation, unit: 'mm', format: pageSize.toUpperCase() });

  const pageW = orientation === 'landscape' ? dims.width : dims.height;
  const pageH = orientation === 'landscape' ? dims.height : dims.width;

  const margin   = 10;
  const footerH  = 8;
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2 - footerH;

  const imgRatio  = svgCanvas.width / svgCanvas.height;
  const pageRatio = contentW / contentH;

  let drawW: number, drawH: number;
  if (imgRatio > pageRatio) {
    drawW = contentW;
    drawH = contentW / imgRatio;
  } else {
    drawH = contentH;
    drawW = contentH * imgRatio;
  }

  const dx = margin + (contentW - drawW) / 2;
  const dy = margin + (contentH - drawH) / 2;

  pdf.addImage(imgData, 'PNG', dx, dy, drawW, drawH);

  pdf.setFontSize(7);
  pdf.setTextColor(160, 160, 160);
  pdf.text(
    `Gia Phả Điện Tử — AncestorTree — Xuất ngày ${date}`,
    pageW / 2,
    pageH - 4,
    { align: 'center' },
  );

  pdf.save(name);
}

// ─── Full genealogy PDF export ────────────────────────────────────────────────

/**
 * Render the family tree SVG into an off-screen canvas (shared by both exports).
 */
async function svgToCanvas(
  svgEl: SVGSVGElement,
  treeWidth: number,
  treeHeight: number,
  offsetX: number,
): Promise<HTMLCanvasElement> {
  const padding = 60;
  const fullW   = Math.max(treeWidth + padding * 2, 400);
  const fullH   = Math.max(treeHeight + padding * 2, 300);

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width',   String(fullW));
  clone.setAttribute('height',  String(fullH));
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
  const blob   = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url    = URL.createObjectURL(blob);

  const DPR    = 2;
  const canvas = document.createElement('canvas');
  canvas.width  = fullW * DPR;
  canvas.height = fullH * DPR;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  img.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload  = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(); };
      img.onerror = () => reject(new Error('Không thể render SVG thành ảnh.'));
      setTimeout(() => reject(new Error('Render SVG bị hết giờ (>15s).')), 15_000);
    });
  } finally {
    URL.revokeObjectURL(url);
  }

  return canvas;
}

/** Default section options — all sections enabled */
export const DEFAULT_FULL_OPTIONS: FullGiaPhaOptions = {
  includeCover: true,
  includeHistory: true,
  includeTree: true,
  includeBiographies: true,
};

/**
 * Export a complete genealogy document to PDF (A4):
 *  • Trang bìa (tuỳ chọn)
 *  • Lịch sử & nguồn gốc (tuỳ chọn, nếu có nội dung)
 *  • Cây gia phả A4 landscape (tuỳ chọn)
 *  • Lý lịch từng thành viên theo từng đời (tuỳ chọn)
 */
export async function exportFullGiaPha(
  containerElement: HTMLElement,
  treeWidth: number,
  treeHeight: number,
  offsetX: number,
  treeData: TreeData,
  clanSettings: ClanSettings | null,
  sectionOptions: FullGiaPhaOptions = DEFAULT_FULL_OPTIONS,
): Promise<void> {
  const date     = new Date().toISOString().slice(0, 10);
  const clanName = clanSettings?.clan_full_name ?? clanSettings?.clan_name ?? 'Gia Phả';
  const filename = `gia-pha-day-du-${date}.pdf`;

  const { includeCover, includeHistory, includeTree, includeBiographies } = sectionOptions;
  let isFirstPage = true;

  // ── Helper: add page (skip addPage for the very first page) ──────────────
  const nextPage = (orientation: 'portrait' | 'landscape' = 'portrait') => {
    if (isFirstPage) { isFirstPage = false; return; }
    pdf.addPage('a4', orientation);
  };

  // ── Start PDF ─────────────────────────────────────────────────────────────
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'A4' });

  // ── Trang bìa ─────────────────────────────────────────────────────────────
  if (includeCover) {
    nextPage('portrait');
    const coverCanvas = await htmlToCanvas(coverPageHtml(clanSettings, date), A4_W_PX);
    pdf.addImage(coverCanvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
  }

  // ── Lịch sử & Nguồn gốc ──────────────────────────────────────────────────
  const hasHistoryContent = !!(
    clanSettings?.clan_description ||
    clanSettings?.clan_history ||
    clanSettings?.clan_mission ||
    clanSettings?.ancestral_hall_address ||
    clanSettings?.ancestral_hall_history
  );

  if (includeHistory && hasHistoryContent) {
    if (isFirstPage) isFirstPage = false; else pdf.addPage('a4', 'portrait');
    const histCanvas = await htmlToCanvas(historyPageHtml(clanSettings), A4_W_PX);
    // First slice goes on current page; remaining slices add pages themselves
    sliceCanvasToPages(pdf, histCanvas, true);
  }

  // ── Cây gia phả (A4 landscape) ───────────────────────────────────────────
  if (includeTree) {
    const svgEl = containerElement.querySelector('svg') as SVGSVGElement | null;
    if (svgEl) {
      if (isFirstPage) isFirstPage = false; else pdf.addPage('a4', 'landscape');
      const treeCanvas = await svgToCanvas(svgEl, treeWidth, treeHeight, offsetX);

      const margin   = 10;
      const footerH  = 8;
      const pageW    = 297, pageH = 210;
      const contentW = pageW - margin * 2;
      const contentH = pageH - margin * 2 - footerH;

      const imgRatio  = treeCanvas.width / treeCanvas.height;
      const pageRatio = contentW / contentH;

      let drawW: number, drawH: number;
      if (imgRatio > pageRatio) {
        drawW = contentW; drawH = contentW / imgRatio;
      } else {
        drawH = contentH; drawW = contentH * imgRatio;
      }
      const dx = margin + (contentW - drawW) / 2;
      const dy = margin + (contentH - drawH) / 2;

      pdf.addImage(treeCanvas.toDataURL('image/png'), 'PNG', dx, dy, drawW, drawH);

      pdf.setFontSize(9);
      pdf.setTextColor(180, 83, 9);
      pdf.text('CÂY GIA PHẢ', pageW / 2, margin - 2, { align: 'center' });

      pdf.setFontSize(7);
      pdf.setTextColor(160, 160, 160);
      pdf.text(
        `${clanName} · Cây gia phả · Xuất ngày ${date}`,
        pageW / 2, pageH - 3,
        { align: 'center' },
      );
    }
  }

  // ── Lý lịch thành viên ────────────────────────────────────────────────────
  if (includeBiographies && treeData.people.length > 0) {
    if (isFirstPage) isFirstPage = false; else pdf.addPage('a4', 'portrait');
    const bioHtml   = biographyPageHtml(treeData.people, treeData.families, clanName);
    const bioCanvas = await htmlToCanvas(bioHtml, A4_W_PX);
    sliceCanvasToPages(pdf, bioCanvas, true);
  }

  if (isFirstPage) throw new Error('Không có trang nào được chọn để xuất.');
  pdf.save(filename);
}
