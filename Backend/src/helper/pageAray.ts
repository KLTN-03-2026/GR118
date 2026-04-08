import { AppError } from "../utils/app-error";
import { ERROR_CODES } from "../constant/error";

export interface PageInfo<T> {
    items: T[];
    totalPages: number;
    page: number;
    limit: number;
}

export class PageArray {
    static toArrayPage<T>(items: T[], page: number, limit: number): PageInfo<T> {
        try {
            const total = items.length;
            const totalPages = Math.ceil(total / limit);
            const pageItems = items.slice((page - 1) * limit, page * limit);
            return {
                items: pageItems,
                totalPages: totalPages,
                page: page,
                limit: limit
            }
        } catch (error) {
            const err = ERROR_CODES.NOT_FOUND;

            if (error instanceof Error) {
                throw new AppError(err.statusCode, err.code, err.message, {
                    originalError: error.message
                });
            } else {
                throw new AppError(500, "UNKNOWN_ERROR", "An unknown error occurred while paginating the array");
            }
        }
    }
}