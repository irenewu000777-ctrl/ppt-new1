"use client";

import { motion } from "framer-motion";
import { buildSheetLayouts, getPaperPt } from "@/lib/layout";
import { PAPER_SIZE_MM } from "@/lib/constants";
import type { LayoutSettings, Page } from "@/lib/types";

interface PreviewPaneProps {
  pages: Page[];
  settings: LayoutSettings;
}

function getPaperRatio(settings: LayoutSettings): number {
  const size = PAPER_SIZE_MM[settings.paperSize];
  const width = settings.orientation === "portrait" ? size.width : size.height;
  const height = settings.orientation === "portrait" ? size.height : size.width;
  return width / height;
}

export function PreviewPane({ pages, settings }: PreviewPaneProps) {
  const sheets = buildSheetLayouts(pages, settings);
  const ratio = getPaperRatio(settings);
  const paperPt = getPaperPt(settings);

  return (
    <section className="min-h-[70vh] flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">实时排版预览</h2>
        <span className="text-sm text-slate-500">
          {paperPt.width.toFixed(0)} × {paperPt.height.toFixed(0)} pt
        </span>
      </div>

      {!pages.length ? (
        <div className="flex h-[60vh] items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-500">
          上传文件后显示拼版预览
        </div>
      ) : (
        <div className="space-y-6">
          {sheets.map((sheet) => (
            <motion.div
              key={sheet.sheetIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-slate-100 p-3"
            >
              <div className="mb-2 text-sm font-medium text-slate-600">Sheet #{sheet.sheetIndex + 1}</div>
              <div
                className="mx-auto w-full max-w-[760px] rounded bg-white p-3 shadow-inner"
                style={{ aspectRatio: `${ratio}` }}
              >
                <div
                  className="grid h-full w-full"
                  style={{
                    gridTemplateRows: `repeat(${settings.rows}, minmax(0, 1fr))`,
                    gridTemplateColumns: `repeat(${settings.columns}, minmax(0, 1fr))`,
                    gap: `${settings.gapMm * 1.2}px`
                  }}
                >
                  {sheet.slots.map((item, idx) => (
                    <div key={idx} className="overflow-hidden rounded border border-slate-200 bg-slate-50">
                      {item ? (
                        // 不修改内容，仅展示每个不可变页面截图
                        <img src={item.page.image} alt={item.page.id} className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-300">Empty</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
