import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
        service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'cancelled', 'late'],
            default: 'pending',
        },
        doctorNote: { type: String, trim: true },
        record: {
            medicalHistory: {
                hasChronicDisease: { type: Boolean, default: false },
                chronicDiseases: [{ type: String }],
                isTakingMedication: { type: Boolean, default: false },
                medications: { type: String, trim: true }
            },
            dentalChart: [{
                toothNumber: { type: String },
                complain: { type: String },
                cost: { type: Number }
            }],
            procedures: [{
                date: { type: Date },
                procedure: { type: String },
                totalCost: { type: Number },
                paid: { type: Number },
                remaining: { type: Number }
            }]
        },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export default mongoose.model('Appointment', appointmentSchema);
