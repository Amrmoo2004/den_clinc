import mongoose from 'mongoose';

const treatmentPlanSchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
        services: [
            {
                service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
                price: { type: Number, default: 0 },
                notes: { type: String, trim: true },
                status: {
                    type: String,
                    enum: ['pending', 'in-progress', 'completed'],
                    default: 'pending',
                },
            },
        ],
        totalCost: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['active', 'completed', 'cancelled'],
            default: 'active',
        },
        notes: { type: String, trim: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

treatmentPlanSchema.pre('save', function () {
    this.totalCost = this.services.reduce((sum, s) => sum + (s.price || 0), 0);
});

export default mongoose.model('TreatmentPlan', treatmentPlanSchema);
