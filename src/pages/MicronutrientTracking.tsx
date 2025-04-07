
import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { MicronutrientRadarChart } from "@/components/dashboard/MicronutrientRadarChart";
import { MacronutrientPieChart } from "@/components/dashboard/MacronutrientPieChart";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Loader2, Info, ChevronDown, ChevronUp, Settings, Camera, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  recipe_id?: string;
}

interface MacronutrientHistory {
  date: string;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  recipe_id?: string;
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
  protein: { value: number; percentage: number; unit: string };
  carbs: { value: number; percentage: number; unit: string };
  fat: { value: number; percentage: number; unit: string };
  fiber: { value: number; percentage: number; unit: string };
}

interface RecipeDetail {
  id: string;
  title: string;
  image_url: string | null;
  created_at: string;
  micronutrients?: {
    vitamin_a: { value: number; unit: string; percentage: number };
    vitamin_c: { value: number; unit: string; percentage: number };
    calcium: { value: number; unit: string; percentage: number };
    iron: { value: number; unit: string; percentage: number };
    potassium: { value: number; unit: string; percentage: number };
    sodium: { value: number; unit: string; percentage: number };
  };
  macronutrients?: {
    protein: { value: number; percentage: number; unit: string };
    carbs: { value: number; percentage: number; unit: string };
    fat: { value: number; percentage: number; unit: string };
    fiber: { value: number; percentage: number; unit: string };
  };
}

export default function MicronutrientTracking() {
  const location = useLocation();
  const locationState = location.state as { activeTab?: string } | null;
  const [activeTab, setActiveTab] = useState(locationState?.activeTab || "macronutrients");
  
  useEffect(() => {
    if (locationState?.activeTab) {
      setActiveTab(locationState.activeTab);
    }
  }, [locationState]);

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
  
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchNutrientData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log("Fetching nutrient data...");
      
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
      
      console.log(`Fetched ${recipes?.length || 0} recipes for nutrient data`);

      // Initialize with empty arrays
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
      
      // Track dates to aggregate data by day
      const processedDates = new Map();
      const dailyData = new Map<string, {
        micro: MicronutrientHistory,
        macro: MacronutrientHistory
      }>();
      
      if (recipes && recipes.length > 0) {
        recipes.forEach(recipe => {
          const dateStr = new Date(recipe.created_at).toISOString().split('T')[0];
          const formattedDate = new Date(recipe.created_at).toLocaleString();
          
          // Initialize empty data structures for this recipe
          let microData: MicronutrientHistory = {
            date: formattedDate,
            vitamin_a: 0,
            vitamin_c: 0,
            calcium: 0,
            iron: 0,
            potassium: 0,
            sodium: 0,
            recipe_id: recipe.id
          };
          
          let macroData: MacronutrientHistory = {
            date: formattedDate,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            recipe_id: recipe.id
          };
          
          // Initialize daily aggregates if they don't exist yet
          if (!dailyData.has(dateStr)) {
            dailyData.set(dateStr, {
              micro: {
                date: dateStr,
                vitamin_a: 0,
                vitamin_c: 0,
                calcium: 0,
                iron: 0,
                potassium: 0,
                sodium: 0
              },
              macro: {
                date: dateStr,
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0
              }
            });
          }
          
          if (recipe.steps && Array.isArray(recipe.steps)) {
            // More precise regex patterns to match nutrient values
            const extractNutrients = (steps: string[]) => {
              for (const step of steps) {
                // Micronutrients
                const vitaminAMatch = step.match(/Vitamin A:?\s*(\d+\.?\d*)\s*mcg\s*\(?(\d+\.?\d*)%\)?/i);
                if (vitaminAMatch) {
                  microData.vitamin_a = parseFloat(vitaminAMatch[1]);
                  dailyData.get(dateStr)!.micro.vitamin_a += microData.vitamin_a;
                  micronutrientTotals.vitamin_a.total += microData.vitamin_a;
                  micronutrientTotals.vitamin_a.count += 1;
                }
                
                const vitaminCMatch = step.match(/Vitamin C:?\s*(\d+\.?\d*)\s*mg\s*\(?(\d+\.?\d*)%\)?/i);
                if (vitaminCMatch) {
                  microData.vitamin_c = parseFloat(vitaminCMatch[1]);
                  dailyData.get(dateStr)!.micro.vitamin_c += microData.vitamin_c;
                  micronutrientTotals.vitamin_c.total += microData.vitamin_c;
                  micronutrientTotals.vitamin_c.count += 1;
                }
                
                const calciumMatch = step.match(/Calcium:?\s*(\d+\.?\d*)\s*mg\s*\(?(\d+\.?\d*)%\)?/i);
                if (calciumMatch) {
                  microData.calcium = parseFloat(calciumMatch[1]);
                  dailyData.get(dateStr)!.micro.calcium += microData.calcium;
                  micronutrientTotals.calcium.total += microData.calcium;
                  micronutrientTotals.calcium.count += 1;
                }
                
                const ironMatch = step.match(/Iron:?\s*(\d+\.?\d*)\s*mg\s*\(?(\d+\.?\d*)%\)?/i);
                if (ironMatch) {
                  microData.iron = parseFloat(ironMatch[1]);
                  dailyData.get(dateStr)!.micro.iron += microData.iron;
                  micronutrientTotals.iron.total += microData.iron;
                  micronutrientTotals.iron.count += 1;
                }
                
                const potassiumMatch = step.match(/Potassium:?\s*(\d+\.?\d*)\s*mg\s*\(?(\d+\.?\d*)%\)?/i);
                if (potassiumMatch) {
                  microData.potassium = parseFloat(potassiumMatch[1]);
                  dailyData.get(dateStr)!.micro.potassium += microData.potassium;
                  micronutrientTotals.potassium.total += microData.potassium;
                  micronutrientTotals.potassium.count += 1;
                }
                
                const sodiumMatch = step.match(/Sodium:?\s*(\d+\.?\d*)\s*mg\s*\(?(\d+\.?\d*)%\)?/i);
                if (sodiumMatch) {
                  microData.sodium = parseFloat(sodiumMatch[1]);
                  dailyData.get(dateStr)!.micro.sodium += microData.sodium;
                  micronutrientTotals.sodium.total += microData.sodium;
                  micronutrientTotals.sodium.count += 1;
                }
                
                // Macronutrients
                const proteinMatch = step.match(/Protein:?\s*(\d+\.?\d*)\s*g\s*\(?(\d+\.?\d*)%\)?/i);
                if (proteinMatch) {
                  macroData.protein = parseFloat(proteinMatch[1]);
                  dailyData.get(dateStr)!.macro.protein += macroData.protein;
                  macronutrientTotals.protein.total += macroData.protein;
                  macronutrientTotals.protein.count += 1;
                }
                
                const carbsMatch = step.match(/Carbs:?\s*(\d+\.?\d*)\s*g\s*\(?(\d+\.?\d*)%\)?/i);
                if (carbsMatch) {
                  macroData.carbs = parseFloat(carbsMatch[1]);
                  dailyData.get(dateStr)!.macro.carbs += macroData.carbs;
                  macronutrientTotals.carbs.total += macroData.carbs;
                  macronutrientTotals.carbs.count += 1;
                }
                
                const fatMatch = step.match(/Fat:?\s*(\d+\.?\d*)\s*g\s*\(?(\d+\.?\d*)%\)?/i);
                if (fatMatch) {
                  macroData.fat = parseFloat(fatMatch[1]);
                  dailyData.get(dateStr)!.macro.fat += macroData.fat;
                  macronutrientTotals.fat.total += macroData.fat;
                  macronutrientTotals.fat.count += 1;
                }
                
                const fiberMatch = step.match(/Fiber:?\s*(\d+\.?\d*)\s*g\s*\(?(\d+\.?\d*)%\)?/i);
                if (fiberMatch) {
                  macroData.fiber = parseFloat(fiberMatch[1]);
                  dailyData.get(dateStr)!.macro.fiber += macroData.fiber;
                  macronutrientTotals.fiber.total += macroData.fiber;
                  macronutrientTotals.fiber.count += 1;
                }
              }
            };
            
            // Extract nutrients from recipe steps
            extractNutrients(recipe.steps);
          }
          
          // Only add this recipe to the history if it has any nutrient data
          if (microData.vitamin_a || microData.vitamin_c || microData.calcium || 
              microData.iron || microData.potassium || microData.sodium ||
              macroData.protein || macroData.carbs || macroData.fat || macroData.fiber) {
            
            micronutrientHistory.push(microData);
            macronutrientHistory.push(macroData);
            
            processedDates.set(dateStr, (processedDates.get(dateStr) || []).concat(recipe.id));
          }
        });
        
        // Add daily aggregated data to the history arrays
        dailyData.forEach((data, date) => {
          microHistoryData.push(data.micro);
          macroHistoryData.push(data.macro);
        });
        
        console.log(`Processed ${micronutrientHistory.length} entries for nutrient history`);
      }
      
      // Handle case when no data is available
      if (micronutrientHistory.filter(day => !day.date.includes(":")).length === 0) {
        setNoDataFound(true);
        const today = new Date();
        
        // Create empty history data for the last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          microHistoryData.push({
            date: dateStr,
            vitamin_a: 0,
            vitamin_c: 0,
            calcium: 0,
            iron: 0,
            potassium: 0,
            sodium: 0,
          });
          
          macroHistoryData.push({
            date: dateStr,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
          });
        }
        
        toast({
          title: "No nutrient data found",
          description: "Please scan your meals to track your nutrition data.",
          variant: "default",
        });
      } else {
        setNoDataFound(false);
      }
      
      console.log("Setting history data");
      setMicroHistoryData(microHistoryData);
      setMacroHistoryData(macroHistoryData);
      
      // Calculate average nutrient values
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
      
      // Set the calculated averages
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
      
      console.log("Setting averages");
      setMicroAverages(microAvgValues);
      setMacroAverages(macroAvgValues);
      
      // Set radar chart data
      setRadarData([
        { name: "Vitamin A", value: microAvgValues.vitamin_a.percentage, fullMark: 100 },
        { name: "Vitamin C", value: microAvgValues.vitamin_c.percentage, fullMark: 100 },
        { name: "Calcium", value: microAvgValues.calcium.percentage, fullMark: 100 },
        { name: "Iron", value: microAvgValues.iron.percentage, fullMark: 100 },
        { name: "Potassium", value: microAvgValues.potassium.percentage, fullMark: 100 },
        { name: "Sodium", value: microAvgValues.sodium.percentage, fullMark: 100 },
      ]);
      
      console.log("Fetch completed successfully");
      
    } catch (error) {
      console.error("Error fetching nutrient data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch nutrient data.",
        variant: "destructive",
      });
      
      setNoDataFound(true);
      
      // Create empty history data for the last 7 days
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
      
      // Set zero values for averages when error occurs
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
  }, [user, historyLimit, toast]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchNutrientData();
    
    // Enable real-time updates for recipe additions
    const channel = supabase
      .channel('recipe_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', 
          schema: 'public',
          table: 'recipes'
        },
        (payload) => {
          console.log("New recipe detected:", payload);
          setRefreshKey(prev => prev + 1); // Force refresh
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, historyLimit, refreshKey, fetchNutrientData]);

  const loadMoreHistory = () => {
    setHistoryLimit(prev => prev + 7);
  };

  const loadLessHistory = () => {
    if (historyLimit > 7) {
      setHistoryLimit(prev => Math.max(7, prev - 7));
    }
  };

  const navigateToScanPage = () => {
    navigate("/recipes");
  };

  const handleViewMealDetails = async (date: string, recipeId?: string) => {
    if (!recipeId) return;
    
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Initialize empty nutrient data structures
        const micronutrients: any = {
          vitamin_a: { value: 0, unit: 'mcg', percentage: 0 },
          vitamin_c: { value: 0, unit: 'mg', percentage: 0 },
          calcium: { value: 0, unit: 'mg', percentage: 0 },
          iron: { value: 0, unit: 'mg', percentage: 0 },
          potassium: { value: 0, unit: 'mg', percentage: 0 },
          sodium: { value: 0, unit: 'mg', percentage: 0 },
        };
        
        const macronutrients: any = {
          protein: { value: 0, unit: 'g', percentage: 0 },
          carbs: { value: 0, unit: 'g', percentage: 0 },
          fat: { value: 0, unit: 'g', percentage: 0 },
          fiber: { value: 0, unit: 'g', percentage: 0 },
        };
        
        // Extract nutrient data from steps
        if (data.steps && Array.isArray(data.steps)) {
          data.steps.forEach(step => {
            // Extract micronutrients with improved regex
            const vitaminAMatch = step.match(/Vitamin A:?\s*(\d+\.?\d*)\s*mcg\s*\((\d+\.?\d*)%\)/i);
            if (vitaminAMatch) {
              micronutrients.vitamin_a = { 
                value: parseFloat(vitaminAMatch[1]), 
                unit: 'mcg', 
                percentage: parseFloat(vitaminAMatch[2])
              };
            }
            
            const vitaminCMatch = step.match(/Vitamin C:?\s*(\d+\.?\d*)\s*mg\s*\((\d+\.?\d*)%\)/i);
            if (vitaminCMatch) {
              micronutrients.vitamin_c = { 
                value: parseFloat(vitaminCMatch[1]), 
                unit: 'mg', 
                percentage: parseFloat(vitaminCMatch[2])
              };
            }
            
            const calciumMatch = step.match(/Calcium:?\s*(\d+\.?\d*)\s*mg\s*\((\d+\.?\d*)%\)/i);
            if (calciumMatch) {
              micronutrients.calcium = { 
                value: parseFloat(calciumMatch[1]), 
                unit: 'mg', 
                percentage: parseFloat(calciumMatch[2])
              };
            }
            
            const ironMatch = step.match(/Iron:?\s*(\d+\.?\d*)\s*mg\s*\((\d+\.?\d*)%\)/i);
            if (ironMatch) {
              micronutrients.iron = { 
                value: parseFloat(ironMatch[1]), 
                unit: 'mg', 
                percentage: parseFloat(ironMatch[2])
              };
            }
            
            const potassiumMatch = step.match(/Potassium:?\s*(\d+\.?\d*)\s*mg\s*\((\d+\.?\d*)%\)/i);
            if (potassiumMatch) {
              micronutrients.potassium = { 
                value: parseFloat(potassiumMatch[1]), 
                unit: 'mg', 
                percentage: parseFloat(potassiumMatch[2])
              };
            }
            
            const sodiumMatch = step.match(/Sodium:?\s*(\d+\.?\d*)\s*mg\s*\((\d+\.?\d*)%\)/i);
            if (sodiumMatch) {
              micronutrients.sodium = { 
                value: parseFloat(sodiumMatch[1]), 
                unit: 'mg', 
                percentage: parseFloat(sodiumMatch[2])
              };
            }
            
            // Extract macronutrients
            const proteinMatch = step.match(/Protein:?\s*(\d+\.?\d*)\s*g\s*\((\d+\.?\d*)%\)/i);
            if (proteinMatch) {
              macronutrients.protein = { 
                value: parseFloat(proteinMatch[1]), 
                unit: 'g', 
                percentage: parseFloat(proteinMatch[2])
              };
            }
            
            const carbsMatch = step.match(/Carbs:?\s*(\d+\.?\d*)\s*g\s*\((\d+\.?\d*)%\)/i);
            if (carbsMatch) {
              macronutrients.carbs = { 
                value: parseFloat(carbsMatch[1]), 
                unit: 'g', 
                percentage: parseFloat(carbsMatch[2])
              };
            }
            
            const fatMatch = step.match(/Fat:?\s*(\d+\.?\d*)\s*g\s*\((\d+\.?\d*)%\)/i);
            if (fatMatch) {
              macronutrients.fat = { 
                value: parseFloat(fatMatch[1]), 
                unit: 'g', 
                percentage: parseFloat(fatMatch[2])
              };
            }
            
            const fiberMatch = step.match(/Fiber:?\s*(\d+\.?\d*)\s*g\s*\((\d+\.?\d*)%\)/i);
            if (fiberMatch) {
              macronutrients.fiber = { 
                value: parseFloat(fiberMatch[1]), 
                unit: 'g', 
                percentage: parseFloat(fiberMatch[2])
              };
            }
          });
        }
        
        setSelectedRecipe({
          id: data.id,
          title: data.title,
          image_url: data.image_url,
          created_at: new Date(data.created_at).toLocaleString(),
          micronutrients,
          macronutrients
        });
        
        setDetailsDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching meal details:", error);
      toast({
        title: "Error",
        description: "Failed to load meal details",
        variant: "destructive"
      });
    }
  };

  const refreshData = () => {
    console.log("Manual refresh triggered");
    setRefreshKey(prevKey => prevKey + 1);
    toast({
      title: "Refreshing",
      description: "Updating nutrient data...",
    });
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
      <PageHeader title="Nutrient Tracking">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={refreshData} 
          className="ml-auto"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </PageHeader>

      <div className="px-6 py-6 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="macronutrients">Macronutrients</TabsTrigger>
            <TabsTrigger value="micronutrients">Micronutrients</TabsTrigger>
          </TabsList>

          <TabsContent value="macronutrients" className="space-y-8">
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
                {noDataFound ? (
                  <div className="text-center py-4 flex flex-col items-center">
                    <p className="text-muted-foreground mb-4">Scan your food to see macronutrient data</p>
                  </div>
                ) : (
                  <MacronutrientPieChart data={macroAverages} />
                )}
              </CardContent>
              {noDataFound && (
                <CardContent className="pt-0">
                  <Button 
                    onClick={navigateToScanPage} 
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Scan Food to Track Nutrients
                  </Button>
                </CardContent>
              )}
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
                
                {noDataFound && (
                  <div className="mt-6">
                    <Button 
                      onClick={navigateToScanPage} 
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" /> Scan Food to Track Nutrients
                    </Button>
                  </div>
                )}
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
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {macroHistoryData.length > 0 ? (
                        macroHistoryData.filter(day => !day.date.includes(":")).map((day) => (
                          <TableRow key={day.date + (day.recipe_id || "")}>
                            <TableCell className="font-medium">{day.date}</TableCell>
                            <TableCell>{day.protein}</TableCell>
                            <TableCell>{day.carbs}</TableCell>
                            <TableCell>{day.fat}</TableCell>
                            <TableCell>{day.fiber}</TableCell>
                            <TableCell>
                              {day.recipe_id && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewMealDetails(day.date, day.recipe_id)}
                                >
                                  View
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6">
                            No nutrition data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {!noDataFound && totalHistoryCount > 0 && (
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
                
                {noDataFound && (
                  <div className="mt-4">
                    <Button 
                      onClick={navigateToScanPage} 
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" /> Scan Food to Track Nutrients
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="micronutrients" className="space-y-8">
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
              {noDataFound && (
                <CardContent className="pt-0">
                  <Button 
                    onClick={navigateToScanPage} 
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Scan Food to Track Nutrients
                  </Button>
                </CardContent>
              )}
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
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {microHistoryData.length > 0 ? (
                        microHistoryData.filter(day => !day.date.includes(":")).map((day) => (
                          <TableRow key={day.date + (day.recipe_id || "")}>
                            <TableCell className="font-medium">{day.date}</TableCell>
                            <TableCell>{day.vitamin_a}</TableCell>
                            <TableCell>{day.vitamin_c}</TableCell>
                            <TableCell>{day.calcium}</TableCell>
                            <TableCell>{day.iron}</TableCell>
                            <TableCell>{day.potassium}</TableCell>
                            <TableCell>{day.sodium}</TableCell>
                            <TableCell>
                              {day.recipe_id && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewMealDetails(day.date, day.recipe_id)}
                                >
                                  View
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6">
                            No nutrition data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {!noDataFound && totalHistoryCount > 0 && (
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
                
                {noDataFound && (
                  <div className="mt-4">
                    <Button 
                      onClick={navigateToScanPage} 
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" /> Scan Food to Track Nutrients
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRecipe?.title || 'Meal Details'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {selectedRecipe?.image_url && (
              <div className="w-full h-48 overflow-hidden rounded-md">
                <img src={selectedRecipe.image_url} alt="Food" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="text-sm">
              <p className="text-muted-foreground">Date: {selectedRecipe?.created_at}</p>
            </div>
            
            {selectedRecipe?.macronutrients && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Macronutrients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(selectedRecipe.macronutrients).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{key}</span>
                          <span>
                            {value.value}{value.unit} ({value.percentage}%)
                          </span>
                        </div>
                        <Progress 
                          value={value.percentage} 
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
            )}
            
            {selectedRecipe?.micronutrients && (
              <MicronutrientRadarChart 
                data={selectedRecipe.micronutrients} 
                showScanButton={false}
                scanDate={selectedRecipe.created_at}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <NavigationBar />
    </div>
  );
}
