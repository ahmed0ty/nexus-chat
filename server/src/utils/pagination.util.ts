import { Types } from "mongoose";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export const getPaginationParams = (options: PaginationOptions) => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 30));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const getCursorPaginationQuery = (cursor?: string): Record<string, unknown> => {
  if (!cursor) return {};
  try {
    const objectId = new Types.ObjectId(cursor);
    return { _id: { $lt: objectId } };
  } catch {
    return {};
  }
};

export const buildPaginationResult = <T extends { _id: unknown }>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  const hasMore = data.length === limit;
  const nextCursor = hasMore ? String(data[data.length - 1]._id) : undefined;

  return {
    data,
    pagination: { total, page, limit, hasMore, nextCursor },
  };
};