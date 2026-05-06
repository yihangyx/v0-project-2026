import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// 获取所有公告
export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value

    if (!adminToken || adminToken !== "authenticated") {
      return NextResponse.json({ success: false, message: "未授权访问" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, message: "获取公告列表失败" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 })
  }
}

// 创建公告
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value

    if (!adminToken || adminToken !== "authenticated") {
      return NextResponse.json({ success: false, message: "未授权访问" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json({ success: false, message: "标题和内容不能为空" }, { status: 400 })
    }

    const { error } = await supabase.from("announcements").insert({
      title,
      content,
      is_active: true,
    })

    if (error) {
      return NextResponse.json({ success: false, message: "创建公告失败" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "公告创建成功" })
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 })
  }
}

// 更新公告
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value

    if (!adminToken || adminToken !== "authenticated") {
      return NextResponse.json({ success: false, message: "未授权访问" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { id, title, content, is_active } = body

    if (!id) {
      return NextResponse.json({ success: false, message: "公告ID不能为空" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (is_active !== undefined) updateData.is_active = is_active

    const { error } = await supabase.from("announcements").update(updateData).eq("id", id)

    if (error) {
      return NextResponse.json({ success: false, message: "更新公告失败" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "公告更新成功" })
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 })
  }
}

// 删除公告
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value

    if (!adminToken || adminToken !== "authenticated") {
      return NextResponse.json({ success: false, message: "未授权访问" }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, message: "公告ID不能为空" }, { status: 400 })
    }

    const { error } = await supabase.from("announcements").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ success: false, message: "删除公告失败" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "公告删除成功" })
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 })
  }
}
