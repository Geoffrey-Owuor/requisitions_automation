// Deep equality for requisition form state, used to tell whether a form has
// unsaved input. Arrays and plain objects are compared by value; anything
// else - strings, numbers, File objects - by identity, so a re-picked file
// counts as a change.
export function isSameFormValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, index) => isSameFormValue(item, b[index]))
    );
  }

  if (!isPlainObject(a) || !isPlainObject(b)) return false;

  const aKeys = Object.keys(a).filter((key) => a[key] !== undefined);
  const bKeys = Object.keys(b).filter((key) => b[key] !== undefined);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key) => isSameFormValue(a[key], b[key]))
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
