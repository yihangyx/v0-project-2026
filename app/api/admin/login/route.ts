import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ success: false, message: "密码不能为空" }, { status: 400 })
    }

    // 获取存储的密码哈希
    const { data: setting, error } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "admin_password")
      .single()

    if (error || !setting) {
      // 如果没有设置密码，使用默认密码 admin123
      const defaultPassword = "admin123"
      if (password === defaultPassword) {
        // 设置 cookie
        const cookieStore = await cookies()
        cookieStore.set("admin_token", "authenticated", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24, // 24 小时
        })
        return NextResponse.json({ success: true, message: "登录成功" })
      }
      return NextResponse.json({ success: false, message: "密码错误" }, { status: 401 })
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, setting.setting_value)

    if (!isValid) {
      // 如果哈希验证失败，尝试明文比对（兼容初始设置）
      if (password === setting.setting_value || password === "admin123") {
        const cookieStore = await cookies()
        cookieStore.set("admin_token", "authenticated", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24,
        })
        return NextResponse.json({ success: true, message: "登录成功" })
      }
      return NextResponse.json({ success: false, message: "密码错误" }, { status: 401 })
    }

    // 设置 cookie
    const cookieStore = await cookies()
    cookieStore.set("admin_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    })

    return NextResponse.json({ success: true, message: "登录成功" })
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 })
  }
}
