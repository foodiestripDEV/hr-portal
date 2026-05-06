import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const currencyValues = ["EUR", "USD", "GBP"] as const;
const roleValues = ["master_admin", "manager", "employee"] as const;
const invoiceStatusValues = ["pending", "paid"] as const;

const invoicePresetSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    defaultAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const financialProfileSchema = new Schema(
  {
    currency: { type: String, enum: currencyValues, required: true },
    monthlyRate: { type: Number, required: true, min: 0 },
    invoiceCycle: { type: String, enum: ["monthly"], required: true, default: "monthly" },
    contractType: { type: String, enum: ["employment", "contractor"], required: true },
    employmentType: { type: String, enum: ["full_time", "part_time"], required: true },
    invoicePreset: { type: invoicePresetSchema, required: true },
  },
  { _id: false },
);

const invoiceLineItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const employeeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    role: { type: String, enum: roleValues, required: true, default: "employee" },
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    startDate: { type: Date, required: true },
    profilePhotoUrl: { type: String, default: null },
    holidayAllowance: { type: Number, required: true, min: 0 },
    holidayRemaining: { type: Number, required: true, min: 0 },
    sickDaysUsed: { type: Number, required: true, min: 0, default: 0 },
    unpaidLeaveUsed: { type: Number, required: true, min: 0, default: 0 },
    financialProfile: { type: financialProfileSchema, required: true },
  },
  { timestamps: true },
);

const invoiceSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    period: { type: String, required: true, trim: true },
    periodMonth: { type: Number, required: true, min: 1, max: 12 },
    periodYear: { type: Number, required: true, min: 2000, max: 2100 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: currencyValues, required: true },
    status: { type: String, enum: invoiceStatusValues, required: true, default: "pending" },
    presetName: { type: String, required: true, trim: true },
    lineItemDescription: { type: String, required: true, trim: true },
    lineItems: { type: [invoiceLineItemSchema], required: true, default: [] },
    generatedAt: { type: Date, required: true, default: Date.now },
    paidAt: { type: Date, default: null },
    pdfStorageKey: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const invoicePeriodRunSchema = new Schema(
  {
    periodMonth: { type: Number, required: true, min: 1, max: 12 },
    periodYear: { type: Number, required: true, min: 2000, max: 2100 },
    generatedById: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    invoiceIds: [{ type: Schema.Types.ObjectId, ref: "Invoice", required: true }],
    generatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

invoiceSchema.index({ employeeId: 1, periodMonth: 1, periodYear: 1 }, { unique: true });
invoicePeriodRunSchema.index({ periodMonth: 1, periodYear: 1 }, { unique: true });

export type EmployeeDocument = InferSchemaType<typeof employeeSchema>;
export type InvoiceDocument = InferSchemaType<typeof invoiceSchema>;
export type InvoicePeriodRunDocument = InferSchemaType<typeof invoicePeriodRunSchema>;

export const EmployeeModel =
  (models.Employee as Model<EmployeeDocument> | undefined) ??
  model<EmployeeDocument>("Employee", employeeSchema);

export const InvoiceModel =
  (models.Invoice as Model<InvoiceDocument> | undefined) ??
  model<InvoiceDocument>("Invoice", invoiceSchema);

export const InvoicePeriodRunModel =
  (models.InvoicePeriodRun as Model<InvoicePeriodRunDocument> | undefined) ??
  model<InvoicePeriodRunDocument>("InvoicePeriodRun", invoicePeriodRunSchema);
