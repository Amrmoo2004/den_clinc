import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
    {
        bookingPrice: { 
            type: Number, 
            required: true, 
            default: 100 
        }
    },
    { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);
