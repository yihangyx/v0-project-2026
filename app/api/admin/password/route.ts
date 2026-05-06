import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // 检查管理员登录状态
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value

    if (!adminToken || adminToken !== "authenticated") {
      return NextResponse.json({ success: false, message: "未授权访问" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { new_password } = body

    if (!new_password || new_password.length < 6) {
      return NextResponse.json({ success: false, message: "新密码长度至少为6位" }, { status: 400 })
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(new_password, 10)

    // 更新或插入密码
    const { error } = await supabase
      .from("admin_settings")
      .upsert({
        setting_key: "admin_password",
        setting_value: hashedPassword,
        updated_at: new Date().toISOString(),
      }, { onConflict: "setting_key" })

    if (error) {
      return NextResponse.json({ success: false, message: "密码更新失败" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "密码修改成功" })
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 })
  }
}
