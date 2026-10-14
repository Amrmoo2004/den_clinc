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
 *
 * /api/patients/{id}/dental-chart:
 *   get:
 *     summary: جلب مخطط الأسنان الكامل للمريض (Dental Chart - 32 سن)
 *     description: يعرض الـ 32 سن كاملة مقسمة (الفك العلوي والفك السفلي) مع تفاصيل الشكوى (Complaint) والتكلفة (Cost) لكل سن وإجمالي التكاليف
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string }, description: "ID المريض" }
 *     responses:
 *       200:
 *         description: تم جلب مخطط الأسنان بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     patientId: { type: string }
 *                     patientName: { type: string }
 *                     patientCode: { type: string }
 *                     dentalChart:
 *                       type: array
 *                       description: قائمة الـ 32 سن
 *                       items:
 *                         type: object
 *                         properties:
 *                           toothNumber: { type: string, example: "UR1" }
 *                           tooth: { type: string, example: "UR1" }
 *                           complaint: { type: string, example: "لا توجد شكوى" }
 *                           complain: { type: string, example: "لا توجد شكوى" }
 *                           cost: { type: number, example: 0 }
 *                           notes: { type: string, example: "" }
 *                           status: { type: string, example: "healthy" }
 *                           jaw: { type: string, example: "upper" }
 *                           quadrant: { type: string, example: "UR" }
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalTeeth: { type: integer, example: 32 }
 *                         totalCost: { type: number, example: 500 }
 *                         teethWithComplaints: { type: integer, example: 1 }
 *                         teethWithCost: { type: integer, example: 1 }
 *                         affectedTeethCount: { type: integer, example: 1 }
 *       404:
 *         description: المريض غير موجود
 *   put:
 *     summary: تحديث / حفظ مخطط الأسنان بالكامل أو مجموعة أسنان (Dental Chart)
 *     description: حفظ وتحديث الشكوى (Complaint) والتكلفة (Cost) لأسنان المريض
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string }, description: "ID المريض" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dentalChart:
 *                 type: array
 *                 description: قائمة الأسنان المراد تحديثها
 *                 items:
 *                   type: object
 *                   required: [toothNumber]
 *                   properties:
 *                     toothNumber: { type: string, example: "UR1", description: "رمز السن (UR1..UR8, UL1..UL8, LR1..LR8, LL1..LL8)" }
 *                     complaint: { type: string, example: "تسوس حاد", description: "الشكوى" }
 *                     cost: { type: number, example: 500, description: "التكلفة" }
 *                     notes: { type: string, example: "ملاحظات إضافية" }
 *           example:
 *             dentalChart:
 *               - toothNumber: "UR1"
 *                 complaint: "تسوس حاد"
 *                 cost: 500
 *               - toothNumber: "UL2"
 *                 complaint: "كسر في السن"
 *                 cost: 350
 *     responses:
 *       200:
 *         description: تم حفظ مخطط الأسنان بنجاح
 *       404:
 *         description: المريض غير موجود
 *   delete:
 *     summary: إعادة ضبط مخطط الأسنان للحالة الافتراضية
 *     description: يعيد تعيين جميع الـ 32 سن إلى الحالة الطبيعية (لا توجد شكوى، تكلفة 0)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string }, description: "ID المريض" }
 *     responses:
 *       200:
 *         description: تمت إعادة ضبط مخطط الأسنان بنجاح
 *       404:
 *         description: المريض غير موجود
 *
 * /api/patients/{id}/dental-chart/{tooth}:
 *   put:
 *     summary: تحديث سن محدد في مخطط الأسنان
 *     description: تعديل الشكوى والتكلفة لسن واحد فقط برمز السن (UR1, UL3, LR5, إلخ)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string }, description: "ID المريض" }
 *       - { in: path, name: tooth, required: true, schema: { type: string, example: "UR1" }, description: "رمز السن" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               complaint: { type: string, example: "ألم مع المشروبات الباردة", description: "الشكوى" }
 *               cost: { type: number, example: 300, description: "التكلفة" }
 *               notes: { type: string, example: "ملاحظات" }
 *     responses:
 *       200:
 *         description: تم تحديث بيانات السن بنجاح
 *       400:
 *         description: رمز السن غير صحيح
 *       404:
 *         description: المريض غير موجود
 *   patch:
 *     summary: تعديل جزئي لسن محدد في مخطط الأسنان
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: tooth, required: true, schema: { type: string, example: "UR1" } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               complaint: { type: string }
 *               cost: { type: number }
 *     responses:
 *       200:
 *         description: تم التعديل
 */

router.get('/', authUser, patientsService.getAll);
router.post('/', authUser, patientsService.create);
router.get('/:id', authUser, patientsService.getOne);
router.put('/:id', authUser, patientsService.update);
router.delete('/:id', authUser, patientsService.remove);
router.get('/:id/reports', authUser, patientsService.getReports);

// Dental Chart routes
router.get('/:id/dental-chart', authUser, patientsService.getDentalChart);
router.put('/:id/dental-chart', authUser, patientsService.updateDentalChart);
router.patch('/:id/dental-chart', authUser, patientsService.updateDentalChart);
router.post('/:id/dental-chart', authUser, patientsService.updateDentalChart);
router.put('/:id/dental-chart/:tooth', authUser, patientsService.updateSingleTooth);
router.patch('/:id/dental-chart/:tooth', authUser, patientsService.updateSingleTooth);
router.delete('/:id/dental-chart', authUser, patientsService.resetDentalChart);

export default router;

