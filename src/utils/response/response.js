export const asynchandler = (fn) => {
    return (req, res, next) => {
        const result = fn(req, res, next);
        if (result && typeof result.catch === 'function') {
            return result.catch(next);
        }
        return result;
    };
};

export const globalErrorHandler = (error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error',
    });
};