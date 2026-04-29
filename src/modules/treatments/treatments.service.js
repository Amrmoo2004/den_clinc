import TreatmentPlan from '../../db/models/treatmentPlan.model.js';
import Patient from '../../db/models/patient.model.js';
import { AppError } from '../../utils/appError.js';
import { asynchandler } from '../../utils/response/response.js';

export const getAll = asynchandler(async (req, res) => {
    const { status, patient, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (patient) filter.patient = patient;

    const [data, total] = await Promise.all([
        TreatmentPlan.find(filter)
            .populate('patient', 'name phone patientCode')
            .populate('services.service', 'name category price')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean(),
        TreatmentPlan.countDocuments(filter),
    ]);

    const stats = {
        total,
        active: await TreatmentPlan.countDocuments({ status: 'active' }),
        completed: await TreatmentPlan.countDocuments({ status: 'completed' }),
        cancelled: await TreatmentPlan.countDocuments({ status: 'cancelled' }),
    };

    return res.status(200).json({
        success: true,
        data,
        stats,
    });
});

export const create = asynchandler(async (req, res, next) => {
    const { patient, services, notes } = req.body;

    if (!patient || !services || !services.length) {
        return next(new AppError('المريض والخدمات مطلوبان', 400));
    }

    const patientExists = await Patient.findById(patient);
    if (!patientExists) return next(new AppError('المريض غير موجود', 404));

    const plan = await TreatmentPlan.create({
        patient, services, notes,
        createdBy: req.user._id,
    });

    const populated = await TreatmentPlan.findById(plan._id)
        .populate('patient', 'name phone')
        .populate('services.service', 'name price');

    return res.status(201).json({ success: true, message: 'تم إنشاء الخطة العلاجية', data: populated });
});

export const getOne = asynchandler(async (req, res, next) => {
    const plan = await TreatmentPlan.findById(req.params.id)
        .populate('patient', 'name phone patientCode gender')
        .populate('services.service', 'name category price')
        .populate('createdBy', 'name role')
        .lean();

    if (!plan) return next(new AppError('الخطة العلاجية غير موجودة', 404));

    return res.status(200).json({ success: true, data: plan });
});

export const update = asynchandler(async (req, res, next) => {
    const { services, notes } = req.body;

    const plan = await TreatmentPlan.findById(req.params.id);
    if (!plan) return next(new AppError('الخطة العلاجية غير موجودة', 404));

    if (services) plan.services = services;
    if (notes !== undefined) plan.notes = notes;

    await plan.save(); // triggers totalCost pre-save hook

    const populated = await TreatmentPlan.findById(plan._id)
        .populate('patient', 'name phone')
        .populate('services.service', 'name price');

    return res.status(200).json({ success: true, message: 'تم تعديل الخطة', data: populated });
});

export const updateStatus = asynchandler(async (req, res, next) => {
    const { status } = req.body;
    const validStatuses = ['active', 'completed', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
        return next(new AppError(`الحالة يجب أن تكون: ${validStatuses.join(', ')}`, 400));
    }

    const plan = await TreatmentPlan.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
    ).populate('patient', 'name');

    if (!plan) return next(new AppError('الخطة العلاجية غير موجودة', 404));

    return res.status(200).json({ success: true, message: 'تم تغيير حالة الخطة', data: plan });
});
