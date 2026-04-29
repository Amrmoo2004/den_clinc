import { Router } from 'express';
import * as inventoryService from './inventory.service.js';
import { authUser } from '../../middlewares/authentaction.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: إدارة المخزون
 *
 * /api/inventory/stats:
 *   get:
 *     summary: إحصائيات المخزون
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: إجمالي الأصناف، أصناف منخفضة، نفذ المخزون
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalItems: { type: number }
 *                     lowStockItems: { type: number }
 *                     outOfStockItems: { type: number }
 *                     availableItems: { type: number }
 *
 * /api/inventory/logs:
 *   get:
 *     summary: سجل عمليات المخزون
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: item, schema: { type: string }, description: "فلترة حسب الصنف (ID)" }
 *       - { in: query, name: type, schema: { type: string, enum: [add, consume] } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 30 } }
 *     responses:
 *       200:
 *         description: سجل الإضافات والسحوبات
 *
 * /api/inventory/consume:
 *   post:
 *     summary: سحب / استهلاك كمية من صنف
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item, quantity]
 *             properties:
 *               item: { type: string, description: "ID الصنف" }
 *               quantity: { type: number, example: 2 }
 *               note: { type: string }
 *     responses:
 *       200:
 *         description: تم السحب بنجاح
 *       400:
 *         description: الكمية غير كافية
 *
 * /api/inventory/categories:
 *   get:
 *     summary: قائمة تصنيفات المخزون
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة الـ categories المتاحة
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { type: string }
 *                   example: ["مواد استهلاكية", "أدوات", "أجهزة", "أدوية"]
 *
 * /api/inventory:
 *   get:
 *     summary: جلب قائمة المخزون
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: category, schema: { type: string, enum: ["مواد استهلاكية", "أدوات", "أجهزة", "أدوية"] } }
 *       - { in: query, name: stockStatus, schema: { type: string, enum: [available, low, out] } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: قائمة أصناف المخزون
 *   post:
 *     summary: إضافة صنف جديد للمخزون
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, quantity]
 *             properties:
 *               name: { type: string, example: "بنج موضعي (ليجنوكايين)" }
 *               category: { type: string, enum: ["مواد استهلاكية", "أدوات", "أجهزة", "أدوية"] }
 *               quantity: { type: number }
 *               unit: { type: string, example: "علبة" }
 *               minQuantity: { type: number, example: 5 }
 *     responses:
 *       201:
 *         description: تم الإضافة
 *
 * /api/inventory/{id}:
 *   put:
 *     summary: تعديل صنف في المخزون
 *     tags: [Inventory]
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
 *               quantity: { type: number }
 *               unit: { type: string }
 *               minQuantity: { type: number }
 *     responses:
 *       200:
 *         description: تم التعديل
 *   delete:
 *     summary: حذف صنف من المخزون
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: تم الحذف
 */

router.get('/stats', authUser, inventoryService.getStats);
router.get('/categories', authUser, inventoryService.getCategories);
router.get('/logs', authUser, inventoryService.getLogs);
router.post('/consume', authUser, inventoryService.consume);
router.get('/', authUser, inventoryService.getAll);
router.post('/', authUser, inventoryService.create);
router.put('/:id', authUser, inventoryService.update);
router.delete('/:id', authUser, inventoryService.remove);

export default router;
