import { Delete$ } from "@aws-sdk/client-s3";

export const ERROR_CODES = {
    INVALID_INPUT: {
        statusCode: 400,
        code: "INVALID_INPUT",
        message: "Invalid input data"
    },

    NOT_FOUND: {
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Resource not found"
    },

    UNAUTHORIZED: {
        statusCode: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized access"
    },

    DB_ERROR: {
        statusCode: 500,
        code: "DB_ERROR",
        message: "Failed to connect to DB"
    },
    SERVER_ERROR: {
        statusCode: 500,
        code: "SERVER_ERROR",
        message: "Internal server error"
    },
    R2_UPLOAD_ERROR: {
        statusCode: 500,
        code: "R2_UPLOAD_ERROR",
        message: "Failed to upload file to R2"
    },
    UPLOAD_ERROR: {
        statusCode: 500,
        code: "UPLOAD_ERROR",
        message: "File upload failed"
    },
    DELETE_ERROR_R2: {
        statusCode : 500,
        code: "DELETE_ERROR_R2",
        message: "Failed to delete file from R2"
    }
} as const;