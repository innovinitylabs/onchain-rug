# OnchainRugs Architecture Fixes

## Root Cause: Missing shadcn/ui CSS Variables

**Problem**: The site extensively uses shadcn/ui components but never defined the required semantic CSS variables, causing:
- Transparent/translucent components (`bg-card` undefined → transparent)
- Non-functional interactive elements
- Recurring issues with every new section

**Solution**: Added complete shadcn/ui CSS variable definitions to `app/globals.css`

## Issues Fixed

### 1. Component Translucency
**Cause**: `bg-card`, `bg-popover`, etc. CSS variables were undefined
**Fix**: Defined all shadcn/ui semantic colors in `:root` and `@media (prefers-color-scheme: dark)`

### 2. Clickability Issues
**Cause**: Framer Motion `motion.div` with incomplete animation states
**Fix**: Created `SectionWrapper` component with proper `initial`/`animate` configuration

### 3. Inconsistent Styling
**Cause**: Components using undefined CSS variables
**Fix**: Hardcoded fallbacks in Card component + defined variables globally

## Usage Guidelines

### For New Sections: Use SectionWrapper

```tsx
import { SectionWrapper } from '@/components/ui/section-wrapper'

// ✅ Correct - handles animation, opacity, and clickability
<SectionWrapper className="bg-white py-8">
  <YourContent />
</SectionWrapper>

// ❌ Avoid - causes the recurring problems
<motion.div animate={{ opacity: 1 }}>
  <YourContent />
</motion.div>
```

### For New Components: Use shadcn/ui Components

All shadcn/ui components now work correctly because CSS variables are defined:
- `Card`, `Button`, `Badge`, `Input` etc. will have proper backgrounds
- No more transparent components
- Consistent theming across light/dark modes

### For Custom Components: Follow Patterns

```tsx
// ✅ Use defined CSS variables
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"

// ✅ Or use semantic variables
className="bg-card text-card-foreground"
```

## Prevention

1. **Always use SectionWrapper** for new sections
2. **Test components in both light/dark modes**
3. **Use shadcn/ui components** instead of custom ones when possible
4. **Check for CSS variable dependencies** when adding new components

## Files Modified

- `app/globals.css`: Added shadcn/ui CSS variables
- `components/ui/card.tsx`: Added fallback backgrounds
- `components/ui/section-wrapper.tsx`: New component for sections
- `app/generator/page.tsx`: Updated ERC attribution section
- `components/attribution/AttributionCodeDisplay.tsx`: Fixed component styling for proper visibility

## Latest Fixes (Animation & Overlap Issues)

### Animation White Flash Fix
**Problem**: SectionWrapper caused white flash during animation
**Solution**: Removed motion animation entirely for immediate visibility

### Overlap Issues Fix
**Problem**: ERC section positioned outside main caused overlap with terminal
**Solution**: Moved section back inside main element with proper spacing and z-index

### Component Visibility Fix
**Problem**: AttributionCodeDisplay still had styling conflicts
**Solution**: Added explicit background and text color overrides for both light/dark modes

This architectural fix ensures no more recurring section issues.</contents>
</xai:function_call">Created ARCHITECTURE_FIXES.md