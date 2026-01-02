# Module: [MODULE_NAME]

**Owner:** [Team Member Name]  
**Status:** Active  
**Last Updated:** YYYY-MM-DD

## Purpose

What this module does (1-2 sentences).

## Responsibilities

- Responsibility 1
- Responsibility 2

## Public Interface

Functions/classes that other modules can use:

### `functionName(params: Type): ReturnType`

Description of what it does.

**Parameters:**
- `param1` - Description

**Returns:**
- Description

**Example:**
```typescript
import { functionName } from './modules/[MODULE_NAME]';
const result = functionName({ ... });
```

## Dependencies

Modules this module uses:
- `module-a` - Why we use it
- `module-b` - Why we use it

## File Structure

```
src/modules/module-name/
├── index.ts        - Public interface
├── core.ts         - Core logic
└── types.ts        - Type definitions
```

## Testing

How to test this module:
```bash
npm test -- module-name
```

## Notes

Any special considerations, gotchas, or future plans.
