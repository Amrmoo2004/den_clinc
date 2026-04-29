import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../db/models/user.model.js';
import { AppError } from '../../utils/appError.js';
import { asynchandler } from '../../utils/response/response.js';
import { authUser } from '../../middlewares/authentaction.js';

export const login = asynchandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('البريد الإلكتروني وكلمة المرور مطلوبان', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !user.isActive) {
        return next(new AppError('بيانات الدخول غير صحيحة', 401));
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return next(new AppError('بيانات الدخول غير صحيحة', 401));
    }

    const access_token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    return res.status(200).json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        data: {
            access_token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        },
    });
});

export const logout = asynchandler(async (req, res) => {
    res.clearCookie('access_token');
    return res.status(200).json({ success: true, message: 'تم تسجيل الخروج' });
});

export const getMe = [
    authUser,
    asynchandler(async (req, res) => {
        return res.status(200).json({ success: true, data: req.user });
    }),
];
