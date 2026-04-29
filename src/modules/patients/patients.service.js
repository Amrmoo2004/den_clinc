import Patient from '../../db/models/patient.model.js';
import Appointment from '../../db/models/appointment.model.js';
import TreatmentPlan from '../../db/models/treatmentPlan.model.js';
import Invoice from '../../db/models/invoice.model.js';
import { AppError } from '../../utils/appError.js';
import { asynchandler } from '../../utils/response/response.js';

export const getAll = asynchandler(async (req, res) => {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { patientCode: { $regex: search, $options: 'i' } },
        ];
    }

    const [data, total] = await Promise.all([
        Patient.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }).lean(),
        Patient.countDocuments(filter),
    ]);

    return res.status(200).json({
        success: true,
        data,
        stats: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
});

export const create = asynchandler(async (req, res, next) => {
    const { name, phone, dateOfBirth, gender, address, notes } = req.body;

    if (!name || !phone) {
        return next(new AppError('الاسم ورقم الهاتف مطلوبان', 400));
    }

    const existing = await Patient.findOne({ phone });
    if (existing) return next(new AppError('يوجد مريض مسجل بنفس رقم الهاتف', 409));

    const patient = await Patient.create({
        name, phone, dateOfBirth, gender, address, notes,
        createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, message: 'تم إضافة المريض بنجاح', data: patient });
});

export const getOne = asynchandler(async (req, res, next) => {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) return next(new AppError('المريض غير موجود', 404));

    return res.status(200).json({ success: true, data: patient });
});

export const update = asynchandler(async (req, res, next) => {
    const { name, phone, dateOfBirth, gender, address, notes } = req.body;

    const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        { name, phone, dateOfBirth, gender, address, notes },
        { new: true, runValidators: true }
    );

    if (!patient) return next(new AppError('المريض غير موجود', 404));

    return res.status(200).json({ success: true, message: 'تم تعديل البيانات', data: patient });
});

export const remove = asynchandler(async (req, res, next) => {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return next(new AppError('المريض غير موجود', 404));

    return res.status(200).json({ success: true, message: 'تم حذف المريض' });
});

export const getReports = asynchandler(async (req, res, next) => {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) return next(new AppError('المريض غير موجود', 404));

    const [appointments, treatmentPlans, invoices] = await Promise.all([
        Appointment.find({ patient: req.params.id })
            .populate('service', 'name category price')
            .sort({ date: -1 })
            .lean(),
        TreatmentPlan.find({ patient: req.params.id })
            .populate('services.service', 'name category price')
            .sort({ createdAt: -1 })
            .lean(),
        Invoice.find({ patient: req.params.id })
            .populate('items.service', 'name')
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const totalDebt = invoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - (inv.paidAmount || 0)), 0);

    return res.status(200).json({
        success: true,
        data: {
            patient,
            stats: {
                totalAppointments: appointments.length,
                completedAppointments: appointments.filter(a => a.status === 'completed').length,
                activeTreatmentPlans: treatmentPlans.filter(t => t.status === 'active').length,
                totalPaid,
                totalDebt,
            },
            appointments,
            treatmentPlans,
            invoices,
        },
    });
});
