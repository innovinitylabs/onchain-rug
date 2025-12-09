/**
 * BigInt serialization polyfill
 * This must be imported/executed before React DevTools tries to serialize any BigInt values
 */

// Polyfill BigInt.prototype.toJSON for JSON.stringify
if (typeof BigInt !== 'undefined' && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function() {
    return this.toString();
  };
}

// Also patch JSON.stringify to handle BigInt values directly
// This is a more robust solution that works even if toJSON isn't called
const originalStringify = JSON.stringify;
JSON.stringify = function(value: any, replacer?: any, space?: any): string {
  // If replacer is a function, wrap it to handle BigInt
  if (typeof replacer === 'function') {
    const wrappedReplacer = (key: string, val: any) => {
      if (typeof val === 'bigint') {
        return val.toString();
      }
      return replacer(key, val);
    };
    return originalStringify(value, wrappedReplacer, space);
  }
  
  // If no replacer, use our own that handles BigInt
  const defaultReplacer = (key: string, val: any) => {
    if (typeof val === 'bigint') {
      return val.toString();
    }
    return val;
  };
  
  return originalStringify(value, defaultReplacer, space);
};

