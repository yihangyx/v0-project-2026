import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"


function generateKeyCode(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  // 格式化为 XXXX-XXXX-XXXX-XXXX 格式
  return result.match(/.{1,4}/g)?.join("-") || result
}

// 生成卡密 API - 需要管理员权限
export async function POST(request: NextRequest) {
  try {
    // 检查管理员登录状态
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value
    
    console.log("[v0] Generate API - admin_token:", adminToken)

    if (!adminToken || adminToken !== "authenticated") {
      return NextResponse.json({ success: false, message: "未授权访问" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { count = 1, duration_days = 30, prefix = "" } = body

    if (count < 1 || count > 100) {
      return NextResponse.json({ success: false, message: "生成数量必须在 1-100 之间" }, { status: 400 })
    }

    if (duration_days < 1 || duration_days > 3650) {
      return NextResponse.json({ success: false, message: "有效期必须在 1-3650 天之间" }, { status: 400 })
    }

    const generatedKeys: string[] = []

    for (let i = 0; i < count; i++) {
      const keyCode = prefix ? `${prefix}-${generateKeyCode(16)}` : generateKeyCode(32)
      
      const { error } = await supabase.from("license_keys").insert({
        key_code: keyCode,
        duration_days: duration_days,
        status: "unused",
      })

      if (!error) {
        generatedKeys.push(keyCode)
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功生成 ${generatedKeys.length} 个卡密`,
      data: generatedKeys,
    })
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 })
  }
}
