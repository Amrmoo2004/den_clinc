import { Router } from 'express';
import * as appointmentsService from './appointments.service.js';
import { authUser } from '../../middlewares/authentaction.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: إدارة المواعيد
 *
 * /api/appointments:
 *   get:
 *     summary: جلب المواعيد
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: view, schema: { type: string, enum: [day, week, all], default: day }, description: "طريقة العرض" }
 *       - { in: query, name: date, schema: { type: string, format: date, example: "2024-01-15" }, description: "تاريخ محدد YYYY-MM-DD" }
 *       - { in: query, name: status, schema: { type: string, enum: [pending, in-progress, completed, cancelled, late] } }
 *     responses:
 *       200:
 *         description: قائمة المواعيد
 *   post:
 *     summary: حجز موعد جديد
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient, service, date, startTime]
 *             properties:
 *               patient: { type: string, description: "ID المريض" }
 *               service: { type: string, description: "ID الخدمة" }
 *               date: { type: string, format: date }
 *               startTime: { type: string, example: "10:30" }
 *               endTime: { type: string, example: "11:00" }
 *               doctorNote: { type: string }
 *               record:
 *                 type: object
 *                 description: السجل المرضي والإجراءات
 *                 properties:
 *                   medicalHistory:
 *                     type: object
 *                     properties:
 *                       hasChronicDisease: { type: boolean }
 *                       chronicDiseases: { type: array, items: { type: string } }
 *                       isTakingMedication: { type: boolean }
 *                       medications: { type: string }
 *                   dentalChart:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         toothNumber: { type: string }
 *                         complain: { type: string }
 *                         cost: { type: number }
 *                   procedures:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         date: { type: string, format: date-time }
 *                         procedure: { type: string }
 *                         totalCost: { type: number }
 *                         paid: { type: number }
 *                         remaining: { type: number }
 *     responses:
 *       201:
 *         description: تم حجز الموعد
 *
 * /api/appointments/{id}:
 *   get:
 *     summary: جلب موعد محدد
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: تفاصيل الموعد
 *   put:
 *     summary: تعديل موعد
 *     tags: [Appointments]
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
 *               date: { type: string, format: date }
 *               startTime: { type: string }
 *               endTime: { type: string }
 *               doctorNote: { type: string }
 *               record:
 *                 type: object
 *                 properties:
 *                   medicalHistory:
 *                     type: object
 *                     properties:
 *                       hasChronicDisease: { type: boolean }
 *                       chronicDiseases: { type: array, items: { type: string } }
 *                       isTakingMedication: { type: boolean }
 *                       medications: { type: string }
 *                   dentalChart:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         toothNumber: { type: string }
 *                         complain: { type: string }
 *                         cost: { type: number }
 *                   procedures:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         date: { type: string, format: date-time }
 *                         procedure: { type: string }
 *                         totalCost: { type: number }
 *                         paid: { type: number }
 *                         remaining: { type: number }
 *     responses:
 *       200:
 *         description: تم التعديل
 *   delete:
 *     summary: حذف / إلغاء موعد
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: تم الإلغاء
 *
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: تغيير حالة الموعد
 *     tags: [Appointments]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed, cancelled, late]
 *     responses:
 *       200:
 *         description: تم تغيير الحالة
 */

router.get('/', authUser, appointmentsService.getAll);
router.post('/', authUser, appointmentsService.create);
router.get('/:id', authUser, appointmentsService.getOne);
router.put('/:id', authUser, appointmentsService.update);
router.patch('/:id/status', authUser, appointmentsService.updateStatus);
router.delete('/:id', authUser, appointmentsService.remove);

export default router;
