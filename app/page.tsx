"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KeyRound, Megaphone, CheckCircle, XCircle, Clock, Shield } from "lucide-react"
import Link from "next/link"

interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
}

interface VerifyResult {
  success: boolean
  message: string
  data?: {
    activated_at?: string
    expires_at?: string
    remaining_days?: number
    duration_days?: number
  }
}

export default function HomePage() {
  const [keyCode, setKeyCode] = useState("")
  const [machineCode, setMachineCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    fetchAnnouncements()
    // 生成一个模拟的机器码（实际使用时应该从客户端获取真实机器码）
    const mockMachineCode = `MC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    setMachineCode(mockMachineCode)
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcement")
      const data = await res.json()
      if (data.success) {
        setAnnouncements(data.data)
      }
    } catch {
      console.error("获取公告失败")
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyCode.trim()) {
      setResult({ success: false, message: "请输入卡密" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key_code: keyCode.trim(), machine_code: machineCode }),
      })

      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ success: false, message: "验证请求失败，请稍后重试" })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("zh-CN")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">卡密验证系统</h1>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              管理后台
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* 卡密验证 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  卡密验证
                </CardTitle>
                <CardDescription>
                  输入您的卡密进行验证或激活
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">卡密</label>
                    <Input
                      value={keyCode}
                      onChange={(e) => setKeyCode(e.target.value)}
                      placeholder="请输入卡密 (如: XXXX-XXXX-XXXX-XXXX)"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">机器码</label>
                    <Input
                      value={machineCode}
                      onChange={(e) => setMachineCode(e.target.value)}
                      placeholder="机器码"
                      className="font-mono text-sm"
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground">
                      机器码自动获取，用于防止卡密共享
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "验证中..." : "验证卡密"}
                  </Button>
                </form>

                {result && (
                  <div className={`mt-4 p-4 rounded-lg ${result.success ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"}`}>
                    <div className="flex items-start gap-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-2 flex-1">
                        <p className={`font-medium ${result.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
                          {result.message}
                        </p>
                        {result.success && result.data && (
                          <div className="space-y-1 text-sm">
                            {result.data.activated_at && (
                              <p className="text-muted-foreground">
                                激活时间: {formatDate(result.data.activated_at)}
                              </p>
                            )}
                            {result.data.expires_at && (
                              <p className="text-muted-foreground">
                                到期时间: {formatDate(result.data.expires_at)}
                              </p>
                            )}
                            {result.data.remaining_days !== undefined && (
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-4 w-4" />
                                <Badge variant={result.data.remaining_days > 7 ? "default" : "destructive"}>
                                  剩余 {result.data.remaining_days} 天
                                </Badge>
                              </div>
                            )}
                            {result.data.duration_days !== undefined && (
                              <p className="text-muted-foreground">
                                有效期: {result.data.duration_days} 天
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* API 信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API 接口</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">公告接口</p>
                  <code className="text-xs">GET /api/announcement</code>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">验证接口</p>
                  <code className="text-xs">POST /api/verify</code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Body: {"{"}&quot;key_code&quot;: &quot;卡密&quot;, &quot;machine_code&quot;: &quot;机器码&quot;{"}"}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">生成接口</p>
                  <code className="text-xs">POST /api/generate</code>
                  <p className="text-xs text-muted-foreground mt-1">
                    需要管理员权限
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 公告列表 */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  系统公告
                </CardTitle>
                <CardDescription>
                  最新消息和更新通知
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.length > 0 ? (
                    announcements.map((ann) => (
                      <div key={ann.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium">{ann.title}</h3>
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {new Date(ann.created_at).toLocaleDateString("zh-CN")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                          {ann.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>暂无公告</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>卡密验证系统 - 安全可靠的授权管理方案</p>
        </div>
      </footer>
    </div>
  )
}
