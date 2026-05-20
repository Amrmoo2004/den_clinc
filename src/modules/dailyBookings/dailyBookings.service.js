import DailyBooking from '../../db/models/dailyBooking.model.js';
import { AppError } from '../../utils/appError.js';
import { asynchandler } from '../../utils/response/response.js';

// Get Daily Bookings (Default to today unless date is provided)
export const getDailyBookings = asynchandler(async (req, res) => {
    const { date } = req.query;
    const filter = {};

    let targetDate;
    if (date) {
        targetDate = new Date(date);
    } else {
        targetDate = new Date();
    }
    
    // Set to midnight to match the `date` field in the DB
    targetDate.setHours(0, 0, 0, 0);

    // End of the target day
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    filter.date = { $gte: targetDate, $lte: endOfDay };

    const bookings = await DailyBooking.find(filter)
        .populate('createdBy', 'name role')
        .sort({ bookingTime: 1 })
        .lean();

    return res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

// Create a new daily booking
export const createDailyBooking = asynchandler(async (req, res, next) => {
    const { name, phone, age, address, notes, bookingTime, record } = req.body;

    if (!name || !phone) {
        return next(new AppError('الاسم ورقم الهاتف مطلوبان', 400));
    }

    // if bookingTime is provided, use it, else default in model is Date.now
    const payload = {
        name,
        phone,
        age,
        address,
        notes,
        record,
        createdBy: req.user._id,
    };

    if (bookingTime) {
        payload.bookingTime = new Date(bookingTime);
        // adjust the date field to match the bookingTime day
        const d = new Date(bookingTime);
        d.setHours(0, 0, 0, 0);
        payload.date = d;
    }

    const booking = await DailyBooking.create(payload);

    return res.status(201).json({ success: true, message: 'تم تسجيل الحجز اليومي بنجاح', data: booking });
});

// Update a daily booking (optional, if needed)
export const updateDailyBooking = asynchandler(async (req, res, next) => {
    const { name, phone, age, address, notes, bookingTime, record } = req.body;
    
    const updateData = { name, phone, age, address, notes };
    if (record) updateData.record = record;
    if (bookingTime) {
        updateData.bookingTime = new Date(bookingTime);
        const d = new Date(bookingTime);
        d.setHours(0, 0, 0, 0);
        updateData.date = d;
    }

    const booking = await DailyBooking.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!booking) return next(new AppError('الحجز غير موجود', 404));

    return res.status(200).json({ success: true, message: 'تم تعديل الحجز بنجاح', data: booking });
});

// Remove a daily booking
export const removeDailyBooking = asynchandler(async (req, res, next) => {
    const booking = await DailyBooking.findByIdAndDelete(req.params.id);
    
    if (!booking) return next(new AppError('الحجز غير موجود', 404));

    return res.status(200).json({ success: true, message: 'تم إلغاء الحجز' });
});
