// Where a sign-in may send the user afterwards: a path on this site only,
// never another origin. "//host" and "/\host" are both read by browsers as
// another host, so neither passes.
export function safeReturnTo(value: string | null | undefined): string {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  ) {
    return value;
  }
  return "/dashboard";
}
