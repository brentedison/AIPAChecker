import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SearchQuery } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SearchFormProps {
  drugClasses: string[];
  onSearch: (query: SearchQuery) => void;
  onCategorySearch: (category: string) => void;
}

const formSchema = z.object({
  medicationName: z.string().optional(),
  drugClass: z.string().optional(),
  patientAge: z.coerce.number().optional(),
  dosage: z.string().optional(),
  quantity: z.coerce.number().optional(),
});

export default function SearchForm({ drugClasses, onSearch, onCategorySearch }: SearchFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medicationName: "",
      drugClass: "",
      patientAge: undefined,
      dosage: "",
      quantity: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Convert "all-classes" value to empty string for API consistency
    const searchValues = {
      ...values,
      drugClass: values.drugClass === "all-classes" ? "" : values.drugClass
    };
    onSearch(searchValues as SearchQuery);
  }

  function handleClear() {
    form.reset();
  }

  return (
    <Card className="bg-white rounded-lg shadow-md p-6 mb-8">
      <CardContent className="p-0">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-2 font-inter">Check Prior Authorization Requirements</h2>
          <p className="text-neutral-600">
            Search for a medication to check if it requires prior authorization and view coverage details.
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="medicationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-800">Medication Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Enter generic or brand name"
                          className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                          {...field}
                        />
                        <Search className="absolute right-3 top-3 text-neutral-600 h-5 w-5" />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="drugClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-800">Drug Class (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary">
                          <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all-classes">All Classes</SelectItem>
                        {drugClasses.map((drugClass) => (
                          <SelectItem key={drugClass} value={drugClass}>
                            {drugClass}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="patientAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-800">Patient Age (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Age in years"
                          className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-800">Dosage (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 20mg"
                          className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-800">Quantity (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 30"
                          className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <button
                  type="button"
                  className="text-[#0078D4] flex items-center font-medium"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <Settings className="mr-1 h-4 w-4" />
                  Advanced Search Options
                </button>
              </div>
              
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="px-5 py-2.5 border border-neutral-300 rounded-md mr-2 font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0078D4] hover:bg-[#41A3E3] text-white rounded-md font-medium shadow-sm"
                >
                  Search
                </Button>
              </div>
            </div>
          </form>
        </Form>
        
        <Separator className="my-4" />
        
        <div>
          <h3 className="text-sm font-medium text-neutral-600 mb-3 font-inter">Quick Search by Common Categories:</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onCategorySearch("Antidiabetics")}
              className="px-3 py-1.5 bg-blue-50 text-[#0078D4] rounded-full text-sm hover:bg-blue-100 transition-colors"
            >
              Antidiabetics
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onCategorySearch("Cardiovascular Agents")}
              className="px-3 py-1.5 bg-blue-50 text-[#0078D4] rounded-full text-sm hover:bg-blue-100 transition-colors"
            >
              Antihypertensives
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onCategorySearch("Pain Management")}
              className="px-3 py-1.5 bg-blue-50 text-[#0078D4] rounded-full text-sm hover:bg-blue-100 transition-colors"
            >
              Pain Management
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onCategorySearch("Mental Health")}
              className="px-3 py-1.5 bg-blue-50 text-[#0078D4] rounded-full text-sm hover:bg-blue-100 transition-colors"
            >
              Mental Health
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onCategorySearch("Requires PA")}
              className="px-3 py-1.5 bg-blue-50 text-[#0078D4] rounded-full text-sm hover:bg-blue-100 transition-colors"
            >
              Requires PA
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
