import { Medication, Alternative, SearchQuery, DrugClasses } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User-related methods
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;

  // Medication-related methods
  getMedications(): Promise<Medication[]>;
  getMedicationById(id: number): Promise<Medication | undefined>;
  searchMedications(query: SearchQuery): Promise<Medication[]>;
  getDrugClasses(): Promise<DrugClasses>;
  initializeMedications(medications: Medication[]): Promise<void>;
  getMedicationsByClass(drugClass: string): Promise<Medication[]>;
  getMedicationByName(name: string): Promise<Medication | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private medications: Map<number, Medication>;
  private drugClasses: Set<string>;
  
  currentId: number;
  currentMedicationId: number;

  constructor() {
    this.users = new Map();
    this.medications = new Map();
    this.drugClasses = new Set();
    this.currentId = 1;
    this.currentMedicationId = 1;
  }

  // User methods
  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Medication methods
  async getMedications(): Promise<Medication[]> {
    return Array.from(this.medications.values());
  }

  async getMedicationById(id: number): Promise<Medication | undefined> {
    return this.medications.get(id);
  }

  async searchMedications(query: SearchQuery): Promise<Medication[]> {
    let results = Array.from(this.medications.values());

    if (query.medicationName) {
      const searchTerm = query.medicationName.toLowerCase();
      results = results.filter(med => 
        med.name.toLowerCase().includes(searchTerm) || 
        (med.brandName && med.brandName.toLowerCase().includes(searchTerm))
      );
    }

    if (query.drugClass) {
      results = results.filter(med => 
        med.drugClass && med.drugClass.toLowerCase() === query.drugClass.toLowerCase()
      );
    }

    if (query.patientAge !== undefined) {
      results = results.filter(med => {
        if (!med.ageRestrictions) return true;
        
        // Simple age restriction check - would need more complex parsing for real implementation
        const ageText = med.ageRestrictions.toLowerCase();
        
        if (ageText.includes('years and older')) {
          const minAge = parseInt(ageText.split(' ')[0]);
          return query.patientAge >= minAge;
        } else if (ageText.includes('years and younger')) {
          const maxAge = parseInt(ageText.split(' ')[0]);
          return query.patientAge <= maxAge;
        }
        
        return true;
      });
    }

    if (query.requiresPA !== undefined) {
      results = results.filter(med => med.requiresPA === query.requiresPA);
    }

    return results;
  }

  async getDrugClasses(): Promise<DrugClasses> {
    return Array.from(this.drugClasses).sort();
  }

  async initializeMedications(medications: Medication[]): Promise<void> {
    this.medications.clear();
    this.drugClasses.clear();
    
    medications.forEach(med => {
      this.medications.set(med.id, med);
      if (med.drugClass) {
        this.drugClasses.add(med.drugClass);
      }
    });
  }

  async getMedicationsByClass(drugClass: string): Promise<Medication[]> {
    return Array.from(this.medications.values()).filter(
      med => med.drugClass && med.drugClass.toLowerCase() === drugClass.toLowerCase()
    );
  }

  async getMedicationByName(name: string): Promise<Medication | undefined> {
    return Array.from(this.medications.values()).find(
      med => med.name.toLowerCase() === name.toLowerCase() ||
             (med.brandName && med.brandName.toLowerCase() === name.toLowerCase())
    );
  }
}

export const storage = new MemStorage();
