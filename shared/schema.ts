import { pgTable, text, serial, integer, boolean, json, jsonb, timestamp, varchar, foreignKey, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Insurance Providers table
export const insuranceProviders = pgTable("insurance_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  phone: text("phone"),
  faxNumber: text("fax_number"),
  portalUrl: text("portal_url"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insuranceProvidersRelations = relations(insuranceProviders, ({ many }) => ({
  formularies: many(formularies),
}));

export const insertInsuranceProviderSchema = createInsertSchema(insuranceProviders).pick({
  name: true,
  description: true,
  website: true,
  phone: true,
  faxNumber: true,
  portalUrl: true,
  logoUrl: true,
});

export type InsertInsuranceProvider = z.infer<typeof insertInsuranceProviderSchema>;
export type InsuranceProvider = typeof insuranceProviders.$inferSelect;

// Formularies table
export const formularies = pgTable("formularies", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => insuranceProviders.id),
  name: text("name").notNull(),
  description: text("description"),
  year: integer("year").notNull(),
  state: varchar("state", { length: 2 }),
  type: text("type").notNull(), // e.g., 'medicaid', 'medicare', 'commercial'
  effectiveDate: timestamp("effective_date"),
  expirationDate: timestamp("expiration_date"),
  paSubmissionInfo: jsonb("pa_submission_info"), // JSON with submission details
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const formulariesRelations = relations(formularies, ({ one, many }) => ({
  insuranceProvider: one(insuranceProviders, {
    fields: [formularies.providerId],
    references: [insuranceProviders.id],
  }),
  medications: many(medications),
  drugClasses: many(drugClasses),
}));

export const insertFormularySchema = createInsertSchema(formularies).pick({
  providerId: true,
  name: true,
  description: true,
  year: true,
  state: true,
  type: true,
  effectiveDate: true,
  expirationDate: true,
  paSubmissionInfo: true,
});

export type InsertFormulary = z.infer<typeof insertFormularySchema>;
export type Formulary = typeof formularies.$inferSelect;

// Drug Classes table
export const drugClasses = pgTable("drug_classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  formularyId: integer("formulary_id").notNull().references(() => formularies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const drugClassesRelations = relations(drugClasses, ({ one, many }) => ({
  formulary: one(formularies, {
    fields: [drugClasses.formularyId],
    references: [formularies.id],
  }),
  medicationDrugClasses: many(medicationDrugClasses),
}));

export const insertDrugClassSchema = createInsertSchema(drugClasses).pick({
  name: true,
  description: true,
  formularyId: true,
});

export type InsertDrugClass = z.infer<typeof insertDrugClassSchema>;
export type DrugClass = typeof drugClasses.$inferSelect;

// Medications table
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  formularyId: integer("formulary_id").notNull().references(() => formularies.id),
  name: text("name").notNull(),
  brandName: text("brand_name"),
  formularyStatus: text("formulary_status").notNull(), // 'preferred', 'preferred-with-pa', 'non-preferred', 'non-formulary'
  requiresPA: boolean("requires_pa").notNull().default(false),
  dosageForms: jsonb("dosage_forms"), // array of strings
  quantityLimits: text("quantity_limits"),
  ageRestrictions: text("age_restrictions"),
  genderRestrictions: text("gender_restrictions"),
  paType: text("pa_type"),
  paCriteria: jsonb("pa_criteria"), // array of strings
  authorizationDuration: text("authorization_duration"),
  page: integer("page"),
  requiredDocumentation: jsonb("required_documentation"), // array of strings
  tags: jsonb("tags"), // array of strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const medicationsRelations = relations(medications, ({ one, many }) => ({
  formulary: one(formularies, {
    fields: [medications.formularyId],
    references: [formularies.id],
  }),
  medicationAlternatives: many(medicationAlternatives, {
    relationName: "medication_alternatives"
  }),
  medicationDrugClasses: many(medicationDrugClasses)
}));

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medications.$inferSelect;

// Junction table for medications and drug classes (many-to-many)
export const medicationDrugClasses = pgTable("medication_drug_classes", {
  medicationId: integer("medication_id").notNull().references(() => medications.id),
  drugClassId: integer("drug_class_id").notNull().references(() => drugClasses.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.medicationId, t.drugClassId] }),
}));

export const medicationDrugClassesRelations = relations(medicationDrugClasses, ({ one }) => ({
  medication: one(medications, {
    fields: [medicationDrugClasses.medicationId],
    references: [medications.id],
  }),
  drugClass: one(drugClasses, {
    fields: [medicationDrugClasses.drugClassId],
    references: [drugClasses.id],
  }),
}));

// Medication alternatives table
export const medicationAlternatives = pgTable("medication_alternatives", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").notNull().references(() => medications.id),
  alternativeId: integer("alternative_id").notNull().references(() => medications.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicationAlternativesRelations = relations(medicationAlternatives, ({ one }) => ({
  medication: one(medications, {
    fields: [medicationAlternatives.medicationId],
    references: [medications.id],
    relationName: "medication_alternatives",
  }),
  alternative: one(medications, {
    fields: [medicationAlternatives.alternativeId],
    references: [medications.id],
  }),
}));

// Search query schema
export const searchQuerySchema = z.object({
  formularyId: z.number(),
  medicationName: z.string().optional(),
  drugClass: z.string().optional(),
  patientAge: z.number().optional(),
  patientGender: z.enum(['male', 'female', 'other']).optional(),
  dosage: z.string().optional(),
  quantity: z.number().optional(),
  dosageForm: z.string().optional(),
  requiresPA: z.boolean().optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

// For API compatibility with the current application
export interface AlternativeDTO {
  id: number;
  name: string;
  brandName?: string;
  formularyStatus: 'preferred' | 'preferred-with-pa' | 'non-preferred' | 'non-formulary';
  requiresPA: boolean;
}

export interface MedicationDTO {
  id: number;
  name: string;
  brandName?: string;
  drugClass?: string;
  formularyStatus: 'preferred' | 'preferred-with-pa' | 'non-preferred' | 'non-formulary';
  requiresPA: boolean;
  dosageForms?: string[];
  quantityLimits?: string;
  ageRestrictions?: string;
  genderRestrictions?: string;
  paType?: string;
  paCriteria?: string[];
  authorizationDuration?: string;
  alternatives?: AlternativeDTO[];
  page?: number;
  requiredDocumentation?: string[];
  tags?: string[];
  formularyId: number;
}

export const PASubmissionInfoSchema = z.object({
  faxNumber: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  emailAddress: z.string().optional(),
  portalUrl: z.string().optional(),
  instructions: z.array(z.string()).optional(),
  checklist: z.array(z.string()).optional(),
});

export type PASubmissionInfo = z.infer<typeof PASubmissionInfoSchema>;

export const drugClassesSchema = z.array(z.string());
export type DrugClasses = z.infer<typeof drugClassesSchema>;
