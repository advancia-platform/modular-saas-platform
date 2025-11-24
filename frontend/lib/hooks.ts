import { useEffect, useState } from 'react';
import { ProjectResponse, TaskResponse } from '../types/models';
import { PaginatedResponse } from '../types/responses';
import { fetchProjects, fetchTasks } from './api';

interface UsePaginatedResult<T> {
  data: T[];
  pagination?: PaginatedResponse<T>['pagination'];
  loading: boolean;
  error?: string;
  refresh: () => void;
}

function usePaginated<T>(
  fetcher: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>,
  page = 1,
  pageSize = 10
): UsePaginatedResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<T>['pagination']>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetcher(page, pageSize);
      setData(res.data);
      setPagination(res.pagination);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, pageSize]);

  return { data, pagination, loading, error, refresh: load };
}

export function useTasks(page = 1, pageSize = 10) {
  return usePaginated<TaskResponse>(fetchTasks, page, pageSize);
}

export function useProjects(page = 1, pageSize = 10) {
  return usePaginated<ProjectResponse>(fetchProjects, page, pageSize);
}
