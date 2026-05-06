import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 公告 API - 获取所有激活的公告
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, content, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, message: "获取公告失败" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 })
  }
}
