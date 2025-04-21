import { useState, useEffect } from "react";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, ChevronDown, ChevronUp, FileText, Filter, Calendar, TabletSmartphone, Pill, Book } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";

interface SearchFormProps {
  drugClasses: string[];
  onSearch: (query: SearchQuery) => void;
  onCategorySearch: (category: string) => void;
}

// Formulary type
interface Formulary {
  id: number;
  name: string;
  provider?: string;
  year?: number;
  description?: string;
}

// Updated schema with more required fields for better PA determination
const formSchema = z.object({
  medicationName: z.string().min(2, { message: "Medication name is required" }).or(z.literal("")),
  drugClass: z.string().optional(),
  patientAge: z.coerce.number().positive().int().optional(),
  patientGender: z.enum(['male', 'female', 'other']).optional(),
  dosage: z.string().optional(),
  quantity: z.coerce.number().positive().int().optional(),
  formularyId: z.coerce.number().default(1), // Default to first formulary for now
});

export default function SearchForm({ drugClasses, onSearch, onCategorySearch }: SearchFormProps) {
  const [activeTab, setActiveTab] = useState<string>("advanced"); // Make advanced search the default
  const [showAdvanced, setShowAdvanced] = useState(true); // Show advanced options by default

  // Fetch available formularies
  const { data: formularies = [] } = useQuery<Formulary[]>({
    queryKey: ['/api/formularies'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medicationName: "",
      drugClass: "",
      patientAge: undefined,
      patientGender: undefined,
      dosage: "",
      quantity: undefined,
      formularyId: 1,
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
    <Card className="bg-white rounded-lg shadow-md mb-8 border-t-4 border-t-[#0078D4]">
      <CardHeader className="pb-0">
        <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-2 h-5 w-5 text-[#0078D4]" />
          Formulary Drug Lookup
        </CardTitle>
        <CardDescription className="text-gray-600">
          Check coverage status, prior authorization requirements, and formulary alternatives
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Tabs defaultValue="advanced" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="quick" className="text-sm font-medium">
              Quick Search
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-sm font-medium">
              Advanced Search
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="quick" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="medicationName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-gray-700 font-medium">Drug Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Enter drug name (generic or brand)"
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0078D4] focus:border-[#0078D4] pl-10"
                              {...field}
                            />
                            <Search className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    className="px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-md font-medium shadow-sm"
                  >
                    Search
                  </Button>
                </div>
              </form>
            </Form>
            
            <Separator className="my-6" />
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Browse by Common Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {drugClasses.map((drugClass) => (
                  <Button
                    key={drugClass}
                    type="button"
                    variant="outline"
                    onClick={() => onCategorySearch(drugClass)}
                    className="justify-start text-left px-3 py-2 border border-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <Pill className="mr-2 h-4 w-4 text-[#0078D4]" />
                    {drugClass}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onCategorySearch("Requires PA")}
                  className="justify-start text-left px-3 py-2 border border-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <Filter className="mr-2 h-4 w-4 text-orange-500" />
                  Requires PA
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Formulary Selection */}
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-4">
                  <FormField
                    control={form.control}
                    name="formularyId"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-gray-700 font-semibold flex items-center">
                          <Book className="mr-2 h-4 w-4 text-blue-500" />
                          Select Formulary
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-1 text-gray-400 cursor-help text-xs">ⓘ</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Choose the patient's specific formulary</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value ? field.value.toString() : "1"}
                          >
                            <SelectTrigger className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0078D4] focus:border-[#0078D4]">
                              <SelectValue placeholder="Select a formulary" />
                            </SelectTrigger>
                            <SelectContent>
                              {formularies.map((formulary) => (
                                <SelectItem key={formulary.id} value={formulary.id.toString()}>
                                  {formulary.name} {formulary.year ? `(${formulary.year})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="medicationName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-gray-700 font-medium">
                          Drug Name
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-1 text-gray-400 cursor-help text-xs">ⓘ</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Enter generic or brand name</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Enter drug name (generic or brand)"
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0078D4] focus:border-[#0078D4] pl-10"
                              {...field}
                            />
                            <Search className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="drugClass"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-gray-700 font-medium">Drug Class</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0078D4] focus:border-[#0078D4]">
                              <SelectValue placeholder="Select drug class" />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Patient Information</h3>
                    <button
                      type="button"
                      className="text-[#0078D4] text-sm flex items-center"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      {showAdvanced ? (
                        <>Hide <ChevronUp className="ml-1 h-4 w-4" /></>
                      ) : (
                        <>Show <ChevronDown className="ml-1 h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                  
                  {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="patientAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">
                              <div className="flex items-center">
                                <Calendar className="mr-1.5 h-4 w-4 text-gray-500" />
                                Patient Age
                              </div>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Age in years"
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0078D4] focus:border-[#0078D4]"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="patientGender"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-gray-700 font-medium">
                              <div className="flex items-center">
                                <TabletSmartphone className="mr-1.5 h-4 w-4 text-gray-500" />
                                Patient Gender
                              </div>
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="male" />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    Male
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="female" />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    Female
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="other" />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    Other
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Prescription Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dosage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Dosage</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 20mg daily"
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0078D4] focus:border-[#0078D4]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 30"
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0078D4] focus:border-[#0078D4]"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="pt-2 flex items-center justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    className="px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-md font-medium shadow-sm"
                  >
                    Check Coverage
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
