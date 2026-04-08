import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      statuscoded: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details || null,
    });
  }

  // lỗi không xác định
  console.error(err);

  return res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal Server Error",
  });
};


export default errorHandler;