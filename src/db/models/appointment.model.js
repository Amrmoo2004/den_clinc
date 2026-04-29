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
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export default mongoose.model('Appointment', appointmentSchema);
