import { useMemo } from 'react';
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { fetchAnimePage, type AnimeFormat, type CatalogPage } from './api';

const catalogKey = (search: string, format: AnimeFormat | null) =>
  ['anime', search, format] as const;

export function useAnimeCatalog(search: string, format: AnimeFormat | null) {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: catalogKey(search, format),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchAnimePage({ search, format, page: pageParam, signal }),
    getNextPageParam: (last) =>
      last.hasNextPage ? last.currentPage + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const items = useMemo(() => {
    const seen = new Set<number>();
    return (query.data?.pages.flatMap((page) => page.items) ?? []).filter(
      (anime) => {
        if (seen.has(anime.id)) return false;
        seen.add(anime.id);
        return true;
      },
    );
  }, [query.data]);
  function resetPagination(nextSearch: string, nextFormat: AnimeFormat | null) {
    const key = catalogKey(nextSearch, nextFormat);
    const updatedAt = queryClient.getQueryState(key)?.dataUpdatedAt;
    queryClient.setQueryData<InfiniteData<CatalogPage, number>>(
      key,
      (cached) =>
        cached
          ? {
              pages: cached.pages.slice(0, 1),
              pageParams: cached.pageParams.slice(0, 1),
            }
          : undefined,
      { updatedAt },
    );
  }
  return { ...query, items, resetPagination };
}
