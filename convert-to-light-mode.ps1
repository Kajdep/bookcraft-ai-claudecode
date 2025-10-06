# Light Mode Conversion Script
# This script converts all dark mode Tailwind classes to light mode

$files = Get-ChildItem -Path ".\components" -Recurse -Filter "*.tsx" -File

$replacements = @{
    # Backgrounds
    'bg-slate-900'      = 'bg-white'
    'bg-slate-800/70'   = 'bg-white/90'
    'bg-slate-800/50'   = 'bg-white shadow-sm'
    'bg-slate-800/40'   = 'bg-white shadow'
    'bg-slate-800/30'   = 'bg-gray-50'
    'bg-slate-800'      = 'bg-gray-100'
    'bg-slate-700'      = 'bg-white'
    'bg-slate-600'      = 'bg-gray-200'
    
    # Text Colors
    'text-slate-100'    = 'text-gray-900'
    'text-slate-200'    = 'text-gray-800'
    'text-slate-300'    = 'text-gray-700'
    'text-slate-400'    = 'text-gray-600'
    'text-slate-500'    = 'text-gray-500'
    'text-white'        = 'text-gray-900'
    
    # Borders
    'border-slate-700/50' = 'border-gray-200'
    'border-slate-700'  = 'border-gray-300'
    'border-slate-600'  = 'border-gray-300'
    'border-slate-500'  = 'border-gray-400'
    
    # Hover States
    'hover:bg-slate-800' = 'hover:bg-gray-100'
    'hover:bg-slate-700' = 'hover:bg-gray-200'
    'hover:bg-slate-600' = 'hover:bg-gray-300'
    'hover:text-slate-200' = 'hover:text-gray-900'
    'hover:text-slate-100' = 'hover:text-gray-900'
    'hover:text-white'  = 'hover:text-gray-900'
    
    # Placeholders
    'placeholder-slate-400' = 'placeholder-gray-400'
    
    # Focus states
    'focus:ring-offset-slate-900' = 'focus:ring-offset-white'
    
    # Shadows - add shadows where backgrounds were transparent
    'shadow-lg'         = 'shadow-md'
}

Write-Host "Converting $($files.Count) files to light mode..." -ForegroundColor Cyan

$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileReplacements = 0
    
    foreach ($key in $replacements.Keys) {
        $pattern = [regex]::Escape($key)
        $count = ([regex]::Matches($content, $pattern)).Count
        if ($count -gt 0) {
            $content = $content -replace $pattern, $replacements[$key]
            $fileReplacements += $count
        }
    }
    
    if ($fileReplacements -gt 0) {
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ $($file.Name): $fileReplacements replacements" -ForegroundColor Green
        $totalReplacements += $fileReplacements
    }
}

Write-Host "`nConversion complete! Total replacements: $totalReplacements" -ForegroundColor Green
Write-Host "Files modified: $($files.Count)" -ForegroundColor Cyan

# Additional manual changes needed
Write-Host "`nManual changes still needed:" -ForegroundColor Yellow
Write-Host "  1. Review shadow classes - some may need adjustment"
Write-Host "  2. Check gradient backgrounds for readability"
Write-Host "  3. Verify button styles and contrast"
Write-Host "  4. Test all modal backgrounds"
Write-Host "  5. Check input field borders and backgrounds"
