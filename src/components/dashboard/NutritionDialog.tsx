
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Save, Share, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MacronutrientPieChart } from "./MacronutrientPieChart";
import { CalorieGauge } from "./CalorieGauge";
import { CalorieBreakdownChart } from "./CalorieBreakdownChart";
import { MicronutrientRadarChart } from "./MicronutrientRadarChart";

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
  onMealLogged?: () => void;
}

export function NutritionDialog({
  open,
  onOpenChange,
  nutritionData,
  imageUrl,
  onMealLogged
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
        
        // Calculate new values - ensure all values are integers
        const newCaloriesConsumed = currentData.calories_consumed + Math.round(nutritionData.calorie_count);
        const newCarbsConsumed = currentData.carbs_consumed + Math.round(nutritionData.macronutrients.carbs.value);
        const newProteinConsumed = currentData.protein_consumed + Math.round(nutritionData.macronutrients.protein.value);
        const newFatConsumed = currentData.fat_consumed + Math.round(nutritionData.macronutrients.fat.value);
        
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
        
      const title = `${foodItemsTitle} (${Math.round(nutritionData.calorie_count)} calories)`;

      // Create steps with nutrition information - format to ensure micronutrient data is parsable
      const steps = [
        `This meal contains approximately ${Math.round(nutritionData.calorie_count)} calories.`,
        `Protein: ${Math.round(nutritionData.macronutrients.protein.value)}${nutritionData.macronutrients.protein.unit} (${Math.round(nutritionData.macronutrients.protein.percentage)}%)`,
        `Carbs: ${Math.round(nutritionData.macronutrients.carbs.value)}${nutritionData.macronutrients.carbs.unit} (${Math.round(nutritionData.macronutrients.carbs.percentage)}%)`,
        `Fat: ${Math.round(nutritionData.macronutrients.fat.value)}${nutritionData.macronutrients.fat.unit} (${Math.round(nutritionData.macronutrients.fat.percentage)}%)`,
        `Fiber: ${Math.round(nutritionData.macronutrients.fiber.value)}${nutritionData.macronutrients.fiber.unit} (${Math.round(nutritionData.macronutrients.fiber.percentage)}%)`,
        `Vitamin A: ${Math.round(nutritionData.micronutrients.vitamin_a.value)}${nutritionData.micronutrients.vitamin_a.unit} (${Math.round(nutritionData.micronutrients.vitamin_a.percentage)}%)`,
        `Vitamin C: ${Math.round(nutritionData.micronutrients.vitamin_c.value)}${nutritionData.micronutrients.vitamin_c.unit} (${Math.round(nutritionData.micronutrients.vitamin_c.percentage)}%)`,
        `Calcium: ${Math.round(nutritionData.micronutrients.calcium.value)}${nutritionData.micronutrients.calcium.unit} (${Math.round(nutritionData.micronutrients.calcium.percentage)}%)`,
        `Iron: ${Math.round(nutritionData.micronutrients.iron.value)}${nutritionData.micronutrients.iron.unit} (${Math.round(nutritionData.micronutrients.iron.percentage)}%)`,
        `Potassium: ${Math.round(nutritionData.micronutrients.potassium.value)}${nutritionData.micronutrients.potassium.unit} (${Math.round(nutritionData.micronutrients.potassium.percentage)}%)`,
        `Sodium: ${Math.round(nutritionData.micronutrients.sodium.value)}${nutritionData.micronutrients.sodium.unit} (${Math.round(nutritionData.micronutrients.sodium.percentage)}%)`,
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
      
      // Call the onMealLogged callback ONLY if it exists AND the meal was successfully logged
      if (onMealLogged) {
        onMealLogged();
      }

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle>Nutrition Analysis</DialogTitle>
          <DialogDescription>
            Here's the nutritional breakdown of your food
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(80vh-120px)] pr-4">
            <div className="space-y-6 pb-6">
              {/* Food Image */}
              {imageUrl && (
                <div className="w-full h-48 overflow-hidden rounded-md">
                  <img src={imageUrl} alt="Food" className="w-full h-full object-cover" />
                </div>
              )}
              
              {/* Calorie Gauge */}
              <CalorieGauge calories={nutritionData.calorie_count} />
              
              {/* Macronutrient Pie Chart */}
              <MacronutrientPieChart data={nutritionData.macronutrients} />
              
              {/* Item Breakdown Chart */}
              {nutritionData.item_breakdown.length > 0 && (
                <CalorieBreakdownChart items={nutritionData.item_breakdown} />
              )}
              
              {/* Micronutrient Visualizations */}
              <MicronutrientRadarChart data={nutritionData.micronutrients} />
              
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
        </div>

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
