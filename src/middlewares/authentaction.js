import jwt from 'jsonwebtoken';
import User from '../db/models/user.model.js';
import { AppError } from '../utils/appError.js';

export const authUser = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.access_token) {
            token = req.cookies.access_token;
        }

        if (!token) {
            return next(new AppError('Authentication required — please login', 401));
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return next(new AppError('Invalid or expired token', 401));
        }

        const user = await User.findById(decoded.id).select('-password').lean();
        if (!user) {
            return next(new AppError('User not found', 401));
        }

        if (!user.isActive) {
            return next(new AppError('Account is deactivated', 403));
        }

        req.user = user;
        next();
    } catch (err) {
        return next(new AppError('Internal server error', 500));
    }
};