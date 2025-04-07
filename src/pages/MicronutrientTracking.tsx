import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MacronutrientPieChart } from "@/components/dashboard/MacronutrientPieChart";
import { MicronutrientRadarChart } from "@/components/dashboard/MicronutrientRadarChart";
import { Button } from "@/components/ui/button";
import { Camera, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { CameraOptionsDialog } from "@/components/dashboard/CameraOptionsDialog";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NutrientData {
  day: string;
  averageData: {
    micronutrients: {
      vitamin_a: { value: number; unit: string; percentage: number };
      vitamin_c: { value: number; unit: string; percentage: number };
      calcium: { value: number; unit: string; percentage: number };
      iron: { value: number; unit: string; percentage: number };
      potassium: { value: number; unit: string; percentage: number };
      sodium: { value: number; unit: string; percentage: number };
    };
    macronutrients: {
      protein: { value: number; unit: string; percentage: number };
      carbs: { value: number; unit: string; percentage: number };
      fat: { value: number; unit: string; percentage: number };
      fiber: { value: number; unit: string; percentage: number };
    };
  };
  meals: Array<{
    id: string;
    timestamp: string;
    micronutrients: {
      vitamin_a: { value: number; unit: string; percentage: number };
      vitamin_c: { value: number; unit: string; percentage: number };
      calcium: { value: number; unit: string; percentage: number };
      iron: { value: number; unit: string; percentage: number };
      potassium: { value: number; unit: string; percentage: number };
      sodium: { value: number; unit: string; percentage: number };
    };
    macronutrients: {
      protein: { value: number; unit: string; percentage: number };
      carbs: { value: number; unit: string; percentage: number };
      fat: { value: number; unit: string; percentage: number };
      fiber: { value: number; unit: string; percentage: number };
    };
  }>;
}

export default function MicronutrientTracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [nutrientHistory, setNutrientHistory] = useState<NutrientData[]>([]);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const handleScanSuccess = useCallback(() => {
    console.log("Scan successful, refreshing nutrient data");
    setRefreshKey(prev => prev + 1);
  }, []);

  const toggleDayExpanded = useCallback((day: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  }, []);

  const fetchNutrientData = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log("Running fetchNutrientData with refreshKey:", refreshKey);
      setLoading(true);
      console.log("Fetching nutrient data...");
      
      const { data: recipesData, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }

      console.log("Fetched", recipesData?.length || 0, "recipes for nutrient data");
      
      if (!recipesData || recipesData.length === 0) {
        setNutrientHistory([]);
        setLoading(false);
        return;
      }
      
      const dailyData = new Map<string, NutrientData>();
      console.log("Processing recipes:", recipesData.length);
      
      recipesData.forEach(recipe => {
        if (!recipe.steps || recipe.steps.length === 0) return;
        
        console.log("Processing recipe", recipe.id, "with", recipe.steps.length, "steps");
        
        const micronutrients: any = {
          vitamin_a: { value: 0, unit: 'mcg', percentage: 0 },
          vitamin_c: { value: 0, unit: 'mg', percentage: 0 },
          calcium: { value: 0, unit: 'mg', percentage: 0 },
          iron: { value: 0, unit: 'mg', percentage: 0 },
          potassium: { value: 0, unit: 'mg', percentage: 0 },
          sodium: { value: 0, unit: 'mg', percentage: 0 }
        };
        
        const macronutrients: any = {
          protein: { value: 0, unit: 'g', percentage: 0 },
          carbs: { value: 0, unit: 'g', percentage: 0 },
          fat: { value: 0, unit: 'g', percentage: 0 },
          fiber: { value: 0, unit: 'g', percentage: 0 }
        };
        
        recipe.steps.forEach(step => {
          const vitaminAMatch = step.match(/Vitamin A: (\d+)mcg \((\d+)%\)/i);
          if (vitaminAMatch) {
            micronutrients.vitamin_a = {
              value: parseInt(vitaminAMatch[1]),
              unit: 'mcg',
              percentage: parseInt(vitaminAMatch[2])
            };
          }
          
          const vitaminCMatch = step.match(/Vitamin C: (\d+)mg \((\d+)%\)/i);
          if (vitaminCMatch) {
            micronutrients.vitamin_c = {
              value: parseInt(vitaminCMatch[1]),
              unit: 'mg',
              percentage: parseInt(vitaminCMatch[2])
            };
          }
          
          const calciumMatch = step.match(/Calcium: (\d+)mg \((\d+)%\)/i);
          if (calciumMatch) {
            micronutrients.calcium = {
              value: parseInt(calciumMatch[1]),
              unit: 'mg',
              percentage: parseInt(calciumMatch[2])
            };
          }
          
          const ironMatch = step.match(/Iron: (\d+)mg \((\d+)%\)/i);
          if (ironMatch) {
            micronutrients.iron = {
              value: parseInt(ironMatch[1]),
              unit: 'mg',
              percentage: parseInt(ironMatch[2])
            };
          }
          
          const potassiumMatch = step.match(/Potassium: (\d+)mg \((\d+)%\)/i);
          if (potassiumMatch) {
            micronutrients.potassium = {
              value: parseInt(potassiumMatch[1]),
              unit: 'mg',
              percentage: parseInt(potassiumMatch[2])
            };
          }
          
          const sodiumMatch = step.match(/Sodium: (\d+)mg \((\d+)%\)/i);
          if (sodiumMatch) {
            micronutrients.sodium = {
              value: parseInt(sodiumMatch[1]),
              unit: 'mg',
              percentage: parseInt(sodiumMatch[2])
            };
          }
          
          const proteinMatch = step.match(/Protein: (\d+)g \((\d+)%\)/i);
          if (proteinMatch) {
            macronutrients.protein = {
              value: parseInt(proteinMatch[1]),
              unit: 'g',
              percentage: parseInt(proteinMatch[2])
            };
          }
          
          const carbsMatch = step.match(/Carbs: (\d+)g \((\d+)%\)/i);
          if (carbsMatch) {
            macronutrients.carbs = {
              value: parseInt(carbsMatch[1]),
              unit: 'g',
              percentage: parseInt(carbsMatch[2])
            };
          }
          
          const fatMatch = step.match(/Fat: (\d+)g \((\d+)%\)/i);
          if (fatMatch) {
            macronutrients.fat = {
              value: parseInt(fatMatch[1]),
              unit: 'g',
              percentage: parseInt(fatMatch[2])
            };
          }
          
          const fiberMatch = step.match(/Fiber: (\d+)g \((\d+)%\)/i);
          if (fiberMatch) {
            macronutrients.fiber = {
              value: parseInt(fiberMatch[1]),
              unit: 'g',
              percentage: parseInt(fiberMatch[2])
            };
          }
        });
        
        const hasNutrientData = 
          micronutrients.vitamin_a.value > 0 || 
          micronutrients.vitamin_c.value > 0 ||
          micronutrients.calcium.value > 0 ||
          micronutrients.iron.value > 0 ||
          micronutrients.potassium.value > 0 ||
          micronutrients.sodium.value > 0 ||
          macronutrients.protein.value > 0 ||
          macronutrients.carbs.value > 0 ||
          macronutrients.fat.value > 0 ||
          macronutrients.fiber.value > 0;
        
        if (!hasNutrientData) return;
        
        const date = new Date(recipe.created_at);
        const dayKey = format(date, 'yyyy-MM-dd');
        
        if (!dailyData.has(dayKey)) {
          dailyData.set(dayKey, {
            day: format(date, 'MMM d'),
            averageData: {
              micronutrients: { ...micronutrients },
              macronutrients: { ...macronutrients }
            },
            meals: []
          });
        }
        
        dailyData.get(dayKey)?.meals.push({
          id: recipe.id,
          timestamp: format(date, 'h:mm a'),
          micronutrients: { ...micronutrients },
          macronutrients: { ...macronutrients }
        });
      });
      
      console.log("Daily data map size:", dailyData.size);
      
      const nutrientHistoryData: NutrientData[] = [];
      dailyData.forEach(dayData => {
        if (dayData.meals.length > 0) {
          nutrientHistoryData.push({
            day: dayData.day,
            averageData: {
              micronutrients: { ...dayData.meals[0].micronutrients },
              macronutrients: { ...dayData.meals[0].macronutrients }
            },
            meals: dayData.meals
          });
        }
      });
      
      console.log("Processed microhistory entries:", nutrientHistoryData.length);
      
      nutrientHistoryData.sort((a, b) => {
        const dateA = new Date(`${a.day} 2025`);
        const dateB = new Date(`${b.day} 2025`);
        return dateB.getTime() - dateA.getTime();
      });
      
      setNutrientHistory(nutrientHistoryData);
      
      if (nutrientHistoryData.length > 0) {
        console.log("Setting averages:", 
          nutrientHistoryData[0].averageData.micronutrients,
          nutrientHistoryData[0].averageData.macronutrients
        );
      }
      
      console.log("Fetch completed successfully");
    } catch (error) {
      console.error("Error fetching nutrient data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, refreshKey]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchNutrientData();
    
    const channel = supabase
      .channel('recipes_changes')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'recipes'
        },
        (payload) => {
          console.log("Recipe table changed, refreshing nutrient data:", payload);
          fetchNutrientData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, fetchNutrientData]);

  const renderNoDataMessage = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <p className="text-muted-foreground text-center mb-4">
        No nutrient data available yet. Scan your food to start tracking!
      </p>
      <Button onClick={() => setCameraDialogOpen(true)} className="flex items-center gap-2">
        <Camera className="h-4 w-4" /> Scan Food
      </Button>
    </div>
  );

  const renderNutrientValue = (value: number, unit: string, percentage: number) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className="font-medium">{value}{unit}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{percentage}% of daily value</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderMealNutrientTable = (meal) => (
    <div className="overflow-x-auto w-full">
      <Table className="w-full text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Nutrient</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">% Daily</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Protein</TableCell>
            <TableCell>{meal.macronutrients.protein.value}{meal.macronutrients.protein.unit}</TableCell>
            <TableCell className="text-right">{meal.macronutrients.protein.percentage}%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Carbs</TableCell>
            <TableCell>{meal.macronutrients.carbs.value}{meal.macronutrients.carbs.unit}</TableCell>
            <TableCell className="text-right">{meal.macronutrients.carbs.percentage}%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Fat</TableCell>
            <TableCell>{meal.macronutrients.fat.value}{meal.macronutrients.fat.unit}</TableCell>
            <TableCell className="text-right">{meal.macronutrients.fat.percentage}%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Vitamin A</TableCell>
            <TableCell>{meal.micronutrients.vitamin_a.value}{meal.micronutrients.vitamin_a.unit}</TableCell>
            <TableCell className="text-right">{meal.micronutrients.vitamin_a.percentage}%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Vitamin C</TableCell>
            <TableCell>{meal.micronutrients.vitamin_c.value}{meal.micronutrients.vitamin_c.unit}</TableCell>
            <TableCell className="text-right">{meal.micronutrients.vitamin_c.percentage}%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  const renderMeal = (meal, index) => (
    <Card key={index} className="border border-border/50 overflow-hidden mb-4">
      <CardHeader className="py-3 bg-muted/30">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Meal at {meal.timestamp}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 px-3">
        {isMobile ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="table">Details</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-2">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">
                    <div className="font-medium">Protein</div>
                    <div>{meal.macronutrients.protein.value}{meal.macronutrients.protein.unit}</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Carbs</div>
                    <div>{meal.macronutrients.carbs.value}{meal.macronutrients.carbs.unit}</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Fat</div>
                    <div>{meal.macronutrients.fat.value}{meal.macronutrients.fat.unit}</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Fiber</div>
                    <div>{meal.macronutrients.fiber.value}{meal.macronutrients.fiber.unit}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="table" className="mt-2">
              <ScrollArea className="h-[250px]">
                {renderMealNutrientTable(meal)}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="charts" className="mt-2">
              <ScrollArea className="h-[250px]">
                <div className="grid gap-4 pb-4">
                  <div className="h-[200px]">
                    <MacronutrientPieChart data={meal.macronutrients} />
                  </div>
                  <div className="h-[240px] pt-2">
                    <MicronutrientRadarChart 
                      data={meal.micronutrients}
                      showScanButton={false}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-[220px]">
              <MicronutrientRadarChart 
                data={meal.micronutrients}
                showScanButton={false}
                clickable={true}
              />
            </div>
            <div className="h-[220px]">
              <MacronutrientPieChart data={meal.macronutrients} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDayCard = (day, index) => {
    const isExpanded = expandedDays[day.day] || false;
    
    return (
      <Card key={index} className="overflow-hidden mb-6">
        <CardHeader className="bg-muted/30 pb-3">
          <CardTitle className="text-lg">{day.day}</CardTitle>
          <CardDescription>
            {day.meals.length} {day.meals.length === 1 ? 'meal' : 'meals'} tracked
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4 pb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="h-[220px]">
              <MacronutrientPieChart 
                data={day.averageData.macronutrients} 
                containerClassName="h-full"
              />
            </div>
            <div className="h-[220px]">
              <MicronutrientRadarChart 
                data={day.averageData.micronutrients}
                showScanButton={false}
              />
            </div>
          </div>
          
          <div className="mt-8 pt-4">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={() => toggleDayExpanded(day.day)}
                  className="w-full mt-4 flex items-center justify-center gap-1"
                >
                  {isExpanded ? (
                    <>Hide Meals <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>Show Meals <ChevronDown className="h-4 w-4" /></>
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-6">
                {isExpanded && (
                  <div className="space-y-2 pt-2">
                    <h4 className="font-medium text-sm mb-3">Individual Meals</h4>
                    <ScrollArea className="max-h-[500px]">
                      <div className="space-y-4 pb-4 pr-2">
                        {day.meals.map((meal, mealIndex) => renderMeal(meal, mealIndex))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Micronutrient Tracking" />
      
      <div className="container px-4 py-6 max-w-6xl">
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="history">Tracking History</TabsTrigger>
            <TabsTrigger value="micro">Micronutrients</TabsTrigger>
            <TabsTrigger value="macro">Macronutrients</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Nutrition History</h2>
              <Button onClick={() => setCameraDialogOpen(true)}>
                <Camera className="mr-2 h-4 w-4" /> Scan Food
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-220px)]">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : nutrientHistory.length > 0 ? (
                <div className="space-y-6 pb-16 pr-4">
                  {nutrientHistory.map((day, index) => renderDayCard(day, index))}
                </div>
              ) : renderNoDataMessage()}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="micro" className="mt-2 pt-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium">Micronutrient History</h2>
              <Button onClick={() => setCameraDialogOpen(true)}>
                <Camera className="mr-2 h-4 w-4" /> Scan Food
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-220px)]">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : nutrientHistory.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-16 pr-4">
                  {nutrientHistory.map((day, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{day.day}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-6 pt-0">
                        <div className="h-[200px]">
                          <MicronutrientRadarChart 
                            data={day.averageData.micronutrients}
                            showScanButton={false}
                            clickable={true}
                            scanDate={day.day}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 pb-3 px-6">
                        <Button
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setExpandedDays(prev => ({ ...prev, [day.day]: true }));
                            document.querySelector('[data-state="active"][value="history"]')?.scrollIntoView({ 
                              behavior: 'smooth',
                              block: 'start'
                            });
                          }}
                        >
                          View Daily Breakdown
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : renderNoDataMessage()}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="macro" className="mt-2 pt-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium">Macronutrient History</h2>
              <Button onClick={() => setCameraDialogOpen(true)}>
                <Camera className="mr-2 h-4 w-4" /> Scan Food
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-220px)]">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : nutrientHistory.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-16 pr-4">
                  {nutrientHistory.map((day, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-0">
                        <CardTitle className="text-lg">{day.day}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-4">
                        <div className="h-[180px]">
                          <MacronutrientPieChart data={day.averageData.macronutrients} />
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 pb-3 px-6">
                        <Button
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setExpandedDays(prev => ({ ...prev, [day.day]: true }));
                            document.querySelector('[data-state="active"][value="history"]')?.scrollIntoView({ 
                              behavior: 'smooth',
                              block: 'start'
                            });
                          }}
                        >
                          View Daily Breakdown
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : renderNoDataMessage()}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
      
      <CameraOptionsDialog
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        featureType="calorie"
        onSuccess={handleScanSuccess}
      />
      
      <NavigationBar />
    </div>
  );
}
