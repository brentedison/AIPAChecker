import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl font-bold text-neutral-800 font-inter">
              Help & Instructions
            </DialogTitle>
            <Button
              variant="ghost"
              className="h-6 w-6 p-0 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Learn how to use the Prior Authorization Checker
          </DialogDescription>
        </DialogHeader>

        <div className="prose text-neutral-700 max-w-none">
          <h3 className="text-lg font-medium text-neutral-800">How to Use This Tool</h3>
          <p>
            This application allows you to check if a medication requires Prior
            Authorization (PA) based on multiple formularies. Select the specific
            formulary that applies to your patient for accurate results.
          </p>

          <h4 className="text-base font-medium text-neutral-800 mt-4">Advanced Search</h4>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Select the appropriate formulary for your patient</li>
            <li>Enter a medication name (generic or brand)</li>
            <li>Provide patient demographics (age, gender) for accurate PA prediction</li>
            <li>Enter dosing information to check for quantity limits</li>
            <li>Click "Search" to see coverage details</li>
          </ol>

          <h4 className="text-base font-medium text-neutral-800 mt-4">Understanding Results</h4>
          <ul className="list-disc ml-5 space-y-1">
            <li>
              <span className="text-green-700 font-medium">Green indicators</span>: No PA required, medication is preferred
            </li>
            <li>
              <span className="text-yellow-700 font-medium">Yellow indicators</span>: PA required, medication is covered with
              requirements
            </li>
            <li>
              <span className="text-red-700 font-medium">Red indicators</span>: Non-formulary medication
            </li>
          </ul>

          <h4 className="text-base font-medium text-neutral-800 mt-4">Advanced Features</h4>
          <ul className="list-disc ml-5 space-y-1">
            <li>Click on a medication card to view detailed information</li>
            <li>
              Check the "Alternatives" tab to find preferred medications in the
              same class
            </li>
            <li>Review specific PA criteria in the "PA Criteria" tab</li>
          </ul>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
