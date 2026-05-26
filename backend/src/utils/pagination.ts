export interface PaginationQuery {
  page?: number | string;
  limit?: number | string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const parsePagination = (q: PaginationQuery): PaginationParams => {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

export const buildPageMeta = (page: number, limit: number, total: number) => ({
  page,
  pageSize: limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
});
