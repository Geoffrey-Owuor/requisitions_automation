"use client";
import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PaginatedResult } from "@/lib/pagination";

interface QueryFnArgs<TParams> {
  params: TParams;
  page: number;
  pageSize: number;
  searchTerm: string;
}

interface UseServerPaginationArgs<T, TParams> {
  // Stable identifier(s) for this query, e.g. ["ITRequisitionsData"].
  // currentPage/itemsPerPage/searchTerm are appended automatically.
  queryKey: unknown[];
  // Filter params specific to the table (e.g. dataFlag, userEmail).
  params: TParams;
  queryFn: (args: QueryFnArgs<TParams>) => Promise<PaginatedResult<T>>;
  initialPageSize?: number;
  searchDebounceMs?: number;
  enabled?: boolean;
}

// Reusable server-side pagination + debounced search for React Query-backed tables.
// The server action passed as `queryFn` is expected to return a PaginatedResult<T>
// (see lib/pagination.ts) built from a LIMIT/OFFSET query.
export function useServerPagination<T, TParams>({
  queryKey,
  params,
  queryFn,
  initialPageSize = 6,
  searchDebounceMs = 350,
  enabled = true,
}: UseServerPaginationArgs<T, TParams>) {
  const [searchTerm, setSearchTermState] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(initialPageSize);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce typed search input, but apply clearing immediately so the
  // "clear search" affordance feels instant rather than lagging. Driven from
  // the setter (an event-handler call site) rather than an effect watching
  // searchTerm, so there's no derived-state-in-effect indirection.
  const setSearchTerm = (value: string) => {
    setSearchTermState(value);
    setCurrentPage(1);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (value === "") {
      setDebouncedSearchTerm("");
      return;
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchTerm(value);
    }, searchDebounceMs);
  };

  // Clear any pending debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const query = useQuery({
    queryKey: [...queryKey, { currentPage, itemsPerPage, debouncedSearchTerm, params }],
    queryFn: () =>
      queryFn({
        params,
        page: currentPage,
        pageSize: itemsPerPage,
        searchTerm: debouncedSearchTerm,
      }),
    placeholderData: keepPreviousData,
    enabled,
  });

  const setItemsPerPage = (n: number) => {
    setItemsPerPageState(n);
    setCurrentPage(1);
  };

  const clearSearch = () => setSearchTerm("");

  return {
    data: query.data?.rows ?? [],
    totalCount: query.data?.totalCount ?? 0,
    // True only for the very first fetch (no cached page to fall back on).
    isLoading: query.isPending,
    // True whenever a request is in flight, including page/search transitions.
    isFetching: query.isFetching,
    refetch: query.refetch,
    searchTerm,
    setSearchTerm,
    clearSearch,
    // Whether the current results reflect an active search filter — useful
    // for callers that need an unfiltered "does this table have any data at
    // all" signal distinct from the filtered totalCount.
    isSearchActive: debouncedSearchTerm.trim().length > 0,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
  };
}
