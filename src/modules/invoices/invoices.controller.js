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
 *
 * /api/invoices/installments/upcoming:
 *   get:
 *     summary: جلب الأقساط القادمة غير المدفوعة لجميع المرضى
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date }, description: "من تاريخ استحقاق YYYY-MM-DD" }
 *       - { in: query, name: to, schema: { type: string, format: date }, description: "إلى تاريخ استحقاق YYYY-MM-DD" }
 *       - { in: query, name: patient, schema: { type: string }, description: "ID المريض للتصفية" }
 *     responses:
 *       200:
 *         description: قائمة الأقساط القادمة
 *
 * /api/invoices/{id}/installments:
 *   post:
 *     summary: توليد/جدولة أقساط لفاتورة
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numberOfInstallments: { type: integer, example: 3, description: "عدد الأقساط للتقسيم التلقائي" }
 *               startDate: { type: string, format: date, example: "2024-05-20", description: "تاريخ استحقاق أول قسط" }
 *               intervalMonths: { type: integer, default: 1, description: "الفاصل الزمني بالأشهر" }
 *               installmentsList:
 *                 type: array
 *                 description: قائمة الأقساط يدويًا (في حال لم تستخدم التقسيم التلقائي)
 *                 items:
 *                   type: object
 *                   properties:
 *                     amount: { type: number, example: 500 }
 *                     dueDate: { type: string, format: date, example: "2024-06-20" }
 *     responses:
 *       200:
 *         description: تم إنشاء خطة الأقساط بنجاح
 *
 * /api/invoices/{id}/installments/{installmentId}/pay:
 *   patch:
 *     summary: سداد قسط محدد في فاتورة
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: installmentId, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod: { type: string, enum: [cash, card, transfer], default: "cash" }
 *     responses:
 *       200:
 *         description: تم سداد القسط بنجاح
 */

router.get('/stats', authUser, invoicesService.getStats);
router.get('/export', authUser, invoicesService.exportInvoices);
router.get('/installments/upcoming', authUser, invoicesService.getUpcomingInstallments);
router.get('/', authUser, invoicesService.getAll);
router.post('/', authUser, invoicesService.create);
router.get('/:id', authUser, invoicesService.getOne);
router.patch('/:id/payment', authUser, invoicesService.recordPayment);
router.post('/:id/installments', authUser, invoicesService.generateInstallments);
router.patch('/:id/installments/:installmentId/pay', authUser, invoicesService.payInstallment);

export default router;
