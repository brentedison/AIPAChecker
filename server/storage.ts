import { 
  MedicationDTO, AlternativeDTO, SearchQuery, DrugClasses, User, InsertUser, 
  PASubmissionInfo, Formulary, InsertFormulary, InsuranceProvider, InsertInsuranceProvider,
  InsertMedication
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, or, inArray } from "drizzle-orm";
import * as schema from "@shared/schema";

// Modify the interface with any CRUD methods you might need
export interface IStorage {
  // User-related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Formulary-related methods
  getFormularies(): Promise<Formulary[]>;
  getFormularyById(id: number): Promise<Formulary | undefined>;
  createFormulary(formulary: InsertFormulary): Promise<Formulary>;
  updateFormulary(id: number, formulary: Partial<InsertFormulary>): Promise<Formulary | undefined>;
  deleteFormulary(id: number): Promise<boolean>;
  getFormularySubmissionInfo(id: number): Promise<PASubmissionInfo | undefined>;

  // Insurance Provider methods
  getInsuranceProviders(): Promise<InsuranceProvider[]>;
  getInsuranceProviderById(id: number): Promise<InsuranceProvider | undefined>;
  createInsuranceProvider(provider: InsertInsuranceProvider): Promise<InsuranceProvider>;
  updateInsuranceProvider(id: number, provider: Partial<InsertInsuranceProvider>): Promise<InsuranceProvider | undefined>;
  deleteInsuranceProvider(id: number): Promise<boolean>;

  // Medication-related methods
  getMedications(formularyId?: number): Promise<MedicationDTO[]>;
  getMedicationById(id: number): Promise<MedicationDTO | undefined>;
  searchMedications(query: SearchQuery): Promise<MedicationDTO[]>;
  getDrugClasses(formularyId?: number): Promise<DrugClasses>;
  initializeMedications(medications: InsertMedication[], formularyId: number): Promise<void>;
  getMedicationsByClass(drugClass: string, formularyId?: number): Promise<MedicationDTO[]>;
  getMedicationByName(name: string, formularyId?: number): Promise<MedicationDTO | undefined>;
  createMedication(medication: InsertMedication): Promise<MedicationDTO>;
  updateMedication(id: number, medication: Partial<InsertMedication>): Promise<MedicationDTO | undefined>;
  deleteMedication(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  // Formulary methods
  async getFormularies(): Promise<Formulary[]> {
    return await db.select().from(schema.formularies);
  }

  async getFormularyById(id: number): Promise<Formulary | undefined> {
    const [formulary] = await db.select().from(schema.formularies).where(eq(schema.formularies.id, id));
    return formulary;
  }

  async createFormulary(formulary: InsertFormulary): Promise<Formulary> {
    const [created] = await db.insert(schema.formularies).values(formulary).returning();
    return created;
  }

  async updateFormulary(id: number, formulary: Partial<InsertFormulary>): Promise<Formulary | undefined> {
    const [updated] = await db
      .update(schema.formularies)
      .set(formulary)
      .where(eq(schema.formularies.id, id))
      .returning();
    return updated;
  }

  async deleteFormulary(id: number): Promise<boolean> {
    const result = await db
      .delete(schema.formularies)
      .where(eq(schema.formularies.id, id));
    return true;
  }

  async getFormularySubmissionInfo(id: number): Promise<PASubmissionInfo | undefined> {
    const [formulary] = await db
      .select({ paSubmissionInfo: schema.formularies.paSubmissionInfo })
      .from(schema.formularies)
      .where(eq(schema.formularies.id, id));
    
    return formulary?.paSubmissionInfo as PASubmissionInfo | undefined;
  }

  // Insurance Provider methods
  async getInsuranceProviders(): Promise<InsuranceProvider[]> {
    return await db.select().from(schema.insuranceProviders);
  }

  async getInsuranceProviderById(id: number): Promise<InsuranceProvider | undefined> {
    const [provider] = await db
      .select()
      .from(schema.insuranceProviders)
      .where(eq(schema.insuranceProviders.id, id));
    return provider;
  }

  async createInsuranceProvider(provider: InsertInsuranceProvider): Promise<InsuranceProvider> {
    const [created] = await db
      .insert(schema.insuranceProviders)
      .values(provider)
      .returning();
    return created;
  }

  async updateInsuranceProvider(id: number, provider: Partial<InsertInsuranceProvider>): Promise<InsuranceProvider | undefined> {
    const [updated] = await db
      .update(schema.insuranceProviders)
      .set(provider)
      .where(eq(schema.insuranceProviders.id, id))
      .returning();
    return updated;
  }

  async deleteInsuranceProvider(id: number): Promise<boolean> {
    const result = await db
      .delete(schema.insuranceProviders)
      .where(eq(schema.insuranceProviders.id, id));
    return true;
  }

  // Medication methods
  async getMedications(formularyId?: number): Promise<MedicationDTO[]> {
    let query = db.select().from(schema.medications);
    
    if (formularyId !== undefined) {
      query = query.where(eq(schema.medications.formularyId, formularyId));
    }
    
    const medications = await query;
    
    return medications.map(med => this.mapToMedicationDTO(med));
  }

  async getMedicationById(id: number): Promise<MedicationDTO | undefined> {
    const [medication] = await db.select().from(schema.medications).where(eq(schema.medications.id, id));
    if (!medication) return undefined;

    const medicationDTO = this.mapToMedicationDTO(medication);
    
    // Load alternatives
    const alternatives = await this.getMedicationAlternatives(id);
    medicationDTO.alternatives = alternatives;

    return medicationDTO;
  }

  async searchMedications(query: SearchQuery): Promise<MedicationDTO[]> {
    let conditions = [];
    
    // Make sure the formularyId is included in the conditions
    if (query.formularyId) {
      conditions.push(eq(schema.medications.formularyId, query.formularyId));
    }
    
    if (query.medicationName) {
      const searchTerm = `%${query.medicationName.toLowerCase()}%`;
      conditions.push(
        or(
          like(schema.medications.name, searchTerm),
          like(schema.medications.brandName || '', searchTerm)
        )
      );
    }
    
    if (query.requiresPA !== undefined) {
      conditions.push(eq(schema.medications.requiresPA, query.requiresPA));
    }
    
    // Age restrictions would need more complex logic for a real implementation
    if (query.patientAge !== undefined) {
      // This would need to be enhanced with proper age restriction parsing
    }
    
    if (query.patientGender !== undefined) {
      // Would need to implement gender-specific logic
    }
    
    if (query.dosageForm !== undefined) {
      // Would need a more sophisticated query against jsonb field
    }
    
    // If we have a drugClass query, we need to join with the junction table
    let medications;
    if (query.drugClass) {
      const drugClasses = await db
        .select()
        .from(schema.drugClasses)
        .where(and(
          eq(schema.drugClasses.name, query.drugClass),
          query.formularyId ? eq(schema.drugClasses.formularyId, query.formularyId) : undefined
        ));
      
      if (drugClasses.length > 0) {
        const drugClassId = drugClasses[0].id;
        
        const medicationIds = await db
          .select({ medicationId: schema.medicationDrugClasses.medicationId })
          .from(schema.medicationDrugClasses)
          .where(eq(schema.medicationDrugClasses.drugClassId, drugClassId));
        
        if (medicationIds.length > 0) {
          const ids = medicationIds.map(m => m.medicationId);
          conditions.push(inArray(schema.medications.id, ids));
        } else {
          // No medications in this drug class
          return [];
        }
      } else {
        // Drug class not found
        return [];
      }
    }
    
    medications = await db
      .select()
      .from(schema.medications)
      .where(and(...conditions));
    
    return medications.map(med => this.mapToMedicationDTO(med));
  }

  async getDrugClasses(formularyId?: number): Promise<DrugClasses> {
    let query = db.select().from(schema.drugClasses);
    
    if (formularyId !== undefined) {
      query = query.where(eq(schema.drugClasses.formularyId, formularyId));
    }
    
    const drugClasses = await query;
    return drugClasses.map(dc => dc.name);
  }

  async initializeMedications(medications: InsertMedication[], formularyId: number): Promise<void> {
    // This would be a transaction to add medications and drug classes
    // For simplicity, we'll just delete existing and add new ones
    await db.delete(schema.medications).where(eq(schema.medications.formularyId, formularyId));
    
    if (medications.length === 0) return;
    
    // Insert medications
    await db.insert(schema.medications).values(medications);
    
    // Extract and add drug classes
    const uniqueDrugClasses = new Set<string>();
    medications.forEach(med => {
      if (med.drugClass) {
        uniqueDrugClasses.add(med.drugClass);
      }
    });
    
    const drugClassesArray = Array.from(uniqueDrugClasses).map(name => ({
      name,
      formularyId,
    }));
    
    if (drugClassesArray.length > 0) {
      await db.insert(schema.drugClasses).values(drugClassesArray);
    }
  }

  async getMedicationsByClass(drugClass: string, formularyId?: number): Promise<MedicationDTO[]> {
    let drugClassQuery = db.select().from(schema.drugClasses).where(eq(schema.drugClasses.name, drugClass));
    
    if (formularyId !== undefined) {
      drugClassQuery = drugClassQuery.where(eq(schema.drugClasses.formularyId, formularyId));
    }
    
    const drugClasses = await drugClassQuery;
    
    if (drugClasses.length === 0) {
      return [];
    }
    
    const drugClassId = drugClasses[0].id;
    
    const medicationIds = await db
      .select({ medicationId: schema.medicationDrugClasses.medicationId })
      .from(schema.medicationDrugClasses)
      .where(eq(schema.medicationDrugClasses.drugClassId, drugClassId));
    
    if (medicationIds.length === 0) {
      return [];
    }
    
    const ids = medicationIds.map(m => m.medicationId);
    
    const medications = await db
      .select()
      .from(schema.medications)
      .where(inArray(schema.medications.id, ids));
    
    return medications.map(med => this.mapToMedicationDTO(med));
  }

  async getMedicationByName(name: string, formularyId?: number): Promise<MedicationDTO | undefined> {
    let query = db.select().from(schema.medications).where(
      or(
        eq(schema.medications.name, name),
        eq(schema.medications.brandName || '', name)
      )
    );
    
    if (formularyId !== undefined) {
      query = query.where(eq(schema.medications.formularyId, formularyId));
    }
    
    const [medication] = await query;
    
    if (!medication) {
      return undefined;
    }
    
    const medicationDTO = this.mapToMedicationDTO(medication);
    
    // Load alternatives
    medicationDTO.alternatives = await this.getMedicationAlternatives(medication.id);
    
    return medicationDTO;
  }

  async createMedication(medication: InsertMedication): Promise<MedicationDTO> {
    // Insert the medication
    const [created] = await db.insert(schema.medications).values(medication).returning();
    
    // If the medication has a drug class, make sure it exists and create the relationship
    if (medication.drugClass) {
      let drugClassId: number;
      
      // Try to find the drug class
      const [drugClass] = await db
        .select()
        .from(schema.drugClasses)
        .where(and(
          eq(schema.drugClasses.name, medication.drugClass),
          eq(schema.drugClasses.formularyId, medication.formularyId)
        ));
      
      if (drugClass) {
        drugClassId = drugClass.id;
      } else {
        // Create a new drug class
        const [newDrugClass] = await db
          .insert(schema.drugClasses)
          .values({
            name: medication.drugClass,
            formularyId: medication.formularyId
          })
          .returning();
        
        drugClassId = newDrugClass.id;
      }
      
      // Create the relationship
      await db.insert(schema.medicationDrugClasses).values({
        medicationId: created.id,
        drugClassId
      });
    }
    
    return this.mapToMedicationDTO(created);
  }

  async updateMedication(id: number, medication: Partial<InsertMedication>): Promise<MedicationDTO | undefined> {
    // First get the current medication
    const [current] = await db
      .select()
      .from(schema.medications)
      .where(eq(schema.medications.id, id));
    
    if (!current) {
      return undefined;
    }
    
    // Update the medication
    const [updated] = await db
      .update(schema.medications)
      .set(medication)
      .where(eq(schema.medications.id, id))
      .returning();
    
    // If the drug class was updated, update the relationship
    if (medication.drugClass !== undefined && medication.drugClass !== current.drugClass) {
      // Remove old relationships
      await db
        .delete(schema.medicationDrugClasses)
        .where(eq(schema.medicationDrugClasses.medicationId, id));
      
      if (medication.drugClass) {
        let drugClassId: number;
        
        // Try to find the drug class
        const [drugClass] = await db
          .select()
          .from(schema.drugClasses)
          .where(and(
            eq(schema.drugClasses.name, medication.drugClass),
            eq(schema.drugClasses.formularyId, current.formularyId)
          ));
        
        if (drugClass) {
          drugClassId = drugClass.id;
        } else {
          // Create a new drug class
          const [newDrugClass] = await db
            .insert(schema.drugClasses)
            .values({
              name: medication.drugClass,
              formularyId: current.formularyId
            })
            .returning();
          
          drugClassId = newDrugClass.id;
        }
        
        // Create the relationship
        await db.insert(schema.medicationDrugClasses).values({
          medicationId: id,
          drugClassId
        });
      }
    }
    
    return this.mapToMedicationDTO(updated);
  }

  async deleteMedication(id: number): Promise<boolean> {
    // Delete medication relationships first
    await db
      .delete(schema.medicationDrugClasses)
      .where(eq(schema.medicationDrugClasses.medicationId, id));
    
    await db
      .delete(schema.medicationAlternatives)
      .where(or(
        eq(schema.medicationAlternatives.medicationId, id),
        eq(schema.medicationAlternatives.alternativeId, id)
      ));
    
    // Delete the medication
    await db
      .delete(schema.medications)
      .where(eq(schema.medications.id, id));
    
    return true;
  }

  // Helper method to get alternatives for a medication
  private async getMedicationAlternatives(medicationId: number): Promise<AlternativeDTO[]> {
    const alternatives = await db
      .select({
        medicationAlternative: schema.medicationAlternatives,
        medication: schema.medications
      })
      .from(schema.medicationAlternatives)
      .innerJoin(
        schema.medications,
        eq(schema.medicationAlternatives.alternativeId, schema.medications.id)
      )
      .where(eq(schema.medicationAlternatives.medicationId, medicationId));
    
    return alternatives.map(alt => ({
      id: alt.medication.id,
      name: alt.medication.name,
      brandName: alt.medication.brandName || undefined,
      formularyStatus: alt.medication.formularyStatus as 'preferred' | 'preferred-with-pa' | 'non-preferred' | 'non-formulary',
      requiresPA: alt.medication.requiresPA
    }));
  }

  // Helper function to map database medication to MedicationDTO
  private mapToMedicationDTO(medication: any): MedicationDTO {
    return {
      id: medication.id,
      name: medication.name,
      brandName: medication.brandName,
      drugClass: medication.drugClass, // Will need to be fetched from the join table in a real implementation
      formularyStatus: medication.formularyStatus as 'preferred' | 'preferred-with-pa' | 'non-preferred' | 'non-formulary',
      requiresPA: medication.requiresPA,
      dosageForms: medication.dosageForms as string[] | undefined,
      quantityLimits: medication.quantityLimits,
      ageRestrictions: medication.ageRestrictions,
      genderRestrictions: medication.genderRestrictions,
      paType: medication.paType,
      paCriteria: medication.paCriteria as string[] | undefined,
      authorizationDuration: medication.authorizationDuration,
      page: medication.page,
      requiredDocumentation: medication.requiredDocumentation as string[] | undefined,
      tags: medication.tags as string[] | undefined,
      formularyId: medication.formularyId,
      alternatives: [] // Will be loaded separately when needed
    };
  }
}

export const storage = new DatabaseStorage();
