import Inventory from '../../db/models/inventory.model.js';
import InventoryLog from '../../db/models/inventoryLog.model.js';
import { AppError } from '../../utils/appError.js';
import { asynchandler } from '../../utils/response/response.js';

export const getStats = asynchandler(async (req, res) => {
    const allItems = await Inventory.find({}).lean();

    const stats = {
        totalItems: allItems.length,
        availableItems: allItems.filter(i => i.quantity > i.minQuantity).length,
        lowStockItems: allItems.filter(i => i.quantity > 0 && i.quantity <= i.minQuantity).length,
        outOfStockItems: allItems.filter(i => i.quantity === 0).length,
    };

    return res.status(200).json({ success: true, data: stats });
});

const CATEGORIES = ['مواد استهلاكية', 'أدوات', 'أجهزة', 'أدوية'];

export const getCategories = asynchandler(async (req, res) => {
    return res.status(200).json({ success: true, data: CATEGORIES });
});

export const getLogs = asynchandler(async (req, res) => {
    const { item, type, page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (item) filter.item = item;
    if (type) filter.type = type;

    const [data, total] = await Promise.all([
        InventoryLog.find(filter)
            .populate('item', 'name category unit')
            .populate('createdBy', 'name role')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean(),
        InventoryLog.countDocuments(filter),
    ]);

    return res.status(200).json({
        success: true,
        data,
        stats: { total, page: parseInt(page), limit: parseInt(limit) },
    });
});

export const consume = asynchandler(async (req, res, next) => {
    const { item, quantity, note } = req.body;

    if (!item || !quantity || quantity <= 0) {
        return next(new AppError('الصنف والكمية مطلوبان', 400));
    }

    const inventoryItem = await Inventory.findById(item);
    if (!inventoryItem) return next(new AppError('الصنف غير موجود', 404));

    if (inventoryItem.quantity < quantity) {
        return next(new AppError(`الكمية غير كافية — المتاح: ${inventoryItem.quantity} ${inventoryItem.unit}`, 400));
    }

    inventoryItem.quantity -= quantity;
    await inventoryItem.save();

    await InventoryLog.create({
        item, type: 'consume', quantity, note,
        createdBy: req.user._id,
    });

    return res.status(200).json({
        success: true,
        message: 'تم تسجيل الاستهلاك',
        data: {
            itemName: inventoryItem.name,
            consumed: quantity,
            remaining: inventoryItem.quantity,
            unit: inventoryItem.unit,
            stockStatus: inventoryItem.quantity === 0 ? 'out' : inventoryItem.quantity <= inventoryItem.minQuantity ? 'low' : 'available',
        },
    });
});

export const getAll = asynchandler(async (req, res) => {
    const { category, stockStatus, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    let data = await Inventory.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean();

    // Filter by stockStatus after retrieval (it's a virtual)
    if (stockStatus) {
        data = data.filter(item => {
            if (stockStatus === 'out') return item.quantity === 0;
            if (stockStatus === 'low') return item.quantity > 0 && item.quantity <= item.minQuantity;
            if (stockStatus === 'available') return item.quantity > item.minQuantity;
            return true;
        });
    }

    const total = await Inventory.countDocuments(filter);

    return res.status(200).json({
        success: true,
        data,
        stats: { total, page: parseInt(page), limit: parseInt(limit) },
    });
});

export const create = asynchandler(async (req, res, next) => {
    const { name, category, quantity, unit, minQuantity } = req.body;

    if (!name || quantity === undefined) {
        return next(new AppError('الاسم والكمية مطلوبان', 400));
    }

    const item = await Inventory.create({
        name, category, quantity, unit, minQuantity,
        createdBy: req.user._id,
    });

    // Log the initial addition
    await InventoryLog.create({
        item: item._id,
        type: 'add',
        quantity,
        note: 'إضافة أولية للمخزون',
        createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, message: 'تم إضافة الصنف للمخزون', data: item });
});

export const update = asynchandler(async (req, res, next) => {
    const { name, category, quantity, unit, minQuantity } = req.body;

    const item = await Inventory.findById(req.params.id);
    if (!item) return next(new AppError('الصنف غير موجود', 404));

    // Log quantity change
    if (quantity !== undefined && quantity !== item.quantity) {
        const diff = quantity - item.quantity;
        await InventoryLog.create({
            item: item._id,
            type: diff > 0 ? 'add' : 'consume',
            quantity: Math.abs(diff),
            note: 'تعديل يدوي للكمية',
            createdBy: req.user._id,
        });
    }

    const updated = await Inventory.findByIdAndUpdate(
        req.params.id,
        { name, category, quantity, unit, minQuantity },
        { new: true, runValidators: true }
    );

    return res.status(200).json({ success: true, message: 'تم التعديل', data: updated });
});

export const remove = asynchandler(async (req, res, next) => {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return next(new AppError('الصنف غير موجود', 404));

    return res.status(200).json({ success: true, message: 'تم حذف الصنف' });
});
