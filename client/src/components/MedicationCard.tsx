import { useState } from "react";
import { Medication } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleAlert, AlertCircle, ArrowRight, FileText, Brain, Bot, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import AIPADecision from "./AIPADecision";

interface MedicationCardProps {
  medication: Medication;
}

export default function MedicationCard({ medication }: MedicationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAIDecision, setShowAIDecision] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    formularyId: medication.formularyId,
    age: undefined as number | undefined,
    gender: undefined as string | undefined,
    diagnosisCode: undefined as string | undefined,
    dosage: undefined as string | undefined,
    quantity: undefined as number | undefined,
  });

  const getBorderColor = () => {
    switch (medication.formularyStatus) {
      case 'preferred':
        return 'border-l-[#32CD32]';
      case 'preferred-with-pa':
        return 'border-l-[#0078D4]';
      case 'non-preferred':
      case 'non-formulary':
        return 'border-l-[#FF6347]';
      default:
        return 'border-l-gray-300';
    }
  };

  const getStatusBadge = () => {
    if (medication.formularyStatus === 'preferred' && !medication.requiresPA) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          <CircleAlert className="mr-1 h-3 w-3" /> No Prior Authorization
        </Badge>
      );
    } else if (medication.requiresPA) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertCircle className="mr-1 h-3 w-3" /> Prior Authorization Required
        </Badge>
      );
    } else if (medication.formularyStatus === 'non-formulary') {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="mr-1 h-3 w-3" /> Non-Formulary
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
      <div 
        className={cn(
          "border-l-4 p-4 cursor-pointer hover:bg-blue-50 transition-colors",
          getBorderColor()
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-wrap justify-between items-start">
          <div className="mb-2 md:mb-0">
            <h3 className="text-lg font-semibold text-neutral-800 font-inter">
              {medication.name}
            </h3>
            {medication.brandName && (
              <p className="text-neutral-600 text-sm">Brand Name: {medication.brandName}</p>
            )}
          </div>
          <div className="flex items-center">
            {getStatusBadge()}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {medication.drugClass && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
              {medication.drugClass}
            </Badge>
          )}
          {medication.quantityLimits && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
              Quantity Limits
            </Badge>
          )}
          {medication.ageRestrictions && (
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
              Age Restrictions
            </Badge>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 border-t border-neutral-200 bg-blue-50">
          <Tabs defaultValue="coverage">
            <TabsList className="border-b border-neutral-200 mb-4 bg-transparent">
              <TabsTrigger value="coverage" className="px-3 py-2 text-sm font-medium data-[state=active]:text-[#0078D4] data-[state=active]:border-b-2 data-[state=active]:border-[#0078D4]">
                Coverage Details
              </TabsTrigger>
              <TabsTrigger value="alternatives" className="px-3 py-2 text-sm font-medium data-[state=active]:text-[#0078D4] data-[state=active]:border-b-2 data-[state=active]:border-[#0078D4]">
                Alternatives
              </TabsTrigger>
              <TabsTrigger value="criteria" className="px-3 py-2 text-sm font-medium data-[state=active]:text-[#0078D4] data-[state=active]:border-b-2 data-[state=active]:border-[#0078D4]">
                PA Criteria
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="coverage">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-800 mb-2 font-inter">Coverage Information</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-neutral-600 mr-2 min-w-[130px]">Formulary Status:</span>
                      <span className="font-medium text-neutral-800">
                        {medication.formularyStatus === 'preferred' ? 'Preferred' : 
                         medication.formularyStatus === 'preferred-with-pa' ? 'Preferred with PA' : 
                         medication.formularyStatus === 'non-preferred' ? 'Non-Preferred' : 
                         'Non-Formulary'}
                      </span>
                    </li>
                    {medication.dosageForms && medication.dosageForms.length > 0 && (
                      <li className="flex items-start">
                        <span className="text-neutral-600 mr-2 min-w-[130px]">Dosage Forms:</span>
                        <span className="font-medium text-neutral-800">{medication.dosageForms.join(', ')}</span>
                      </li>
                    )}
                    {medication.quantityLimits && (
                      <li className="flex items-start">
                        <span className="text-neutral-600 mr-2 min-w-[130px]">Quantity Limits:</span>
                        <span className="font-medium text-neutral-800">{medication.quantityLimits}</span>
                      </li>
                    )}
                    {medication.ageRestrictions && (
                      <li className="flex items-start">
                        <span className="text-neutral-600 mr-2 min-w-[130px]">Age Restrictions:</span>
                        <span className="font-medium text-neutral-800">{medication.ageRestrictions}</span>
                      </li>
                    )}
                    {medication.genderRestrictions && (
                      <li className="flex items-start">
                        <span className="text-neutral-600 mr-2 min-w-[130px]">Gender Restrictions:</span>
                        <span className="font-medium text-neutral-800">{medication.genderRestrictions}</span>
                      </li>
                    )}
                  </ul>
                </div>
                
                {medication.requiresPA && (
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-2 font-inter">Prior Authorization</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="text-neutral-600 mr-2 min-w-[130px]">PA Required:</span>
                        <span className="font-medium text-yellow-600">Yes</span>
                      </li>
                      {medication.paType && (
                        <li className="flex items-start">
                          <span className="text-neutral-600 mr-2 min-w-[130px]">PA Type:</span>
                          <span className="font-medium text-neutral-800">{medication.paType}</span>
                        </li>
                      )}
                      {medication.authorizationDuration && (
                        <li className="flex items-start">
                          <span className="text-neutral-600 mr-2 min-w-[130px]">Authorization Duration:</span>
                          <span className="font-medium text-neutral-800">{medication.authorizationDuration}</span>
                        </li>
                      )}
                    </ul>
                    <div className="mt-4">
                      <Button 
                        variant="link" 
                        className="text-[#0078D4] hover:underline text-sm p-0 h-auto"
                      >
                        <FileText className="mr-1 h-4 w-4" /> Download PA Form
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="alternatives">
              <h4 className="text-sm font-semibold text-neutral-800 mb-3 font-inter">Preferred Alternatives</h4>
              {medication.alternatives && medication.alternatives.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {medication.alternatives.map((alt) => (
                    <div key={alt.id} className="border border-neutral-200 rounded p-3 bg-white">
                      <div className="flex justify-between">
                        <div>
                          <h5 className="font-medium text-neutral-800">{alt.name}</h5>
                          {alt.brandName && (
                            <p className="text-sm text-neutral-600">Brand: {alt.brandName}</p>
                          )}
                        </div>
                        <Badge variant="outline" className={cn(
                          alt.formularyStatus === 'preferred' ? 'bg-green-100 text-green-800 border-green-200' : 
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        )}>
                          {alt.formularyStatus === 'preferred' ? 'Preferred' : 'Preferred with PA'}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">
                        <p className="text-neutral-600">
                          {alt.requiresPA ? 'Prior Authorization required' : 'No Prior Authorization required'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-neutral-200 rounded p-4 text-neutral-600">
                  No alternative medications found for this drug.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="criteria">
              <h4 className="text-sm font-semibold text-neutral-800 mb-3 font-inter">Prior Authorization Criteria</h4>
              {medication.requiresPA ? (
                <div className="bg-white border border-neutral-200 rounded-md p-4">
                  {medication.paCriteria && medication.paCriteria.length > 0 ? (
                    <>
                      <p className="text-sm text-neutral-700 mb-3">
                        Authorization will be approved when ALL of the following criteria are met:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-700 ml-2">
                        {medication.paCriteria.map((criteria, index) => (
                          <li key={index}>{criteria}</li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <p className="text-sm text-neutral-700">
                      Prior authorization required. Specific criteria not available.
                    </p>
                  )}
                  
                  {medication.requiredDocumentation && medication.requiredDocumentation.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <p className="text-sm font-medium text-neutral-800">Required Documentation:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-neutral-700 ml-2 mt-2">
                        {medication.requiredDocumentation.map((doc, index) => (
                          <li key={index}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-neutral-200 rounded p-4 text-neutral-600">
                  This medication does not require prior authorization.
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {medication.requiresPA && (
            <>
              <Separator className="my-4" />
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => setShowAIDecision(true)}
                  className="bg-[#0078D4] hover:bg-[#106EBE] text-white flex items-center gap-2"
                >
                  <Brain className="h-4 w-4" />
                  AI-Powered Prior Authorization Determination
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      
      {showAIDecision && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <AIPADecision 
              medication={medication}
              patientInfo={patientInfo}
              onDismiss={() => setShowAIDecision(false)}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
