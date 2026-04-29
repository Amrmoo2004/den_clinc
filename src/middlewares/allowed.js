import { AppError } from '../utils/appError.js';

export const isAuthorized = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required', 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError(
                `Access denied. Required role: ${allowedRoles.join(' or ')}`,
                403
            ));
        }

        next();
    };
};