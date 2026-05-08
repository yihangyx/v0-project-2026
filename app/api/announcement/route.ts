import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sealedResponse } from "@/lib/crypto"
import { AnnouncementListResponseSchema, type AnnouncementListResponse } from "@/lib/types"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, content, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(sealedResponse({
        success: false,
        message: "获取公告失败",
        data: [],
      } satisfies AnnouncementListResponse), { status: 500 })
    }

    const res: AnnouncementListResponse = {
      success: true,
      data: data || [],
    }

    // Validate response shape before sealing
    AnnouncementListResponseSchema.parse(res)

    return NextResponse.json(sealedResponse(res), {
      headers: { "Cache-Control": "public, max-age=300" },
    })
  } catch (err) {
    console.error("[/api/announcement]", err)
    return NextResponse.json(sealedResponse({
      success: false,
      message: "服务器错误",
      data: [],
    } satisfies AnnouncementListResponse), { status: 500 })
  }
}
