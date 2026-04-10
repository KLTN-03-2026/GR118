import rateLimit from 'express-rate-limit';

// General rate limiter for all routes
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for auth routes (login, register)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Tăng lên 20 lần để thuận tiện test
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count successful requests as well
});

// Very strict rate limiter for password-related operations
export const passwordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Tăng lên 10 lần
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
