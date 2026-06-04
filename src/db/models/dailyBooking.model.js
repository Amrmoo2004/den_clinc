import mongoose from 'mongoose';

const dailyBookingSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        age: { type: Number },
        address: { type: String, trim: true },
        bookingTime: { type: Date, default: Date.now },
        date: { 
            type: Date, 
            default: () => {
                const d = new Date();
                d.setHours(0, 0, 0, 0);
                return d;
            } 
        },
        notes: { type: String, trim: true },
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
        status: {
            type: String,
            enum: ['pending', 'completed'],
            default: 'pending',
        },
        bookingPrice: { type: Number },
        extraPaid: { type: Number, default: 0 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export default mongoose.model('DailyBooking', dailyBookingSchema);
