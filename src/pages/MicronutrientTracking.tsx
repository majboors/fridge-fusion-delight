
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MicronutrientRadarChart } from "@/components/dashboard/MicronutrientRadarChart";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
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

interface MicronutrientAverages {
  vitamin_a: { value: number; unit: string; percentage: number };
  vitamin_c: { value: number; unit: string; percentage: number };
  calcium: { value: number; unit: string; percentage: number };
  iron: { value: number; unit: string; percentage: number };
  potassium: { value: number; unit: string; percentage: number };
  sodium: { value: number; unit: string; percentage: number };
}

export default function MicronutrientTracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<MicronutrientHistory[]>([]);
  const [averages, setAverages] = useState<MicronutrientAverages>({
    vitamin_a: { value: 0, unit: "mcg", percentage: 0 },
    vitamin_c: { value: 0, unit: "mg", percentage: 0 },
    calcium: { value: 0, unit: "mg", percentage: 0 },
    iron: { value: 0, unit: "mg", percentage: 0 },
    potassium: { value: 0, unit: "mg", percentage: 0 },
    sodium: { value: 0, unit: "mg", percentage: 0 },
  });

  const [radarData, setRadarData] = useState<{ name: string; value: number; fullMark: number }[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchMicronutrientData();
  }, [user, navigate]);

  const fetchMicronutrientData = async () => {
    try {
      setLoading(true);
      
      // Fetch recipes from the last 7 days that have micronutrient data
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        throw error;
      }

      // Extract micronutrient data from recipes
      // (Assuming recipes have a micronutrients field or we can extract from steps)
      const micronutrientHistory: MicronutrientHistory[] = [];
      const micronutrientTotals = {
        vitamin_a: { total: 0, count: 0 },
        vitamin_c: { total: 0, count: 0 },
        calcium: { total: 0, count: 0 },
        iron: { total: 0, count: 0 },
        potassium: { total: 0, count: 0 },
        sodium: { total: 0, count: 0 },
      };
      
      const processedDates = new Set();
      
      recipes.forEach(recipe => {
        // Try to extract micronutrient information from recipe data
        // For recipes created from nutrition API, the data should be in the steps field
        const dateStr = new Date(recipe.created_at).toISOString().split('T')[0];
        
        // Skip if we already have data for this date
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
        
        // Extract micronutrient data from recipe steps
        // This assumes the nutrition data is stored in a specific format in the steps
        if (recipe.steps && Array.isArray(recipe.steps)) {
          recipe.steps.forEach(step => {
            // Parse vitamin A
            const vitaminAMatch = step.match(/Vitamin A:?\s*(\d+\.?\d*)\s*mcg/i);
            if (vitaminAMatch) {
              microData.vitamin_a = parseFloat(vitaminAMatch[1]);
              micronutrientTotals.vitamin_a.total += microData.vitamin_a;
              micronutrientTotals.vitamin_a.count += 1;
            }
            
            // Parse vitamin C
            const vitaminCMatch = step.match(/Vitamin C:?\s*(\d+\.?\d*)\s*mg/i);
            if (vitaminCMatch) {
              microData.vitamin_c = parseFloat(vitaminCMatch[1]);
              micronutrientTotals.vitamin_c.total += microData.vitamin_c;
              micronutrientTotals.vitamin_c.count += 1;
            }
            
            // Parse calcium
            const calciumMatch = step.match(/Calcium:?\s*(\d+\.?\d*)\s*mg/i);
            if (calciumMatch) {
              microData.calcium = parseFloat(calciumMatch[1]);
              micronutrientTotals.calcium.total += microData.calcium;
              micronutrientTotals.calcium.count += 1;
            }
            
            // Parse iron
            const ironMatch = step.match(/Iron:?\s*(\d+\.?\d*)\s*mg/i);
            if (ironMatch) {
              microData.iron = parseFloat(ironMatch[1]);
              micronutrientTotals.iron.total += microData.iron;
              micronutrientTotals.iron.count += 1;
            }
            
            // Parse potassium
            const potassiumMatch = step.match(/Potassium:?\s*(\d+\.?\d*)\s*mg/i);
            if (potassiumMatch) {
              microData.potassium = parseFloat(potassiumMatch[1]);
              micronutrientTotals.potassium.total += microData.potassium;
              micronutrientTotals.potassium.count += 1;
            }
            
            // Parse sodium
            const sodiumMatch = step.match(/Sodium:?\s*(\d+\.?\d*)\s*mg/i);
            if (sodiumMatch) {
              microData.sodium = parseFloat(sodiumMatch[1]);
              micronutrientTotals.sodium.total += microData.sodium;
              micronutrientTotals.sodium.count += 1;
            }
          });
        }
        
        // Only add data if we found at least one micronutrient
        if (microData.vitamin_a || microData.vitamin_c || microData.calcium || 
            microData.iron || microData.potassium || microData.sodium) {
          micronutrientHistory.push(microData);
          processedDates.add(dateStr);
        }
      });

      // If we have no real data yet, use some mock data for initial display
      if (micronutrientHistory.length === 0) {
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          
          micronutrientHistory.push({
            date: date.toISOString().split('T')[0],
            vitamin_a: Math.floor(Math.random() * 800) + 200,
            vitamin_c: Math.floor(Math.random() * 80) + 20,
            calcium: Math.floor(Math.random() * 800) + 200,
            iron: Math.floor(Math.random() * 14) + 4,
            potassium: Math.floor(Math.random() * 3000) + 1000,
            sodium: Math.floor(Math.random() * 2000) + 500,
          });
        }
        
        toast({
          title: "No micronutrient data found",
          description: "Using sample data for visualization. Log your meals to see real data.",
          variant: "default",
        });
      }
      
      setHistoryData(micronutrientHistory);
      
      // Calculate averages
      const calculateAverage = (nutrient: keyof typeof micronutrientTotals, unit: string, daily: number) => {
        const total = micronutrientTotals[nutrient].total;
        const count = micronutrientTotals[nutrient].count || 1; // Prevent division by zero
        const average = total / count;
        const percentage = Math.round((average / daily) * 100);
        return { value: Math.round(average), unit, percentage };
      };
      
      const avgValues = {
        vitamin_a: calculateAverage('vitamin_a', 'mcg', 900),
        vitamin_c: calculateAverage('vitamin_c', 'mg', 90),
        calcium: calculateAverage('calcium', 'mg', 1000),
        iron: calculateAverage('iron', 'mg', 18),
        potassium: calculateAverage('potassium', 'mg', 3500),
        sodium: calculateAverage('sodium', 'mg', 2300),
      };
      
      setAverages(avgValues);
      
      setRadarData([
        { name: "Vitamin A", value: avgValues.vitamin_a.percentage, fullMark: 100 },
        { name: "Vitamin C", value: avgValues.vitamin_c.percentage, fullMark: 100 },
        { name: "Calcium", value: avgValues.calcium.percentage, fullMark: 100 },
        { name: "Iron", value: avgValues.iron.percentage, fullMark: 100 },
        { name: "Potassium", value: avgValues.potassium.percentage, fullMark: 100 },
        { name: "Sodium", value: avgValues.sodium.percentage, fullMark: 100 },
      ]);
      
    } catch (error) {
      console.error("Error fetching micronutrient data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch micronutrient data. Using mock data instead.",
        variant: "destructive",
      });
      
      // Use mock data as fallback
      const mockHistoryData: MicronutrientHistory[] = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        mockHistoryData.push({
          date: date.toISOString().split('T')[0],
          vitamin_a: Math.floor(Math.random() * 800) + 200,
          vitamin_c: Math.floor(Math.random() * 80) + 20,
          calcium: Math.floor(Math.random() * 800) + 200,
          iron: Math.floor(Math.random() * 14) + 4,
          potassium: Math.floor(Math.random() * 3000) + 1000,
          sodium: Math.floor(Math.random() * 2000) + 500,
        });
      }
      
      setHistoryData(mockHistoryData);
      
      // Set mock averages
      const avgValues = {
        vitamin_a: { 
          value: Math.round(mockHistoryData.reduce((sum, day) => sum + day.vitamin_a, 0) / mockHistoryData.length),
          unit: "mcg",
          percentage: Math.round((mockHistoryData.reduce((sum, day) => sum + day.vitamin_a, 0) / mockHistoryData.length) / 900 * 100)
        },
        vitamin_c: { 
          value: Math.round(mockHistoryData.reduce((sum, day) => sum + day.vitamin_c, 0) / mockHistoryData.length),
          unit: "mg",
          percentage: Math.round((mockHistoryData.reduce((sum, day) => sum + day.vitamin_c, 0) / mockHistoryData.length) / 90 * 100)
        },
        calcium: { 
          value: Math.round(mockHistoryData.reduce((sum, day) => sum + day.calcium, 0) / mockHistoryData.length),
          unit: "mg",
          percentage: Math.round((mockHistoryData.reduce((sum, day) => sum + day.calcium, 0) / mockHistoryData.length) / 1000 * 100)
        },
        iron: { 
          value: Math.round(mockHistoryData.reduce((sum, day) => sum + day.iron, 0) / mockHistoryData.length),
          unit: "mg",
          percentage: Math.round((mockHistoryData.reduce((sum, day) => sum + day.iron, 0) / mockHistoryData.length) / 18 * 100)
        },
        potassium: { 
          value: Math.round(mockHistoryData.reduce((sum, day) => sum + day.potassium, 0) / mockHistoryData.length),
          unit: "mg",
          percentage: Math.round((mockHistoryData.reduce((sum, day) => sum + day.potassium, 0) / mockHistoryData.length) / 3500 * 100)
        },
        sodium: { 
          value: Math.round(mockHistoryData.reduce((sum, day) => sum + day.sodium, 0) / mockHistoryData.length),
          unit: "mg",
          percentage: Math.round((mockHistoryData.reduce((sum, day) => sum + day.sodium, 0) / mockHistoryData.length) / 2300 * 100)
        }
      };
      
      setAverages(avgValues);
      
      setRadarData([
        { name: "Vitamin A", value: avgValues.vitamin_a.percentage, fullMark: 100 },
        { name: "Vitamin C", value: avgValues.vitamin_c.percentage, fullMark: 100 },
        { name: "Calcium", value: avgValues.calcium.percentage, fullMark: 100 },
        { name: "Iron", value: avgValues.iron.percentage, fullMark: 100 },
        { name: "Potassium", value: avgValues.potassium.percentage, fullMark: 100 },
        { name: "Sodium", value: avgValues.sodium.percentage, fullMark: 100 },
      ]);
    } finally {
      setLoading(false);
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
      <PageHeader title="Micronutrient Tracking" />

      <div className="px-6 py-6 space-y-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              Micronutrient Balance <Info className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>Your micronutrient intake summary</CardDescription>
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

        <MicronutrientRadarChart data={averages} />

        <Card>
          <CardHeader>
            <CardTitle>Nutrition History</CardTitle>
            <CardDescription>Your daily micronutrient intake based on logged meals</CardDescription>
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
                  {historyData.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">{day.date}</TableCell>
                      <TableCell>{day.vitamin_a}</TableCell>
                      <TableCell>{day.vitamin_c}</TableCell>
                      <TableCell>{day.calcium}</TableCell>
                      <TableCell>{day.iron}</TableCell>
                      <TableCell>{day.potassium}</TableCell>
                      <TableCell>{day.sodium}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <NavigationBar />
    </div>
  );
}
