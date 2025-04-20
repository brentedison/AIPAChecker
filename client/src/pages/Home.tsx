import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import MedicationCard from "@/components/MedicationCard";
import InformationSection from "@/components/InformationSection";
import HelpModal from "@/components/HelpModal";
import { useQuery } from "@tanstack/react-query";
import { Medication, SearchQuery } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    medicationName: "",
    drugClass: "",
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
      if (query.medicationName) queryParams.append('medicationName', query.medicationName);
      if (query.drugClass) queryParams.append('drugClass', query.drugClass);
      if (query.patientAge !== undefined) queryParams.append('patientAge', query.patientAge.toString());
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
      setSearchQuery({ requiresPA: true });
    } else {
      setSearchQuery({ drugClass: category });
    }
  };

  const handleUploadFormulary = async () => {
    try {
      await apiRequest('POST', '/api/upload-formulary');
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drug-classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/search'] });
    } catch (error) {
      console.error('Error uploading formulary:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      <Header 
        onHelpClick={() => setShowHelpModal(true)} 
        onUploadClick={handleUploadFormulary}
      />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <SearchForm 
          drugClasses={drugClasses} 
          onSearch={handleSearchSubmit}
          onCategorySearch={handleCategorySearch}
        />
        
        <section id="searchResults" className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-neutral-800 font-inter">Search Results</h2>
            <div className="text-sm text-neutral-600">
              <span>{searchResults.length}</span> medications found
            </div>
          </div>

          {isSearching ? (
            // Loading skeleton
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-md mb-4 p-4">
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Error searching medications: {error instanceof Error ? error.message : "Unknown error"}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-neutral-600">No medications found matching your search criteria.</p>
              <p className="text-sm text-neutral-500 mt-2">Try adjusting your search terms or browse by category.</p>
            </div>
          ) : (
            // Display search results
            searchResults.map((medication: Medication) => (
              <MedicationCard key={medication.id} medication={medication} />
            ))
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
