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
 */

router.get('/dashboard', authUser, reportsService.getDashboard);
router.get('/top-services', authUser, reportsService.getTopServices);
router.get('/export', authUser, reportsService.exportReport);

export default router;
