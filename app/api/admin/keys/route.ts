import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// 获取所有卡密
export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value

    if (!adminToken || adminToken !== "authenticated") {
      return NextResponse.json({ success: false, message: "未授权访问" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("license_keys")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, message: "获取卡密列表失败" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 })
  }
}

// 更新卡密状态（禁用/解禁）
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value

    if (!adminToken || adminToken !== "authenticated") {
      return NextResponse.json({ success: false, message: "未授权访问" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { id, action, reason } = body

    if (!id || !action) {
      return NextResponse.json({ success: false, message: "参数错误" }, { status: 400 })
    }

    let updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (action === "ban") {
      updateData.status = "banned"
      updateData.banned_reason = reason || "管理员手动禁用"
    } else if (action === "unban") {
      // 获取当前卡密信息以决定恢复状态
      const { data: license } = await supabase
        .from("license_keys")
        .select("activated_at, expires_at")
        .eq("id", id)
        .single()

      if (license?.activated_at) {
        // 如果已激活过，检查是否过期
        if (license.expires_at && new Date(license.expires_at) < new Date()) {
          updateData.status = "expired"
        } else {
          updateData.status = "active"
        }
      } else {
        updateData.status = "unused"
      }
      updateData.banned_reason = null
    } else if (action === "delete") {
      const { error } = await supabase.from("license_keys").delete().eq("id", id)
      if (error) {
        return NextResponse.json({ success: false, message: "删除失败" }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: "删除成功" })
    }

    const { error } = await supabase.from("license_keys").update(updateData).eq("id", id)

    if (error) {
      return NextResponse.json({ success: false, message: "更新失败" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "操作成功" })
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 })
  }
}
