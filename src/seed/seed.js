/**
 * Seed Script — بيانات تجريبية شاملة للعيادة
 * تشغيل: node src/seed/seed.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../db/models/user.model.js';
import Service from '../db/models/service.model.js';
import Patient from '../db/models/patient.model.js';
import Inventory from '../db/models/inventory.model.js';
import InventoryLog from '../db/models/inventoryLog.model.js';
import Appointment from '../db/models/appointment.model.js';
import TreatmentPlan from '../db/models/treatmentPlan.model.js';
import Invoice from '../db/models/invoice.model.js';

await mongoose.connect(process.env.URL_DATABASE);
console.log('✅ Connected to database');

// ── 1. CLEAR ALL COLLECTIONS ──────────────────────────────────────────────────
await Promise.all([
    User.deleteMany({}),
    Service.deleteMany({}),
    Patient.deleteMany({}),
    Inventory.deleteMany({}),
    InventoryLog.deleteMany({}),
    Appointment.deleteMany({}),
    TreatmentPlan.deleteMany({}),
    Invoice.deleteMany({}),
]);
console.log('🗑️  Cleared all collections');

// ── 2. USERS ──────────────────────────────────────────────────────────────────
const salt = parseInt(process.env.SALTROUNDS) || 10;
const hashedPassword = await bcrypt.hash('123456', salt);

const [doctor, receptionist] = await User.insertMany([
    {
        name: 'د. عمر محمد',
        email: 'doctor@clinic.com',
        password: hashedPassword,
        role: 'doctor',
        isActive: true,
    },
    {
        name: 'سارة الاستقبال',
        email: 'reception@clinic.com',
        password: hashedPassword,
        role: 'receptionist',
        isActive: true,
    },
]);
console.log('✅ Users created (2)');

// ── 3. SERVICES ───────────────────────────────────────────────────────────────
const services = await Service.insertMany([
    { name: 'كشف دوري', category: 'عام', price: 200, description: 'فحص عام للأسنان والتشخيص', isActive: true },
    { name: 'حشو عصب', category: 'علاجي', price: 1200, description: 'علاج قناة الجذر (Root Canal)', isActive: true },
    { name: 'تنظيف وجير', category: 'وقائي', price: 400, description: 'تنظيف الجير والرواسب بالموجات فوق الصوتية', isActive: true },
    { name: 'تبييض أسنان', category: 'تجميلي', price: 1500, description: 'تبييض بالليزر جلسة واحدة', isActive: true },
    { name: 'خلع ضرس', category: 'علاجي', price: 350, description: 'خلع بسيط بتخدير موضعي', isActive: true },
    { name: 'حشو ضوئي', category: 'علاجي', price: 600, description: 'حشو Composite تجميلي', isActive: true },
    { name: 'تركيب طقم', category: 'تجميلي', price: 3000, description: 'أطقم أسنان كاملة متحركة', isActive: true },
    { name: 'تقويم أسنان', category: 'تجميلي', price: 8000, description: 'تقويم معدني كامل (18 شهر)', isActive: true },
    { name: 'زراعة سن', category: 'علاجي', price: 5000, description: 'زراعة سن اصطناعي (Implant)', isActive: true },
    { name: 'تلبيسة (Crown)', category: 'تجميلي', price: 1800, description: 'تلبيسة بورسلين على الأسنان', isActive: true },
]);
console.log('✅ Services created (10)');

// ── 4. PATIENTS ───────────────────────────────────────────────────────────────
const patientsData = [
    { name: 'أحمد محمود سالم', phone: '01012345678', gender: 'male', dateOfBirth: new Date('1990-03-15'), address: 'القاهرة - مدينة نصر', notes: 'حساسية من البنسلين', createdBy: receptionist._id },
    { name: 'فاطمة علي حسن', phone: '01123456789', gender: 'female', dateOfBirth: new Date('1985-07-22'), address: 'الجيزة - الدقي', notes: '', createdBy: receptionist._id },
    { name: 'محمد عبد الله إبراهيم', phone: '01234567890', gender: 'male', dateOfBirth: new Date('1978-11-05'), address: 'الإسكندرية - العجمي', notes: 'مريض سكري - جرعة تخدير مخفضة', createdBy: doctor._id },
    { name: 'نورهان سامي رضا', phone: '01512345678', gender: 'female', dateOfBirth: new Date('1995-01-30'), address: 'القاهرة - المعادي', notes: '', createdBy: receptionist._id },
    { name: 'عمر خالد فاروق', phone: '01098765432', gender: 'male', dateOfBirth: new Date('2000-09-12'), address: 'القاهرة - الزيتون', notes: '', createdBy: receptionist._id },
    { name: 'ريم حسام الدين', phone: '01234509876', gender: 'female', dateOfBirth: new Date('1992-04-18'), address: 'الجيزة - المهندسين', notes: 'قلق من علاج الأسنان - يحتاج تهدئة', createdBy: doctor._id },
    { name: 'كريم طارق منصور', phone: '01156789012', gender: 'male', dateOfBirth: new Date('1988-12-25'), address: 'القاهرة - شبرا', notes: '', createdBy: receptionist._id },
    { name: 'هدى إبراهيم سعد', phone: '01378901234', gender: 'female', dateOfBirth: new Date('1975-06-08'), address: 'الجيزة - الهرم', notes: 'ضغط مرتفع', createdBy: receptionist._id },
    { name: 'يوسف مصطفى أحمد', phone: '01567890123', gender: 'male', dateOfBirth: new Date('2005-02-14'), address: 'القاهرة - عين شمس', notes: '', createdBy: doctor._id },
    { name: 'سلمى رامي عزت', phone: '01289012345', gender: 'female', dateOfBirth: new Date('1998-08-20'), address: 'القاهرة - مصر الجديدة', notes: '', createdBy: receptionist._id },
];

// Create patients one by one (trigger pre-save for patientCode)
const patients = [];
for (const p of patientsData) {
    const patient = await Patient.create(p);
    patients.push(patient);
}
console.log('✅ Patients created (10)');

// ── 5. INVENTORY ──────────────────────────────────────────────────────────────
const inventoryItems = await Inventory.insertMany([
    { name: 'بنج موضعي (ليجنوكايين)', category: 'أدوية', quantity: 10, unit: 'علبة', minQuantity: 3, createdBy: doctor._id },
    { name: 'مواد حشو (Composite)', category: 'مواد استهلاكية', quantity: 5, unit: 'سرنجة', minQuantity: 3, createdBy: doctor._id },
    { name: 'قفازات طبية - مقاس M', category: 'مواد استهلاكية', quantity: 8, unit: 'علبة', minQuantity: 5, createdBy: doctor._id },
    { name: 'كمامات طبية', category: 'مواد استهلاكية', quantity: 15, unit: 'علبة', minQuantity: 5, createdBy: doctor._id },
    { name: 'إبر تخدير', category: 'مواد استهلاكية', quantity: 50, unit: 'قطعة', minQuantity: 20, createdBy: doctor._id },
    { name: 'خيوط جراحية', category: 'مواد استهلاكية', quantity: 20, unit: 'قطعة', minQuantity: 5, createdBy: doctor._id },
    { name: 'مواد طبع (Alginate)', category: 'مواد استهلاكية', quantity: 3, unit: 'كيلو', minQuantity: 2, createdBy: doctor._id },
    { name: 'مبردة (Drill Bits)', category: 'أدوات', quantity: 12, unit: 'قطعة', minQuantity: 4, createdBy: doctor._id },
    { name: 'مرايا فحص', category: 'أدوات', quantity: 6, unit: 'قطعة', minQuantity: 3, createdBy: doctor._id },
    { name: 'جهاز Apex Locator', category: 'أجهزة', quantity: 1, unit: 'جهاز', minQuantity: 1, createdBy: doctor._id },
]);
console.log('✅ Inventory created (10 items)');

// ── 6. INVENTORY LOGS ─────────────────────────────────────────────────────────
await InventoryLog.insertMany([
    { item: inventoryItems[0]._id, type: 'add', quantity: 10, note: 'استلام دورة جديدة', createdBy: receptionist._id },
    { item: inventoryItems[1]._id, type: 'add', quantity: 5, note: 'شراء من المورد', createdBy: receptionist._id },
    { item: inventoryItems[2]._id, type: 'add', quantity: 8, note: 'استلام مخزون', createdBy: receptionist._id },
    { item: inventoryItems[0]._id, type: 'consume', quantity: 2, note: 'استخدام في جلسات تخدير', createdBy: doctor._id },
    { item: inventoryItems[2]._id, type: 'consume', quantity: 1, note: 'استخدام يومي', createdBy: doctor._id },
    { item: inventoryItems[4]._id, type: 'add', quantity: 50, note: 'شراء دفعة كبيرة', createdBy: receptionist._id },
    { item: inventoryItems[4]._id, type: 'consume', quantity: 5, note: 'استخدام في حالات التخدير', createdBy: doctor._id },
]);
console.log('✅ Inventory logs created (7 logs)');

// ── 7. APPOINTMENTS ───────────────────────────────────────────────────────────
const today = new Date();
const d = (offset) => { const d = new Date(today); d.setDate(d.getDate() + offset); return d; };

const appointments = await Appointment.insertMany([
    // Past - completed
    { patient: patients[0]._id, service: services[0]._id, date: d(-10), startTime: '09:00', endTime: '09:30', status: 'completed', doctorNote: 'فحص عام - الأسنان بحالة جيدة', createdBy: receptionist._id },
    { patient: patients[1]._id, service: services[1]._id, date: d(-8), startTime: '10:00', endTime: '11:30', status: 'completed', doctorNote: 'حشو عصب ناجح - سن 26', createdBy: receptionist._id },
    { patient: patients[2]._id, service: services[4]._id, date: d(-7), startTime: '11:00', endTime: '11:30', status: 'completed', doctorNote: 'خلع ضرس العقل - بدون مضاعفات', createdBy: doctor._id },
    { patient: patients[3]._id, service: services[2]._id, date: d(-5), startTime: '09:30', endTime: '10:00', status: 'completed', doctorNote: 'تنظيف شامل - تكرار بعد 6 أشهر', createdBy: receptionist._id },
    { patient: patients[4]._id, service: services[5]._id, date: d(-3), startTime: '12:00', endTime: '12:45', status: 'completed', doctorNote: 'حشو ضوئي سن 15 - نتيجة ممتازة', createdBy: receptionist._id },
    { patient: patients[5]._id, service: services[3]._id, date: d(-2), startTime: '14:00', endTime: '14:45', status: 'completed', doctorNote: 'تبييض - نتيجة 6 درجات أفتح', createdBy: doctor._id },

    // Past - cancelled
    { patient: patients[6]._id, service: services[0]._id, date: d(-4), startTime: '10:00', endTime: '10:30', status: 'cancelled', doctorNote: 'لم يحضر المريض', createdBy: receptionist._id },

    // Today
    { patient: patients[7]._id, service: services[1]._id, date: d(0), startTime: '10:00', endTime: '11:30', status: 'in-progress', doctorNote: '', createdBy: receptionist._id },
    { patient: patients[8]._id, service: services[2]._id, date: d(0), startTime: '12:00', endTime: '12:30', status: 'pending', doctorNote: '', createdBy: receptionist._id },

    // Future
    { patient: patients[9]._id, service: services[7]._id, date: d(1), startTime: '09:00', endTime: '10:00', status: 'pending', doctorNote: '', createdBy: receptionist._id },
    { patient: patients[0]._id, service: services[9]._id, date: d(2), startTime: '11:00', endTime: '12:00', status: 'pending', doctorNote: '', createdBy: receptionist._id },
    { patient: patients[2]._id, service: services[8]._id, date: d(3), startTime: '13:00', endTime: '14:00', status: 'pending', doctorNote: '', createdBy: doctor._id },
    { patient: patients[1]._id, service: services[6]._id, date: d(5), startTime: '10:30', endTime: '11:30', status: 'pending', doctorNote: '', createdBy: receptionist._id },
]);
console.log('✅ Appointments created (13)');

// ── 8. TREATMENT PLANS ────────────────────────────────────────────────────────
const treatmentPlans = [];

const plan1 = await TreatmentPlan.create({
    patient: patients[2]._id,
    services: [
        { service: services[8]._id, price: 5000, notes: 'زراعة السن الأمامي', status: 'pending' },
        { service: services[9]._id, price: 1800, notes: 'تلبيسة على الزراعة', status: 'pending' },
    ],
    status: 'active',
    notes: 'خطة علاج متكاملة لتعويض السن المفقود - جلستين على الأقل',
    createdBy: doctor._id,
});
treatmentPlans.push(plan1);

const plan2 = await TreatmentPlan.create({
    patient: patients[5]._id,
    services: [
        { service: services[3]._id, price: 1500, notes: 'تبييض أولي', status: 'completed' },
        { service: services[9]._id, price: 3600, notes: 'تلبيسة على 2 سن أمامي', status: 'pending' },
    ],
    status: 'active',
    notes: 'تجميل الابتسامة - مرحلتين',
    createdBy: doctor._id,
});
treatmentPlans.push(plan2);

const plan3 = await TreatmentPlan.create({
    patient: patients[1]._id,
    services: [
        { service: services[1]._id, price: 1200, notes: 'حشو عصب سن 26', status: 'completed' },
        { service: services[6]._id, price: 3000, notes: 'طقم جزئي علوي', status: 'pending' },
    ],
    status: 'active',
    notes: 'علاج متكامل للأسنان العلوية',
    createdBy: doctor._id,
});
treatmentPlans.push(plan3);

console.log('✅ Treatment plans created (3)');

// ── 9. INVOICES ───────────────────────────────────────────────────────────────
const invoices = [];

// Paid invoice
const inv1 = await Invoice.create({
    patient: patients[0]._id,
    appointment: appointments[0]._id,
    items: [{ service: services[0]._id, name: 'كشف دوري', price: 200 }],
    totalAmount: 200,
    paidAmount: 200,
    paymentMethod: 'cash',
    notes: 'مدفوع بالكامل',
    createdBy: receptionist._id,
});
invoices.push(inv1);

// Paid invoice
const inv2 = await Invoice.create({
    patient: patients[1]._id,
    appointment: appointments[1]._id,
    treatmentPlan: treatmentPlans[2]._id,
    items: [{ service: services[1]._id, name: 'حشو عصب', price: 1200 }],
    totalAmount: 1200,
    paidAmount: 1200,
    paymentMethod: 'card',
    notes: '',
    createdBy: receptionist._id,
});
invoices.push(inv2);

// Paid invoice
const inv3 = await Invoice.create({
    patient: patients[2]._id,
    appointment: appointments[2]._id,
    items: [{ service: services[4]._id, name: 'خلع ضرس', price: 350 }],
    totalAmount: 350,
    paidAmount: 350,
    paymentMethod: 'cash',
    notes: '',
    createdBy: receptionist._id,
});
invoices.push(inv3);

// Paid invoice
const inv4 = await Invoice.create({
    patient: patients[3]._id,
    appointment: appointments[3]._id,
    items: [{ service: services[2]._id, name: 'تنظيف وجير', price: 400 }],
    totalAmount: 400,
    paidAmount: 400,
    paymentMethod: 'cash',
    notes: '',
    createdBy: receptionist._id,
});
invoices.push(inv4);

// Paid invoice
const inv5 = await Invoice.create({
    patient: patients[4]._id,
    appointment: appointments[4]._id,
    items: [{ service: services[5]._id, name: 'حشو ضوئي', price: 600 }],
    totalAmount: 600,
    paidAmount: 600,
    paymentMethod: 'transfer',
    notes: '',
    createdBy: receptionist._id,
});
invoices.push(inv5);

// Paid invoice
const inv6 = await Invoice.create({
    patient: patients[5]._id,
    appointment: appointments[5]._id,
    treatmentPlan: treatmentPlans[1]._id,
    items: [{ service: services[3]._id, name: 'تبييض أسنان', price: 1500 }],
    totalAmount: 1500,
    paidAmount: 1500,
    paymentMethod: 'card',
    notes: 'دفع بالكارت فيزا',
    createdBy: receptionist._id,
});
invoices.push(inv6);

// Partial invoice
const inv7 = await Invoice.create({
    patient: patients[2]._id,
    treatmentPlan: treatmentPlans[0]._id,
    items: [
        { service: services[8]._id, name: 'زراعة سن', price: 5000 },
        { service: services[9]._id, name: 'تلبيسة (Crown)', price: 1800 },
    ],
    totalAmount: 6800,
    paidAmount: 3000,
    paymentMethod: 'cash',
    notes: 'دفع مقدم - المتبقي عند انتهاء العلاج',
    createdBy: receptionist._id,
});
invoices.push(inv7);

// Unpaid invoice
const inv8 = await Invoice.create({
    patient: patients[1]._id,
    treatmentPlan: treatmentPlans[2]._id,
    items: [{ service: services[6]._id, name: 'تركيب طقم', price: 3000 }],
    totalAmount: 3000,
    paidAmount: 0,
    paymentMethod: 'cash',
    notes: 'سيتم الدفع بعد التسليم',
    createdBy: receptionist._id,
});
invoices.push(inv8);

console.log('✅ Invoices created (8)');

// ── SUMMARY ───────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════╗');
console.log('║        🦷 Seed Completed Successfully!       ║');
console.log('╠══════════════════════════════════════════════╣');
console.log('║  📧 Doctor:        doctor@clinic.com         ║');
console.log('║  📧 Receptionist:  reception@clinic.com      ║');
console.log('║  🔑 Password:      123456                    ║');
console.log('╠══════════════════════════════════════════════╣');
console.log('║  👥 Patients:      10                        ║');
console.log('║  🏥 Services:      10                        ║');
console.log('║  📅 Appointments:  13                        ║');
console.log('║  📋 Plans:         3                         ║');
console.log('║  🧾 Invoices:      8                         ║');
console.log('║  📦 Inventory:     10 items + 7 logs         ║');
console.log('╚══════════════════════════════════════════════╝\n');

await mongoose.disconnect();
process.exit(0);
