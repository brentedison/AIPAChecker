import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchQuerySchema, PARequestSchema } from "@shared/schema";
import { initializeFormulary } from "./pdfParser";
import fs from 'fs';
import path from 'path';
import { aiService } from "./services/aiService";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoints
  app.get('/api/medications', async (_req: Request, res: Response) => {
    try {
      const medications = await storage.getMedications();
      res.json(medications);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching medications' });
    }
  });

  app.get('/api/medications/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid medication ID' });
      }

      const medication = await storage.getMedicationById(id);
      if (!medication) {
        return res.status(404).json({ message: 'Medication not found' });
      }

      res.json(medication);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching medication' });
    }
  });

  app.get('/api/drug-classes', async (_req: Request, res: Response) => {
    try {
      const drugClasses = await storage.getDrugClasses();
      res.json(drugClasses);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching drug classes' });
    }
  });
  
  app.get('/api/formularies', async (_req: Request, res: Response) => {
    try {
      const formularies = await storage.getFormularies();
      res.json(formularies);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching formularies' });
    }
  });

  app.post('/api/search', async (req: Request, res: Response) => {
    try {
      const parseResult = searchQuerySchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid search query', errors: parseResult.error.format() });
      }
      
      const results = await storage.searchMedications(parseResult.data);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: 'Error searching medications' });
    }
  });

  app.get('/api/search', async (req: Request, res: Response) => {
    try {
      // Handle GET search with query parameters
      const query = {
        formularyId: req.query.formularyId ? parseInt(req.query.formularyId as string) : 1, // Default to formulary ID 1
        medicationName: req.query.medicationName as string | undefined,
        drugClass: req.query.drugClass as string | undefined,
        patientAge: req.query.patientAge ? parseInt(req.query.patientAge as string) : undefined,
        patientGender: req.query.patientGender as 'male' | 'female' | 'other' | undefined,
        dosage: req.query.dosage as string | undefined,
        quantity: req.query.quantity ? parseInt(req.query.quantity as string) : undefined,
        requiresPA: req.query.requiresPA === 'true' ? true : 
                    req.query.requiresPA === 'false' ? false : undefined
      };
      
      const parseResult = searchQuerySchema.safeParse(query);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid search query', errors: parseResult.error.format() });
      }
      
      const results = await storage.searchMedications(parseResult.data);
      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: 'Error searching medications' });
    }
  });

  app.get('/api/medications/class/:className', async (req: Request, res: Response) => {
    try {
      const className = req.params.className;
      const medications = await storage.getMedicationsByClass(className);
      res.json(medications);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching medications by class' });
    }
  });

  app.post('/api/upload-formulary', async (req: Request, res: Response) => {
    try {
      // In a real implementation, this would handle file upload and parsing
      // For this demo, we'll just re-initialize with our sample data
      const { formularyId } = req.body;
      
      if (!formularyId) {
        return res.status(400).json({ message: 'Formulary ID is required' });
      }
      
      const medications = await initializeFormulary();
      await storage.initializeMedications(medications, formularyId);
      res.json({ message: 'Formulary uploaded and processed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error uploading formulary' });
    }
  });

  // AI-powered Prior Authorization endpoint
  app.post('/api/analyze-pa', async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const parseResult = PARequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: 'Invalid PA request data', 
          errors: parseResult.error.format() 
        });
      }
      
      const paRequest = parseResult.data;
      
      // Get the medication details
      const medication = await storage.getMedicationById(paRequest.medicationId);
      if (!medication) {
        return res.status(404).json({ message: 'Medication not found' });
      }
      
      // If the medication doesn't require PA, return an auto-approval
      if (!medication.requiresPA) {
        return res.json({
          decision: "APPROVED",
          confidence: 1.0,
          rationale: "This medication does not require prior authorization according to the formulary.",
          missingInformation: [],
          suggestedAlternatives: []
        });
      }
      
      // Extract patient info from the request
      const patientInfo = {
        age: paRequest.patientAge,
        gender: paRequest.patientGender,
        diagnosisCode: paRequest.diagnosisCode,
        dosage: paRequest.dosage,
        quantity: paRequest.quantity
      };
      
      // Use the AI service to analyze the PA request
      const decision = await aiService.analyzePARequest(medication, patientInfo);
      
      // Return the decision
      res.json(decision);
    } catch (error) {
      console.error('PA analysis error:', error);
      res.status(500).json({ 
        message: 'Error analyzing prior authorization request',
        decision: "NEEDS_REVIEW",
        confidence: 0,
        rationale: "An error occurred during the automated analysis. Please submit for manual review.",
        missingInformation: ["Technical error occurred"],
        suggestedAlternatives: []
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
