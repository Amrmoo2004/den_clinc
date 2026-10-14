import Patient from '../../db/models/patient.model.js';
import Appointment from '../../db/models/appointment.model.js';
import DailyBooking from '../../db/models/dailyBooking.model.js';
import TreatmentPlan from '../../db/models/treatmentPlan.model.js';
import Invoice from '../../db/models/invoice.model.js';
import { AppError } from '../../utils/appError.js';
import { asynchandler } from '../../utils/response/response.js';
import {
    ALL_TEETH_CODES,
    generateDefaultDentalChart,
    normalizeDentalChart,
    mergeDentalChartUpdates,
    calculateDentalChartStats,
} from '../../utils/dentalChart.js';

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
    const { name, phone, dateOfBirth, gender, address, notes, dentalChart } = req.body;

    if (!name || !phone) {
        return next(new AppError('الاسم ورقم الهاتف مطلوبان', 400));
    }

    const existing = await Patient.findOne({ phone });
    if (existing) return next(new AppError('يوجد مريض مسجل بنفس رقم الهاتف', 409));

    const initialChart = dentalChart ? mergeDentalChartUpdates([], dentalChart) : generateDefaultDentalChart();

    const patient = await Patient.create({
        name, phone, dateOfBirth, gender, address, notes,
        dentalChart: initialChart,
        record: {
            dentalChart: initialChart,
        },
        createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, message: 'تم إضافة المريض بنجاح', data: patient });
});

export const getOne = asynchandler(async (req, res, next) => {
    const patient = await Patient.findById(req.params.id)
        .populate('createdBy', 'name phone role')
        .lean();
    if (!patient) return next(new AppError('المريض غير موجود', 404));

    const [appointments, dailyBookings, treatmentPlans, invoices] = await Promise.all([
        Appointment.find({ patient: req.params.id })
            .populate('service', 'name category price')
            .populate('createdBy', 'name phone role')
            .sort({ date: -1 })
            .lean(),
        DailyBooking.find({ patient: req.params.id })
            .populate('createdBy', 'name phone role')
            .sort({ date: -1 })
            .lean(),
        TreatmentPlan.find({ patient: req.params.id })
            .populate('services.service', 'name category price')
            .populate('createdBy', 'name phone role')
            .sort({ createdAt: -1 })
            .lean(),
        Invoice.find({ patient: req.params.id })
            .populate('items.service', 'name')
            .populate('createdBy', 'name phone role')
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const totalDebt = invoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - (inv.paidAmount || 0)), 0);

    const dentalChart = normalizeDentalChart(patient.dentalChart);
    const dentalChartStats = calculateDentalChartStats(dentalChart);

    return res.status(200).json({
        success: true,
        data: {
            ...patient,
            dentalChart,
            dentalChartStats,
            totalDentalCost: dentalChartStats.totalCost,
            record: {
                ...(patient.record || {}),
                dentalChart,
            },
            stats: {
                totalAppointments: appointments.length,
                completedAppointments: appointments.filter(a => a.status === 'completed').length,
                totalDailyBookings: dailyBookings.length,
                activeTreatmentPlans: treatmentPlans.filter(t => t.status === 'active').length,
                totalPaid,
                totalDebt,
                totalDentalCost: dentalChartStats.totalCost,
                teethWithComplaints: dentalChartStats.teethWithComplaints,
            },
            appointments,
            dailyBookings,
            treatmentPlans,
            invoices,
        },
    });
});

export const update = asynchandler(async (req, res, next) => {
    const { name, phone, dateOfBirth, gender, address, notes, dentalChart } = req.body;

    const patient = await Patient.findById(req.params.id);
    if (!patient) return next(new AppError('المريض غير موجود', 404));

    if (name) patient.name = name;
    if (phone) patient.phone = phone;
    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (address !== undefined) patient.address = address;
    if (notes !== undefined) patient.notes = notes;
    if (dentalChart) {
        patient.dentalChart = mergeDentalChartUpdates(patient.dentalChart, dentalChart);
        if (patient.record) {
            patient.record.dentalChart = patient.dentalChart;
        }
    }

    await patient.save();

    return res.status(200).json({ success: true, message: 'تم تعديل البيانات', data: patient });
});

export const remove = asynchandler(async (req, res, next) => {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return next(new AppError('المريض غير موجود', 404));

    return res.status(200).json({ success: true, message: 'تم حذف المريض' });
});

// Dental Chart Handlers
export const getDentalChart = asynchandler(async (req, res, next) => {
    const patient = await Patient.findById(req.params.id).select('name patientCode dentalChart record').lean();
    if (!patient) return next(new AppError('المريض غير موجود', 404));

    const dentalChart = normalizeDentalChart(patient.dentalChart);
    const stats = calculateDentalChartStats(dentalChart);

    return res.status(200).json({
        success: true,
        data: {
            patientId: patient._id,
            patientName: patient.name,
            patientCode: patient.patientCode,
            dentalChart,
            stats,
        },
    });
});

export const updateDentalChart = asynchandler(async (req, res, next) => {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return next(new AppError('المريض غير موجود', 404));

    const updates = req.body.dentalChart || req.body.teeth || req.body;
    patient.dentalChart = mergeDentalChartUpdates(patient.dentalChart, updates);
    if (patient.record) {
        patient.record.dentalChart = patient.dentalChart;
    }

    await patient.save();

    const stats = calculateDentalChartStats(patient.dentalChart);

    return res.status(200).json({
        success: true,
        message: 'تم حفظ مخطط الأسنان بنجاح',
        data: {
            patientId: patient._id,
            patientName: patient.name,
            dentalChart: patient.dentalChart,
            stats,
        },
    });
});

export const updateSingleTooth = asynchandler(async (req, res, next) => {
    const toothCode = (req.params.tooth || '').toUpperCase().trim();
    if (!ALL_TEETH_CODES.includes(toothCode)) {
        return next(
            new AppError(
                `رمز السن غير صحيح: ${req.params.tooth}. يجب أن يكون أحد رموز الـ 32 سن (UR1..UR8, UL1..UL8, LR1..LR8, LL1..LL8)`,
                400
            )
        );
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) return next(new AppError('المريض غير موجود', 404));

    const { complaint, complain, cost, notes, status } = req.body;
    const updateItem = {
        toothNumber: toothCode,
        tooth: toothCode,
        complaint: complaint !== undefined ? complaint : complain,
        cost,
        notes,
        status,
    };

    patient.dentalChart = mergeDentalChartUpdates(patient.dentalChart, [updateItem]);
    if (patient.record) {
        patient.record.dentalChart = patient.dentalChart;
    }

    await patient.save();

    const updatedTooth = patient.dentalChart.find(t => t.toothNumber === toothCode);
    const stats = calculateDentalChartStats(patient.dentalChart);

    return res.status(200).json({
        success: true,
        message: `تم تحديث بيانات السن ${toothCode} بنجاح`,
        data: {
            tooth: updatedTooth,
            stats,
        },
    });
});

export const resetDentalChart = asynchandler(async (req, res, next) => {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return next(new AppError('المريض غير موجود', 404));

    patient.dentalChart = generateDefaultDentalChart();
    if (patient.record) {
        patient.record.dentalChart = patient.dentalChart;
    }

    await patient.save();

    const stats = calculateDentalChartStats(patient.dentalChart);

    return res.status(200).json({
        success: true,
        message: 'تمت إعادة ضبط مخطط الأسنان للحالة الافتراضية بنجاح',
        data: {
            patientId: patient._id,
            dentalChart: patient.dentalChart,
            stats,
        },
    });
});

export const getReports = asynchandler(async (req, res, next) => {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) return next(new AppError('المريض غير موجود', 404));

    const [appointments, dailyBookings, treatmentPlans, invoices] = await Promise.all([
        Appointment.find({ patient: req.params.id })
            .populate('service', 'name category price')
            .sort({ date: -1 })
            .lean(),
        DailyBooking.find({ patient: req.params.id })
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
                totalDailyBookings: dailyBookings.length,
                activeTreatmentPlans: treatmentPlans.filter(t => t.status === 'active').length,
                totalPaid,
                totalDebt,
            },
            appointments,
            dailyBookings,
            treatmentPlans,
            invoices,
        },
    });
});
