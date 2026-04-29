import { Router } from 'express';
import * as patientsService from './patients.service.js';
import { authUser } from '../../middlewares/authentaction.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: إدارة المرضى
 *
 * /api/patients:
 *   get:
 *     summary: جلب قائمة المرضى
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: search, schema: { type: string }, description: "بحث بالاسم أو رقم الهاتف" }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: قائمة المرضى
 *   post:
 *     summary: إضافة مريض جديد
 *     tags: [Patients]
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
 *               name: { type: string, example: "أحمد محمد علي" }
 *               phone: { type: string, example: "01012345678" }
 *               dateOfBirth: { type: string, format: date, example: "1990-05-15" }
 *               gender: { type: string, enum: [male, female] }
 *               address: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: تم إضافة المريض بنجاح
 *
 * /api/patients/{id}:
 *   get:
 *     summary: جلب بيانات مريض
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: بيانات المريض
 *       404:
 *         description: المريض غير موجود
 *   put:
 *     summary: تعديل بيانات مريض
 *     tags: [Patients]
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
 *               dateOfBirth: { type: string, format: date }
 *               gender: { type: string, enum: [male, female] }
 *               address: { type: string }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: تم التعديل
 *   delete:
 *     summary: حذف مريض
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: تم الحذف
 *
 * /api/patients/{id}/reports:
 *   get:
 *     summary: جلب التقارير الطبية لمريض
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: سجل طبي كامل للمريض (مواعيد، خطط علاجية، فواتير)
 */

router.get('/', authUser, patientsService.getAll);
router.post('/', authUser, patientsService.create);
router.get('/:id', authUser, patientsService.getOne);
router.put('/:id', authUser, patientsService.update);
router.delete('/:id', authUser, patientsService.remove);
router.get('/:id/reports', authUser, patientsService.getReports);

export default router;
