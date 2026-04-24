"use client";

import type { ChangeEvent } from "react";
import { MAX_PDF_FILE_SIZE_MB, PAPER_SIZE_OPTIONS } from "@/lib/constants";
import type { LayoutSettings } from "@/lib/types";

interface ControlPanelProps {
  settings: LayoutSettings;
  loading: boolean;
  sourceName: string | null;
  statusText?: string | null;
  errorMessage?: string | null;
  onFileChange: (file: File | null) => void;
  onSettingsChange: (next: LayoutSettings) => void;
  onGenerate: () => void;
  onRetry?: () => void;
}

export function ControlPanel({
  settings,
  loading,
  sourceName,
  statusText,
  errorMessage,
  onFileChange,
  onSettingsChange,
  onGenerate,
  onRetry
}: ControlPanelProps) {
  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onFileChange(file);
  };

  return (
    <aside className="w-full lg:w-[400px] lg:h-full flex-none">
      <div className="h-full bg-white rounded-[2rem] border border-gray-100 shadow-sm p-7 flex flex-col justify-between gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">上传文件 Upload</h3>
            <label className="group border-2 border-dashed border-gray-100 bg-gray-50/60 hover:border-blue-200 hover:bg-white rounded-2xl p-5 flex flex-col items-center justify-center transition-all cursor-pointer">
              <p className="text-xs font-semibold text-slate-700 truncate max-w-full px-2">
                {sourceName ?? "点击或拖拽文件"}
              </p>
              <p className="mt-1 text-xs text-slate-500">MAX {MAX_PDF_FILE_SIZE_MB}MB</p>
              {statusText ? <p className="mt-1 text-xs font-medium text-indigo-600">{statusText}</p> : null}
              <input
                type="file"
                accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">纸张配置 Paper</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-slate-700 ml-1 font-semibold">尺寸 Size</p>
                <div className="relative">
                  <select
                    value={settings.paperSize}
                    onChange={(e) => onSettingsChange({ ...settings, paperSize: e.target.value as LayoutSettings["paperSize"] })}
                    className="w-full appearance-none bg-slate-50 border-none rounded-xl pl-3 pr-8 py-2 text-xs font-semibold focus:ring-1 focus:ring-blue-100 cursor-pointer h-[44px] text-slate-700"
                  >
                    {PAPER_SIZE_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-[48%] text-[10px] font-bold text-slate-500">▾</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-700 ml-1 font-semibold">方向 Orientation</p>
                <div className="flex bg-slate-50 rounded-xl p-1 h-[52px]">
                  <button
                    onClick={() => onSettingsChange({ ...settings, orientation: "portrait" })}
                    type="button"
                    className={`flex-1 text-xs rounded-lg font-bold transition-all ${settings.orientation === "portrait" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <span className="block leading-tight">纵向</span>
                    <span className="block text-[10px] opacity-75 mt-0.5">Portrait</span>
                  </button>
                  <button
                    onClick={() => onSettingsChange({ ...settings, orientation: "landscape" })}
                    type="button"
                    className={`flex-1 text-xs rounded-lg font-bold transition-all ${settings.orientation === "landscape" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <span className="block leading-tight">横向</span>
                    <span className="block text-[10px] opacity-75 mt-0.5">Landscape</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">网格排版 Grid</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl px-3 py-2 flex justify-between items-center h-[44px]">
                <span className="text-xs text-slate-700 font-semibold">行 Rows</span>
                <div className="relative w-9">
                  <select
                    value={settings.rows}
                    onChange={(e) => onSettingsChange({ ...settings, rows: Number(e.target.value) })}
                    className="w-full appearance-none bg-transparent border-none text-right text-xs font-bold focus:ring-0 p-0 pr-3 text-slate-700"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-[48%] text-[10px] font-bold text-slate-500">▾</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl px-3 py-2 flex justify-between items-center h-[44px]">
                <span className="text-xs text-slate-700 font-semibold">列 Cols</span>
                <div className="relative w-9">
                  <select
                    value={settings.columns}
                    onChange={(e) => onSettingsChange({ ...settings, columns: Number(e.target.value) })}
                    className="w-full appearance-none bg-transparent border-none text-right text-xs font-bold focus:ring-0 p-0 pr-3 text-slate-700"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-[48%] text-[10px] font-bold text-slate-500">▾</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">排列顺序 Order Pattern</h3>
              <div className="flex bg-slate-50 rounded-xl p-1 h-[56px]">
                <button
                  onClick={() => onSettingsChange({ ...settings, pattern: "Z" })}
                  type="button"
                  className={`flex-1 text-xs rounded-lg font-bold transition-all ${settings.pattern === "Z" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <span className="block leading-tight">横向优先</span>
                  <span className="block text-[10px] opacity-75 mt-0.5">Horizontal Pattern</span>
                </button>
                <button
                  onClick={() => onSettingsChange({ ...settings, pattern: "N" })}
                  type="button"
                  className={`flex-1 text-xs rounded-lg font-bold transition-all ${settings.pattern === "N" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <span className="block leading-tight">纵向优先</span>
                  <span className="block text-[10px] opacity-75 mt-0.5">Vertical Pattern</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl px-3 py-2 flex justify-between items-center h-[44px]">
              <span className="text-xs text-slate-700 font-semibold">间距 Spacing (mm)</span>
              <input
                type="number"
                min={0}
                max={20}
                value={settings.gapMm}
                onChange={(e) => onSettingsChange({ ...settings, gapMm: Number(e.target.value) })}
                className="bg-transparent border-none text-right w-12 text-xs font-bold focus:ring-0 p-0 text-slate-700"
              />
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-gray-100 space-y-4">
          <button
            onClick={onGenerate}
            disabled={loading || !sourceName}
            className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "处理中..." : "生成 PDF / Generate PDF"}
          </button>
          {onRetry ? (
            <button
              onClick={onRetry}
              disabled={loading}
              className="w-full py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl font-semibold text-[12px] transition-all disabled:cursor-not-allowed disabled:opacity-60"
            >
              重试 Retry
            </button>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
