import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return new NextResponse("PPT/PPTX 已切换为纯前端快照管线，不再提供服务端转换接口。", { status: 410 });
}
