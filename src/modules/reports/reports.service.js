import Invoice from '../../db/models/invoice.model.js';
import Patient from '../../db/models/patient.model.js';
import Appointment from '../../db/models/appointment.model.js';
import Inventory from '../../db/models/inventory.model.js';
import { asynchandler } from '../../utils/response/response.js';

export const getDashboard = asynchandler(async (req, res) => {
    const now = new Date();

    // This month range
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Today range
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const [
        totalPatients, lastMonthPatients,
        completedAppointments, lastMonthCompleted,
        todayAppointments,
        monthRevenue, lastMonthRevenue,
        totalRevenue,
        lowStockItems,
        recentAppointments,
    ] = await Promise.all([
        Patient.countDocuments({}),
        Patient.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
        Appointment.countDocuments({ status: 'completed' }),
        Appointment.countDocuments({ status: 'completed', updatedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
        Appointment.countDocuments({ date: { $gte: today, $lte: endOfToday } }),
        Invoice.aggregate([
            { $match: { createdAt: { $gte: startOfMonth }, status: { $in: ['paid', 'partial'] } } },
            { $group: { _id: null, total: { $sum: '$paidAmount' } } },
        ]),
        Invoice.aggregate([
            { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, status: { $in: ['paid', 'partial'] } } },
            { $group: { _id: null, total: { $sum: '$paidAmount' } } },
        ]),
        Invoice.aggregate([
            { $group: { _id: null, total: { $sum: '$paidAmount' } } },
        ]),
        Inventory.countDocuments({ $expr: { $lte: ['$quantity', '$minQuantity'] } }),
        Appointment.find({ date: { $gte: today, $lte: endOfToday } })
            .populate('patient', 'name phone')
            .populate('service', 'name price')
            .sort({ startTime: 1 })
            .limit(10)
            .lean(),
    ]);

    const thisMonthRevenue = monthRevenue[0]?.total || 0;
    const prevMonthRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = prevMonthRevenue > 0
        ? (((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1)
        : null;

    const totalAllAppointments = await Appointment.countDocuments({});
    const completionRate = totalAllAppointments > 0
        ? ((completedAppointments / totalAllAppointments) * 100).toFixed(1)
        : 0;

    return res.status(200).json({
        success: true,
        data: {
            totalIncome: totalRevenue[0]?.total || 0,
            monthlyRevenue: thisMonthRevenue,
            revenueGrowth: revenueGrowth ? `${revenueGrowth}%` : 'N/A',
            totalPatients,
            newPatientsLastMonth: lastMonthPatients,
            completedAppointments,
            todayAppointments,
            completionRate: `${completionRate}%`,
            lowStockAlerts: lowStockItems,
            recentAppointments,
        },
    });
});

export const getTopServices = asynchandler(async (req, res) => {
    const { limit = 10, from, to } = req.query;

    const matchStage = {};
    if (from || to) {
        matchStage.date = {};
        if (from) matchStage.date.$gte = new Date(from);
        if (to) matchStage.date.$lte = new Date(to);
    }

    const topServices = await Appointment.aggregate([
        { $match: { status: 'completed', ...matchStage } },
        {
            $group: {
                _id: '$service',
                count: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: 'services',
                localField: '_id',
                foreignField: '_id',
                as: 'serviceDetails',
            },
        },
        { $unwind: '$serviceDetails' },
        {
            $project: {
                _id: 0,
                serviceId: '$_id',
                name: '$serviceDetails.name',
                category: '$serviceDetails.category',
                price: '$serviceDetails.price',
                count: 1,
                revenue: { $multiply: ['$count', '$serviceDetails.price'] },
            },
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) },
    ]);

    const totalCount = topServices.reduce((sum, s) => sum + s.count, 0);
    const result = topServices.map(s => ({
        ...s,
        percentage: totalCount > 0 ? `${((s.count / totalCount) * 100).toFixed(1)}%` : '0%',
    }));

    return res.status(200).json({ success: true, data: result });
});

export const exportReport = asynchandler(async (req, res) => {
    const { from, to } = req.query;

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = toDate;
    }

    const invoiceFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
    const appointmentFilter = Object.keys(dateFilter).length ? { date: dateFilter } : {};

    const [invoices, appointments, patients] = await Promise.all([
        Invoice.find(invoiceFilter)
            .populate('patient', 'name phone')
            .populate('items.service', 'name')
            .sort({ createdAt: -1 })
            .lean(),
        Appointment.find(appointmentFilter)
            .populate('patient', 'name')
            .populate('service', 'name category price')
            .sort({ date: -1 })
            .lean(),
        Patient.countDocuments(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const completedAppts = appointments.filter(a => a.status === 'completed').length;

    return res.status(200).json({
        success: true,
        data: {
            summary: {
                totalRevenue,
                totalInvoices: invoices.length,
                completedAppointments: completedAppts,
                newPatients: patients,
                period: { from: from || 'All time', to: to || 'Now' },
            },
            invoices,
            appointments,
        },
    });
});
