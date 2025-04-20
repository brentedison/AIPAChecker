import { useQuery } from "@tanstack/react-query";
import { Medication } from "@shared/schema";

export function useFormulary() {
  // Fetch all medications
  const {
    data: medications = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/medications'],
  });

  // Fetch drug classes
  const { 
    data: drugClasses = [],
    isLoading: isLoadingClasses 
  } = useQuery({
    queryKey: ['/api/drug-classes'],
  });

  // Get a specific medication by ID
  const getMedicationById = (id: number): Medication | undefined => {
    return medications.find((med: Medication) => med.id === id);
  };

  // Get medications by drug class
  const getMedicationsByClass = (drugClass: string): Medication[] => {
    return medications.filter(
      (med: Medication) => med.drugClass === drugClass
    );
  };

  // Get medications that require PA
  const getMedicationsRequiringPA = (): Medication[] => {
    return medications.filter((med: Medication) => med.requiresPA);
  };

  return {
    medications,
    drugClasses,
    isLoading,
    isLoadingClasses,
    isError,
    error,
    getMedicationById,
    getMedicationsByClass,
    getMedicationsRequiringPA
  };
}

export default useFormulary;
