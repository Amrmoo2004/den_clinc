import Invoice from '../../db/models/invoice.model.js';
import Patient from '../../db/models/patient.model.js';
import { AppError } from '../../utils/appError.js';
import { asynchandler } from '../../utils/response/response.js';

export const getStats = asynchandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [allInvoices, todayInvoices] = await Promise.all([
        Invoice.find({}).lean(),
        Invoice.find({ createdAt: { $gte: today, $lte: endOfDay } }).lean(),
    ]);

    const totalIncome = allInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const todayCollection = todayInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const remainingAmounts = allInvoices.reduce(
        (sum, inv) => sum + Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0)),
        0
    );
    const completedInvoices = allInvoices.filter(inv => inv.status === 'paid').length;

    return res.status(200).json({
        success: true,
        data: {
            totalIncome,
            todayCollection,
            remainingAmounts,
            completedInvoices,
            totalInvoices: allInvoices.length,
            partialInvoices: allInvoices.filter(inv => inv.status === 'partial').length,
            unpaidInvoices: allInvoices.filter(inv => inv.status === 'unpaid').length,
        },
    });
});

export const exportInvoices = asynchandler(async (req, res) => {
    const { from, status, to } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = toDate;
        }
    }

    const invoices = await Invoice.find(filter)
        .populate('patient', 'name phone patientCode')
        .populate('items.service', 'name')
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json({
        success: true,
        message: 'بيانات التصدير جاهزة',
        data: invoices,
        stats: {
            total: invoices.length,
            totalAmount: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
            totalPaid: invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0),
        },
    });
});

export const getAll = asynchandler(async (req, res) => {
    const { status, patient, from, to, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (patient) filter.patient = patient;
    if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = toDate;
        }
    }

    const [data, total] = await Promise.all([
        Invoice.find(filter)
            .populate('patient', 'name phone patientCode')
            .populate('items.service', 'name')
            .populate('createdBy', 'name')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean(),
        Invoice.countDocuments(filter),
    ]);

    return res.status(200).json({
        success: true,
        data,
        stats: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
});

export const create = asynchandler(async (req, res, next) => {
    const { patient, appointment, treatmentPlan, items, totalAmount, paidAmount, paymentMethod, notes } = req.body;

    if (!patient || !totalAmount) {
        return next(new AppError('المريض والإجمالي مطلوبان', 400));
    }

    const patientExists = await Patient.findById(patient);
    if (!patientExists) return next(new AppError('المريض غير موجود', 404));

    const invoice = await Invoice.create({
        patient, appointment, treatmentPlan, items,
        totalAmount, paidAmount: paidAmount || 0,
        paymentMethod, notes,
        createdBy: req.user._id,
    });

    const populated = await Invoice.findById(invoice._id)
        .populate('patient', 'name phone')
        .populate('items.service', 'name');

    return res.status(201).json({ success: true, message: 'تم إنشاء الفاتورة', data: populated });
});

export const getOne = asynchandler(async (req, res, next) => {
    const invoice = await Invoice.findById(req.params.id)
        .populate('patient', 'name phone patientCode')
        .populate('appointment', 'date startTime status')
        .populate('treatmentPlan', 'totalCost status')
        .populate('items.service', 'name category price')
        .populate('createdBy', 'name')
        .lean();

    if (!invoice) return next(new AppError('الفاتورة غير موجودة', 404));

    return res.status(200).json({ success: true, data: invoice });
});

export const recordPayment = asynchandler(async (req, res, next) => {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
        return next(new AppError('يجب إدخال مبلغ صحيح', 400));
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return next(new AppError('الفاتورة غير موجودة', 404));

    if (invoice.status === 'paid') {
        return next(new AppError('الفاتورة مدفوعة بالكامل بالفعل', 400));
    }

    invoice.paidAmount = Math.min(invoice.paidAmount + amount, invoice.totalAmount);
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    await invoice.save(); // triggers status auto-update

    return res.status(200).json({
        success: true,
        message: 'تم تسجيل الدفعة',
        data: {
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: invoice.totalAmount,
            paidAmount: invoice.paidAmount,
            remaining: invoice.totalAmount - invoice.paidAmount,
            status: invoice.status,
        },
    });
});
