import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, Clock, Loader2, ChevronDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { PADecisionResponse, PARequest, Medication } from "@shared/schema";

interface AIPADecisionProps {
  medication: Medication;
  patientInfo: {
    age?: number;
    gender?: string;
    diagnosisCode?: string;
    dosage?: string;
    quantity?: number;
    formularyId: number;
  };
  onDismiss: () => void;
}

export default function AIPADecision({ medication, patientInfo, onDismiss }: AIPADecisionProps) {
  const { toast } = useToast();
  const [showRationale, setShowRationale] = useState(false);

  // Prepare the request data
  const paRequest: PARequest = {
    medicationId: medication.id,
    formularyId: patientInfo.formularyId,
    patientAge: patientInfo.age,
    patientGender: patientInfo.gender,
    diagnosisCode: patientInfo.diagnosisCode,
    dosage: patientInfo.dosage,
    quantity: patientInfo.quantity,
  };

  // Query the AI decision
  const { data: decision, isLoading, isError } = useQuery<PADecisionResponse>({
    queryKey: ['/api/analyze-pa', medication.id],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/analyze-pa', {
          method: 'POST',
          body: JSON.stringify(paRequest),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return response.json();
      } catch (error) {
        toast({
          title: "Error analyzing PA request",
          description: "There was an error processing your prior authorization request.",
          variant: "destructive",
        });
        throw error;
      }
    }
  });

  // Determine the decision status
  let statusColor = '';
  let statusIcon = null;
  let statusTitle = '';
  let statusBgColor = '';
  let confidenceLabel = '';

  if (decision) {
    if (decision.decision === 'APPROVED') {
      statusColor = 'text-green-600';
      statusBgColor = 'bg-green-50 border-green-200';
      statusIcon = <CheckCircle className="h-12 w-12 text-green-600" />;
      statusTitle = 'Approved';
      confidenceLabel = decision.confidence >= 0.8 ? 'High' : decision.confidence >= 0.5 ? 'Moderate' : 'Low';
    } else if (decision.decision === 'DENIED') {
      statusColor = 'text-red-600';
      statusBgColor = 'bg-red-50 border-red-200';
      statusIcon = <XCircle className="h-12 w-12 text-red-600" />;
      statusTitle = 'Denied';
      confidenceLabel = decision.confidence >= 0.8 ? 'High' : decision.confidence >= 0.5 ? 'Moderate' : 'Low';
    } else {
      statusColor = 'text-amber-600';
      statusBgColor = 'bg-amber-50 border-amber-200';
      statusIcon = <AlertTriangle className="h-12 w-12 text-amber-600" />;
      statusTitle = 'Needs Review';
      confidenceLabel = 'N/A';
    }
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg border-t-4 border-t-blue-500 max-w-3xl mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold flex items-center">
            AI Prior Authorization Analysis
          </CardTitle>
          <CardDescription>
            Processing your prior authorization request...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 text-center">
            Our AI is analyzing the medication request against formulary criteria.
            <br />This may take a few moments...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="shadow-lg border-t-4 border-t-red-500 max-w-3xl mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center text-red-600">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Error Processing Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error processing your prior authorization request. Please try again or contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={onDismiss} variant="outline">Close</Button>
        </CardFooter>
      </Card>
    );
  }

  if (!decision) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`shadow-lg border-t-4 border-t-${decision.decision === 'APPROVED' ? 'green' : decision.decision === 'DENIED' ? 'red' : 'amber'}-500 max-w-3xl mx-auto`}>
        <CardHeader className={`pb-2 ${statusBgColor} rounded-t-lg`}>
          <CardTitle className={`text-2xl font-bold flex items-center ${statusColor}`}>
            {statusIcon}
            <div className="ml-4">
              <div>PA {statusTitle}</div>
              <div className="text-sm font-normal mt-1">
                Confidence: <span className="font-medium">{confidenceLabel}</span> ({Math.round(decision.confidence * 100)}%)
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Medication</h3>
              <p className="text-lg font-semibold">{medication.name}</p>
              {medication.brandName && <p className="text-sm text-gray-500">({medication.brandName})</p>}
              <div className="mt-1 text-sm">
                <div>Class: <span className="font-medium">{medication.drugClass || 'Not specified'}</span></div>
                <div>Status: <span className="font-medium">{medication.formularyStatus}</span></div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Patient Information</h3>
              <div className="text-sm">
                {patientInfo.age && <div>Age: <span className="font-medium">{patientInfo.age} years</span></div>}
                {patientInfo.gender && <div>Gender: <span className="font-medium">{patientInfo.gender}</span></div>}
                {patientInfo.diagnosisCode && (
                  <div>Diagnosis Code: <span className="font-medium">{patientInfo.diagnosisCode}</span></div>
                )}
                {patientInfo.dosage && <div>Dosage: <span className="font-medium">{patientInfo.dosage}</span></div>}
                {patientInfo.quantity && <div>Quantity: <span className="font-medium">{patientInfo.quantity}</span></div>}
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="mb-4 text-gray-600 hover:text-gray-900"
            onClick={() => setShowRationale(!showRationale)}
          >
            {showRationale ? 'Hide Decision Rationale' : 'Show Decision Rationale'}
            <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showRationale ? 'rotate-180' : ''}`} />
          </Button>
          
          {showRationale && (
            <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Decision Rationale</h3>
              <p className="text-sm text-gray-600">{decision.rationale}</p>
              
              {decision.missingInformation.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-1">Missing Information</h4>
                  <ul className="text-sm text-gray-600 list-disc pl-5">
                    {decision.missingInformation.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {decision.decision === 'DENIED' && decision.suggestedAlternatives.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">Suggested Alternatives</h3>
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <ul className="text-sm text-gray-600 space-y-2">
                  {decision.suggestedAlternatives.map((alt, index) => (
                    <li key={index} className="flex items-start">
                      <ArrowRight className="text-blue-500 mr-2 h-4 w-4 shrink-0 mt-0.5" />
                      {alt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {decision.decision === 'NEEDS_REVIEW' && (
            <Alert className="mt-4 bg-amber-50 border-amber-200">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Manual Review Required</AlertTitle>
              <AlertDescription className="text-amber-700">
                This request needs additional review by a healthcare professional. Please submit the request through your regular PA submission process.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2 pt-2 border-t">
          <Button onClick={onDismiss} variant="outline">Close</Button>
          {decision.decision === 'APPROVED' && (
            <Button className="bg-green-600 hover:bg-green-700">
              Download Approval
            </Button>
          )}
          {decision.decision === 'DENIED' && (
            <Button className="bg-blue-600 hover:bg-blue-700">
              Submit Appeal
            </Button>
          )}
          {decision.decision === 'NEEDS_REVIEW' && (
            <Button className="bg-amber-600 hover:bg-amber-700">
              Submit for Review
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}