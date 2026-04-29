import { Router } from 'express';
import * as treatmentsService from './treatments.service.js';
import { authUser } from '../../middlewares/authentaction.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Treatments
 *   description: الخطط العلاجية
 *
 * /api/treatment-plans:
 *   get:
 *     summary: جلب الخطط العلاجية
 *     tags: [Treatments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [active, completed, cancelled] } }
 *       - { in: query, name: patient, schema: { type: string }, description: "فلترة حسب المريض (ID)" }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: قائمة الخطط العلاجية
 *   post:
 *     summary: إنشاء خطة علاجية جديدة
 *     tags: [Treatments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient, services]
 *             properties:
 *               patient: { type: string, description: "ID المريض" }
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     service: { type: string, description: "ID الخدمة" }
 *                     price: { type: number }
 *                     notes: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: تم إنشاء الخطة
 *
 * /api/treatment-plans/{id}:
 *   get:
 *     summary: جلب خطة علاجية
 *     tags: [Treatments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: تفاصيل الخطة
 *   put:
 *     summary: تعديل خطة علاجية
 *     tags: [Treatments]
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
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     service: { type: string }
 *                     price: { type: number }
 *                     notes: { type: string }
 *                     status: { type: string, enum: [pending, in-progress, completed] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: تم التعديل
 *
 * /api/treatment-plans/{id}/status:
 *   patch:
 *     summary: تغيير حالة الخطة
 *     tags: [Treatments]
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
 *               status: { type: string, enum: [active, completed, cancelled] }
 *     responses:
 *       200:
 *         description: تم تغيير الحالة
 */

router.get('/', authUser, treatmentsService.getAll);
router.post('/', authUser, treatmentsService.create);
router.get('/:id', authUser, treatmentsService.getOne);
router.put('/:id', authUser, treatmentsService.update);
router.patch('/:id/status', authUser, treatmentsService.updateStatus);

export default router;
