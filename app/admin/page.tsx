"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { KeyRound, Megaphone, Settings, LogOut, Plus, Ban, CheckCircle, Trash2, Eye, EyeOff, Copy, Download, FileCode } from "lucide-react"

interface LicenseKey {
  id: string
  key_code: string
  status: "unused" | "active" | "expired" | "banned"
  duration_days: number
  activated_at: string | null
  expires_at: string | null
  activation_ip: string | null
  machine_code: string | null
  banned_reason: string | null
  created_at: string
}

interface Announcement {
  id: string
  title: string
  content: string
  is_active: boolean
  created_at: string
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loading, setLoading] = useState(false)

  // Keys state
  const [keys, setKeys] = useState<LicenseKey[]>([])
  const [generateCount, setGenerateCount] = useState(1)
  const [generateDays, setGenerateDays] = useState(30)
  const [generatePrefix, setGeneratePrefix] = useState("")
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([])

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")

  // Settings state
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Dialog state
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    const res = await fetch("/api/admin/keys", { credentials: "include" })
    const data = await res.json()
    if (data.success) {
      setKeys(data.data)
    }
  }, [])

  const fetchAnnouncements = useCallback(async () => {
    const res = await fetch("/api/admin/announcements", { credentials: "include" })
    const data = await res.json()
    if (data.success) {
      setAnnouncements(data.data)
    }
  }, [])

  useEffect(() => {
    // 检查登录状态
    const checkAuth = async () => {
      const res = await fetch("/api/admin/keys", { credentials: "include" })
      if (res.ok) {
        setIsLoggedIn(true)
        fetchKeys()
        fetchAnnouncements()
      }
    }
    checkAuth()
  }, [fetchKeys, fetchAnnouncements])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoginError("")

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    })

    const data = await res.json()
    setLoading(false)

    if (data.success) {
      setIsLoggedIn(true)
      setPassword("")
      fetchKeys()
      fetchAnnouncements()
    } else {
      setLoginError(data.message)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" })
    setIsLoggedIn(false)
    setKeys([])
    setAnnouncements([])
  }

  const handleGenerateKeys = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          count: generateCount,
          duration_days: generateDays,
          prefix: generatePrefix,
        }),
      })

      const data = await res.json()
      setLoading(false)

      if (data.success) {
        setGeneratedKeys(data.data)
        fetchKeys()
      } else {
        alert(data.message || "生成失败")
      }
    } catch (error) {
      setLoading(false)
      alert("生成卡密失败，请重试")
    }
  }

  const handleKeyAction = async (id: string, action: "ban" | "unban" | "delete", reason?: string) => {
    const res = await fetch("/api/admin/keys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, action, reason }),
    })

    if ((await res.json()).success) {
      fetchKeys()
      setBanDialogOpen(false)
      setBanReason("")
      setSelectedKeyId(null)
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!newTitle || !newContent) return

    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: newTitle, content: newContent }),
    })

    if ((await res.json()).success) {
      setNewTitle("")
      setNewContent("")
      fetchAnnouncements()
    }
  }

  const handleToggleAnnouncement = async (id: string, is_active: boolean) => {
    await fetch("/api/admin/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, is_active: !is_active }),
    })
    fetchAnnouncements()
  }

  const handleDeleteAnnouncement = async (id: string) => {
    await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE", credentials: "include" })
    fetchAnnouncements()
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("两次输入的密码不一致")
      return
    }
    if (newPassword.length < 6) {
      alert("密码长度至少为6位")
      return
    }

    const res = await fetch("/api/admin/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ new_password: newPassword }),
    })

    const data = await res.json()
    if (data.success) {
      alert("密码修改成功")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      alert(data.message)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportKeys = () => {
    const text = generatedKeys.join("\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `keys_${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      unused: { variant: "secondary", label: "未使用" },
      active: { variant: "default", label: "已激活" },
      expired: { variant: "outline", label: "已过期" },
      banned: { variant: "destructive", label: "已禁用" },
    }
    const { variant, label } = variants[status] || { variant: "secondary" as const, label: status }
    return <Badge variant={variant}>{label}</Badge>
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleString("zh-CN")
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">管理后台</CardTitle>
            <CardDescription>请输入管理员密码登录</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {loginError && <p className="text-sm text-destructive">{loginError}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "登录中..." : "登录"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                默认密码: admin123
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">卡密管理系统</h1>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="keys" className="gap-2">
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">卡密管理</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">公告管理</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">系统设置</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <FileCode className="h-4 w-4" />
              <span className="hidden sm:inline">API 文档</span>
            </TabsTrigger>
          </TabsList>

          {/* 卡密管理 */}
          <TabsContent value="keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>生成卡密</CardTitle>
                <CardDescription>批量生成新的卡密</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>生成数量</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={generateCount}
                      onChange={(e) => setGenerateCount(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>有效期（天）</Label>
                    <Input
                      type="number"
                      min={1}
                      max={3650}
                      value={generateDays}
                      onChange={(e) => setGenerateDays(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>前缀（可选）</Label>
                    <Input
                      value={generatePrefix}
                      onChange={(e) => setGeneratePrefix(e.target.value)}
                      placeholder="如: VIP"
                    />
                  </div>
                </div>
                <Button onClick={handleGenerateKeys} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "生成中..." : "生成卡密"}
                </Button>

                {generatedKeys.length > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">新生成的卡密：</span>
                      <Button variant="outline" size="sm" onClick={exportKeys}>
                        <Download className="h-4 w-4 mr-2" />
                        导出
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {generatedKeys.map((key, i) => (
                        <div key={i} className="flex items-center justify-between text-sm font-mono bg-background p-2 rounded">
                          <span>{key}</span>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(key)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>卡密列表</CardTitle>
                <CardDescription>共 {keys.length} 个卡密</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>卡密</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>有效期</TableHead>
                        <TableHead className="hidden md:table-cell">激活时间</TableHead>
                        <TableHead className="hidden md:table-cell">到期时间</TableHead>
                        <TableHead className="hidden lg:table-cell">激活IP</TableHead>
                        <TableHead className="hidden xl:table-cell">机器码</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-mono text-xs max-w-[150px] truncate">
                            {key.key_code}
                          </TableCell>
                          <TableCell>{getStatusBadge(key.status)}</TableCell>
                          <TableCell>{key.duration_days}天</TableCell>
                          <TableCell className="hidden md:table-cell text-xs">
                            {formatDate(key.activated_at)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs">
                            {formatDate(key.expires_at)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs">
                            {key.activation_ip || "-"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-xs max-w-[100px] truncate">
                            {key.machine_code || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(key.key_code)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {key.status === "banned" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleKeyAction(key.id, "unban")}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Dialog open={banDialogOpen && selectedKeyId === key.id} onOpenChange={(open) => {
                                  setBanDialogOpen(open)
                                  if (!open) {
                                    setSelectedKeyId(null)
                                    setBanReason("")
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedKeyId(key.id)}
                                    >
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>禁用卡密</DialogTitle>
                                      <DialogDescription>
                                        请输入禁用原因
                                      </DialogDescription>
                                    </DialogHeader>
                                    <Input
                                      value={banReason}
                                      onChange={(e) => setBanReason(e.target.value)}
                                      placeholder="禁用原因..."
                                    />
                                    <DialogFooter>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleKeyAction(key.id, "ban", banReason)}
                                      >
                                        确认禁用
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleKeyAction(key.id, "delete")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 公告管理 */}
          <TabsContent value="announcements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>发布公告</CardTitle>
                <CardDescription>创建新的系统公告</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>标题</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="公告标题"
                  />
                </div>
                <div className="space-y-2">
                  <Label>内容</Label>
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="公告内容"
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreateAnnouncement}>
                  <Plus className="h-4 w-4 mr-2" />
                  发布公告
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>公告列表</CardTitle>
                <CardDescription>共 {announcements.length} 条公告</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{ann.title}</h3>
                            <Badge variant={ann.is_active ? "default" : "secondary"}>
                              {ann.is_active ? "已发布" : "已隐藏"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{ann.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(ann.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAnnouncement(ann.id, ann.is_active)}
                          >
                            {ann.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">暂无公告</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 系统设置 */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>修改密码</CardTitle>
                <CardDescription>修改管理员登录密码</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>新密码</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入新密码"
                  />
                </div>
                <div className="space-y-2">
                  <Label>确认密码</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
                  />
                </div>
                <Button onClick={handleChangePassword}>
                  保存修改
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API 接口说明</CardTitle>
                <CardDescription>供外部脚本调用的接口</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">1. 公告接口</h4>
                  <code className="block bg-muted p-2 rounded text-sm">
                    GET /api/announcement
                  </code>
                  <p className="text-sm text-muted-foreground">获取所有已发布的公告</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">2. 卡密验证接口</h4>
                  <code className="block bg-muted p-2 rounded text-sm">
                    POST /api/verify
                  </code>
                  <p className="text-sm text-muted-foreground">
                    请��体: {"{"}&quot;key_code&quot;: &quot;卡密&quot;, &quot;machine_code&quot;: &quot;机器码&quot;{"}"}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">3. 生成卡密接口</h4>
                  <code className="block bg-muted p-2 rounded text-sm">
                    POST /api/generate
                  </code>
                  <p className="text-sm text-muted-foreground">
                    需要管理员登录，请求体: {"{"}&quot;count&quot;: 数量, &quot;duration_days&quot;: 天数, &quot;prefix&quot;: &quot;前缀&quot;{"}"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API 文档 */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API 接口文档</CardTitle>
                <CardDescription>供脚本调用的 API 接口说明</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 公告 API */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-primary">1. 公告 API</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm font-mono">/api/announcement</code>
                    </div>
                    <p className="text-sm text-muted-foreground">获取当前活跃的公告列表</p>
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">响应示例：</p>
                      <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "announcements": [
    {
      "id": "uuid",
      "title": "公告标题",
      "content": "公告内容",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* 卡密验证 API */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-primary">2. 卡密验证 API</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge>POST</Badge>
                      <code className="text-sm font-mono">/api/verify</code>
                    </div>
                    <p className="text-sm text-muted-foreground">验证卡密是否有效，自动检测 IP 和机器码</p>
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">请求参数：</p>
                      <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`{
  "key_code": "卡密代码",
  "machine_code": "机器码（可选，首次激活后必须一致）"
}`}
                      </pre>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">成功响应：</p>
                      <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "message": "验证成功",
  "data": {
    "status": "active",
    "expires_at": "2024-02-01T00:00:00Z",
    "remaining_days": 30
  }
}`}
                      </pre>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">错误响应：</p>
                      <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`{
  "success": false,
  "error": "卡密已被禁用",
  "code": "KEY_BANNED"
}`}
                      </pre>
                    </div>
                    <div className="mt-3 p-3 bg-destructive/10 rounded">
                      <p className="text-sm text-destructive font-medium">安全机制：</p>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                        <li>• 首次激活时记录 IP 和机器码</li>
                        <li>• 后续验证时自动比对，不匹配则自动禁用</li>
                        <li>• 过期卡密会返回 KEY_EXPIRED 错误</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 生成卡密 API */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-primary">3. 生成卡密 API</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge>POST</Badge>
                      <code className="text-sm font-mono">/api/generate</code>
                    </div>
                    <p className="text-sm text-muted-foreground">生成新的卡密（需要管理员登录）</p>
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">请求参数：</p>
                      <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`{
  "count": 10,
  "duration_days": 30,
  "prefix": "VIP"
}`}
                      </pre>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">响应示例：</p>
                      <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "keys": [
    "VIP-XXXX-XXXX-XXXX",
    "VIP-YYYY-YYYY-YYYY"
  ]
}`}
                      </pre>
                    </div>
                    <div className="mt-3 p-3 bg-yellow-500/10 rounded">
                      <p className="text-sm text-yellow-600 font-medium">注意：</p>
                      <p className="text-xs text-muted-foreground mt-1">此接口需要管理员登录后才能调用</p>
                    </div>
                  </div>
                </div>

                {/* 错误码说明 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-primary">4. 错误码说明</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>错误码</TableHead>
                          <TableHead>说明</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell><code className="text-xs">KEY_NOT_FOUND</code></TableCell>
                          <TableCell className="text-sm">卡密不存在</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code className="text-xs">KEY_BANNED</code></TableCell>
                          <TableCell className="text-sm">卡密已被禁用</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code className="text-xs">KEY_EXPIRED</code></TableCell>
                          <TableCell className="text-sm">卡密已过期</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code className="text-xs">MACHINE_MISMATCH</code></TableCell>
                          <TableCell className="text-sm">机器码不匹配（已自动禁用）</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code className="text-xs">IP_MISMATCH</code></TableCell>
                          <TableCell className="text-sm">IP 不匹配（已自动禁用）</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
