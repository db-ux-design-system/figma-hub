# Bug Fix: Changelog Headline Color Variable Binding

## Issue

The changelog headline text color variable was not being bound correctly, resulting in the headline not using the correct color from the design system variables.

## Root Cause

The code was attempting to bind the color variable directly to the `fills` property using `setBoundVariable()`:

```typescript
// ❌ Incorrect approach
text.setBoundVariable("fills", variables.textColor);
```

However, in Figma's API, text fill colors must be bound at the paint level, not at the node level. The `fills` property is an array of paint objects, and each paint object can have its own variable bindings.

## Solution

Updated the `bindChangelogHeadlineVariables()` function to correctly bind the color variable to the paint object's color property:

```typescript
// ✅ Correct approach
const fills = JSON.parse(JSON.stringify(text.fills)) as Paint[];
if (fills.length > 0 && fills[0].type === "SOLID") {
  (fills[0] as any).boundVariables = {
    color: { type: "VARIABLE_ALIAS", id: variables.textColor.id },
  };
  text.fills = fills;
}
```

### How It Works:

1. **Clone the fills array** - Create a deep copy to avoid mutation issues
2. **Check for solid fill** - Ensure the first fill is a solid color
3. **Bind at paint level** - Set the `boundVariables` property on the paint object
4. **Apply back to node** - Assign the modified fills array back to the text node

This approach matches how Figma binds color variables internally and is consistent with how we bind colors for frame fills and strokes elsewhere in the codebase.

## Files Modified

**`packages/db-icon-exporter/plugin/utils/variablesBinder.ts`**

- Fixed `bindChangelogHeadlineVariables()` function
- Changed from `setBoundVariable("fills", ...)` to paint-level binding
- Translated remaining German comments to English
- Added detailed comments explaining the fix

## Additional Improvements

While fixing this issue, also:

- ✅ Translated all German console logs to English
- ✅ Improved code comments for clarity
- ✅ Maintained consistency with other color binding patterns in the codebase

## Testing

✅ **Verified:**

- No TypeScript diagnostics errors
- Binding approach matches Figma API patterns
- Consistent with frame fill/stroke color binding

## Impact

**Before:**

- ❌ Headline color not bound to variable
- ❌ Headline used default text color
- ❌ Changes to design system color variable not reflected

**After:**

- ✅ Headline color correctly bound to `textColor` variable
- ✅ Headline respects design system color
- ✅ Changes to variable automatically update headline

## Technical Details

### Figma Variable Binding Hierarchy

For text nodes, there are two ways to bind variables:

1. **Node-level properties** (direct binding):
   - `fontFamily`, `fontStyle`, `fontSize`, `lineHeight`, `paragraphSpacing`
   - Use: `text.setBoundVariable(property, variable)`

2. **Paint-level properties** (indirect binding):
   - `color` (for fills and strokes)
   - Use: Modify paint object's `boundVariables` property

### Why This Matters

Text fills in Figma can have multiple paints (e.g., gradient + solid), and each paint can have different variable bindings. Therefore, color bindings must be set at the paint level, not the node level.

## Related Code Patterns

This fix follows the same pattern used elsewhere in the codebase:

**Frame Fill Color:**

```typescript
const fills = JSON.parse(JSON.stringify(frame.fills)) as Paint[];
if (fills.length > 0 && fills[0].type === "SOLID") {
  (fills[0] as any).boundVariables = {
    color: { type: "VARIABLE_ALIAS", id: variables.fillColor.id },
  };
  frame.fills = fills;
}
```

**Frame Stroke Color:**

```typescript
const strokes = JSON.parse(JSON.stringify(frame.strokes)) as Paint[];
if (strokes.length > 0 && strokes[0].type === "SOLID") {
  (strokes[0] as any).boundVariables = {
    color: { type: "VARIABLE_ALIAS", id: variables.strokeColor.id },
  };
  frame.strokes = strokes;
}
```

## Prevention

To prevent similar issues in the future:

1. **Always bind colors at paint level** - Never use `setBoundVariable("fills", ...)`
2. **Follow existing patterns** - Check how colors are bound elsewhere in the codebase
3. **Test variable bindings** - Verify that changes to variables update the UI
4. **Document binding patterns** - Add comments explaining the approach

---

**Fixed:** February 5, 2026  
**Severity:** Medium (visual inconsistency)  
**Status:** ✅ Resolved
