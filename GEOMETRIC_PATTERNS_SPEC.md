# Geometric Patterns Specification

## Overview

OnchainRugs implements a two-layer geometric pattern system:
- **Masks**: Define WHERE geometric effects apply (spatial boundaries)
- **Fields**: Define HOW stripe sampling behaves within those boundaries

All field types now work with all mask types, ensuring robust onchain rendering.

## Architecture

### Pattern Generation Flow
```
NFT Data (seed, palette, stripes) → Deterministic Config → Mask + Field → Visual Output
```

### Onchain Constraints
- **Deterministic**: Same seed always produces same patterns
- **No Storage**: Patterns derived from existing NFT data
- **Memory Efficient**: Must work within browser/onchain limits
- **Robust**: No silent failures or incompatible combinations

## Field Types

### 1. None
- **Effect**: No geometric field effects
- **Works with**: All masks
- **Onchain**: Always returns base stripe index

### 2. Stripe Rotation
- **Effect**: Rotates stripe sampling based on position and optional mask rotation
- **Works with**: All masks
- **Special**: Uses `mask.getRotationAt()` if available, falls back to global angle
- **Onchain**: Requires mask activity check

### 3. Diagonal Drift
- **Effect**: Creates diagonal wave patterns through phase shifting
- **Works with**: All masks
- **Algorithm**: `sin(x * 0.015) * 0.6` creates position-based phase modulation
- **Onchain**: Requires mask activity check

### 4. Two Stripe Borrow
- **Effect**: Deterministically borrows colors from ±2 adjacent stripes
- **Works with**: All masks
- **Algorithm**: Hash-based selection between `prev2` and `next2` indices
- **Onchain**: Requires mask activity check

### 5. Arc Region Field
- **Effect**: Applies different stripe behaviors based on geometric regions
- **Works with**: All masks (robust fallback for non-regional)
- **Regional Masks**: Uses region identity for specific effects
- **Non-Regional**: Falls back to base stripe index (no effect)
- **Special Behaviors**:

#### Known Regions
- `primary_core`: Subtle rotation with evolution scaling
- `line_upper`/`line_lower`: Adjacent stripe borrowing
- `upper`/`lower`: Directional borrowing for circle partitions

#### Unknown Regions (Generic Fallback)
- Uses `hashString(regionId)` for deterministic effects
- 4 different effect types based on hash % 4:
  1. **Rotation**: `(hash % 2) * magnitude` direction
  2. **Borrow Up**: `baseIndex + (hash % 3 + 1)`
  3. **Borrow Down**: `baseIndex - (hash % 3 + 1)`
  4. **Position Mod**: `(x + y) * 0.005 * evolution`

## Mask Types

### Non-Regional Masks (6 types)
- `none`: No masking (effects apply everywhere)
- `block_circles`: Circular block patterns
- `block_rectangles`: Rectangular block patterns
- `block_triangles`: Triangular block patterns
- `circle_interference`: Interfering circle patterns
- `compass_cut`: Compass-based cuts

**Field Behavior**: All fields apply effects where `mask.isActive(x,y)` returns true

### Regional Masks (4 types)
- `circle_partition_cut`: Returns `"upper"`/`"lower"`
- `circle_boolean_cut`: Returns `"upper"`/`"lower"`
- `arc_partition`: Returns `"primary_core"`, `"secondary_X_arc"`, `"line_upper"`/`"line_lower"`
- `arc_dominance_partition`: Returns `"primary_core"`, `"secondary_X_arc"`, `"line_upper"`/`"line_lower"`

**Field Behavior**:
- Non-regional fields: Apply effects where active
- ArcRegionField: Uses region information for enhanced effects

## Compatibility Matrix

| Mask Type | Field Support | Notes |
|-----------|---------------|-------|
| none | ✅ All fields | Effects apply everywhere |
| block_* | ✅ All fields | Effects within block boundaries |
| circle_interference | ✅ All fields | Effects within interference patterns |
| compass_cut | ✅ All fields | Effects within compass cuts |
| circle_partition_cut | ✅ All fields | ArcRegionField uses "upper"/"lower" |
| circle_boolean_cut | ✅ All fields | ArcRegionField uses "upper"/"lower" |
| arc_partition | ✅ All fields | ArcRegionField uses arc regions |
| arc_dominance_partition | ✅ All fields | ArcRegionField uses arc regions |

## Implementation Details

### Consistent Interface Pattern
All field types follow this pattern:
```typescript
getSourceStripeIndex(x, y, baseStripeIndex, stripeData, mask, doormatData, evolutionStrength) {
  // 1. Check mask activity
  if (!mask || !mask.isActive(x, y)) {
    return baseStripeIndex
  }

  // 2. Apply field-specific logic
  // 3. Use optional mask features when available
  // 4. Return modified stripe index
}
```

### Hash Function for Determinism
```typescript
hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32-bit
  }
  return Math.abs(hash)
}
```

## Onchain Considerations

### Gas Optimization
- Precompute expensive operations where possible
- Use efficient hash functions
- Minimize memory allocations
- Consider lookup tables for common patterns

### Rendering Performance
- Effects should be fast to compute per pixel
- Avoid complex trigonometric functions where possible
- Cache region lookups for regional masks
- Balance visual complexity with computational cost

### Memory Constraints
- HTML generation happens onchain in `tokenURI()`
- Base64 encoding adds ~33% size overhead
- Keep JavaScript payload minimal
- Consider compressed/optimized algorithms

## Testing Strategy

### Compatibility Testing
- ✅ All 50 field+mask combinations tested
- ✅ No runtime errors or silent failures
- ✅ Appropriate effects for each combination

### Quality Assurance
- **Tier A**: Always visually pleasing combinations
- **Tier B**: Acceptable but less striking
- **Tier C**: Avoid (too noisy/confusing)

### Onchain Simulation
- Test with constrained environments
- Verify deterministic output across runs
- Measure gas costs for different complexity levels

## Future Extensions

### New Field Types
- Add new field types following the consistent interface
- Ensure they work with all existing masks
- Test compatibility before deployment

### New Mask Types
- Implement `RegionalEngravingMask` interface for region support
- Add region naming conventions
- Update ArcRegionField if new region types added

### Evolution System
- Time-based pattern emergence
- Achievement-based unlocks
- Dynamic pattern progression

## Deployment Checklist

- [ ] All field types work with all mask types
- [ ] No silent failures or undefined behavior
- [ ] Deterministic output from NFT seed
- [ ] Gas-efficient implementation
- [ ] Browser-compatible rendering
- [ ] Tested with various NFT data combinations
- [ ] Documentation updated for new features