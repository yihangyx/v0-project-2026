"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { KeyRound, Loader2, X } from "lucide-react"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showLogin, setShowLogin] = useState(false) // 控制登录弹窗显示
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (data.success) {
        router.push("/admin")
      } else {
        setError(data.error || "登录失败")
      }
    } catch {
      setError("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{ 
        backgroundImage: `url(https://s41.ax1x.com/2026/03/26/peQg4Gn.webp)`,
      }}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* 未登录时只显示一个按钮 */}
      {!showLogin ? (
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 drop-shadow-lg">卡密管理系统</h1>
          <Button 
            size="lg" 
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-6 text-lg rounded-xl"
            onClick={() => setShowLogin(true)}
          >
            点此进入管理员登录
          </Button>
        </div>
      ) : (
        // 点击后显示登录弹窗
        <div className="relative z-10 w-full max-w-md">
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
            {/* 关闭按钮 */}
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <KeyRound className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">管理员登录</CardTitle>
              <CardDescription className="text-white/70">请验证身份后进入管理后台</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">管理员密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入管理员密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-300 text-center">{error}</p>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/30"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      登录验证中...
                    </>
                  ) : (
                    "确认登录后台"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
