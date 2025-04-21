import Anthropic from '@anthropic-ai/sdk';
import { PADecisionResponse, PADecisionResponseSchema, MedicationDTO } from '@shared/schema';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * AI service for making automatic prior authorization decisions
 */
export class AIService {
  /**
   * Analyze a prior authorization request and make a determination
   */
  async analyzePARequest(
    medication: MedicationDTO,
    patientInfo: {
      age?: number;
      gender?: string;
      diagnosisCode?: string;
      dosage?: string;
      quantity?: number;
    }
  ): Promise<PADecisionResponse> {
    try {
      const promptContext = this.buildPromptContext(medication, patientInfo);
      
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1024,
        temperature: 0.1, // Lower temperature for more consistent, deterministic responses
        system: `You are an expert pharmacy benefits manager AI assistant specializing in Prior Authorization (PA) decisions. 
        Your primary responsibility is to analyze medication requests against formulary criteria and determine if the request should be approved or denied.
        
        Use only the provided formulary and patient information to make your determination. Base your decision strictly on:
        1. Whether the medication requires PA according to the formulary
        2. If PA is required, whether the patient meets the specific PA criteria
        3. Age restrictions, gender restrictions, quantity limits, and specific clinical criteria in the PA requirements
        4. The appropriateness of the patient's diagnosis code for the requested medication
        
        Format your response as valid JSON with the following structure:
        {
          "decision": "APPROVED" or "DENIED" or "NEEDS_REVIEW",
          "confidence": (a number between 0 and 1 indicating confidence in the decision),
          "rationale": (brief explanation of the decision),
          "missingInformation": (array of strings indicating what information would be needed for a definitive decision, if any),
          "suggestedAlternatives": (array of alternative medication names if the request is denied)
        }
        
        Apply strict objective criteria. Do not make assumptions or creative interpretations beyond what's explicitly stated.`,
        messages: [
          { 
            role: 'user', 
            content: promptContext
          }
        ],
      });

      // Parse the AI response from the first content block
      try {
        // Access the content properly depending on the type of content block
        let responseText = '';
        
        if (response.content[0].type === 'text') {
          responseText = response.content[0].text;
        } else {
          console.error("Unexpected response content type:", response.content[0].type);
          throw new Error("Invalid response format");
        }
        
        const result = JSON.parse(responseText);
        
        // Validate the response against our schema
        const validatedResponse = PADecisionResponseSchema.parse({
          decision: result.decision,
          confidence: result.confidence,
          rationale: result.rationale,
          missingInformation: result.missingInformation || [],
          suggestedAlternatives: result.suggestedAlternatives || [],
        });
        
        return validatedResponse;
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        return {
          decision: "NEEDS_REVIEW",
          confidence: 0,
          rationale: "Unable to process AI response",
          missingInformation: ["Technical error in processing"],
          suggestedAlternatives: [],
        };
      }
    } catch (error) {
      console.error("AI service error:", error);
      return {
        decision: "NEEDS_REVIEW",
        confidence: 0,
        rationale: "Error in AI processing service",
        missingInformation: ["Technical error occurred"],
        suggestedAlternatives: [],
      };
    }
  }

  /**
   * Build a comprehensive prompt context for the AI model
   */
  private buildPromptContext(
    medication: MedicationDTO,
    patientInfo: {
      age?: number;
      gender?: string;
      diagnosisCode?: string;
      dosage?: string;
      quantity?: number;
    }
  ): string {
    return `
# Prior Authorization Request Assessment

## Medication Information
- Name: ${medication.name}
- Brand Name: ${medication.brandName || 'N/A'}
- Drug Class: ${medication.drugClass || 'N/A'}
- Formulary Status: ${medication.formularyStatus}
- Requires Prior Authorization: ${medication.requiresPA ? 'Yes' : 'No'}
${medication.dosageForms ? `- Available Dosage Forms: ${JSON.stringify(medication.dosageForms)}` : ''}
${medication.quantityLimits ? `- Quantity Limits: ${medication.quantityLimits}` : ''}
${medication.ageRestrictions ? `- Age Restrictions: ${medication.ageRestrictions}` : ''}
${medication.genderRestrictions ? `- Gender Restrictions: ${medication.genderRestrictions}` : ''}
${medication.paType ? `- PA Type: ${medication.paType}` : ''}

## PA Criteria
${medication.paCriteria && medication.paCriteria.length > 0 
  ? medication.paCriteria.map((criteria, i) => `${i+1}. ${criteria}`).join('\n')
  : 'No specific PA criteria listed'}

${medication.requiredDocumentation && medication.requiredDocumentation.length > 0 
  ? `## Required Documentation\n${medication.requiredDocumentation.map((doc, i) => `${i+1}. ${doc}`).join('\n')}`
  : ''}

## Patient Information
- Age: ${patientInfo.age !== undefined ? patientInfo.age : 'Not provided'}
- Gender: ${patientInfo.gender || 'Not provided'}
- Diagnosis Code: ${patientInfo.diagnosisCode || 'Not provided'}
- Requested Dosage: ${patientInfo.dosage || 'Not provided'}
- Requested Quantity: ${patientInfo.quantity !== undefined ? patientInfo.quantity : 'Not provided'}

## Alternative Medications
${medication.alternatives && medication.alternatives.length > 0 
  ? medication.alternatives.map(alt => 
    `- ${alt.name}${alt.brandName ? ` (${alt.brandName})` : ''}: ${alt.formularyStatus}, Requires PA: ${alt.requiresPA ? 'Yes' : 'No'}`
  ).join('\n')
  : 'No alternatives listed'}

Based on the information provided, please determine if this prior authorization request should be APPROVED, DENIED, or sent for manual NEEDS_REVIEW. Provide your decision with rationale, confidence score, any missing information needed, and suggested alternatives if appropriate.`;
  }
}

export const aiService = new AIService();