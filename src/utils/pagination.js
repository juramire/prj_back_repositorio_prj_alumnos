export const parsePagination = (query, defaults = { page: 1, pageSize: 10, maxPageSize: 50 }) => {
  const page = Math.max(1, parseInt(query.page ?? defaults.page, 10) || defaults.page);
  const rawSize = parseInt(query.pageSize ?? defaults.pageSize, 10) || defaults.pageSize;
  const pageSize = Math.min(Math.max(1, rawSize), defaults.maxPageSize);
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
};
