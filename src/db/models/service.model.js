import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        category: {
            type: String,
            enum: ['عام', 'علاجي', 'وقائي', 'تجميلي'],
            default: 'عام',
        },
        price: { type: Number, required: true, min: 0 },
        description: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model('Service', serviceSchema);
