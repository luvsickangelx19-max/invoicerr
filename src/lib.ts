import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { WHATSAPP_NUMBER, type NumberingConfig } from './types';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const money = (value: number) => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
export const itemAmount = (item: { qty: number; price: number; discount: number }) =>
  Math.max(0, item.qty * item.price - item.discount);
export const docSubtotal = (doc: { items: { qty: number; price: number; discount: number }[] }) =>
  doc.items.reduce((sum, item) => sum + itemAmount(item), 0);
export { docTotal, docTotalDiscount } from './types';

export function readStore<T>(name: string, fallback: T): T {
  try {
    const value = localStorage.getItem(name);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore(name: string, value: unknown) {
  try {
    localStorage.setItem(name, JSON.stringify(value));
  } catch { /* ignore */ }
}

export function generateNumber(prefix: string, numbering: NumberingConfig, kind: string): string {
  const running = (numbering.running[kind] ?? 0) + 1;
  const now = new Date();
  return `${prefix}/${running}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function incrementRunning(numbering: NumberingConfig, kind: string): NumberingConfig {
  return { ...numbering, running: { ...numbering.running, [kind]: (numbering.running[kind] ?? 0) + 1 } };
}

const A4_RATIO = 297 / 210;

async function inlineImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(imgs.map(async (img) => {
    if (img.src.startsWith('data:')) return;
    if (!img.complete || img.naturalWidth === 0) {
      await new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
        setTimeout(resolve, 15000);
      });
    }
    try {
      const resp = await fetch(img.src);
      const blob = await resp.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      img.src = dataUrl;
      await new Promise<void>((resolve) => {
        if (img.complete) resolve();
        else img.addEventListener('load', () => resolve(), { once: true });
      });
    } catch { /* leave original src */ }
  }));
}

async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  await inlineImages(element);

  const paper = element.querySelector<HTMLElement>('.doc-paper') ?? element;

  // The paper lives inside a ScaledPaper wrapper that applies transform: scale().
  // html2canvas cannot handle ancestor transforms, so we temporarily neutralise
  // every ancestor up to the document body, plus the paper's own inline styles.
  const ancestors: HTMLElement[] = [];
  let node: HTMLElement | null = paper.parentElement;
  while (node && node !== document.body) {
    ancestors.push(node);
    node = node.parentElement;
  }
  const savedAncestorStyles = ancestors.map((a) => ({
    el: a,
    transform: a.style.transform,
    width: a.style.width,
    height: a.style.height,
    overflow: a.style.overflow,
    position: a.style.position,
  }));
  ancestors.forEach((a) => {
    a.style.transform = 'none';
    a.style.overflow = 'visible';
  });

  const W = 595;
  const H = Math.round(W * A4_RATIO);
  const saved = {
    transform: paper.style.transform,
    width: paper.style.width,
    maxWidth: paper.style.maxWidth,
    height: paper.style.height,
    aspectRatio: paper.style.aspectRatio,
    overflow: paper.style.overflow,
  };
  paper.style.transform = 'none';
  paper.style.width = `${W}px`;
  paper.style.maxWidth = 'none';
  paper.style.height = `${H}px`;
  paper.style.aspectRatio = 'auto';
  paper.style.overflow = 'hidden';

  try {
    return await html2canvas(paper, {
      scale: 3,
      useCORS: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0,
      width: W,
      height: H,
      windowWidth: W,
      windowHeight: H,
      onclone: (doc) => {
        doc.querySelectorAll<HTMLElement>('.doc-paper').forEach((el) => {
          el.style.boxShadow = 'none';
          el.style.transform = 'none';
          el.style.width = `${W}px`;
          el.style.maxWidth = 'none';
          el.style.height = `${H}px`;
          el.style.aspectRatio = 'auto';
          el.style.overflow = 'hidden';
        });
      },
    });
  } finally {
    paper.style.transform = saved.transform;
    paper.style.width = saved.width;
    paper.style.maxWidth = saved.maxWidth;
    paper.style.height = saved.height;
    paper.style.aspectRatio = saved.aspectRatio;
    paper.style.overflow = saved.overflow;
    savedAncestorStyles.forEach((s) => {
      s.el.style.transform = s.transform;
      s.el.style.width = s.width;
      s.el.style.height = s.height;
      s.el.style.overflow = s.overflow;
      s.el.style.position = s.position;
    });
  }
}

export async function exportPNG(element: HTMLElement, filename: string) {
  const canvas = await captureElement(element);
  canvas.toBlob((blob) => {
    if (blob) saveAs(blob, filename.endsWith('.png') ? filename : `${filename}.png`);
  }, 'image/png');
}

export async function exportJPG(element: HTMLElement, filename: string) {
  const canvas = await captureElement(element);
  canvas.toBlob((blob) => {
    if (blob) saveAs(blob, filename.endsWith('.jpg') ? filename : `${filename}.jpg`);
  }, 'image/jpeg', 0.95);
}

export async function exportPDF(element: HTMLElement, filename: string, isA4 = false) {
  const canvas = await captureElement(element);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  if (isA4) {
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
  } else {
    const ratio = canvas.width / canvas.height;
    let w = pdfW;
    let h = w / ratio;
    if (h > pdfH) { h = pdfH; w = h * ratio; }
    const x = (pdfW - w) / 2;
    const y = (pdfH - h) / 2;
    pdf.addImage(imgData, 'PNG', x, y, w, h);
  }
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export function exportWord(htmlContent: string, filename: string) {
  const fullHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:12pt;color:#111;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #999;padding:6px;font-size:10pt;}</style></head><body>${htmlContent}</body></html>`;
  const blob = new Blob([fullHtml], { type: 'application/msword' });
  saveAs(blob, filename.endsWith('.doc') ? filename : `${filename}.doc`);
}

export async function shareToWhatsApp(file: Blob, filename: string, message: string) {
  try {
    const fileObj = new File([file], filename, { type: file.type });
    if (navigator.canShare && navigator.canShare({ files: [fileObj] })) {
      await navigator.share({ files: [fileObj], text: message });
      return;
    }
  } catch { /* fall through */ }
  saveAs(file, filename);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

export async function shareImageToWhatsApp(element: HTMLElement, filename: string, message: string) {
  const canvas = await captureElement(element);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (blob) await shareToWhatsApp(blob, filename, message);
}

export async function shareToSocial(element: HTMLElement, filename: string, platform: 'instagram' | 'threads' | 'tiktok', caption: string) {
  const canvas = await captureElement(element);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const file = new File([blob], filename, { type: 'image/png' });
  const text = caption || 'Rencang Resik';
  const shareData: ShareData = { files: [file], text, title: 'Rencang Resik' };

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share(shareData);
      return;
    } catch { /* fall through to download */ }
  }

  saveAs(blob, filename);
  const urls: Record<string, string> = {
    instagram: 'https://www.instagram.com/',
    threads: 'https://www.threads.net/',
    tiktok: 'https://www.tiktok.com/',
  };
  window.open(urls[platform], '_blank');
}

export function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(2);
  return `${d}/${m}/${y}`;
}
