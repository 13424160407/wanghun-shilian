Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("C:\工作文件夹\dead-cells-mvp\sprites\UI\biaoge_shuzhixitong\玩家属性和经验值获取消耗.xlsx")

$strings = @()
foreach ($entry in $zip.Entries) {
  if ($entry.Name -eq "sharedStrings.xml") {
    $reader = New-Object System.IO.StreamReader($entry.Open())
    $xml = [xml]$reader.ReadToEnd()
    $reader.Close()
    foreach ($si in $xml.sst.si) {
      if ($si.t) { $strings += $si.t } else { $strings += "" }
    }
  }
}

foreach ($entry in $zip.Entries) {
  if ($entry.FullName -match 'xl/worksheets/sheet1.xml') {
    $reader = New-Object System.IO.StreamReader($entry.Open())
    $xml = [xml]$reader.ReadToEnd()
    $reader.Close()
    $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $ns.AddNamespace("s", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
    $rows = $xml.SelectNodes("//s:row", $ns)
    foreach ($row in $rows) {
      $line = ""
      $cells = $row.SelectNodes("s:c", $ns)
      foreach ($cell in $cells) {
        $t = $cell.GetAttribute("t")
        $v = $cell.SelectSingleNode("s:v", $ns)
        $val = ""
        if ($v -and $v.InnerText) {
          if ($t -eq "s") {
            $idx = [int]$v.InnerText
            if ($idx -lt $strings.Length) { $val = $strings[$idx] }
          } else { $val = $v.InnerText }
        }
        $line += $val + "`t"
      }
      Write-Host $line
    }
  }
}

$zip.Dispose()
