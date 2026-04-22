import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { tmpdir } from "os";
import path from "path";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";

export const runtime = "nodejs";

async function runLibreOfficeConvert(inputPath: string, outputDir: string): Promise<void> {
  const command = process.platform === "win32" ? "soffice.exe" : "soffice";
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      outputDir,
      inputPath
    ]);

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `LibreOffice 转换失败，退出码 ${code}`));
    });
  });
}

async function tryRemoteConvert(file: File): Promise<Uint8Array | null> {
  const apiUrl = process.env.CONVERT_API_URL;
  if (!apiUrl) return null;

  const form = new FormData();
  form.append("file", file);

  const headers: HeadersInit = {};
  if (process.env.CONVERT_API_KEY) {
    headers.Authorization = `Bearer ${process.env.CONVERT_API_KEY}`;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: form
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`远程转换失败：${text || response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function convertPptToPdf(file: File): Promise<Uint8Array> {
  const remoteResult = await tryRemoteConvert(file);
  if (remoteResult) return remoteResult;

  const workDir = await mkdtemp(path.join(tmpdir(), "ppt-convert-"));
  try {
    const ext = file.name.toLowerCase().endsWith(".pptx") ? ".pptx" : ".ppt";
    const base = randomUUID();
    const inputPath = path.join(workDir, `${base}${ext}`);
    const outputPath = path.join(workDir, `${base}.pdf`);

    await writeFile(inputPath, new Uint8Array(await file.arrayBuffer()));
    await runLibreOfficeConvert(inputPath, workDir);
    return new Uint8Array(await readFile(outputPath));
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return new NextResponse("未收到文件", { status: 400 });
    }

    const lower = file.name.toLowerCase();
    if (lower.endsWith(".pdf")) {
      return new NextResponse(await file.arrayBuffer(), {
        status: 200,
        headers: { "Content-Type": "application/pdf" }
      });
    }

    if (!lower.endsWith(".ppt") && !lower.endsWith(".pptx")) {
      return new NextResponse("仅支持 PDF / PPT / PPTX", { status: 400 });
    }

    const pdfBytes = await convertPptToPdf(file);
    const body = new Blob([Uint8Array.from(pdfBytes)], { type: "application/pdf" });
    return new NextResponse(body, {
      status: 200,
      headers: { "Content-Type": "application/pdf" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PPT/PPTX 转换失败";
    return new NextResponse(
      `${message}。请安装 LibreOffice（确保 soffice 可执行命令可用），或配置 CONVERT_API_URL。`,
      { status: 500 }
    );
  }
}
