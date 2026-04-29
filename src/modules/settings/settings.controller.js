import { Router } from 'express';
import * as settingsService from './settings.service.js';
import { authUser } from '../../middlewares/authentaction.js';
import { isAuthorized } from '../../middlewares/allowed.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: إعدادات النظام — أسعار الخدمات وإدارة المستخدمين
 *
 * /api/settings/services:
 *   get:
 *     summary: جلب قائمة الخدمات
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: category, schema: { type: string } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: isActive, schema: { type: boolean } }
 *     responses:
 *       200:
 *         description: قائمة الخدمات مع التصنيف والسعر
 *   post:
 *     summary: إضافة خدمة جديدة
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name: { type: string, example: "كشف دوري" }
 *               category: { type: string, enum: ["عام", "علاجي", "وقائي", "تجميلي"], default: "عام" }
 *               price: { type: number, example: 200 }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: تم إضافة الخدمة
 *
 * /api/settings/services/{id}:
 *   put:
 *     summary: تعديل خدمة
 *     tags: [Settings]
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
 *               category: { type: string }
 *               price: { type: number }
 *               description: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: تم التعديل
 *   delete:
 *     summary: حذف خدمة
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: تم الحذف
 *
 * /api/settings/users:
 *   get:
 *     summary: جلب قائمة المستخدمين (الدكتور فقط)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة الموظفين والأطباء
 *   post:
 *     summary: إضافة مستخدم جديد (الدكتور فقط)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               role: { type: string, enum: [doctor, receptionist] }
 *     responses:
 *       201:
 *         description: تم إضافة المستخدم
 *
 * /api/settings/users/{id}:
 *   patch:
 *     summary: تفعيل / إيقاف مستخدم (الدكتور فقط)
 *     tags: [Settings]
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
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: تم تحديث الحالة
 *   delete:
 *     summary: حذف مستخدم (الدكتور فقط)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: تم الحذف
 */

// Services routes (all authenticated)
router.get('/services', authUser, settingsService.getAllServices);
router.post('/services', authUser, settingsService.createService);
router.put('/services/:id', authUser, settingsService.updateService);
router.delete('/services/:id', authUser, settingsService.deleteService);

// Users routes (doctor only)
router.get('/users', authUser, isAuthorized(['doctor']), settingsService.getAllUsers);
router.post('/users', authUser, isAuthorized(['doctor']), settingsService.createUser);
router.patch('/users/:id', authUser, isAuthorized(['doctor']), settingsService.toggleUserStatus);
router.delete('/users/:id', authUser, isAuthorized(['doctor']), settingsService.deleteUser);

export default router;
