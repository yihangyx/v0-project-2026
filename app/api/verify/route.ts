import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// 卡密验证 API
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { key_code, machine_code } = body

    if (!key_code) {
      return NextResponse.json({ success: false, message: "卡密不能为空" }, { status: 400 })
    }

    // 获取客户端 IP
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown"

    // 查询卡密
    const { data: license, error } = await supabase
      .from("license_keys")
      .select("*")
      .eq("key_code", key_code)
      .single()

    if (error || !license) {
      return NextResponse.json({ success: false, message: "卡密不存在" }, { status: 404 })
    }

    // 检查是否被禁用
    if (license.status === "banned") {
      return NextResponse.json({
        success: false,
        message: `卡密已被禁用: ${license.banned_reason || "违规使用"}`,
      }, { status: 403 })
    }

    // 检查是否已过期
    if (license.status === "expired" || (license.expires_at && new Date(license.expires_at) < new Date())) {
      // 更新状态为过期
      if (license.status !== "expired") {
        await supabase
          .from("license_keys")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", license.id)
      }
      return NextResponse.json({ success: false, message: "卡密已过期" }, { status: 403 })
    }

    // 如果是未使用状态，进行首次激活
    if (license.status === "unused") {
      const activatedAt = new Date()
      const expiresAt = new Date(activatedAt.getTime() + license.duration_days * 24 * 60 * 60 * 1000)

      const { error: updateError } = await supabase
        .from("license_keys")
        .update({
          status: "active",
          activated_at: activatedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          activation_ip: ip,
          machine_code: machine_code || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", license.id)

      if (updateError) {
        return NextResponse.json({ success: false, message: "激活失败" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "卡密激活成功",
        data: {
          activated_at: activatedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          duration_days: license.duration_days,
        },
      })
    }

    // 已激活状态，验证 IP 和机器码
    if (license.status === "active") {
      // 检查 IP 和机器码是否匹配
      const ipMismatch = license.activation_ip && license.activation_ip !== ip
      const machineMismatch = license.machine_code && machine_code && license.machine_code !== machine_code

      if (ipMismatch || machineMismatch) {
        // 自动禁用卡密
        const reason = ipMismatch ? "IP 地址不匹配" : "机器码不匹配"
        await supabase
          .from("license_keys")
          .update({
            status: "banned",
            banned_reason: `检测到异常: ${reason}，原IP: ${license.activation_ip}，新IP: ${ip}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", license.id)

        return NextResponse.json({
          success: false,
          message: `卡密已被自动禁用: ${reason}`,
        }, { status: 403 })
      }

      // 计算剩余时间
      const expiresAt = new Date(license.expires_at)
      const now = new Date()
      const remainingMs = expiresAt.getTime() - now.getTime()
      const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000))

      return NextResponse.json({
        success: true,
        message: "验证成功",
        data: {
          activated_at: license.activated_at,
          expires_at: license.expires_at,
          remaining_days: remainingDays > 0 ? remainingDays : 0,
        },
      })
    }

    return NextResponse.json({ success: false, message: "卡密状态异常" }, { status: 400 })
  } catch {
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 })
  }
}
