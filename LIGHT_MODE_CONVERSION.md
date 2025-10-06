# Light Mode Conversion Guide

## Color Mapping: Dark → Light

### Backgrounds
- `bg-slate-900` → `bg-white` or `bg-gray-50`
- `bg-slate-800` → `bg-gray-100`
- `bg-slate-700` → `bg-gray-200`
- `bg-slate-600` → `bg-gray-300`

### Text Colors
- `text-slate-100` → `text-gray-900`
- `text-slate-200` → `text-gray-800`
- `text-slate-300` → `text-gray-700`
- `text-slate-400` → `text-gray-600`
- `text-slate-500` → `text-gray-500`

### Borders
- `border-slate-700` → `border-gray-300`
- `border-slate-600` → `border-gray-400`
- `border-slate-500` → `border-gray-500`

### Hover States
- `hover:bg-slate-800` → `hover:bg-gray-100`
- `hover:bg-slate-700` → `hover:bg-gray-200`
- `hover:text-slate-200` → `hover:text-gray-900`

### Input Fields
- `bg-slate-700 border-slate-600 text-white` → `bg-white border-gray-300 text-gray-900`
- `placeholder-slate-400` → `placeholder-gray-400`

### Cards & Containers
- `bg-slate-800/50` → `bg-white shadow-sm`
- `bg-slate-800/30` → `bg-gray-50`

### Focus States  
- `focus:ring-offset-slate-900` → `focus:ring-offset-white`
- `focus:border-brand-primary` → `focus:border-brand-primary` (keep)

### Special Elements
- Gradient backgrounds: Adjust to work with light theme
- Shadows: Add `shadow-sm` or `shadow-md` where needed
- Brand colors: Keep purple/cyan accent colors

## Implementation Steps

1. Update App.tsx main container
2. Update Header component
3. Update MainLayout
4. Update all workspace components
5. Update UI components (Button, Card, Input, etc.)
6. Update modals and overlays
7. Test all views and interactions

## Testing Checklist

- [ ] Header and navigation
- [ ] Writing Studio editor
- [ ] All tabs (Research, Visual, Material, etc.)
- [ ] Modals and dialogs
- [ ] Buttons and inputs
- [ ] Cards and containers
- [ ] Hover and focus states
- [ ] Readability in all sections
