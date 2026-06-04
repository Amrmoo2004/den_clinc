import Service from '../../db/models/service.model.js';
import User from '../../db/models/user.model.js';
import Setting from '../../db/models/setting.model.js';
import { AppError } from '../../utils/appError.js';
import { asynchandler } from '../../utils/response/response.js';

// ─── SERVICES ───────────────────────────────────────────────────────────────

export const getAllServices = asynchandler(async (req, res) => {
    const { category, search, isActive } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const data = await Service.find(filter).sort({ category: 1, name: 1 }).lean();

    const stats = {
        total: data.length,
        byCategory: data.reduce((acc, s) => {
            acc[s.category] = (acc[s.category] || 0) + 1;
            return acc;
        }, {}),
    };

    return res.status(200).json({ success: true, data, stats });
});

export const createService = asynchandler(async (req, res, next) => {
    const { name, category, price, description } = req.body;

    if (!name || price === undefined) {
        return next(new AppError('اسم الخدمة والسعر مطلوبان', 400));
    }

    const existing = await Service.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) return next(new AppError('خدمة بنفس الاسم موجودة بالفعل', 409));

    const service = await Service.create({ name, category, price, description });

    return res.status(201).json({ success: true, message: 'تم إضافة الخدمة', data: service });
});

export const updateService = asynchandler(async (req, res, next) => {
    const { name, category, price, description, isActive } = req.body;

    const service = await Service.findByIdAndUpdate(
        req.params.id,
        { name, category, price, description, isActive },
        { new: true, runValidators: true }
    );

    if (!service) return next(new AppError('الخدمة غير موجودة', 404));

    return res.status(200).json({ success: true, message: 'تم تعديل الخدمة', data: service });
});

export const deleteService = asynchandler(async (req, res, next) => {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return next(new AppError('الخدمة غير موجودة', 404));

    return res.status(200).json({ success: true, message: 'تم حذف الخدمة' });
});

// ─── USERS ───────────────────────────────────────────────────────────────────

export const getAllUsers = asynchandler(async (req, res) => {
    const users = await User.find({})
        .select('-password')
        .sort({ role: 1, name: 1 })
        .lean();

    return res.status(200).json({
        success: true,
        data: users,
        stats: {
            total: users.length,
            doctors: users.filter(u => u.role === 'doctor').length,
            receptionists: users.filter(u => u.role === 'receptionist').length,
            active: users.filter(u => u.isActive).length,
        },
    });
});

export const createUser = asynchandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return next(new AppError('الاسم والبريد الإلكتروني وكلمة المرور والدور مطلوبون', 400));
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return next(new AppError('البريد الإلكتروني مستخدم بالفعل', 409));

    const user = await User.create({ name, email: email.toLowerCase(), password, role });

    return res.status(201).json({
        success: true,
        message: 'تم إضافة المستخدم',
        data: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
    });
});

export const toggleUserStatus = asynchandler(async (req, res, next) => {
    const { isActive } = req.body;

    if (isActive === undefined) {
        return next(new AppError('يجب تحديد حالة التفعيل (isActive)', 400));
    }

    // Prevent doctor from deactivating themselves
    if (req.params.id === req.user._id.toString()) {
        return next(new AppError('لا يمكنك تعطيل حسابك الخاص', 400));
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true }
    ).select('-password');

    if (!user) return next(new AppError('المستخدم غير موجود', 404));

    return res.status(200).json({
        success: true,
        message: isActive ? 'تم تفعيل المستخدم' : 'تم إيقاف المستخدم',
        data: user,
    });
});

export const deleteUser = asynchandler(async (req, res, next) => {
    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
        return next(new AppError('لا يمكنك حذف حسابك الخاص', 400));
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new AppError('المستخدم غير موجود', 404));

    return res.status(200).json({ success: true, message: 'تم حذف المستخدم' });
});

// ─── CLINIC SETTINGS ────────────────────────────────────────────────────────

export const getClinicSettings = asynchandler(async (req, res) => {
    let settings = await Setting.findOne().lean();
    if (!settings) {
        settings = { bookingPrice: 100 };
    }
    return res.status(200).json({ success: true, data: settings });
});

export const updateClinicSettings = asynchandler(async (req, res, next) => {
    const { bookingPrice } = req.body;

    if (bookingPrice === undefined || typeof bookingPrice !== 'number' || bookingPrice < 0) {
        return next(new AppError('سعر الحجز غير صالح', 400));
    }

    const settings = await Setting.findOneAndUpdate(
        {},
        { bookingPrice },
        { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({ success: true, message: 'تم تحديث إعدادات العيادة بنجاح', data: settings });
});
