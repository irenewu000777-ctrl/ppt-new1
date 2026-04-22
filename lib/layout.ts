import { PAPER_SIZE_MM, mmToPt } from "./constants";
import type { LayoutSettings, Page } from "./types";

export interface PositionedPage {
  page: Page;
  slotIndex: number;
}

export interface SheetLayout {
  sheetIndex: number;
  slots: Array<PositionedPage | null>;
}

export function getSlotOrder(rows: number, columns: number, pattern: LayoutSettings["pattern"]): number[] {
  const indices: number[] = [];
  if (pattern === "Z") {
    for (let i = 0; i < rows * columns; i += 1) indices.push(i);
    return indices;
  }

  for (let col = 0; col < columns; col += 1) {
    for (let row = 0; row < rows; row += 1) {
      indices.push(row * columns + col);
    }
  }
  return indices;
}

export function buildSheetLayouts(pages: Page[], settings: LayoutSettings): SheetLayout[] {
  const perSheet = settings.rows * settings.columns;
  const slotOrder = getSlotOrder(settings.rows, settings.columns, settings.pattern);
  const sheets: SheetLayout[] = [];

  for (let start = 0; start < pages.length; start += perSheet) {
    const chunk = pages.slice(start, start + perSheet);
    const slots: Array<PositionedPage | null> = Array.from({ length: perSheet }, () => null);
    chunk.forEach((page, i) => {
      const slotIndex = slotOrder[i];
      slots[slotIndex] = { page, slotIndex };
    });
    sheets.push({ sheetIndex: sheets.length, slots });
  }

  return sheets;
}

export function getPaperPt(settings: LayoutSettings): { width: number; height: number } {
  const mmSize = PAPER_SIZE_MM[settings.paperSize];
  const widthPt = mmToPt(mmSize.width);
  const heightPt = mmToPt(mmSize.height);
  if (settings.orientation === "landscape") {
    return { width: heightPt, height: widthPt };
  }
  return { width: widthPt, height: heightPt };
}
