import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: { type: String, unique: true },
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
        appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
        treatmentPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'TreatmentPlan' },
        items: [
            {
                service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
                name: { type: String },
                price: { type: Number, default: 0 },
            },
        ],
        totalAmount: { type: Number, required: true, min: 0 },
        paidAmount: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['paid', 'partial', 'unpaid'],
            default: 'unpaid',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'transfer'],
            default: 'cash',
        },
        notes: { type: String, trim: true },
        installments: [
            {
                amount: { type: Number, required: true },
                dueDate: { type: Date, required: true },
                status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
                paidDate: { type: Date },
                paymentMethod: { type: String, enum: ['cash', 'card', 'transfer'] },
            },
        ],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

invoiceSchema.pre('save', async function () {
    if (!this.invoiceNumber) {
        const count = await mongoose.model('Invoice').countDocuments();
        this.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }
    // Auto-compute status
    if (this.paidAmount >= this.totalAmount) {
        this.status = 'paid';
    } else if (this.paidAmount > 0) {
        this.status = 'partial';
    } else {
        this.status = 'unpaid';
    }
});

export default mongoose.model('Invoice', invoiceSchema);
