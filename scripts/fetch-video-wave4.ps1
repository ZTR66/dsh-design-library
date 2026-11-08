# fetch-video-wave4.ps1
#
# Fourth wave: sound, typography, data motion, transitions, and shaders.
#
# varghq/skills carries 76 skills; only the ones about making a film with code
# are taken. The rest are e-commerce ad pipelines, character generators and
# paid-API routes — out of scope for a plugin that draws frames locally, and
# copying them would bloat the library with instructions nobody can follow here.
#
# Sources:
#   varghq/skills           MIT  — sound, kinetic type, data motion, transitions
#   gokayfem/shader-skills  MIT  — GLSL / SDF / raymarching reference
#   edenfunf/reelmimic      MIT  — music-to-video, montage on a beat spine
#   first-fluke/oh-my-agent MIT  — sound design listening and loudness method

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$Data = Join-Path $Root 'data\video-styles'
$Tmp  = Join-Path $env:TEMP ('vk-wave4-' + [guid]::NewGuid().ToString('N').Substring(0, 8))

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
    param([string]$From, [string]$To, [string[]]$Ext = @('.md', '.json'))
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

# The skills worth taking from varghq/skills, grouped by what they answer.
$VarghPicks = @(
    'video-sound',            # voice, SFX, music bed, measured mix
    'kinetic-type-art',       # 17 beat-timed typography pieces
    'maps-and-data-motion',   # maps, charts, counters, audio visualizers
    'transition-craft',       # how cuts and wipes are specified
    'motion-formats',         # lyric-video and montage formats
    'title-design',           # titles and end cards
    'footage-effects',        # procedural overlays and treatments
    'edit-footage-with-code', # editing as code
    'short-form-ffmpeg-cookbook', # ffmpeg recipes
    'paper-shaders',          # paper material looks
    'threejs-animatic',       # 3D previz
    'video-script',           # script structure
    'video-moodboard',        # look development
    'caption-styles'          # subtitle styling
)

Write-Host '=== 1/4 varghq/skills - selected video skills ==='
$paths = @()
foreach ($p in $VarghPicks) { $paths += $p }
$d = Clone-Sparse -Repo 'varghq/skills' -Name 'varg' -Paths $paths
if ($d) {
    $total = 0
    foreach ($p in $VarghPicks) {
        $src = Join-Path $d $p
        if (-not (Test-Path $src)) { continue }
        $n = Copy-TreeDocs -From $src -To (Join-Path $Data "varg\$p")
        if ($n -gt 0) { Write-Host ("  {0,-28} {1} files" -f $p, $n) }
        $total += $n
    }
    Write-Host "  total: $total"
}

Write-Host '=== 2/4 shader-skills - MIT ==='
$d = Clone-Sparse -Repo 'gokayfem/shader-skills' -Name 'shader' -Paths @('skills', 'README.md')
if ($d) {
    $n = Copy-TreeDocs -From (Join-Path $d 'skills') -To (Join-Path $Data 'shader')
    $readme = Join-Path $d 'README.md'
    if (Test-Path $readme) { Copy-Item $readme (Join-Path $Data 'shader\README.md') -Force }
    Write-Host "  files: $n"
}

Write-Host '=== 3/4 reelmimic - music to video ==='
$d = Clone-Sparse -Repo 'edenfunf/reelmimic' -Name 'reelmimic' -Paths @('.claude/skills')
if ($d) {
    $n = Copy-TreeDocs -From (Join-Path $d '.claude\skills') -To (Join-Path $Data 'reelmimic')
    Write-Host "  files: $n"
}

Write-Host '=== 4/4 oh-my-agent - sound design ==='
$d = Clone-Sparse -Repo 'first-fluke/oh-my-agent' -Name 'oma' -Paths @('pi-package/skills/oma-video')
if ($d) {
    $n = Copy-TreeDocs -From (Join-Path $d 'pi-package\skills\oma-video') -To (Join-Path $Data 'sound')
    Write-Host "  files: $n"
}

Write-Host ''
Write-Host '=== cleanup ==='
Remove-Item $Tmp -Recurse -Force -ErrorAction SilentlyContinue
Write-Host 'done'
