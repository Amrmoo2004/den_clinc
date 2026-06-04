import { Router } from 'express';
import * as reportsService from './reports.service.js';
import { authUser } from '../../middlewares/authentaction.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: التقارير والإحصائيات
 *
 * /api/reports/dashboard:
 *   get:
 *     summary: مؤشرات لوحة التحكم الرئيسية
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: إجمالي الدخل، عدد المرضى، المواعيد المكتملة مقارنة بالشهر الماضي
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome: { type: number }
 *                     totalPatients: { type: number }
 *                     completedAppointments: { type: number }
 *                     monthlyRevenue: { type: number }
 *                     todayAppointments: { type: number }
 *                     lowStockAlerts: { type: number }
 *                     completionRate: { type: number }
 *                     recentAppointments:
 *                       type: array
 *                       items: { type: object }
 *
 * /api/reports/top-services:
 *   get:
 *     summary: أكثر الخدمات طلباً
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: قائمة الخدمات مع مرات الاستخدام والإيراد والنسبة
 *
 * /api/reports/export:
 *   get:
 *     summary: تصدير التقرير التحليلي
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: بيانات التقرير الكاملة
 *
 * /api/reports/daily-profit-dashboard:
 *   get:
 *     summary: لوحة تحكم الربح اليومي
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: date, schema: { type: string, format: date }, description: "تاريخ محدد YYYY-MM-DD (افتراضيا اليوم)" }
 *       - { in: query, name: from, schema: { type: string, format: date }, description: "بداية الفترة YYYY-MM-DD" }
 *       - { in: query, name: to, schema: { type: string, format: date }, description: "نهاية الفترة YYYY-MM-DD" }
 *     responses:
 *       200:
 *         description: تفاصيل الربح اليومي من الحجوزات والمواعيد
 * /api/reports/bookings-analytics:
 *   get:
 *     summary: تحليلات وتقسيمات الحجوزات (الداشبورد)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date }, description: "بداية الفترة YYYY-MM-DD" }
 *       - { in: query, name: to, schema: { type: string, format: date }, description: "نهاية الفترة YYYY-MM-DD" }
 *     responses:
 *       200:
 *         description: تحليلات مفصلة للحجوزات تشمل (باليوم، بالحالة، بالنوع، بالطبيب)
 */

router.get('/dashboard', authUser, reportsService.getDashboard);
router.get('/top-services', authUser, reportsService.getTopServices);
router.get('/export', authUser, reportsService.exportReport);
router.get('/daily-profit-dashboard', authUser, reportsService.getDailyProfitDashboard);
router.get('/bookings-analytics', authUser, reportsService.getBookingsAnalytics);

export default router;
