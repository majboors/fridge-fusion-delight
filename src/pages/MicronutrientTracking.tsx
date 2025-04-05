
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MicronutrientRadarChart } from "@/components/dashboard/MicronutrientRadarChart";
import { MacronutrientPieChart } from "@/components/dashboard/MacronutrientPieChart";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Loader2, Info, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress"; // Added missing import
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar 
} from "recharts";

interface MicronutrientHistory {
  date: string;
  vitamin_a: number;
  vitamin_c: number;
  calcium: number;
  iron: number;
  potassium: number;
  sodium: number;
}

interface MacronutrientHistory {
  date: string;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface MicronutrientAverages {
  vitamin_a: { value: number; unit: string; percentage: number };
  vitamin_c: { value: number; unit: string; percentage: number };
  calcium: { value: number; unit: string; percentage: number };
  iron: { value: number; unit: string; percentage: number };
  potassium: { value: number; unit: string; percentage: number };
  sodium: { value: number; unit: string; percentage: number };
}

interface MacronutrientAverages {
  protein: { value: number; unit: string; percentage: number };
  carbs: { value: number; unit: string; percentage: number };
  fat: { value: number; unit: string; percentage: number };
  fiber: { value: number; unit: string; percentage: number };
}

export default function MicronutrientTracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [microHistoryData, setMicroHistoryData] = useState<MicronutrientHistory[]>([]);
  const [macroHistoryData, setMacroHistoryData] = useState<MacronutrientHistory[]>([]);
  const [microAverages, setMicroAverages] = useState<MicronutrientAverages>({
    vitamin_a: { value: 0, unit: "mcg", percentage: 0 },
    vitamin_c: { value: 0, unit: "mg", percentage: 0 },
    calcium: { value: 0, unit: "mg", percentage: 0 },
    iron: { value: 0, unit: "mg", percentage: 0 },
    potassium: { value: 0, unit: "mg", percentage: 0 },
    sodium: { value: 0, unit: "mg", percentage: 0 },
  });
  const [macroAverages, setMacroAverages] = useState<MacronutrientAverages>({
    protein: { value: 0, unit: "g", percentage: 0 },
    carbs: { value: 0, unit: "g", percentage: 0 },
    fat: { value: 0, unit: "g", percentage: 0 },
    fiber: { value: 0, unit: "g", percentage: 0 },
  });

  const [radarData, setRadarData] = useState<{ name: string; value: number; fullMark: number }[]>([]);
  const [historyLimit, setHistoryLimit] = useState(7); // Default to showing last 7 days
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);
  const [noDataFound, setNoDataFound] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchNutrientData();
  }, [user, navigate, historyLimit]);

  const fetchNutrientData = async () => {
    try {
      setLoading(true);
      
      const { count, error: countError } = await supabase
        .from('recipes')
        .select('created_at', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      
      if (countError) {
        throw countError;
      }
      
      setTotalHistoryCount(count || 0);
      
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(historyLimit);
      
      if (error) {
        throw error;
      }

      const micronutrientHistory: MicronutrientHistory[] = [];
      const macronutrientHistory: MacronutrientHistory[] = [];
      
      const micronutrientTotals = {
        vitamin_a: { total: 0, count: 0 },
        vitamin_c: { total: 0, count: 0 },
        calcium: { total: 0, count: 0 },
        iron: { total: 0, count: 0 },
        potassium: { total: 0, count: 0 },
        sodium: { total: 0, count: 0 },
      };
      
      const macronutrientTotals = {
        protein: { total: 0, count: 0 },
        carbs: { total: 0, count: 0 },
        fat: { total: 0, count: 0 },
        fiber: { total: 0, count: 0 },
      };
      
      const processedDates = new Set();
      
      if (recipes && recipes.length > 0) {
        recipes.forEach(recipe => {
          const dateStr = new Date(recipe.created_at).toISOString().split('T')[0];
          
          if (processedDates.has(dateStr)) {
            return;
          }
          
          let microData = {
            date: dateStr,
            vitamin_a: 0,
            vitamin_c: 0,
            calcium: 0,
            iron: 0,
            potassium: 0,
            sodium: 0
          };
          
          let macroData = {
            date: dateStr,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
          };
          
          if (recipe.steps && Array.isArray(recipe.steps)) {
            recipe.steps.forEach(step => {
              // Extract micronutrients
              const vitaminAMatch = step.match(/Vitamin A:?\s*(\d+\.?\d*)\s*mcg/i);
              if (vitaminAMatch) {
                microData.vitamin_a = parseFloat(vitaminAMatch[1]);
                micronutrientTotals.vitamin_a.total += microData.vitamin_a;
                micronutrientTotals.vitamin_a.count += 1;
              }
              
              const vitaminCMatch = step.match(/Vitamin C:?\s*(\d+\.?\d*)\s*mg/i);
              if (vitaminCMatch) {
                microData.vitamin_c = parseFloat(vitaminCMatch[1]);
                micronutrientTotals.vitamin_c.total += microData.vitamin_c;
                micronutrientTotals.vitamin_c.count += 1;
              }
              
              const calciumMatch = step.match(/Calcium:?\s*(\d+\.?\d*)\s*mg/i);
              if (calciumMatch) {
                microData.calcium = parseFloat(calciumMatch[1]);
                micronutrientTotals.calcium.total += microData.calcium;
                micronutrientTotals.calcium.count += 1;
              }
              
              const ironMatch = step.match(/Iron:?\s*(\d+\.?\d*)\s*mg/i);
              if (ironMatch) {
                microData.iron = parseFloat(ironMatch[1]);
                micronutrientTotals.iron.total += microData.iron;
                micronutrientTotals.iron.count += 1;
              }
              
              const potassiumMatch = step.match(/Potassium:?\s*(\d+\.?\d*)\s*mg/i);
              if (potassiumMatch) {
                microData.potassium = parseFloat(potassiumMatch[1]);
                micronutrientTotals.potassium.total += microData.potassium;
                micronutrientTotals.potassium.count += 1;
              }
              
              const sodiumMatch = step.match(/Sodium:?\s*(\d+\.?\d*)\s*mg/i);
              if (sodiumMatch) {
                microData.sodium = parseFloat(sodiumMatch[1]);
                micronutrientTotals.sodium.total += microData.sodium;
                micronutrientTotals.sodium.count += 1;
              }
              
              // Extract macronutrients
              const proteinMatch = step.match(/Protein:?\s*(\d+\.?\d*)\s*g/i);
              if (proteinMatch) {
                macroData.protein = parseFloat(proteinMatch[1]);
                macronutrientTotals.protein.total += macroData.protein;
                macronutrientTotals.protein.count += 1;
              }
              
              const carbsMatch = step.match(/Carbs:?\s*(\d+\.?\d*)\s*g/i);
              if (carbsMatch) {
                macroData.carbs = parseFloat(carbsMatch[1]);
                macronutrientTotals.carbs.total += macroData.carbs;
                macronutrientTotals.carbs.count += 1;
              }
              
              const fatMatch = step.match(/Fat:?\s*(\d+\.?\d*)\s*g/i);
              if (fatMatch) {
                macroData.fat = parseFloat(fatMatch[1]);
                macronutrientTotals.fat.total += macroData.fat;
                macronutrientTotals.fat.count += 1;
              }
              
              const fiberMatch = step.match(/Fiber:?\s*(\d+\.?\d*)\s*g/i);
              if (fiberMatch) {
                macroData.fiber = parseFloat(fiberMatch[1]);
                macronutrientTotals.fiber.total += macroData.fiber;
                macronutrientTotals.fiber.count += 1;
              }
            });
          }
          
          if (microData.vitamin_a || microData.vitamin_c || microData.calcium || 
              microData.iron || microData.potassium || microData.sodium ||
              macroData.protein || macroData.carbs || macroData.fat || macroData.fiber) {
            micronutrientHistory.push(microData);
            macronutrientHistory.push(macroData);
            processedDates.add(dateStr);
          }
        });
      }
      
      if (micronutrientHistory.length === 0) {
        setNoDataFound(true);
        // Set empty history with zeros
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          micronutrientHistory.push({
            date: dateStr,
            vitamin_a: 0,
            vitamin_c: 0,
            calcium: 0,
            iron: 0,
            potassium: 0,
            sodium: 0,
          });
          
          macronutrientHistory.push({
            date: dateStr,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
          });
        }
        
        toast({
          title: "No nutrient data found",
          description: "Please log your meals to see your nutrient data.",
          variant: "default",
        });
      } else {
        setNoDataFound(false);
      }
      
      setMicroHistoryData(micronutrientHistory);
      setMacroHistoryData(macronutrientHistory);
      
      const calculateMicroAverage = (nutrient: keyof typeof micronutrientTotals, unit: string, daily: number) => {
        const total = micronutrientTotals[nutrient].total;
        const count = micronutrientTotals[nutrient].count || 1;
        const average = total / count;
        const percentage = Math.round((average / daily) * 100);
        return { value: Math.round(average), unit, percentage };
      };
      
      const calculateMacroAverage = (nutrient: keyof typeof macronutrientTotals, unit: string, daily: number) => {
        const total = macronutrientTotals[nutrient].total;
        const count = macronutrientTotals[nutrient].count || 1;
        const average = total / count;
        const percentage = Math.round((average / daily) * 100);
        return { value: Math.round(average), unit, percentage };
      };
      
      const microAvgValues = {
        vitamin_a: calculateMicroAverage('vitamin_a', 'mcg', 900),
        vitamin_c: calculateMicroAverage('vitamin_c', 'mg', 90),
        calcium: calculateMicroAverage('calcium', 'mg', 1000),
        iron: calculateMicroAverage('iron', 'mg', 18),
        potassium: calculateMicroAverage('potassium', 'mg', 3500),
        sodium: calculateMicroAverage('sodium', 'mg', 2300),
      };
      
      const macroAvgValues = {
        protein: calculateMacroAverage('protein', 'g', 50),
        carbs: calculateMacroAverage('carbs', 'g', 275),
        fat: calculateMacroAverage('fat', 'g', 78),
        fiber: calculateMacroAverage('fiber', 'g', 28),
      };
      
      setMicroAverages(microAvgValues);
      setMacroAverages(macroAvgValues);
      
      setRadarData([
        { name: "Vitamin A", value: microAvgValues.vitamin_a.percentage, fullMark: 100 },
        { name: "Vitamin C", value: microAvgValues.vitamin_c.percentage, fullMark: 100 },
        { name: "Calcium", value: microAvgValues.calcium.percentage, fullMark: 100 },
        { name: "Iron", value: microAvgValues.iron.percentage, fullMark: 100 },
        { name: "Potassium", value: microAvgValues.potassium.percentage, fullMark: 100 },
        { name: "Sodium", value: microAvgValues.sodium.percentage, fullMark: 100 },
      ]);
      
    } catch (error) {
      console.error("Error fetching nutrient data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch nutrient data.",
        variant: "destructive",
      });
      
      setNoDataFound(true);
      
      // Set empty history with zeros
      const emptyMicroHistory: MicronutrientHistory[] = [];
      const emptyMacroHistory: MacronutrientHistory[] = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        emptyMicroHistory.push({
          date: dateStr,
          vitamin_a: 0,
          vitamin_c: 0,
          calcium: 0,
          iron: 0,
          potassium: 0,
          sodium: 0,
        });
        
        emptyMacroHistory.push({
          date: dateStr,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0
        });
      }
      
      setMicroHistoryData(emptyMicroHistory);
      setMacroHistoryData(emptyMacroHistory);
      
      const zeroMicroValues = {
        vitamin_a: { value: 0, unit: "mcg", percentage: 0 },
        vitamin_c: { value: 0, unit: "mg", percentage: 0 },
        calcium: { value: 0, unit: "mg", percentage: 0 },
        iron: { value: 0, unit: "mg", percentage: 0 },
        potassium: { value: 0, unit: "mg", percentage: 0 },
        sodium: { value: 0, unit: "mg", percentage: 0 },
      };
      
      const zeroMacroValues = {
        protein: { value: 0, unit: "g", percentage: 0 },
        carbs: { value: 0, unit: "g", percentage: 0 },
        fat: { value: 0, unit: "g", percentage: 0 },
        fiber: { value: 0, unit: "g", percentage: 0 },
      };
      
      setMicroAverages(zeroMicroValues);
      setMacroAverages(zeroMacroValues);
      
      setRadarData([
        { name: "Vitamin A", value: 0, fullMark: 100 },
        { name: "Vitamin C", value: 0, fullMark: 100 },
        { name: "Calcium", value: 0, fullMark: 100 },
        { name: "Iron", value: 0, fullMark: 100 },
        { name: "Potassium", value: 0, fullMark: 100 },
        { name: "Sodium", value: 0, fullMark: 100 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreHistory = () => {
    setHistoryLimit(prev => prev + 7);
  };

  const loadLessHistory = () => {
    if (historyLimit > 7) {
      setHistoryLimit(prev => Math.max(7, prev - 7));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      <PageHeader title="Nutrient Tracking" />

      <div className="px-6 py-6 space-y-8">
        <Tabs defaultValue="micro" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="micro">Micronutrients</TabsTrigger>
            <TabsTrigger value="macro">Macronutrients</TabsTrigger>
          </TabsList>

          <TabsContent value="micro" className="space-y-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  Micronutrient Balance <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  {noDataFound 
                    ? "No micronutrient data available. Log your meals to see your data." 
                    : "Your micronutrient intake summary"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-full h-[300px]">
                  <ChartContainer 
                    config={{
                      vitamin_a: { color: "#f97316" },
                      vitamin_c: { color: "#84cc16" },
                      calcium: { color: "#06b6d4" },
                      iron: { color: "#a855f7" },
                      potassium: { color: "#ec4899" },
                      sodium: { color: "#64748b" }
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" />
                        <Radar
                          name="Micronutrients"
                          dataKey="value"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <MicronutrientRadarChart data={microAverages} />

            <Card>
              <CardHeader>
                <CardTitle>Micronutrient History</CardTitle>
                <CardDescription>
                  {noDataFound 
                    ? "No historical data available. Log your meals to build your nutrition history." 
                    : "Your daily micronutrient intake based on logged meals"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>Vitamin A (mcg)</TableHead>
                        <TableHead>Vitamin C (mg)</TableHead>
                        <TableHead>Calcium (mg)</TableHead>
                        <TableHead>Iron (mg)</TableHead>
                        <TableHead>Potassium (mg)</TableHead>
                        <TableHead>Sodium (mg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {microHistoryData.length > 0 ? (
                        microHistoryData.map((day) => (
                          <TableRow key={day.date}>
                            <TableCell className="font-medium">{day.date}</TableCell>
                            <TableCell>{day.vitamin_a}</TableCell>
                            <TableCell>{day.vitamin_c}</TableCell>
                            <TableCell>{day.calcium}</TableCell>
                            <TableCell>{day.iron}</TableCell>
                            <TableCell>{day.potassium}</TableCell>
                            <TableCell>{day.sodium}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6">
                            No nutrition data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {!noDataFound && (
                  <div className="mt-4 flex justify-center space-x-2">
                    {historyLimit > 7 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadLessHistory}
                        className="flex items-center gap-1"
                      >
                        <ChevronUp className="h-4 w-4" /> Show Less
                      </Button>
                    )}
                    
                    {historyLimit < totalHistoryCount && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadMoreHistory}
                        className="flex items-center gap-1"
                      >
                        <ChevronDown className="h-4 w-4" /> Show More
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="macro" className="space-y-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  Macronutrient Distribution <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  {noDataFound 
                    ? "No macronutrient data available. Log your meals to see your data." 
                    : "Your macronutrient intake summary"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <MacronutrientPieChart data={macroAverages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Macronutrient Details</CardTitle>
                <CardDescription>
                  {noDataFound
                    ? "Log your meals to see macronutrient details"
                    : "Detailed breakdown of your macronutrient consumption"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(macroAverages).map(([key, nutrient]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{key}</span>
                        <span>
                          {nutrient.value}{nutrient.unit} ({nutrient.percentage}%)
                        </span>
                      </div>
                      <Progress 
                        value={nutrient.percentage} 
                        className="h-2"
                        indicatorStyle={{ 
                          backgroundColor: 
                            key === "protein" ? "#4ade80" : 
                            key === "carbs" ? "#facc15" : 
                            key === "fat" ? "#60a5fa" : 
                            "#f59e0b" // fiber
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Macronutrient History</CardTitle>
                <CardDescription>
                  {noDataFound 
                    ? "No historical data available. Log your meals to build your nutrition history." 
                    : "Your daily macronutrient intake based on logged meals"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>Protein (g)</TableHead>
                        <TableHead>Carbs (g)</TableHead>
                        <TableHead>Fat (g)</TableHead>
                        <TableHead>Fiber (g)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {macroHistoryData.length > 0 ? (
                        macroHistoryData.map((day) => (
                          <TableRow key={day.date}>
                            <TableCell className="font-medium">{day.date}</TableCell>
                            <TableCell>{day.protein}</TableCell>
                            <TableCell>{day.carbs}</TableCell>
                            <TableCell>{day.fat}</TableCell>
                            <TableCell>{day.fiber}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            No nutrition data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {!noDataFound && (
                  <div className="mt-4 flex justify-center space-x-2">
                    {historyLimit > 7 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadLessHistory}
                        className="flex items-center gap-1"
                      >
                        <ChevronUp className="h-4 w-4" /> Show Less
                      </Button>
                    )}
                    
                    {historyLimit < totalHistoryCount && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadMoreHistory}
                        className="flex items-center gap-1"
                      >
                        <ChevronDown className="h-4 w-4" /> Show More
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <NavigationBar />
    </div>
  );
}
