import AppLogo from "@/assets/AppLogo";
import { Button } from "@/components/ui/button";
import { Upload, HelpCircle } from "lucide-react";

interface HeaderProps {
  onHelpClick: () => void;
  onUploadClick: () => void;
}

export default function Header({ onHelpClick, onUploadClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <AppLogo className="w-12 h-12 mr-3" />
          <div>
            <h1 className="text-xl font-bold text-neutral-800 font-inter">Prior Authorization Checker</h1>
            <p className="text-sm text-neutral-600">Formulary Coverage & PA Requirements</p>
          </div>
        </div>
        <div className="flex items-center">
          <Button 
            variant="default" 
            onClick={onUploadClick}
            className="mr-2 bg-[#0078D4] hover:bg-[#41A3E3]"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Formulary
          </Button>
          <Button 
            variant="outline" 
            onClick={onHelpClick}
            className="text-[#0078D4] border-[#0078D4] hover:bg-blue-50"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Help
          </Button>
        </div>
      </div>
    </header>
  );
}
