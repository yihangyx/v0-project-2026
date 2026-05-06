import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileCode, Shield } from "lucide-react"

export default function DocsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com"

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">API 文档</h1>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              管理后台
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* 公告 API */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">GET</Badge>
                <CardTitle className="text-lg font-mono">/api/announcement</CardTitle>
              </div>
              <CardDescription>获取系统公告列表</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">请求示例</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`curl ${baseUrl}/api/announcement`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">响应示例</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": [
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
            </CardContent>
          </Card>

          {/* 验证 API */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600">POST</Badge>
                <CardTitle className="text-lg font-mono">/api/verify</CardTitle>
              </div>
              <CardDescription>验证卡密是否有效，首次验证时自动激活并绑定 IP/机器码</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">请求参数</h4>
                <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
                  <p><code className="text-primary">key_code</code> (必填): 卡密</p>
                  <p><code className="text-primary">machine_code</code> (必填): 机器码，用于绑定设备</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">请求示例</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`curl -X POST ${baseUrl}/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{"key_code": "XXXX-XXXX-XXXX-XXXX", "machine_code": "YOUR_MACHINE_CODE"}'`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">成功响应</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "卡密验证成功",
  "data": {
    "activated_at": "2024-01-01T00:00:00Z",
    "expires_at": "2024-01-31T00:00:00Z",
    "remaining_days": 30
  }
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">错误响应</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`// 卡密无效
{"success": false, "message": "卡密不存在"}

// 卡密已过期
{"success": false, "message": "卡密已过期"}

// 卡密被禁用
{"success": false, "message": "卡密已被禁用: [禁用原因]"}

// IP/机器码不匹配（自动禁用）
{"success": false, "message": "检测到异常: IP或机器码不匹配，卡密已被自动禁用"}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* 生成 API */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600">POST</Badge>
                <CardTitle className="text-lg font-mono">/api/generate</CardTitle>
              </div>
              <CardDescription>批量生成卡密（需要管理员权限）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">请求参数</h4>
                <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
                  <p><code className="text-primary">count</code> (可选): 生成数量，默认 1，最大 100</p>
                  <p><code className="text-primary">duration_days</code> (可选): 有效天数，默认 30</p>
                  <p><code className="text-primary">prefix</code> (可选): 卡密前缀</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">请求头</h4>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p><code className="text-primary">Cookie</code>: 需要有效的管理员登录 session</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">响应示例</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "成功生成 5 个卡密",
  "data": {
    "keys": [
      "PREFIX-XXXX-XXXX-XXXX-XXXX",
      "PREFIX-YYYY-YYYY-YYYY-YYYY"
    ]
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* 安全说明 */}
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-lg">安全机制</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. 卡密首次激活时会记录 IP 地址和机器码</p>
              <p>2. 后续验证时会比对 IP 和机器码，如果不匹配将自动禁用卡密</p>
              <p>3. 被禁用的卡密需要管理员手动解禁</p>
              <p>4. 生成卡密接口需要管理员登录后才能调用</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
