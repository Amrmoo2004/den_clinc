import mongoose from 'mongoose';

const dailyBookingSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
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
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export default mongoose.model('DailyBooking', dailyBookingSchema);
