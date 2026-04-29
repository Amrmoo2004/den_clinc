import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        category: {
            type: String,
            enum: ['مواد استهلاكية', 'أدوات', 'أجهزة', 'أدوية'],
            default: 'مواد استهلاكية',
        },
        quantity: { type: Number, required: true, default: 0, min: 0 },
        unit: { type: String, default: 'قطعة', trim: true },
        minQuantity: { type: Number, default: 5 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

inventorySchema.virtual('stockStatus').get(function () {
    if (this.quantity === 0) return 'out';
    if (this.quantity <= this.minQuantity) return 'low';
    return 'available';
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

export default mongoose.model('Inventory', inventorySchema);
