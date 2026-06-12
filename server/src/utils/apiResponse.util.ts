import { Response } from "express";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export const ApiResponse = {
  success<T>(res: Response, data: T, statusCode: number = 200, message?: string): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  paginated<T>(res: Response, data: T[], pagination: PaginationMeta): Response {
    return res.status(200).json({
      success: true,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    });
  },

  error(res: Response, message: string, statusCode: number = 500, details?: unknown): Response {
    return res.status(statusCode).json({
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  notFound(res: Response, resource: string = "Resource"): Response {
    return this.error(res, `${resource} not found`, 404);
  },

  unauthorized(res: Response, message: string = "Unauthorized"): Response {
    return this.error(res, message, 401);
  },

  forbidden(res: Response, message: string = "Forbidden"): Response {
    return this.error(res, message, 403);
  },

  conflict(res: Response, message: string): Response {
    return this.error(res, message, 409);
  },
};