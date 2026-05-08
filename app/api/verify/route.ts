import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifySignature, sealedResponse } from "@/lib/crypto"
import {
  VerifyRequestSchema,
  type VerifySuccessResponse,
  type VerifyErrorResponse,
} from "@/lib/types"
import { ZodError } from "zod"

export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse & validate request body ────────────────────────────────────
    const body = await request.json()
    const parsed = VerifyRequestSchema.parse(body)
    const { key_code, fingerprint, timestamp, signature } = parsed

    // ── 2. Signature verification (replay protection) ─────────────────────
    if (timestamp && signature) {
      verifySignature(
        timestamp.toString(),
        JSON.stringify(body),
        signature
      )
    }

    // ── 3. Get client IP ────────────────────────────────────────────────────
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "unknown"

    const supabase = await createClient()

    // ── 4. Query license ────────────────────────────────────────────────────
    const { data: license, error } = await supabase
      .from("license_keys")
      .select("*")
      .eq("key_code", key_code)
      .single()

    if (error || !license) {
      const res: VerifyErrorResponse = {
        success: false,
        message: "卡密不存在",
      }
      return NextResponse.json(sealedResponse(res), {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      })
    }

    // ── 5. Check banned ─────────────────────────────────────────────────────
    if (license.status === "banned") {
      const res: VerifyErrorResponse = {
        success: false,
        message: `卡密已被禁用: ${license.banned_reason || "违规使用"}`,
      }
      return NextResponse.json(sealedResponse(res), {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      })
    }

    // ── 6. Check expired ────────────────────────────────────────────────────
    if (
      license.status === "expired" ||
      (license.expires_at && new Date(license.expires_at) < new Date())
    ) {
      if (license.status !== "expired") {
        await supabase
          .from("license_keys")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("id", license.id)
      }
      const res: VerifyErrorResponse = {
        success: false,
        message: "卡密已过期",
      }
      return NextResponse.json(sealedResponse(res), {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      })
    }

    // ── 7. First activation (status: unused) ─────────────────────────────────
    if (license.status === "unused") {
      const activatedAt = new Date()
      const expiresAt = new Date(
        activatedAt.getTime() + license.duration_days * 24 * 60 * 60 * 1000
      )

      const { error: updateError } = await supabase
        .from("license_keys")
        .update({
          status: "active",
          activated_at: activatedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          activation_ip: ip,
          machine_code: body.machine_code || fingerprint || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", license.id)

      if (updateError) {
        const res: VerifyErrorResponse = {
          success: false,
          message: "激活失败",
        }
        return NextResponse.json(sealedResponse(res), {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        })
      }

      const res: VerifySuccessResponse = {
        success: true,
        message: "卡密激活成功",
        data: {
          activated_at: activatedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          remaining_days: license.duration_days,
        },
      }
      return NextResponse.json(sealedResponse(res), {
        headers: { "Cache-Control": "no-store" },
      })
    }

    // ── 8. Active: validate IP + fingerprint ────────────────────────────────
    if (license.status === "active") {
      const ipMismatch =
        license.activation_ip && license.activation_ip !== ip

      // Fingerprint mismatch if both are provided
      const fpMismatch =
        fingerprint &&
        license.machine_code &&
        fingerprint !== license.machine_code

      if (ipMismatch || fpMismatch) {
        const reason = ipMismatch ? "IP 地址不匹配" : "设备指纹不匹配"
        await supabase
          .from("license_keys")
          .update({
            status: "banned",
            banned_reason: `检测到异常: ${reason}，原IP: ${license.activation_ip}，新IP: ${ip}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", license.id)

        const res: VerifyErrorResponse = {
          success: false,
          message: `卡密已被自动禁用: ${reason}`,
        }
        return NextResponse.json(sealedResponse(res), {
          status: 403,
          headers: { "Cache-Control": "no-store" },
        })
      }

      // Calculate remaining days
      const expiresAt = new Date(license.expires_at)
      const now = new Date()
      const remainingMs = expiresAt.getTime() - now.getTime()
      const remainingDays = Math.max(
        0,
        Math.ceil(remainingMs / (24 * 60 * 60 * 1000))
      )

      const res: VerifySuccessResponse = {
        success: true,
        message: "验证成功",
        data: {
          activated_at: license.activated_at,
          expires_at: license.expires_at,
          remaining_days: remainingDays,
        },
      }
      return NextResponse.json(sealedResponse(res), {
        headers: { "Cache-Control": "no-store" },
      })
    }

    // ── 9. Unknown status ────────────────────────────────────────────────────
    const res: VerifyErrorResponse = {
      success: false,
      message: "卡密状态异常",
    }
    return NextResponse.json(sealedResponse(res), {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    })
  } catch (err) {
    // Zod validation errors → return friendly message inside sealed envelope
    if (err instanceof ZodError) {
      const res: VerifyErrorResponse = {
        success: false,
        message: `请求格式错误: ${err.errors.map((e) => e.message).join(", ")}`,
      }
      return NextResponse.json(sealedResponse(res), { status: 400 })
    }

    // Signature errors
    if (err instanceof Error) {
      if (
        err.message === "INVALID_SIGNATURE" ||
        err.message === "INVALID_TIMESTAMP"
      ) {
        const res: VerifyErrorResponse = {
          success: false,
          message: "签名验证失败",
        }
        return NextResponse.json(sealedResponse(res), { status: 401 })
      }
    }

    return NextResponse.json(sealedResponse({
      success: false,
      message: "服务器错误",
    }), { status: 500 })
  }
}
