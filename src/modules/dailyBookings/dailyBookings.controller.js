import { Router } from 'express';
import * as dailyBookingsService from './dailyBookings.service.js';
import { authUser } from '../../middlewares/authentaction.js'; // Notice the typo in directory name 'authentaction.js' is how it is spelled in appointments.controller.js

const router = Router();

/**
 * @swagger
 * tags:
 *   name: DailyBookings
 *   description: الحجوزات اليومية السريعة
 *
 * /api/daily-bookings:
 *   get:
 *     summary: جلب الحجوزات اليومية
 *     tags: [DailyBookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: date, schema: { type: string, format: date, example: "2024-01-15" }, description: "تاريخ محدد YYYY-MM-DD (افتراضيا يجلب حجوزات اليوم الحالي فقط)" }
 *     responses:
 *       200:
 *         description: قائمة الحجوزات
 *   post:
 *     summary: إضافة حجز يومي جديد
 *     tags: [DailyBookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name: { type: string, description: "اسم المريض" }
 *               phone: { type: string, description: "رقم الهاتف" }
 *               address: { type: string, description: "العنوان" }
 *               notes: { type: string, description: "ملاحظات" }
 *               bookingTime: { type: string, format: date-time, description: "وقت الحجز (اختياري، افتراضيا الوقت الحالي)" }
 *     responses:
 *       201:
 *         description: تم تسجيل الحجز
 *
 * /api/daily-bookings/{id}:
 *   put:
 *     summary: تعديل حجز يومي
 *     tags: [DailyBookings]
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
 *               name: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: تم التعديل
 *   delete:
 *     summary: حذف حجز يومي
 *     tags: [DailyBookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: تم الحذف
 */

router.get('/', authUser, dailyBookingsService.getDailyBookings);
router.post('/', authUser, dailyBookingsService.createDailyBooking);
router.put('/:id', authUser, dailyBookingsService.updateDailyBooking);
router.delete('/:id', authUser, dailyBookingsService.removeDailyBooking);

export default router;
