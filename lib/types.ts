export type Pattern = "Z" | "N";
export type Orientation = "portrait" | "landscape";
export type PaperSizeKey = "A4" | "A5" | "Letter" | "B5";

export interface Page {
  id: string;
  image: string;
  pdfPageIndex: number;
}

export interface PagePipelineResult {
  sourceName: string;
  sourcePdfBytes: Uint8Array;
  pages: Page[];
}

export interface LayoutSettings {
  rows: number;
  columns: number;
  gapMm: number;
  paperSize: PaperSizeKey;
  orientation: Orientation;
  pattern: Pattern;
}
