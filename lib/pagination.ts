// Shared helpers for server-side paginated Postgres queries.
// Pair with hooks/useServerPagination.ts on the client.

export interface PaginatedResult<T> {
  rows: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const MAX_PAGE_SIZE = 200;

// Clamp page/pageSize into safe bounds and convert to SQL LIMIT/OFFSET.
export function toSafeOffsetLimit({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) {
  const limit = Math.min(Math.max(Math.trunc(pageSize) || 1, 1), MAX_PAGE_SIZE);
  const safePage = Math.max(Math.trunc(page) || 1, 1);
  return { limit, offset: (safePage - 1) * limit };
}

// Turns rows selected with `COUNT(*) OVER() AS total_count` into a PaginatedResult.
// Reading total_count from a window function avoids a second round trip for the count.
export function toPaginatedResult<T extends { total_count?: string | number }>(
  rowsWithCount: T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const totalCount =
    rowsWithCount.length > 0 ? Number(rowsWithCount[0].total_count) : 0;

  return {
    rows: rowsWithCount,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(totalCount / pageSize), 1),
  };
}

export function emptyPaginatedResult<T>(
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return { rows: [], totalCount: 0, page, pageSize, totalPages: 1 };
}
