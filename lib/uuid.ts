const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Check ids from URLs or callers before they reach a uuid column: Postgres
// rejects malformed input with an error (22P02) rather than matching nothing.
export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);
