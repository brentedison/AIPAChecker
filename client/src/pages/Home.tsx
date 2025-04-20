import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import MedicationCard from "@/components/MedicationCard";
import InformationSection from "@/components/InformationSection";
import HelpModal from "@/components/HelpModal";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { Medication, SearchQuery } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info, Search } from "lucide-react";

export default function Home() {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    medicationName: "",
    drugClass: "",
    formularyId: 1, // Default to the first formulary
  });

  // Fetch drug classes
  const { data: drugClasses = [] } = useQuery({
    queryKey: ['/api/drug-classes'],
  });

  // Search results query
  const {
    data: searchResults = [],
    isLoading: isSearching,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/search', searchQuery],
    enabled: !!searchQuery.medicationName || !!searchQuery.drugClass || searchQuery.requiresPA !== undefined,
    queryFn: async ({ queryKey }) => {
      const query = queryKey[1] as SearchQuery;
      
      // Build query string for GET request
      const queryParams = new URLSearchParams();
      if (query.formularyId) queryParams.append('formularyId', query.formularyId.toString());
      if (query.medicationName) queryParams.append('medicationName', query.medicationName);
      if (query.drugClass) queryParams.append('drugClass', query.drugClass);
      if (query.patientAge !== undefined) queryParams.append('patientAge', query.patientAge.toString());
      if (query.patientGender) queryParams.append('patientGender', query.patientGender);
      if (query.dosage) queryParams.append('dosage', query.dosage);
      if (query.quantity !== undefined) queryParams.append('quantity', query.quantity.toString());
      if (query.requiresPA !== undefined) queryParams.append('requiresPA', query.requiresPA.toString());
      
      const response = await apiRequest('GET', `/api/search?${queryParams.toString()}`);
      return await response.json();
    }
  });

  const handleSearchSubmit = (query: SearchQuery) => {
    setSearchQuery(query);
  };

  const handleCategorySearch = (category: string) => {
    if (category === "Requires PA") {
      setSearchQuery({ 
        requiresPA: true,
        formularyId: searchQuery.formularyId // Preserve the current formulary ID
      });
    } else {
      setSearchQuery({ 
        drugClass: category,
        formularyId: searchQuery.formularyId // Preserve the current formulary ID
      });
    }
  };

  const handleUploadFormulary = async () => {
    try {
      await apiRequest('POST', '/api/upload-formulary', {
        formularyId: searchQuery.formularyId
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drug-classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/search'] });
    } catch (error) {
      console.error('Error uploading formulary:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      <Header 
        onHelpClick={() => setShowHelpModal(true)} 
        onUploadClick={handleUploadFormulary}
      />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <SearchForm 
          drugClasses={drugClasses} 
          onSearch={handleSearchSubmit}
          onCategorySearch={handleCategorySearch}
        />
        
        <section id="searchResults" className="mb-8">
          {(!!searchQuery.medicationName || !!searchQuery.drugClass || searchQuery.requiresPA !== undefined) && (
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Coverage Results</h2>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <span className="font-medium">{searchResults.length}</span> medications found
              </div>
            </div>
          )}

          {isSearching ? (
            // Loading skeleton
            <>
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-5">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32 mb-3" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </>
          ) : isError ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                There was an error searching medications: {error instanceof Error ? error.message : "Unknown error"}
              </AlertDescription>
            </Alert>
          ) : searchResults.length === 0 && (!!searchQuery.medicationName || !!searchQuery.drugClass || searchQuery.requiresPA !== undefined) ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center mb-6">
              <div className="flex flex-col items-center justify-center">
                <div className="rounded-full bg-gray-100 p-3 mb-3">
                  <Info className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">No medications found</h3>
                <p className="text-gray-600 max-w-md">
                  No medications match your search criteria. Try broadening your search terms or browsing by category.
                </p>
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            // Display search results
            <div className="space-y-4">
              {searchResults.map((medication: Medication) => (
                <MedicationCard key={medication.id} medication={medication} />
              ))}
            </div>
          ) : (
            // Initial state - no search performed yet
            <div className="bg-white/50 rounded-lg border border-dashed border-gray-300 p-8 text-center mb-6">
              <div className="flex flex-col items-center justify-center">
                <div className="rounded-full bg-blue-50 p-3 mb-3">
                  <Search className="h-6 w-6 text-[#0078D4]" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">Start Your Search</h3>
                <p className="text-gray-600 max-w-md">
                  Enter a medication name or select a drug class above to check PA requirements and coverage details.
                </p>
              </div>
            </div>
          )}
        </section>
        
        <InformationSection />
      </main>
      
      <Footer />
      
      {showHelpModal && (
        <HelpModal onClose={() => setShowHelpModal(false)} />
      )}
    </div>
  );
}
