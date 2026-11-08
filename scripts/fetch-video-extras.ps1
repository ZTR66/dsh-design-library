# fetch-video-extras.ps1
#
# Clone the second wave of video resources into data/video-styles/.
#
# Why git instead of the GitHub contents API: the API is limited to 60
# unauthenticated requests per hour and this needs several hundred, while a
# sparse clone fetches only the wanted folders in one request.
#
# Licensing decides what is copied:
#   video-shotcraft           Apache-2.0  cards and style specs
#   huashu-art-motion         MIT         references
#   awesome-opus-video-skills MIT         the index
#   video-skills-toolkit      MIT         skill templates
#   free-remotion-templates   MIT         template source
#   reactvideoeditor          unlicensed  DOCS ONLY
#   ali-abassi                unlicensed  DOCS ONLY

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$Data = Join-Path $Root 'data\video-styles'
$Tmp  = Join-Path $env:TEMP ('vk-extras-' + [guid]::NewGuid().ToString('N').Substring(0, 8))

New-Item -ItemType Directory -Force -Path $Tmp | Out-Null

function Clone-Sparse {
    param(
        [string]$Repo,
        [string]$Name,
        [string[]]$Paths
    )
    $dir = Join-Path $Tmp $Name
    Write-Host "  cloning $Repo ..." -NoNewline
    git clone --depth 1 --filter=blob:none --sparse "https://github.com/$Repo.git" $dir 2>&1 | Out-Null
    if (-not (Test-Path $dir)) {
        Write-Host ' FAILED'
        return $null
    }
    if ($Paths.Count -gt 0) {
        $patterns = @()
        foreach ($p in $Paths) {
            if ($p -match '\.') { $patterns += "/$p" } else { $patterns += "/$p/" }
        }
        git -C $dir sparse-checkout set --no-cone @patterns 2>&1 | Out-Null
    }
    Write-Host ' ok'
    return $dir
}

# Copy every document under $From into a single flat folder $To.
function Copy-FlatDocs {
    param([string]$From, [string]$To, [string[]]$Ext = @('.md', '.json'))
    New-Item -ItemType Directory -Force -Path $To | Out-Null
    if (-not (Test-Path $From)) { return 0 }
    $count = 0
    Get-ChildItem $From -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
        $Ext -contains $_.Extension
    } | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $To $_.Name) -Force
        $count++
    }
    return $count
}

# Copy documents under $From into $To, preserving the folder structure.
function Copy-TreeDocs {
    param([string]$From, [string]$To, [string[]]$Ext = @('.md', '.json', '.tsx', '.ts'))
    New-Item -ItemType Directory -Force -Path $To | Out-Null
    if (-not (Test-Path $From)) { return 0 }
    $count = 0
    Get-ChildItem $From -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
        $Ext -contains $_.Extension
    } | ForEach-Object {
        $rel = $_.FullName.Substring($From.Length + 1)
        $dest = Join-Path $To $rel
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
        Copy-Item $_.FullName $dest -Force
        $count++
    }
    return $count
}

Write-Host '=== 1/7 video-shotcraft - 124 shot cards ==='
$d = Clone-Sparse -Repo 'Vincentwei1021/video-shotcraft' -Name 'shotcraft' -Paths @('gallery', 'references', 'SKILL.md')
if ($d) {
    $shots = Join-Path $Data 'shots'
    New-Item -ItemType Directory -Force -Path $shots | Out-Null
    $lib = Join-Path $d 'gallery\api\library.json'
    if (Test-Path $lib) {
        Copy-Item $lib (Join-Path $shots 'library.json') -Force
        Write-Host ("  library.json: {0} KB" -f [math]::Round((Get-Item $lib).Length / 1KB))
    }
    $skillFile = Join-Path $d 'SKILL.md'
    if (Test-Path $skillFile) { Copy-Item $skillFile (Join-Path $shots 'SKILL.md') -Force }
    $n = Copy-TreeDocs -From (Join-Path $d 'references') -To (Join-Path $shots 'cards')
    Write-Host "  card sources: $n"
}

Write-Host '=== 2/7 huashu-art-motion - methodology ==='
$d = Clone-Sparse -Repo 'alchaincyf/huashu-art-motion' -Name 'artmotion' -Paths @('references', 'defaults', 'SKILL.md')
if ($d) {
    $target = Join-Path $Data 'artmotion'
    $n = Copy-FlatDocs -From (Join-Path $d 'references') -To $target
    $n += Copy-FlatDocs -From (Join-Path $d 'defaults') -To $target
    $skillFile = Join-Path $d 'SKILL.md'
    if (Test-Path $skillFile) { Copy-Item $skillFile (Join-Path $target 'SKILL.md') -Force }
    Write-Host "  docs: $n"
}

Write-Host '=== 3/7 awesome-opus-video-skills - index ==='
$d = Clone-Sparse -Repo 'ismoshushi/awesome-opus-video-skills' -Name 'awesome' -Paths @('README.md', 'skills.md')
if ($d) {
    $target = Join-Path $Data 'index'
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    foreach ($f in @('README.md', 'skills.md')) {
        $p = Join-Path $d $f
        if (Test-Path $p) { Copy-Item $p (Join-Path $target $f) -Force }
    }
    Write-Host '  index ok'
}

Write-Host '=== 4/7 video-skills-toolkit - templates ==='
$d = Clone-Sparse -Repo 'liangdabiao/video-skills-toolkit' -Name 'toolkit' -Paths @('skills')
if ($d) {
    $n = Copy-TreeDocs -From (Join-Path $d 'skills') -To (Join-Path $Data 'toolkit')
    Write-Host "  files: $n"
}

Write-Host '=== 5/7 free-remotion-templates - MIT ==='
$d = Clone-Sparse -Repo 'RenderComp/free-remotion-templates' -Name 'freerem' -Paths @('src', 'docs', 'ASSETS.md')
if ($d) {
    $target = Join-Path $Data 'remotion\free'
    $n = Copy-TreeDocs -From (Join-Path $d 'src') -To $target
    $readme = Join-Path $d 'README.md'
    if (Test-Path $readme) {
        New-Item -ItemType Directory -Force -Path $target | Out-Null
        Copy-Item $readme (Join-Path $target 'README.md') -Force
    }
    Write-Host "  files: $n"
}

Write-Host '=== 6/7 reactvideoeditor - docs only ==='
$d = Clone-Sparse -Repo 'reactvideoeditor/remotion-templates' -Name 'rve' -Paths @('README.md')
if ($d) {
    $target = Join-Path $Data 'remotion\rve'
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    $readme = Join-Path $d 'README.md'
    if (Test-Path $readme) { Copy-Item $readme (Join-Path $target 'README.md') -Force }
    Write-Host '  README only - source not copied, the repository declares no license'
}

Write-Host '=== 7/7 ali-abassi - docs only ==='
$d = Clone-Sparse -Repo 'ali-abassi/remotion-templates' -Name 'aliabassi' -Paths @('README.md', 'SKILL.md')
if ($d) {
    $target = Join-Path $Data 'remotion\aliabassi'
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    foreach ($f in @('README.md', 'SKILL.md')) {
        $p = Join-Path $d $f
        if (Test-Path $p) { Copy-Item $p (Join-Path $target $f) -Force }
    }
    Write-Host '  docs only - source not copied, the repository declares no license'
}

Write-Host ''
Write-Host '=== cleanup ==='
Remove-Item $Tmp -Recurse -Force -ErrorAction SilentlyContinue
Write-Host 'done'
