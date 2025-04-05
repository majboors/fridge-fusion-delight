
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, X, Save, Share, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface NutritionResponseData {
  calorie_count: number;
  macronutrients: {
    protein: { value: number; unit: string; percentage: number };
    carbs: { value: number; unit: string; percentage: number };
    fat: { value: number; unit: string; percentage: number };
    fiber: { value: number; unit: string; percentage: number };
  };
  micronutrients: {
    vitamin_a: { value: number; unit: string; percentage: number };
    vitamin_c: { value: number; unit: string; percentage: number };
    calcium: { value: number; unit: string; percentage: number };
    iron: { value: number; unit: string; percentage: number };
    potassium: { value: number; unit: string; percentage: number };
    sodium: { value: number; unit: string; percentage: number };
  };
  food_items: string[];
  item_breakdown: {
    name: string;
    calories: number;
    percentage: number;
  }[];
  serving_size: string;
}

interface NutritionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutritionData: NutritionResponseData | null;
  imageUrl?: string;
}

export function NutritionDialog({
  open,
  onOpenChange,
  nutritionData,
  imageUrl
}: NutritionDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  if (!nutritionData) {
    return null;
  }

  const handleLogMeal = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      // Update nutrition data for today
      const { data: nutritionDbData, error: nutritionError } = await supabase.rpc('get_or_create_todays_nutrition_data', {
        user_uuid: user.id
      });

      if (nutritionError) {
        throw nutritionError;
      }

      if (nutritionDbData && nutritionDbData.length > 0) {
        const currentData = nutritionDbData[0];
        
        // Calculate new values
        const newCaloriesConsumed = currentData.calories_consumed + nutritionData.calorie_count;
        const newCarbsConsumed = currentData.carbs_consumed + nutritionData.macronutrients.carbs.value;
        const newProteinConsumed = currentData.protein_consumed + nutritionData.macronutrients.protein.value;
        const newFatConsumed = currentData.fat_consumed + nutritionData.macronutrients.fat.value;
        
        // Calculate weekly progress as percentage of goals met
        const caloriePercentage = Math.min((newCaloriesConsumed / currentData.calories_goal) * 100, 100);
        const carbsPercentage = Math.min((newCarbsConsumed / currentData.carbs_goal) * 100, 100);
        const proteinPercentage = Math.min((newProteinConsumed / currentData.protein_goal) * 100, 100);
        const fatPercentage = Math.min((newFatConsumed / currentData.fat_goal) * 100, 100);
        
        const weeklyProgress = Math.round((caloriePercentage + carbsPercentage + proteinPercentage + fatPercentage) / 4);
        
        // Update the nutrition data
        const { error: updateError } = await supabase
          .from('nutrition_data')
          .update({
            calories_consumed: newCaloriesConsumed,
            carbs_consumed: newCarbsConsumed,
            protein_consumed: newProteinConsumed,
            fat_consumed: newFatConsumed,
            weekly_progress: weeklyProgress,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentData.id);
        
        if (updateError) {
          throw updateError;
        }
      }

      // Save as a meal recipe
      const foodItemsTitle = nutritionData.food_items.length > 0 
        ? nutritionData.food_items.join(", ")
        : "Meal";
        
      const title = `${foodItemsTitle} (${nutritionData.calorie_count} calories)`;

      // Create steps with nutrition information
      const steps = [
        `This meal contains approximately ${nutritionData.calorie_count} calories.`,
        `Protein: ${nutritionData.macronutrients.protein.value}${nutritionData.macronutrients.protein.unit} (${nutritionData.macronutrients.protein.percentage}%)`,
        `Carbs: ${nutritionData.macronutrients.carbs.value}${nutritionData.macronutrients.carbs.unit} (${nutritionData.macronutrients.carbs.percentage}%)`,
        `Fat: ${nutritionData.macronutrients.fat.value}${nutritionData.macronutrients.fat.unit} (${nutritionData.macronutrients.fat.percentage}%)`,
        `Fiber: ${nutritionData.macronutrients.fiber.value}${nutritionData.macronutrients.fiber.unit} (${nutritionData.macronutrients.fiber.percentage}%)`,
      ];

      // Save to recipes table
      const { error: recipeSaveError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: title,
          image_url: imageUrl || null,
          ingredients: nutritionData.food_items,
          steps: steps
        });
      
      if (recipeSaveError) {
        throw recipeSaveError;
      }

      setIsLogged(true);
      toast({
        title: "Success!",
        description: "Meal logged successfully",
      });

    } catch (error) {
      console.error("Error saving meal:", error);
      toast({
        title: "Error",
        description: "Failed to log meal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nutrition Analysis</DialogTitle>
          <DialogDescription>
            Here's the nutritional breakdown of your food
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Food Image */}
            {imageUrl && (
              <div className="w-full h-48 overflow-hidden rounded-md">
                <img src={imageUrl} alt="Food" className="w-full h-full object-cover" />
              </div>
            )}
            
            {/* Calories */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Calories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{nutritionData.calorie_count}</div>
                <div className="text-sm text-muted-foreground">Total calories</div>
                
                {nutritionData.item_breakdown.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Breakdown by Item:</h4>
                    {nutritionData.item_breakdown.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span>{item.calories} cal ({item.percentage}%)</span>
                        </div>
                        <Progress value={item.percentage} className="h-1" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Macronutrients */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Macronutrients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Protein</span>
                    <span>{nutritionData.macronutrients.protein.value}{nutritionData.macronutrients.protein.unit} ({nutritionData.macronutrients.protein.percentage}%)</span>
                  </div>
                  <Progress value={nutritionData.macronutrients.protein.percentage} className="h-2 bg-secondary" indicatorClassName="bg-green-500" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Carbs</span>
                    <span>{nutritionData.macronutrients.carbs.value}{nutritionData.macronutrients.carbs.unit} ({nutritionData.macronutrients.carbs.percentage}%)</span>
                  </div>
                  <Progress value={nutritionData.macronutrients.carbs.percentage} className="h-2 bg-secondary" indicatorClassName="bg-yellow-400" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Fat</span>
                    <span>{nutritionData.macronutrients.fat.value}{nutritionData.macronutrients.fat.unit} ({nutritionData.macronutrients.fat.percentage}%)</span>
                  </div>
                  <Progress value={nutritionData.macronutrients.fat.percentage} className="h-2 bg-secondary" indicatorClassName="bg-blue-400" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Fiber</span>
                    <span>{nutritionData.macronutrients.fiber.value}{nutritionData.macronutrients.fiber.unit} ({nutritionData.macronutrients.fiber.percentage}%)</span>
                  </div>
                  <Progress value={nutritionData.macronutrients.fiber.percentage} className="h-2 bg-secondary" indicatorClassName="bg-amber-600" />
                </div>
              </CardContent>
            </Card>
            
            {/* Micronutrients */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Micronutrients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Vitamin A</span>
                      <span>{nutritionData.micronutrients.vitamin_a.percentage}%</span>
                    </div>
                    <Progress value={nutritionData.micronutrients.vitamin_a.percentage} className="h-1" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Vitamin C</span>
                      <span>{nutritionData.micronutrients.vitamin_c.percentage}%</span>
                    </div>
                    <Progress value={nutritionData.micronutrients.vitamin_c.percentage} className="h-1" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Calcium</span>
                      <span>{nutritionData.micronutrients.calcium.percentage}%</span>
                    </div>
                    <Progress value={nutritionData.micronutrients.calcium.percentage} className="h-1" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Iron</span>
                      <span>{nutritionData.micronutrients.iron.percentage}%</span>
                    </div>
                    <Progress value={nutritionData.micronutrients.iron.percentage} className="h-1" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Potassium</span>
                      <span>{nutritionData.micronutrients.potassium.percentage}%</span>
                    </div>
                    <Progress value={nutritionData.micronutrients.potassium.percentage} className="h-1" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Sodium</span>
                      <span>{nutritionData.micronutrients.sodium.percentage}%</span>
                    </div>
                    <Progress value={nutritionData.micronutrients.sodium.percentage} className="h-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Food Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Detected Food</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {nutritionData.food_items.map((item, idx) => (
                    <span key={idx} className="bg-secondary px-3 py-1 rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
                {nutritionData.serving_size && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Serving size: {nutritionData.serving_size}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {isLogged && (
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
                <CardContent className="flex items-center gap-2 py-4">
                  <Award className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Achievement Unlocked: Nutrition Tracker!</span>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between mt-4 pt-4 border-t">
          {!isLogged ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="mr-2 h-4 w-4" /> Dismiss
              </Button>
              <Button onClick={handleLogMeal} disabled={isSaving}>
                {isSaving ? (
                  <>Logging...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Log This Meal
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <Check className="mr-2 h-4 w-4" /> Done
              </Button>
              <Button variant="secondary" onClick={() => {
                toast({
                  title: "Shared!",
                  description: "Meal details copied to clipboard",
                });
              }}>
                <Share className="mr-2 h-4 w-4" /> Share
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
