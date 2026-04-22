import { PDFDocument } from "pdf-lib";
import { buildSheetLayouts, getPaperPt } from "./layout";
import { mmToPt } from "./constants";
import type { LayoutSettings, PagePipelineResult } from "./types";

export async function exportImposedPdf(data: PagePipelineResult, settings: LayoutSettings): Promise<Uint8Array> {
  try {
    const outDoc = await PDFDocument.create();
    const sourceDoc = await PDFDocument.load(Uint8Array.from(data.sourcePdfBytes));
    const layouts = buildSheetLayouts(data.pages, settings);
    const paper = getPaperPt(settings);
    const outerMarginPt = mmToPt(8);
    const gapPt = mmToPt(settings.gapMm);
    const cellWidth = (paper.width - outerMarginPt * 2 - gapPt * (settings.columns - 1)) / settings.columns;
    const cellHeight = (paper.height - outerMarginPt * 2 - gapPt * (settings.rows - 1)) / settings.rows;

    for (const sheet of layouts) {
      const page = outDoc.addPage([paper.width, paper.height]);
      for (let slot = 0; slot < sheet.slots.length; slot += 1) {
        const item = sheet.slots[slot];
        if (!item) continue;

        const row = Math.floor(slot / settings.columns);
        const col = slot % settings.columns;

        const x = outerMarginPt + col * (cellWidth + gapPt);
        const yTop = outerMarginPt + row * (cellHeight + gapPt);
        const y = paper.height - yTop - cellHeight;

        const sourcePage = sourceDoc.getPage(item.page.pdfPageIndex);
        const embeddedPage = await outDoc.embedPage(sourcePage);
        const scale = Math.min(cellWidth / embeddedPage.width, cellHeight / embeddedPage.height);
        const drawWidth = embeddedPage.width * scale;
        const drawHeight = embeddedPage.height * scale;
        const drawX = x + (cellWidth - drawWidth) / 2;
        const drawY = y + (cellHeight - drawHeight) / 2;

        page.drawPage(embeddedPage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight
        });
      }
    }

    return outDoc.save();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知导出错误";
    throw new Error(`导出 PDF 失败：${msg}`);
  }
}
