import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Medication schema types
export interface Medication {
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
  alternatives?: Alternative[];
  page?: number;
  requiredDocumentation?: string[];
  tags?: string[];
}

export interface Alternative {
  id: number;
  name: string;
  brandName?: string;
  formularyStatus: 'preferred' | 'preferred-with-pa' | 'non-preferred' | 'non-formulary';
  requiresPA: boolean;
}

export const medicationSchema = z.object({
  id: z.number(),
  name: z.string(),
  brandName: z.string().optional(),
  drugClass: z.string().optional(),
  formularyStatus: z.enum(['preferred', 'preferred-with-pa', 'non-preferred', 'non-formulary']),
  requiresPA: z.boolean(),
  dosageForms: z.array(z.string()).optional(),
  quantityLimits: z.string().optional(),
  ageRestrictions: z.string().optional(),
  genderRestrictions: z.string().optional(),
  paType: z.string().optional(),
  paCriteria: z.array(z.string()).optional(),
  authorizationDuration: z.string().optional(),
  alternatives: z.array(z.object({
    id: z.number(),
    name: z.string(),
    brandName: z.string().optional(),
    formularyStatus: z.enum(['preferred', 'preferred-with-pa', 'non-preferred', 'non-formulary']),
    requiresPA: z.boolean()
  })).optional(),
  page: z.number().optional(),
  requiredDocumentation: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

export type InsertMedication = z.infer<typeof medicationSchema>;

export const drugClassesSchema = z.array(z.string());
export type DrugClasses = z.infer<typeof drugClassesSchema>;

// Search query schema
export const searchQuerySchema = z.object({
  medicationName: z.string().optional(),
  drugClass: z.string().optional(),
  patientAge: z.number().optional(),
  dosage: z.string().optional(),
  quantity: z.number().optional(),
  requiresPA: z.boolean().optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
