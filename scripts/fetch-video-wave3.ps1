# fetch-video-wave3.ps1
#
# Third wave: animation principles, shot composition, and film-method documents.
#
# Each source is chosen for a gap the first two waves left open:
#   motion-design-skills   why motion feels right — timing, easing, weight, rhythm
#   chaojifeng-video-design  story spine, shot planning, sound-picture rhythm
#   baocut                 shot cards, transition wording, camera-move checks
#   visual-skills          storyboard and shot-list method (CC-BY-4.0)
#   vibe-manim             33 standalone Manim scenes as reference patterns
#   skills (modelstudio)   director treatment and shot prompt structure
#
# Licenses:
#   iart-ai/motion-design-skills   MIT
#   mileson/chaojifeng-video-design MIT
#   jimliu/baocut                  NOASSERTION -> docs only, verify before copying
#   smixs/visual-skills            CC-BY-4.0, attribution required
#   G-U-N/vibe-manim               MIT
#   modelstudioai/skills           Apache-2.0

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$Data = Join-Path $Root 'data\video-styles'
$Tmp  = Join-Path $env:TEMP ('vk-wave3-' + [guid]::NewGuid().ToString('N').Substring(0, 8))

New-Item -ItemType Directory -Force -Path $Tmp | Out-Null

function Clone-Sparse {
    param([string]$Repo, [string]$Name, [string[]]$Paths)
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
            if ($p -match '\\.') { $patterns += "/$p" } else { $patterns += "/$p/" }
        }
        git -C $dir sparse-checkout set --no-cone @patterns 2>&1 | Out-Null
    }
    Write-Host ' ok'
    return $dir
}

function Copy-TreeDocs {
    param([string]$From, [string]$To, [string[]]$Ext = @('.md', '.json', '.py'))
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

Write-Host '=== 1/6 motion-design-skills - MIT ==='
$d = Clone-Sparse -Repo 'iart-ai/motion-design-skills' -Name 'mds' -Paths @('skills', 'README.md')
if ($d) {
    $n = Copy-TreeDocs -From (Join-Path $d 'skills') -To (Join-Path $Data 'motion')
    $readme = Join-Path $d 'README.md'
    if (Test-Path $readme) { Copy-Item $readme (Join-Path $Data 'motion\README.md') -Force }
    Write-Host "  files: $n"
}

Write-Host '=== 2/6 chaojifeng-video-design - MIT ==='
$d = Clone-Sparse -Repo 'mileson/chaojifeng-video-design' -Name 'cjf' -Paths @('SKILL.md', 'DIRECTOR.md', 'TECHNIQUE.md', 'agents', 'references')
if ($d) {
    $target = Join-Path $Data 'director\chaojifeng'
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    foreach ($f in @('SKILL.md', 'DIRECTOR.md', 'TECHNIQUE.md', 'README.md')) {
        $p = Join-Path $d $f
        if (Test-Path $p) { Copy-Item $p (Join-Path $target $f) -Force }
    }
    $n = Copy-TreeDocs -From (Join-Path $d 'references') -To $target
    $n += Copy-TreeDocs -From (Join-Path $d 'agents') -To $target
    Write-Host "  docs: $n"
}

Write-Host '=== 3/6 visual-skills - CC-BY-4.0 ==='
$d = Clone-Sparse -Repo 'smixs/visual-skills' -Name 'vs' -Paths @('video', 'README.md', 'LICENSE')
if ($d) {
    $target = Join-Path $Data 'director\visual-skills'
    $n = Copy-TreeDocs -From (Join-Path $d 'video') -To $target
    foreach ($f in @('README.md', 'LICENSE')) {
        $p = Join-Path $d $f
        if (Test-Path $p) {
            New-Item -ItemType Directory -Force -Path $target | Out-Null
            Copy-Item $p (Join-Path $target $f) -Force
        }
    }
    Write-Host "  docs: $n (CC-BY-4.0, attribution recorded in NOTICE)"
}

Write-Host '=== 4/6 vibe-manim - MIT, 33 scenes ==='
$d = Clone-Sparse -Repo 'G-U-N/vibe-manim' -Name 'vmanim' -Paths @('gallery', 'skills')
if ($d) {
    $n = Copy-TreeDocs -From (Join-Path $d 'gallery') -To (Join-Path $Data 'manim')
    $n += Copy-TreeDocs -From (Join-Path $d 'skills') -To (Join-Path $Data 'manim\skills')
    Write-Host "  files: $n"
}

Write-Host '=== 5/6 modelstudioai/skills - Apache-2.0 ==='
$d = Clone-Sparse -Repo 'modelstudioai/skills' -Name 'ms' -Paths @('skills/spark-video')
if ($d) {
    $n = Copy-TreeDocs -From (Join-Path $d 'skills\spark-video') -To (Join-Path $Data 'director\spark-video')
    Write-Host "  files: $n"
}

Write-Host '=== 6/6 baocut - license unclear, docs only ==='
$d = Clone-Sparse -Repo 'jimliu/baocut' -Name 'baocut' -Paths @('LICENSE', 'skills/baocut/references/craft')
if ($d) {
    $lic = Join-Path $d 'LICENSE'
    if (Test-Path $lic) {
        $first = Get-Content $lic -TotalCount 3
        Write-Host ("  LICENSE begins: " + ($first -join ' | '))
    }
    $target = Join-Path $Data 'director\baocut'
    $n = Copy-TreeDocs -From (Join-Path $d 'skills\baocut\references\craft') -To $target
    Write-Host "  docs: $n"
}

Write-Host ''
Write-Host '=== cleanup ==='
Remove-Item $Tmp -Recurse -Force -ErrorAction SilentlyContinue
Write-Host 'done'
