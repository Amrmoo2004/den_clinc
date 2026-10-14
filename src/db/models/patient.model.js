import mongoose from 'mongoose';
import { generateDefaultDentalChart } from '../../utils/dentalChart.js';

const toothSchema = new mongoose.Schema(
    {
        toothNumber: { type: String, required: true },
        tooth: { type: String },
        complaint: { type: String, default: 'لا توجد شكوى', trim: true },
        complain: { type: String, default: 'لا توجد شكوى', trim: true },
        cost: { type: Number, default: 0 },
        notes: { type: String, trim: true, default: '' },
        status: { type: String, default: 'healthy' },
        jaw: { type: String, enum: ['upper', 'lower'] },
        quadrant: { type: String, enum: ['UR', 'UL', 'LR', 'LL'] },
    },
    { _id: false }
);

const patientSchema = new mongoose.Schema(
    {
        patientCode: { type: String, unique: true },
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        dateOfBirth: { type: Date },
        gender: { type: String, enum: ['male', 'female'], default: 'male' },
        address: { type: String, trim: true },
        notes: { type: String, trim: true },
        dentalChart: {
            type: [toothSchema],
            default: () => generateDefaultDentalChart(),
        },
        record: {
            medicalHistory: {
                hasChronicDisease: { type: Boolean, default: false },
                chronicDiseases: [{ type: String }],
                isTakingMedication: { type: Boolean, default: false },
                medications: { type: String, trim: true },
            },
            dentalChart: [toothSchema],
            procedures: [
                {
                    date: { type: Date },
                    procedure: { type: String },
                    totalCost: { type: Number },
                    paid: { type: Number },
                    remaining: { type: Number },
                },
            ],
        },
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
    if (!this.dentalChart || this.dentalChart.length === 0) {
        this.dentalChart = generateDefaultDentalChart();
    }
    if (this.record) {
        this.record.dentalChart = this.dentalChart;
    }
});

export default mongoose.model('Patient', patientSchema);

