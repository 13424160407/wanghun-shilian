# 简单的 PowerShell HTTP 服务器
$port = 5500
$root = $PSScriptRoot

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript"
    ".css"  = "text/css"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".mp3"  = "audio/mpeg"
    ".json" = "application/json"
    ".ico"  = "image/x-icon"
    ".svg"  = "image/svg+xml"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()

Write-Host ""
Write-Host "========================================"
Write-Host "  亡魂试炼 - 游戏服务器已启动"
Write-Host "========================================"
Write-Host ""
Write-Host "  请用浏览器打开:"
Write-Host "  http://localhost:$port"
Write-Host "  http://127.0.0.1:$port"
Write-Host ""
Write-Host "  按 Ctrl+C 停止服务器"
Write-Host "========================================"
Write-Host ""

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    
    $urlPath = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($urlPath -eq "/") { $urlPath = "/index.html" }
    
    $filePath = Join-Path $root $urlPath.TrimStart("/").Replace("/", "\")
    
    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $ct = if ($mime[$ext]) { $mime[$ext] } else { "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.ContentType = $ct
        $res.ContentLength64 = $bytes.Length
        $res.Headers.Add("Access-Control-Allow-Origin", "*")
        $res.Headers.Add("Cache-Control", "no-cache")
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        Write-Host ("  [200] " + $urlPath)
    } else {
        $res.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("Not Found: " + $urlPath)
        $res.OutputStream.Write($msg, 0, $msg.Length)
        Write-Host ("  [404] " + $urlPath)
    }
    $res.OutputStream.Close()
}
