import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";

type ValidateTarget = "body" | "query" | "params";

export const validate =
  (schema: ZodSchema, target: ValidateTarget = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = (error as ZodError).issues.map((e: ZodIssue) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        res.status(400).json({ 
          success: false, 
          error: "Validation failed", 
          details: errors 
        });
        return;
      }
      next(error);
    }
  };