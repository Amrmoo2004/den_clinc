import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
    {
        patientCode: { type: String, unique: true },
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        dateOfBirth: { type: Date },
        gender: { type: String, enum: ['male', 'female'], default: 'male' },
        address: { type: String, trim: true },
        notes: { type: String, trim: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

patientSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    return Math.floor((Date.now() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
});

patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

patientSchema.pre('save', async function () {
    if (!this.patientCode) {
        const count = await mongoose.model('Patient').countDocuments();
        this.patientCode = `PT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }
});

export default mongoose.model('Patient', patientSchema);
