import DailyBooking from '../../db/models/dailyBooking.model.js';
import Setting from '../../db/models/setting.model.js';
import Patient from '../../db/models/patient.model.js';
import { AppError } from '../../utils/appError.js';
import { asynchandler } from '../../utils/response/response.js';

// Get Daily Bookings (Default to today unless date is provided)
export const getDailyBookings = asynchandler(async (req, res) => {
    const { date, status } = req.query;
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

    // Stats for the dashboard
    const totalBookingPrice = bookings.reduce((sum, b) => sum + (b.bookingPrice || 0), 0);
    const totalExtraPaid = bookings.reduce((sum, b) => sum + (b.extraPaid || 0), 0);
    const totalProcedurePaid = bookings.reduce((sum, b) => {
        return sum + (b.record?.procedures?.reduce((pSum, p) => pSum + (p.paid || 0), 0) || 0);
    }, 0);
    const totalDailyProfit = totalBookingPrice + totalExtraPaid + totalProcedurePaid;

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        totalBookingPrice,
        totalExtraPaid,
        totalProcedurePaid,
        totalDailyProfit,
    };

    let filteredBookings = bookings;
    if (status) {
        filteredBookings = bookings.filter(b => b.status === status);
    }

    return res.status(200).json({ success: true, count: filteredBookings.length, data: filteredBookings, stats });
});

// Create a new daily booking
export const createDailyBooking = asynchandler(async (req, res, next) => {
    const { name, phone, age, address, notes, bookingTime, record, status, bookingPrice, extraPaid } = req.body;

    if (!name || !phone) {
        return next(new AppError('الاسم ورقم الهاتف مطلوبان', 400));
    }

    let finalBookingPrice = bookingPrice;
    if (finalBookingPrice === undefined) {
        const settings = await Setting.findOne().lean();
        finalBookingPrice = settings ? settings.bookingPrice : 100;
    }

    // if bookingTime is provided, use it, else default in model is Date.now
    
    // Auto link or create patient
    let patientDoc = await Patient.findOne({ phone });
    if (!patientDoc) {
        patientDoc = await Patient.create({
            name,
            phone,
            dateOfBirth: age ? new Date(new Date().setFullYear(new Date().getFullYear() - age)) : undefined,
            address,
            createdBy: req.user._id,
        });
    }

    const payload = {
        patient: patientDoc._id,
        name,
        phone,
        age,
        address,
        notes,
        record,
        status,
        bookingPrice: finalBookingPrice,
        extraPaid: extraPaid !== undefined ? extraPaid : 0,
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
    const { name, phone, age, address, notes, bookingTime, record, status, bookingPrice, extraPaid } = req.body;
    
    const updateData = { name, phone, age, address, notes };
    if (status) updateData.status = status;
    if (record) updateData.record = record;
    if (bookingPrice !== undefined) updateData.bookingPrice = bookingPrice;
    if (extraPaid !== undefined) updateData.extraPaid = extraPaid;
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

// Update status of a daily booking
export const updateStatus = asynchandler(async (req, res, next) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'completed'];

    if (!status || !validStatuses.includes(status)) {
        return next(new AppError(`الحالة يجب أن تكون: ${validStatuses.join(', ')}`, 400));
    }

    const booking = await DailyBooking.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
    );

    if (!booking) return next(new AppError('الحجز غير موجود', 404));

    return res.status(200).json({ success: true, message: 'تم تغيير حالة الحجز', data: booking });
});
