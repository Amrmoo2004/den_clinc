import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema(
    {
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
        type: { type: String, enum: ['add', 'consume'], required: true },
        quantity: { type: Number, required: true },
        note: { type: String, trim: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export default mongoose.model('InventoryLog', inventoryLogSchema);
