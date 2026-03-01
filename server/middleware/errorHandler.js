export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Global Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
    // Log the actual error stack to the server console for debugging
    console.error(`[ERROR] ${err.message}`);
    console.error(err.stack);

    // If we're in production, mask the internal error message to prevent stack trace leaks
    const isProduction = process.env.NODE_ENV === 'production';

    // Check if it's a known Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Database Validation Error',
            details: Object.values(err.errors).map(e => e.message)
        });
    }

    // Default 500 response
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    const message = isProduction && statusCode === 500 ? 'Internal Server Error' : err.message;

    res.status(statusCode).json({
        message,
        // Optional: Include stack trace only in development
        ...(isProduction ? {} : { stack: err.stack })
    });
};
