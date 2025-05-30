import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ExternalLink } from "lucide-react";

export default function InformationSection() {
  return (
    <Card className="bg-white rounded-lg shadow-md p-6">
      <CardContent className="p-0">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4 font-inter">Prior Authorization Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-neutral-800 mb-3 font-inter">Submission Process</h3>
            <div className="prose text-neutral-700 text-sm">
              <p className="mb-2">When Prior Authorization is required, submit requests through the methods specific to the selected formulary:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Complete and submit PA forms from the provider's website</li>
                <li>Online submission via healthcare provider's portal</li>
                <li>Phone or fax submission to pharmacy services</li>
                <li>Electronic submission through EHR integrations</li>
              </ul>
              <p className="mt-3">
                Submission details will be specific to the patient's insurance formulary. 
                Check the selected formulary documentation for specific submission guidelines.
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-neutral-800 mb-3 font-inter">PA Request Checklist</h3>
            <div className="bg-blue-50 p-4 rounded-md">
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="text-[#0078D4] mr-2 h-5 w-5 shrink-0 mt-0.5" />
                  <span>Complete all required fields on the PA form</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-[#0078D4] mr-2 h-5 w-5 shrink-0 mt-0.5" />
                  <span>Include patient diagnosis and specific clinical indication</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-[#0078D4] mr-2 h-5 w-5 shrink-0 mt-0.5" />
                  <span>Document previous treatment history and response</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-[#0078D4] mr-2 h-5 w-5 shrink-0 mt-0.5" />
                  <span>Attach relevant lab results and clinical documentation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-[#0078D4] mr-2 h-5 w-5 shrink-0 mt-0.5" />
                  <span>Include provider contact information</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
