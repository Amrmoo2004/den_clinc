import Appointment from '../../db/models/appointment.model.js';
import Patient from '../../db/models/patient.model.js';
import Service from '../../db/models/service.model.js';
import { AppError } from '../../utils/appError.js';
import { asynchandler } from '../../utils/response/response.js';

export const getAll = asynchandler(async (req, res) => {
    const { view = 'day', date, status } = req.query;

    const filter = {};

    // Date filter
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    if (view === 'day') {
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.date = { $gte: targetDate, $lte: endOfDay };
    } else if (view === 'week') {
        const startOfWeek = new Date(targetDate);
        const endOfWeek = new Date(targetDate);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        filter.date = { $gte: startOfWeek, $lte: endOfWeek };
    }

    if (status) filter.status = status;

    const data = await Appointment.find(filter)
        .populate('patient', 'name phone patientCode')
        .populate('service', 'name category price')
        .populate('createdBy', 'name role')
        .sort({ date: 1, startTime: 1 })
        .lean();

    // Stats for the dashboard
    const stats = {
        total: data.length,
        pending: data.filter(a => a.status === 'pending').length,
        inProgress: data.filter(a => a.status === 'in-progress').length,
        completed: data.filter(a => a.status === 'completed').length,
        cancelled: data.filter(a => a.status === 'cancelled').length,
        late: data.filter(a => a.status === 'late').length,
    };

    return res.status(200).json({ success: true, data, stats });
});

export const create = asynchandler(async (req, res, next) => {
    const { patient, service, date, startTime, endTime, doctorNote } = req.body;

    if (!patient || !service || !date || !startTime) {
        return next(new AppError('المريض والخدمة والتاريخ والوقت مطلوبون', 400));
    }

    const [patientExists, serviceExists] = await Promise.all([
        Patient.findById(patient),
        Service.findById(service),
    ]);

    if (!patientExists) return next(new AppError('المريض غير موجود', 404));
    if (!serviceExists) return next(new AppError('الخدمة غير موجودة', 404));

    const appointment = await Appointment.create({
        patient, service, date, startTime, endTime, doctorNote,
        createdBy: req.user._id,
    });

    const populated = await Appointment.findById(appointment._id)
        .populate('patient', 'name phone')
        .populate('service', 'name price');

    return res.status(201).json({ success: true, message: 'تم حجز الموعد بنجاح', data: populated });
});

export const getOne = asynchandler(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id)
        .populate('patient', 'name phone patientCode gender dateOfBirth')
        .populate('service', 'name category price')
        .populate('createdBy', 'name role')
        .lean();

    if (!appointment) return next(new AppError('الموعد غير موجود', 404));

    return res.status(200).json({ success: true, data: appointment });
});

export const update = asynchandler(async (req, res, next) => {
    const { date, startTime, endTime, doctorNote, service } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { date, startTime, endTime, doctorNote, service },
        { new: true, runValidators: true }
    ).populate('patient', 'name phone').populate('service', 'name price');

    if (!appointment) return next(new AppError('الموعد غير موجود', 404));

    return res.status(200).json({ success: true, message: 'تم تعديل الموعد', data: appointment });
});

export const updateStatus = asynchandler(async (req, res, next) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled', 'late'];

    if (!status || !validStatuses.includes(status)) {
        return next(new AppError(`الحالة يجب أن تكون: ${validStatuses.join(', ')}`, 400));
    }

    const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
    ).populate('patient', 'name').populate('service', 'name');

    if (!appointment) return next(new AppError('الموعد غير موجود', 404));

    return res.status(200).json({ success: true, message: 'تم تغيير حالة الموعد', data: appointment });
});

export const remove = asynchandler(async (req, res, next) => {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return next(new AppError('الموعد غير موجود', 404));

    return res.status(200).json({ success: true, message: 'تم إلغاء الموعد' });
});
