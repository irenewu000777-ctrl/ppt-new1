"use client";

import { motion } from "framer-motion";
import { buildSheetLayouts, getPaperPt } from "@/lib/layout";
import { PAPER_SIZE_MM } from "@/lib/constants";
import type { LayoutSettings, Page } from "@/lib/types";

interface PreviewPaneProps {
  pages: Page[];
  settings: LayoutSettings;
  onReset: () => void;
}

function getPaperRatio(settings: LayoutSettings): number {
  const size = PAPER_SIZE_MM[settings.paperSize];
  const width = settings.orientation === "portrait" ? size.width : size.height;
  const height = settings.orientation === "portrait" ? size.height : size.width;
  return width / height;
}

export function PreviewPane({ pages, settings, onReset }: PreviewPaneProps) {
  const sheets = buildSheetLayouts(pages, settings);
  const ratio = getPaperRatio(settings);
  const paperPt = getPaperPt(settings);

  return (
    <section className="flex-grow flex flex-col bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[600px] lg:min-h-0 lg:h-full">
      <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-white">
        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-700">实时预览 Preview</span>
          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[10px] rounded font-mono uppercase tracking-tight">Live View</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors" title="全屏 Fullscreen" type="button">□</button>
          <button onClick={onReset} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors" title="重置 Reset" type="button">↺</button>
        </div>
      </div>

      <div className="flex-grow relative bg-[#F1F3F5] group p-8 overflow-auto">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_1px]"></div>
        <div className="absolute right-4 top-3 text-[10px] text-slate-400 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
          {paperPt.width.toFixed(0)} × {paperPt.height.toFixed(0)} pt
        </div>

        <div className="flex flex-col items-center gap-10">
          {!pages.length ? (
            <div className="py-24 text-center relative z-10">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm mb-6 border border-gray-100">
                <span className="text-slate-200 text-2xl">▦</span>
              </div>
              <p className="text-slate-400 text-sm font-semibold">请在左侧上传文件启动预览</p>
              <p className="text-[10px] text-slate-300 mt-2 uppercase tracking-widest font-bold">Local processing only</p>
            </div>
          ) : (
            <div className="w-full space-y-6">
              {sheets.map((sheet) => (
                <motion.div
                  key={sheet.sheetIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-[580px] mx-auto bg-white shadow-2xl border border-gray-200 p-5 transition-transform hover:scale-[1.01]"
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
                      <div key={idx} className="bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-[11px] text-slate-300 font-mono font-bold overflow-hidden">
                        {item ? (
                          <img src={item.page.image} alt={item.page.id} className="h-full w-full object-contain" />
                        ) : (
                          `PAGE ${idx + 1}`
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center mt-10">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full border border-gray-100 shadow-sm">
            <span className="text-blue-500">i</span>
            <span className="text-[11px] text-slate-400 font-medium">所有拼版过程均在您的浏览器本地完成，安全且私密。</span>
          </div>
        </div>
      </div>
    </section>
  );
}
