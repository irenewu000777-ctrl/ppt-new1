"use client";

import { useEffect, useMemo, useState } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { PreviewPane } from "@/components/PreviewPane";
import { exportImposedPdf } from "@/lib/exportPdf";
import { buildPagePipeline } from "@/lib/pipeline";
import type { LayoutSettings, PagePipelineResult } from "@/lib/types";

const initialSettings: LayoutSettings = {
  rows: 2,
  columns: 2,
  gapMm: 4,
  paperSize: "A4",
  orientation: "portrait",
  pattern: "Z"
};

const ENCOURAGEMENT_LINES = [
  {
    zh: "打印了就是看过了，看过了就是学会了，学会了就是稳过了！",
    en: "Printed = Read, Read = Learned, Learned = Passed!"
  },
  {
    zh: "别看了，这页 PPT 刚才它跟我说它已经记住自己了",
    en: "Don't be nervous, this slide just told me it has already memorized itself!"
  },
  {
    zh: "复习就像掉头发，虽然痛苦，但总会长出来的（我是说知识）",
    en: "Reviewing is like losing hair, it's painful, but it'll grow back-I mean the knowledge"
  },
  {
    zh: "考的全都会，蒙的全都对！",
    en: "May everything you study be on the test, and every guess be correct!"
  },
  {
    zh: "祝：过！",
    en: "Wish: Pass!"
  },
  {
    zh: "万事胜意",
    en: "May everything go better than expected!"
  },
  {
    zh: "好运加持中...",
    en: "Good luck loading..."
  },
  {
    zh: "去战斗吧！",
    en: "Go fight!"
  },
  {
    zh: "关关难过关关过！",
    en: "Pass every challenge, one by one!"
  }
] as const;

function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // 延迟释放，避免部分浏览器在点击瞬间提前失效
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<LayoutSettings>(initialSettings);
  const [pipeline, setPipeline] = useState<PagePipelineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<{ zh: string; en: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [retryFile, setRetryFile] = useState<File | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const pages = useMemo(() => pipeline?.pages ?? [], [pipeline]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    const isPpt = lower.endsWith(".ppt") || lower.endsWith(".pptx");
    setLoading(true);
    setRetryFile(file);
    setCanRetry(false);
    setCompletionMessage(null);
    setErrorMessage(null);
    setStatusText(isPpt ? "正在生成幻灯片预览..." : "正在生成页面预览...");
    try {
      const data = await buildPagePipeline(file, {
        snapshotScale: 3,
        debugMode: false,
        onProgress: (progress) => {
          if (progress.total && progress.current) {
            setStatusText(`${progress.message}（${progress.current}/${progress.total}）`);
            return;
          }
          setStatusText(progress.message);
        }
      });
      setPipeline(data);
      setCompletionMessage(null);
    } catch (error) {
      const text = error instanceof Error ? error.message : "文件处理失败";
      setErrorMessage(text);
      setPipeline(null);
      setCanRetry(text.includes("建议先导出为 PDF 再上传"));
    } finally {
      setLoading(false);
      setStatusText(null);
    }
  };

  const handleGenerate = async () => {
    if (!pipeline) return;
    setLoading(true);
    try {
      const bytes = await exportImposedPdf(pipeline, settings);
      const safeBytes = Uint8Array.from(bytes);
      const blob = new Blob([safeBytes], { type: "application/pdf" });
      const filename = `${pipeline.sourceName.replace(/\.[^.]+$/, "")}-study-layout.pdf`;
      downloadPdf(blob, filename);
      const randomLine = ENCOURAGEMENT_LINES[Math.floor(Math.random() * ENCOURAGEMENT_LINES.length)];
      setCompletionMessage(randomLine);
      setErrorMessage(null);
    } catch (error) {
      const text = error instanceof Error ? error.message : "导出失败";
      setErrorMessage(text);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPipeline(null);
    setSettings(initialSettings);
    setStatusText(null);
    setCompletionMessage(null);
    setErrorMessage(null);
    setRetryFile(null);
    setCanRetry(false);
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans flex flex-col selection:bg-blue-100">
      <nav className="sticky top-0 z-50 flex-none bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center">
        <div className="max-w-[1600px] w-full mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-indigo-400 rounded-lg rotate-12 opacity-20"></div>
                <div className="relative w-5 h-5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-md shadow-sm flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
              </div>
              <span className="text-lg font-bold tracking-tight">PrintFlow</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 border-l border-gray-100 pl-6 uppercase tracking-widest font-medium">
              <span>本地拼版工作站</span>
              <span className="opacity-30">›</span>
              <span className="text-blue-500 font-semibold text-[10px]">LOCAL PROCESSING</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
            浏览器本地处理 · 安全隐私
          </div>
        </div>
      </nav>

      <div className="flex-grow flex flex-col p-4 md:p-5 gap-3 max-w-[1600px] w-full mx-auto">
        <div className="flex-none flex items-end justify-between px-2 mb-2">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">控制台 Console</h1>
            <p className="text-xs text-slate-400 mt-0.5">多页 PDF 灵活合并打印，节省纸张并优化阅读体验。</p>
          </div>
          <div className="text-[10px] text-slate-400 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
            PDF / PPT / PPTX (MAX 40MB)
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:h-[calc(100vh-170px)]">
          <ControlPanel
            settings={settings}
            loading={loading}
            sourceName={pipeline?.sourceName ?? null}
            statusText={statusText}
            errorMessage={errorMessage}
            onFileChange={handleFileChange}
            onSettingsChange={setSettings}
            onGenerate={handleGenerate}
            onRetry={canRetry && retryFile ? () => handleFileChange(retryFile) : undefined}
          />
          <PreviewPane pages={pages} settings={settings} onReset={handleReset} />
        </div>
      </div>

      {mounted && completionMessage ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]">
          <div
            className="w-full max-w-[620px] rounded-3xl border border-blue-200 bg-white p-6 shadow-2xl text-center"
            role="dialog"
            aria-modal="true"
            aria-label="导出完成提示"
          >
            <div className="mx-auto max-w-[46ch] max-h-[42vh] overflow-y-auto pr-1">
              <p className="text-2xl font-extrabold leading-snug tracking-tight text-slate-900 break-words">{completionMessage.zh}</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500 break-words">{completionMessage.en}</p>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-400">已完成导出并开始下载</p>
            <button
              onClick={handleReset}
              type="button"
              autoFocus
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-base font-bold text-white transition-all hover:from-blue-500 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/70 focus-visible:ring-offset-2"
            >
              <span className="block">再印一份</span>
              <span className="block text-xs font-semibold mt-0.5 opacity-90">Start New Flow</span>
            </button>
          </div>
        </div>
      ) : null}

      <footer className="flex-none h-12 px-6 flex items-center border-t border-gray-100 bg-white text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-8">
        <p>© 2026 PrintFlow Labs · Local Handouts Engine</p>
      </footer>
    </main>
  );
}
