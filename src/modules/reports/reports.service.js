import Invoice from '../../db/models/invoice.model.js';
import Patient from '../../db/models/patient.model.js';
import Appointment from '../../db/models/appointment.model.js';
import DailyBooking from '../../db/models/dailyBooking.model.js';
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
        todayAppointmentsList,
        todayDailyBookingsList,
        monthRevenue, lastMonthRevenue,
        totalRevenue,
        lowStockItems,
    ] = await Promise.all([
        Patient.countDocuments({}),
        Patient.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
        Appointment.countDocuments({ status: 'completed' }),
        Appointment.countDocuments({ status: 'completed', updatedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
        Appointment.find({ date: { $gte: today, $lte: endOfToday } })
            .populate('patient', 'name phone')
            .populate('service', 'name price')
            .sort({ startTime: 1 })
            .lean(),
        DailyBooking.find({ date: { $gte: today, $lte: endOfToday } }).lean(),
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

    const todayDailyBookingsBookingPrice = todayDailyBookingsList.reduce((sum, b) => sum + (b.bookingPrice || 0), 0);
    const todayDailyBookingsExtraPaid = todayDailyBookingsList.reduce((sum, b) => sum + (b.extraPaid || 0), 0);
    const todayDailyBookingsTotal = todayDailyBookingsBookingPrice + todayDailyBookingsExtraPaid;

    const todayAppointmentsBookingPrice = todayAppointmentsList.reduce((sum, a) => sum + (a.bookingPrice || 0), 0);
    const todayAppointmentsExtraPaid = todayAppointmentsList.reduce((sum, a) => sum + (a.extraPaid || 0), 0);
    const todayAppointmentsServicePrice = todayAppointmentsList.reduce((sum, a) => sum + (a.service?.price || 0), 0);
    const todayAppointmentsTotal = todayAppointmentsBookingPrice + todayAppointmentsExtraPaid + todayAppointmentsServicePrice;

    const todayDailyProfit = todayDailyBookingsTotal + todayAppointmentsTotal;

    // Monthly and Yearly calculations for the quick dashboard
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const [monthlyAppts, monthlyBookings, yearlyAppts, yearlyBookings] = await Promise.all([
        Appointment.find({ date: { $gte: startOfMonth, $lte: endOfLastMonth } }).populate('service', 'price').lean(),
        DailyBooking.find({ date: { $gte: startOfMonth, $lte: endOfLastMonth } }).lean(),
        Appointment.find({ date: { $gte: startOfYear, $lte: endOfYear } }).populate('service', 'price').lean(),
        DailyBooking.find({ date: { $gte: startOfYear, $lte: endOfYear } }).lean(),
    ]);

    const calculateProfit = (appts, bookings) => {
        const apptTotal = appts.reduce((sum, a) => sum + (a.bookingPrice || 0) + (a.extraPaid || 0) + (a.service?.price || 0), 0);
        const bookingTotal = bookings.reduce((sum, b) => sum + (b.bookingPrice || 0) + (b.extraPaid || 0), 0);
        return apptTotal + bookingTotal;
    };

    const monthDailyProfit = calculateProfit(monthlyAppts, monthlyBookings);
    const yearDailyProfit = calculateProfit(yearlyAppts, yearlyBookings);

    return res.status(200).json({
        success: true,
        data: {
            totalIncome: totalRevenue[0]?.total || 0,
            monthlyRevenue: thisMonthRevenue,
            revenueGrowth: revenueGrowth ? `${revenueGrowth}%` : 'N/A',
            totalPatients,
            newPatientsLastMonth: lastMonthPatients,
            completedAppointments,
            todayAppointments: todayAppointmentsList.length,
            todayDailyProfit,
            monthDailyProfit,
            yearDailyProfit,
            todayStats: {
                dailyBookings: {
                    count: todayDailyBookingsList.length,
                    bookingPrice: todayDailyBookingsBookingPrice,
                    extraPaid: todayDailyBookingsExtraPaid,
                    total: todayDailyBookingsTotal,
                },
                appointments: {
                    count: todayAppointmentsList.length,
                    bookingPrice: todayAppointmentsBookingPrice,
                    extraPaid: todayAppointmentsExtraPaid,
                    servicePrice: todayAppointmentsServicePrice,
                    total: todayAppointmentsTotal,
                }
            },
            completionRate: `${completionRate}%`,
            lowStockAlerts: lowStockItems,
            recentAppointments: todayAppointmentsList.slice(0, 10),
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

export const getDailyProfitDashboard = asynchandler(async (req, res) => {
    const { from, to, date } = req.query;

    let startDate, endDate;

    if (from || to) {
        startDate = from ? new Date(from) : new Date(0);
        startDate.setHours(0, 0, 0, 0);

        endDate = to ? new Date(to) : new Date();
        endDate.setHours(23, 59, 59, 999);
    } else {
        const targetDate = date ? new Date(date) : new Date();
        startDate = new Date(targetDate);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);
    }

    const [dailyBookings, appointments] = await Promise.all([
        DailyBooking.find({ date: { $gte: startDate, $lte: endDate } })
            .populate('createdBy', 'name role')
            .lean(),
        Appointment.find({ date: { $gte: startDate, $lte: endDate } })
            .populate('patient', 'name phone')
            .populate('service', 'name price')
            .populate('createdBy', 'name role')
            .lean(),
    ]);

    const dbBookingPrice = dailyBookings.reduce((sum, b) => sum + (b.bookingPrice || 0), 0);
    const dbExtraPaid = dailyBookings.reduce((sum, b) => sum + (b.extraPaid || 0), 0);
    const dbTotal = dbBookingPrice + dbExtraPaid;

    const appBookingPrice = appointments.reduce((sum, a) => sum + (a.bookingPrice || 0), 0);
    const appExtraPaid = appointments.reduce((sum, a) => sum + (a.extraPaid || 0), 0);
    const appServicePrice = appointments.reduce((sum, a) => sum + (a.service?.price || 0), 0);
    const appTotal = appBookingPrice + appExtraPaid + appServicePrice;

    const totalDailyProfit = dbTotal + appTotal;

    let breakdown = [];
    if (from || to) {
        const breakdownMap = {};
        
        const formatDateKey = (d) => {
            const dateObj = new Date(d);
            return dateObj.toISOString().split('T')[0];
        };

        dailyBookings.forEach(b => {
            const key = formatDateKey(b.date);
            if (!breakdownMap[key]) {
                breakdownMap[key] = { date: key, dailyBookingsCount: 0, dailyBookingsTotal: 0, appointmentsCount: 0, appointmentsTotal: 0, total: 0 };
            }
            breakdownMap[key].dailyBookingsCount += 1;
            breakdownMap[key].dailyBookingsTotal += (b.bookingPrice || 0) + (b.extraPaid || 0);
            breakdownMap[key].total += (b.bookingPrice || 0) + (b.extraPaid || 0);
        });

        appointments.forEach(a => {
            const key = formatDateKey(a.date);
            if (!breakdownMap[key]) {
                breakdownMap[key] = { date: key, dailyBookingsCount: 0, dailyBookingsTotal: 0, appointmentsCount: 0, appointmentsTotal: 0, total: 0 };
            }
            const apptTotal = (a.bookingPrice || 0) + (a.extraPaid || 0) + (a.service?.price || 0);
            breakdownMap[key].appointmentsCount += 1;
            breakdownMap[key].appointmentsTotal += apptTotal;
            breakdownMap[key].total += apptTotal;
        });

        breakdown = Object.values(breakdownMap).sort((a, b) => a.date.localeCompare(b.date));
    }

    return res.status(200).json({
        success: true,
        data: {
            period: {
                from: startDate.toISOString().split('T')[0],
                to: endDate.toISOString().split('T')[0]
            },
            dailyBookings: {
                count: dailyBookings.length,
                totalBookingPrice: dbBookingPrice,
                totalExtraPaid: dbExtraPaid,
                total: dbTotal,
                items: dailyBookings.map(b => ({
                    _id: b._id,
                    name: b.name,
                    phone: b.phone,
                    date: b.date,
                    bookingPrice: b.bookingPrice || 0,
                    extraPaid: b.extraPaid || 0,
                    total: (b.bookingPrice || 0) + (b.extraPaid || 0),
                    status: b.status,
                    createdBy: b.createdBy
                }))
            },
            appointments: {
                count: appointments.length,
                totalBookingPrice: appBookingPrice,
                totalExtraPaid: appExtraPaid,
                totalServicePrice: appServicePrice,
                total: appTotal,
                items: appointments.map(a => ({
                    _id: a._id,
                    patient: a.patient,
                    service: a.service,
                    date: a.date,
                    bookingPrice: a.bookingPrice || 0,
                    extraPaid: a.extraPaid || 0,
                    servicePrice: a.service?.price || 0,
                    total: (a.bookingPrice || 0) + (a.extraPaid || 0) + (a.service?.price || 0),
                    status: a.status,
                    createdBy: a.createdBy
                }))
            },
            totalDailyProfit,
            breakdown: breakdown.length > 0 ? breakdown : undefined
        }
    });
});

export const getBookingsAnalytics = asynchandler(async (req, res) => {
    const { from, to } = req.query;

    const startDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 6)); // Default last 7 days including today
    startDate.setHours(0, 0, 0, 0);

    const endDate = to ? new Date(to) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const [dailyBookings, appointments] = await Promise.all([
        DailyBooking.find({ date: { $gte: startDate, $lte: endDate } })
            .populate('createdBy', 'name role')
            .lean(),
        Appointment.find({ date: { $gte: startDate, $lte: endDate } })
            .populate('patient', 'name phone')
            .populate('service', 'name category price')
            .populate('createdBy', 'name role')
            .lean(),
    ]);

    const totalBookings = dailyBookings.length + appointments.length;

    const typeBreakdown = {
        appointments: appointments.length,
        dailyBookings: dailyBookings.length
    };

    const statusBreakdown = {
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        late: 0
    };

    const doctorBreakdown = {};
    const timeline = {};

    const processItem = (item, type) => {
        // Status
        if (item.status) {
            const statusKey = item.status === 'in-progress' ? 'inProgress' : item.status;
            statusBreakdown[statusKey] = (statusBreakdown[statusKey] || 0) + 1;
        }

        // Doctor/Creator
        if (item.createdBy && item.createdBy.name) {
            const creator = item.createdBy.name;
            if (!doctorBreakdown[creator]) doctorBreakdown[creator] = 0;
            doctorBreakdown[creator]++;
        }

        // Timeline (Daily)
        const dateKey = new Date(item.date || item.createdAt).toISOString().split('T')[0];
        if (!timeline[dateKey]) timeline[dateKey] = { date: dateKey, total: 0, appointments: 0, dailyBookings: 0 };
        timeline[dateKey].total++;
        if (type === 'appointment') timeline[dateKey].appointments++;
        if (type === 'dailyBooking') timeline[dateKey].dailyBookings++;
    };

    appointments.forEach(a => processItem(a, 'appointment'));
    dailyBookings.forEach(b => processItem(b, 'dailyBooking'));

    const timelineArray = Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date));
    const doctorArray = Object.entries(doctorBreakdown).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    return res.status(200).json({
        success: true,
        data: {
            period: { from: startDate.toISOString().split('T')[0], to: endDate.toISOString().split('T')[0] },
            totalBookings,
            typeBreakdown,
            statusBreakdown,
            doctorBreakdown: doctorArray,
            timeline: timelineArray
        }
    });
});
