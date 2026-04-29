import { Router } from 'express';
import * as invoicesService from './invoices.service.js';
import { authUser } from '../../middlewares/authentaction.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: الفواتير والمدفوعات
 *
 * /api/invoices/stats:
 *   get:
 *     summary: إحصائيات الفواتير
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: إجمالي الدخل، تحصيل اليوم، المبالغ المتبقية، فواتير مكتملة
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
 *                     todayCollection: { type: number }
 *                     remainingAmounts: { type: number }
 *                     completedInvoices: { type: number }
 *                     totalInvoices: { type: number }
 *
 * /api/invoices/export:
 *   get:
 *     summary: تصدير الفواتير
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: status, schema: { type: string, enum: [paid, partial, unpaid] } }
 *     responses:
 *       200:
 *         description: بيانات الفواتير للتصدير
 *
 * /api/invoices:
 *   get:
 *     summary: جلب قائمة الفواتير
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [paid, partial, unpaid] } }
 *       - { in: query, name: patient, schema: { type: string } }
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: قائمة الفواتير
 *   post:
 *     summary: إنشاء فاتورة جديدة
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient, totalAmount]
 *             properties:
 *               patient: { type: string, description: "ID المريض" }
 *               appointment: { type: string, description: "ID الموعد (اختياري)" }
 *               treatmentPlan: { type: string, description: "ID الخطة (اختياري)" }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     service: { type: string }
 *                     name: { type: string }
 *                     price: { type: number }
 *               totalAmount: { type: number }
 *               paidAmount: { type: number, default: 0 }
 *               paymentMethod: { type: string, enum: [cash, card, transfer] }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: تم إنشاء الفاتورة
 *
 * /api/invoices/{id}:
 *   get:
 *     summary: جلب فاتورة محددة
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: تفاصيل الفاتورة
 *
 * /api/invoices/{id}/payment:
 *   patch:
 *     summary: تسجيل دفعة على الفاتورة
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number, description: "المبلغ المدفوع" }
 *               paymentMethod: { type: string, enum: [cash, card, transfer] }
 *     responses:
 *       200:
 *         description: تم تسجيل الدفعة
 */

router.get('/stats', authUser, invoicesService.getStats);
router.get('/export', authUser, invoicesService.exportInvoices);
router.get('/', authUser, invoicesService.getAll);
router.post('/', authUser, invoicesService.create);
router.get('/:id', authUser, invoicesService.getOne);
router.patch('/:id/payment', authUser, invoicesService.recordPayment);

export default router;
