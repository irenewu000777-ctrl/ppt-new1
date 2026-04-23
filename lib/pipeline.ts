"use client";

import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfjsPkg from "pdfjs-dist/package.json";
import { MAX_PDF_FILE_SIZE_BYTES, MAX_PDF_FILE_SIZE_MB } from "./constants";
import type { Page, PagePipelineResult, PipelineProgress } from "./types";

GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsPkg.version}/build/pdf.worker.min.mjs`;

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isPptLike(file: File): boolean {
  const lower = file.name.toLowerCase();
  return (
    file.type.includes("presentation") ||
    lower.endsWith(".ppt") ||
    lower.endsWith(".pptx")
  );
}

function getSourceType(file: File): PagePipelineResult["sourceType"] {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".pptx")) return "pptx";
  if (lower.endsWith(".ppt")) return "ppt";
  return "pdf";
}

function isLikelyPdf(bytes: Uint8Array): boolean {
  const probeLen = Math.min(bytes.length, 1024);
  const probe = new TextDecoder("ascii", { fatal: false }).decode(bytes.slice(0, probeLen));
  return probe.includes("%PDF-");
}

function explainNonPdf(bytes: Uint8Array): string {
  const probeLen = Math.min(bytes.length, 300);
  const preview = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, probeLen)).trim();
  if (!preview) return "返回内容为空";
  if (preview.startsWith("<") || preview.toLowerCase().includes("html")) {
    return "返回内容像 HTML 错误页";
  }
  return `返回内容前缀：${preview.slice(0, 120)}`;
}

function ensurePdf(bytes: Uint8Array, scene: string): Uint8Array {
  if (isLikelyPdf(bytes)) return bytes;
  throw new Error(`${scene} 不是有效 PDF（No PDF header found）。${explainNonPdf(bytes)}`);
}

async function convertInputToPdf(file: File): Promise<Uint8Array> {
  if (file.size > MAX_PDF_FILE_SIZE_BYTES) {
    throw new Error(`文件超出限制：最大支持 ${MAX_PDF_FILE_SIZE_MB}MB。`);
  }

  if (isPdf(file)) {
    const raw = new Uint8Array(await file.arrayBuffer());
    return ensurePdf(raw, "上传文件");
  }
  throw new Error("文件类型不支持。请上传 PDF / PPT / PPTX。");
}

async function waitForStableSlide(slideNode: Element): Promise<void> {
  const images = Array.from(slideNode.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const done = () => {
            img.removeEventListener("load", done);
            img.removeEventListener("error", done);
            resolve();
          };
          img.addEventListener("load", done);
          img.addEventListener("error", done);
        })
    )
  );
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

async function buildPptSnapshotPages(
  file: File,
  onProgress?: (progress: PipelineProgress) => void,
  snapshotScale = 2
): Promise<Page[]> {
  const [{ init }, html2canvasModule] = await Promise.all([import("pptx-preview"), import("html2canvas")]);
  const html2canvas = html2canvasModule.default;
  const raw = await file.arrayBuffer();
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-20000px";
  host.style.top = "0";
  host.style.width = "1280px";
  host.style.height = "720px";
  host.style.opacity = "0";
  host.style.pointerEvents = "none";
  host.style.background = "#fff";
  document.body.appendChild(host);

  try {
    const previewer = init(host, { width: 1280, height: 720, mode: "slide" });
    const deck = await previewer.load(raw);
    const total = previewer.slideCount || deck?.slides?.length || 0;
    if (!total) {
      throw new Error("未解析到任何幻灯片");
    }

    const pages: Page[] = [];
    for (let i = 0; i < total; i += 1) {
      onProgress?.({
        message: "正在生成幻灯片预览...",
        current: i + 1,
        total
      });
      previewer.renderSingleSlide(i);
      let slideNode = host.firstElementChild;
      if (!slideNode && i === 0) {
        previewer.renderSingleSlide(i + 1);
        slideNode = host.firstElementChild;
      }
      if (!slideNode) {
        throw new Error(`第 ${i + 1} 页渲染失败`);
      }

      await waitForStableSlide(slideNode);
      const canvas = await html2canvas(slideNode as HTMLElement, {
        backgroundColor: "#ffffff",
        scale: Math.max(2, Math.min(3, snapshotScale)),
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      pages.push({
        id: `${file.name}-${i + 1}`,
        image: canvas.toDataURL("image/png"),
        width: canvas.width,
        height: canvas.height
      });
    }
    return pages;
  } finally {
    document.body.removeChild(host);
  }
}

async function buildPdfPages(
  file: File,
  rawPdfBytes: Uint8Array,
  onProgress?: (progress: PipelineProgress) => void
): Promise<Page[]> {
  // 一份用于后续导出持久保存，一份给 pdf.js 预览，避免 worker 转移导致 buffer detached。
  const previewPdfBytes = Uint8Array.from(rawPdfBytes);
  let pdf;
  try {
    const loadingTask = getDocument({ data: previewPdfBytes });
    pdf = await loadingTask.promise;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "PDF 解析失败";
    throw new Error(`PDF 解析失败：${msg}`);
  }

  const pages = await Promise.all(
    Array.from({ length: pdf.numPages }, async (_, i) => {
      onProgress?.({ message: "正在生成页面预览...", current: i + 1, total: pdf.numPages });
      const page = await pdf.getPage(i + 1);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("无法创建预览画布");
      }
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      return {
        id: `${file.name}-${i + 1}`,
        image: canvas.toDataURL("image/png"),
        width: canvas.width,
        height: canvas.height,
        pdfPageIndex: i
      };
    })
  );
  return pages;
}

export async function buildPagePipeline(
  file: File,
  options?: { onProgress?: (progress: PipelineProgress) => void; snapshotScale?: number }
): Promise<PagePipelineResult> {
  const onProgress = options?.onProgress;
  if (!isPdf(file) && !isPptLike(file)) {
    throw new Error("仅支持 PDF / PPT / PPTX 文件。");
  }

  if (file.size > MAX_PDF_FILE_SIZE_BYTES) {
    throw new Error(`文件超出限制：最大支持 ${MAX_PDF_FILE_SIZE_MB}MB。`);
  }

  if (isPdf(file)) {
    const rawPdfBytes = await convertInputToPdf(file);
    const sourcePdfBytes = Uint8Array.from(rawPdfBytes);
    const pages = await buildPdfPages(file, rawPdfBytes, onProgress);
    return {
      sourceName: file.name,
      sourceType: "pdf",
      sourcePdfBytes,
      pages
    };
  }

  try {
    const pages = await buildPptSnapshotPages(file, onProgress, options?.snapshotScale ?? 2);
    return {
      sourceName: file.name,
      sourceType: getSourceType(file),
      pages
    };
  } catch {
    throw new Error("当前课件较复杂，建议先导出为 PDF 再上传。");
  }

}

