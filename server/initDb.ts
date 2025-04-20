import { db } from "./db";
import * as schema from "@shared/schema";
import { sql } from "drizzle-orm";
import { mockData } from "./pdfParser";

// This script will create all the necessary tables and seed them with initial data
export async function initializeDatabase() {
  console.log("Initializing database and creating schemas...");
  
  try {
    // Create tables if they don't exist
    await createTables();
    
    // Check if there's already an insurance provider
    const insuranceProviders = await db.select().from(schema.insuranceProviders);
    
    if (insuranceProviders.length === 0) {
      // Create insurance provider
      console.log("Creating sample insurance provider...");
      const [provider] = await db.insert(schema.insuranceProviders).values({
        name: "Molina Healthcare",
        description: "Molina Healthcare of Washington",
        website: "https://www.molinahealthcare.com",
        phone: "800-869-7175",
        faxNumber: "800-869-7791",
        portalUrl: "https://provider.molinahealthcare.com",
        logoUrl: "/logo/molina.svg"
      }).returning();
      
      // Create formulary
      console.log("Creating sample formulary...");
      const paSubmissionInfo = {
        faxNumber: "800-869-7791",
        phone: "800-869-7175",
        website: "https://www.molinahealthcare.com",
        portalUrl: "https://provider.molinahealthcare.com",
        instructions: [
          "Complete all required fields on the PA form",
          "Include patient diagnosis and clinical indication",
          "Document previous treatment history and response"
        ],
        checklist: [
          "Recent laboratory results (within last 3 months)",
          "Medical records documenting previous trials",
          "Current medication list",
          "Provider contact information"
        ]
      };
      
      const [formulary] = await db.insert(schema.formularies).values({
        providerId: provider.id,
        name: "Washington Apple Health PDL",
        description: "Molina Healthcare of Washington Apple Health (Medicaid) Preferred Drug List",
        year: 2025,
        state: "WA",
        type: "medicaid",
        paSubmissionInfo
      }).returning();
      
      // Insert mock medications
      console.log("Inserting sample medications...");
      // Add formularyId to each medication
      const medicationsWithFormularyId = mockData.map(med => ({
        ...med,
        formularyId: formulary.id,
        // Convert array fields to proper JSON for database storage
        dosageForms: med.dosageForms ? JSON.stringify(med.dosageForms) : null,
        paCriteria: med.paCriteria ? JSON.stringify(med.paCriteria) : null,
        requiredDocumentation: med.requiredDocumentation ? JSON.stringify(med.requiredDocumentation) : null,
        tags: med.tags ? JSON.stringify(med.tags) : null,
        // Remove the alternatives field as we'll handle them separately
        alternatives: undefined
      }));
      
      // Extract alternative medications and add them as regular medications
      const alternativeMedications = [];
      const alternativeRelationships = [];
      
      // First collect all unique alternative medications
      mockData.forEach(med => {
        if (med.alternatives && med.alternatives.length > 0) {
          med.alternatives.forEach(alt => {
            // Create a full medication record for each alternative
            alternativeMedications.push({
              id: alt.id,
              name: alt.name,
              brandName: alt.brandName || null,
              formularyId: formulary.id,
              formularyStatus: alt.formularyStatus,
              requiresPA: alt.requiresPA,
              // Required fields with defaults
              dosageForms: null,
              paCriteria: null,
              requiredDocumentation: null,
              tags: JSON.stringify(['Alternative'])
            });
            
            // Create the relationship for later
            alternativeRelationships.push({
              medicationId: med.id,
              alternativeId: alt.id,
              reason: "Preferred formulary alternative"
            });
          });
        }
      });
      
      // Insert all medications first
      const allMedications = [...medicationsWithFormularyId, ...alternativeMedications];
      await db.insert(schema.medications).values(allMedications);
      
      // Extract and insert drug classes
      const uniqueDrugClasses = new Set<string>();
      medicationsWithFormularyId.forEach(med => {
        if (med.drugClass) {
          uniqueDrugClasses.add(med.drugClass);
        }
      });
      
      if (uniqueDrugClasses.size > 0) {
        console.log("Creating drug classes...");
        const drugClassesArray = Array.from(uniqueDrugClasses).map(name => ({
          name,
          formularyId: formulary.id,
          description: `${name} drug class`
        }));
        
        const insertedDrugClasses = await db.insert(schema.drugClasses).values(drugClassesArray).returning();
        
        // Create medication-drug class associations
        const medicationDrugClassValues = [];
        
        for (const med of medicationsWithFormularyId) {
          if (med.drugClass) {
            const drugClass = insertedDrugClasses.find(dc => dc.name === med.drugClass);
            if (drugClass) {
              medicationDrugClassValues.push({
                medicationId: med.id,
                drugClassId: drugClass.id
              });
            }
          }
        }
        
        if (medicationDrugClassValues.length > 0) {
          console.log("Creating medication-drug class associations...");
          await db.insert(schema.medicationDrugClasses).values(medicationDrugClassValues);
        }
      }
      
      // Insert alternative relationships
      if (alternativeRelationships.length > 0) {
        console.log("Creating medication alternatives relationships...");
        await db.insert(schema.medicationAlternatives).values(alternativeRelationships);
      }
    } else {
      console.log("Database already initialized, skipping seed data creation");
    }
    
    console.log("Database initialization completed successfully!");
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}

async function createTables() {
  // Create tables using raw SQL for more control over the process
  
  // Users table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Insurance providers table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS insurance_providers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      website TEXT,
      phone TEXT,
      fax_number TEXT,
      portal_url TEXT,
      logo_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Formularies table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS formularies (
      id SERIAL PRIMARY KEY,
      provider_id INTEGER NOT NULL REFERENCES insurance_providers(id),
      name TEXT NOT NULL,
      description TEXT,
      year INTEGER NOT NULL,
      state VARCHAR(2),
      type TEXT NOT NULL,
      effective_date TIMESTAMP,
      expiration_date TIMESTAMP,
      pa_submission_info JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Drug classes table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS drug_classes (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      formulary_id INTEGER NOT NULL REFERENCES formularies(id),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Medications table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS medications (
      id SERIAL PRIMARY KEY,
      formulary_id INTEGER NOT NULL REFERENCES formularies(id),
      name TEXT NOT NULL,
      brand_name TEXT,
      drug_class TEXT,
      formulary_status TEXT NOT NULL,
      requires_pa BOOLEAN NOT NULL DEFAULT FALSE,
      dosage_forms JSONB,
      quantity_limits TEXT,
      age_restrictions TEXT,
      gender_restrictions TEXT,
      pa_type TEXT,
      pa_criteria JSONB,
      authorization_duration TEXT,
      page INTEGER,
      required_documentation JSONB,
      tags JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Junction table for medications and drug classes
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS medication_drug_classes (
      medication_id INTEGER NOT NULL REFERENCES medications(id),
      drug_class_id INTEGER NOT NULL REFERENCES drug_classes(id),
      PRIMARY KEY (medication_id, drug_class_id)
    )
  `);
  
  // Medication alternatives table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS medication_alternatives (
      id SERIAL PRIMARY KEY,
      medication_id INTEGER NOT NULL REFERENCES medications(id),
      alternative_id INTEGER NOT NULL REFERENCES medications(id),
      reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}