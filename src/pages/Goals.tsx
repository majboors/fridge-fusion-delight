
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Target, Check, ChevronRight, ArrowRight, RefreshCw, FileText } from "lucide-react";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { calculateCalorieIntake, generateMealPlan } from "@/lib/api-client";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Meal, MealPlan } from "@/types/goals";
import { Json } from "@/integrations/supabase/types";

type GoalType = "gain" | "lose" | "maintain" | "";
type FormStep = "goal-selection" | "basic-info" | "weight-details" | "activity-details" | "dietary-details" | "results" | "meal-plan";

interface UserGoalDetails {
  goalType: GoalType;
  currentWeight: string;
  targetWeight: string;
  timeframe: string;
  age: string;
  height: string;
  activityLevel: string;
  mealsPerDay: string;
  dietaryRestrictions: string;
}

interface CalorieResults {
  daily_calories: number;
  macronutrient_split: {
    protein: { percentage: number; grams: number };
    carbs: { percentage: number; grams: number };
    fat: { percentage: number; grams: number };
  };
  weight_change_projection?: {
    weekly_change: number;
    monthly_change: number;
    unit: string;
  };
}

interface SavedGoal {
  id: string;
  goal_type: string;
  current_weight: number;
  target_weight?: number;
  timeframe?: number;
  age: number;
  height: number;
  activity_level: string;
  meals_per_day: number;
  dietary_restrictions?: string;
  daily_calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  created_at: string;
}

interface SavedMealPlan {
  id: string;
  goal_id: string;
  total_daily_calories: number;
  meals: Meal[];
  notes?: string;
  created_at: string;
}

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [generatingMealPlan, setGeneratingMealPlan] = useState(false);
  const [currentStep, setCurrentStep] = useState<FormStep>("goal-selection");
  const [activeTab, setActiveTab] = useState<"new" | "saved">("new");
  const [saving, setSaving] = useState(false);
  
  const [userGoal, setUserGoal] = useState<UserGoalDetails>({
    goalType: "",
    currentWeight: "",
    targetWeight: "",
    timeframe: "",
    age: "",
    height: "",
    activityLevel: "moderate",
    mealsPerDay: "3",
    dietaryRestrictions: ""
  });
  
  const [calorieResults, setCalorieResults] = useState<CalorieResults | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [savedGoalId, setSavedGoalId] = useState<string | null>(null);
  const [savedGoals, setSavedGoals] = useState<SavedGoal[]>([]);
  const [savedMealPlans, setSavedMealPlans] = useState<Record<string, SavedMealPlan>>({});
  
  const [selectedSavedGoal, setSelectedSavedGoal] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchUserGoals();
    
    if (location.state) {
      if (location.state.activeTab) {
        setActiveTab(location.state.activeTab);
      }
    }
  }, [user, navigate, location.state]);

  const fetchUserGoals = async () => {
    try {
      setLoading(true);
      
      const { data: goalsData, error: goalsError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (goalsError) {
        console.error('Error fetching user goals:', goalsError);
        toast({
          title: "Error",
          description: "Failed to load your saved goals",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      setSavedGoals(goalsData || []);
      
      if (goalsData && goalsData.length > 0) {
        const { data: mealPlansData, error: mealPlansError } = await supabase
          .from('meal_plans')
          .select('*')
          .in('goal_id', goalsData.map(goal => goal.id));
          
        if (mealPlansError) {
          console.error('Error fetching meal plans:', mealPlansError);
        } else if (mealPlansData) {
          const mealPlansMap: Record<string, SavedMealPlan> = {};
          mealPlansData.forEach(plan => {
            const typedMeals = (plan.meals as unknown) as Meal[];
            
            mealPlansMap[plan.goal_id] = {
              id: plan.id,
              goal_id: plan.goal_id,
              total_daily_calories: plan.total_daily_calories,
              meals: typedMeals,
              notes: plan.notes || undefined,
              created_at: plan.created_at
            };
          });
          setSavedMealPlans(mealPlansMap);
        }
      }
      
    } catch (error) {
      console.error('Error in fetchUserGoals:', error);
      toast({
        title: "Error",
        description: "Failed to load your saved goals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ... keep existing code (rest of component)

  return (
    <div className="bg-background min-h-screen pb-20">
      <PageHeader title="Goals" />

      <div className="px-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "new" | "saved")}>
          <TabsList className="w-full">
            <TabsTrigger className="w-1/2" value="new">Create Goal</TabsTrigger>
            <TabsTrigger className="w-1/2" value="saved">Saved Goals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new">
            {/* New goal form content */}
            <div className="mt-4">
              {/* Form steps based on currentStep */}
              {currentStep === "goal-selection" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">What's your nutrition goal?</h2>
                  <div className="space-y-2">
                    <RadioGroup 
                      value={userGoal.goalType} 
                      onValueChange={(value) => setUserGoal({...userGoal, goalType: value as GoalType})}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="lose" id="lose" />
                        <Label htmlFor="lose">Lose Weight</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="maintain" id="maintain" />
                        <Label htmlFor="maintain">Maintain Weight</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gain" id="gain" />
                        <Label htmlFor="gain">Gain Weight</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => userGoal.goalType && setCurrentStep("basic-info")}
                    disabled={!userGoal.goalType}
                  >
                    Continue
                  </Button>
                </div>
              )}
              
              {currentStep === "basic-info" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="age">Age</Label>
                      <Input 
                        id="age" 
                        type="number" 
                        value={userGoal.age} 
                        onChange={(e) => setUserGoal({...userGoal, age: e.target.value})}
                        placeholder="Enter your age"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input 
                        id="height" 
                        type="number" 
                        value={userGoal.height} 
                        onChange={(e) => setUserGoal({...userGoal, height: e.target.value})}
                        placeholder="Enter your height in cm"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setCurrentStep("goal-selection")}>
                      Back
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => (userGoal.age && userGoal.height) && setCurrentStep("weight-details")}
                      disabled={!userGoal.age || !userGoal.height}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
              
              {currentStep === "weight-details" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Weight Details</h2>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="current-weight">Current Weight (kg)</Label>
                      <Input 
                        id="current-weight" 
                        type="number" 
                        value={userGoal.currentWeight} 
                        onChange={(e) => setUserGoal({...userGoal, currentWeight: e.target.value})}
                        placeholder="Enter your current weight"
                      />
                    </div>
                    {userGoal.goalType !== "maintain" && (
                      <div>
                        <Label htmlFor="target-weight">Target Weight (kg)</Label>
                        <Input 
                          id="target-weight" 
                          type="number" 
                          value={userGoal.targetWeight} 
                          onChange={(e) => setUserGoal({...userGoal, targetWeight: e.target.value})}
                          placeholder="Enter your target weight"
                        />
                      </div>
                    )}
                    {userGoal.goalType !== "maintain" && (
                      <div>
                        <Label htmlFor="timeframe">Timeframe (weeks)</Label>
                        <Input 
                          id="timeframe" 
                          type="number" 
                          value={userGoal.timeframe} 
                          onChange={(e) => setUserGoal({...userGoal, timeframe: e.target.value})}
                          placeholder="Enter your timeframe"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setCurrentStep("basic-info")}>
                      Back
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        if (userGoal.currentWeight) {
                          if (userGoal.goalType === "maintain") {
                            setCurrentStep("activity-details");
                          } else if (userGoal.targetWeight && userGoal.timeframe) {
                            setCurrentStep("activity-details");
                          }
                        }
                      }}
                      disabled={
                        !userGoal.currentWeight || 
                        (userGoal.goalType !== "maintain" && (!userGoal.targetWeight || !userGoal.timeframe))
                      }
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
              
              {currentStep === "activity-details" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Activity Level</h2>
                  <div className="space-y-2">
                    <RadioGroup 
                      value={userGoal.activityLevel} 
                      onValueChange={(value) => setUserGoal({...userGoal, activityLevel: value})}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sedentary" id="sedentary" />
                        <Label htmlFor="sedentary">Sedentary (little or no exercise)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="light" />
                        <Label htmlFor="light">Light (exercise 1-3 days/week)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="moderate" id="moderate" />
                        <Label htmlFor="moderate">Moderate (exercise 3-5 days/week)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="active" id="active" />
                        <Label htmlFor="active">Active (exercise 6-7 days/week)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="very_active" id="very_active" />
                        <Label htmlFor="very_active">Very Active (hard exercise daily)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setCurrentStep("weight-details")}>
                      Back
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => setCurrentStep("dietary-details")}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
              
              {currentStep === "dietary-details" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Dietary Preferences</h2>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="meals-per-day">Meals per Day</Label>
                      <Input 
                        id="meals-per-day" 
                        type="number" 
                        min="1"
                        max="6"
                        value={userGoal.mealsPerDay} 
                        onChange={(e) => setUserGoal({...userGoal, mealsPerDay: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dietary-restrictions">Dietary Restrictions</Label>
                      <Textarea 
                        id="dietary-restrictions" 
                        value={userGoal.dietaryRestrictions} 
                        onChange={(e) => setUserGoal({...userGoal, dietaryRestrictions: e.target.value})}
                        placeholder="e.g. vegetarian, vegan, gluten-free, etc."
                        className="h-20"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setCurrentStep("activity-details")}>
                      Back
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleCalculateCalories}
                      disabled={calculating}
                    >
                      {calculating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        "Calculate Calories"
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {currentStep === "results" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Your Nutritional Plan</h2>
                  {calorieResults && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Daily Calorie Target</CardTitle>
                        <CardDescription>Based on your {userGoal.goalType} weight goal</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold mb-4">
                          {calorieResults.daily_calories} calories
                        </div>
                        
                        <div className="space-y-3">
                          <h3 className="font-medium">Daily Macronutrients</h3>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-secondary rounded-lg p-2">
                              <div className="text-lg font-semibold">
                                {calorieResults.macronutrient_split.protein.grams}g
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Protein ({calorieResults.macronutrient_split.protein.percentage}%)
                              </div>
                            </div>
                            <div className="bg-secondary rounded-lg p-2">
                              <div className="text-lg font-semibold">
                                {calorieResults.macronutrient_split.carbs.grams}g
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Carbs ({calorieResults.macronutrient_split.carbs.percentage}%)
                              </div>
                            </div>
                            <div className="bg-secondary rounded-lg p-2">
                              <div className="text-lg font-semibold">
                                {calorieResults.macronutrient_split.fat.grams}g
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Fat ({calorieResults.macronutrient_split.fat.percentage}%)
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {calorieResults.weight_change_projection && (
                          <div className="mt-4 pt-4 border-t">
                            <h3 className="font-medium mb-2">Expected Progress</h3>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Weekly:</span>
                                <span className="font-medium">
                                  {calorieResults.weight_change_projection.weekly_change} {calorieResults.weight_change_projection.unit}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Monthly:</span>
                                <span className="font-medium">
                                  {calorieResults.weight_change_projection.monthly_change} {calorieResults.weight_change_projection.unit}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex-col space-y-2">
                        <Button 
                          className="w-full" 
                          onClick={handleSaveGoal}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Save Goal
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={handleGenerateMealPlan}
                          disabled={generatingMealPlan}
                        >
                          {generatingMealPlan ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="mr-2 h-4 w-4" />
                              Generate Meal Plan
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full"
                          onClick={() => setCurrentStep("goal-selection")}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Start Over
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </div>
              )}
              
              {currentStep === "meal-plan" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Your Daily Meal Plan</h2>
                    <Button variant="outline" size="sm" onClick={() => setCurrentStep("results")}>
                      Back to Results
                    </Button>
                  </div>
                  
                  {mealPlan && (
                    <>
                      <div className="bg-secondary rounded-lg p-3 text-center mb-4">
                        <div className="text-sm text-muted-foreground">Daily Calories</div>
                        <div className="text-2xl font-bold">{mealPlan.total_daily_calories} kcal</div>
                      </div>
                      
                      <div className="space-y-4">
                        {mealPlan.meals.map((meal, index) => (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle>{meal.name}</CardTitle>
                              <CardDescription>
                                {meal.time} · {meal.calories} kcal
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm mb-3">{meal.description}</p>
                              
                              <div className="mb-3">
                                <h4 className="text-xs font-medium text-muted-foreground mb-1">FOODS</h4>
                                <ul className="text-sm space-y-1">
                                  {meal.foods.map((food, foodIndex) => (
                                    <li key={foodIndex} className="flex items-center">
                                      <ChevronRight className="h-3 w-3 text-muted-foreground mr-1" />
                                      {food}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-1">MACROS</h4>
                                <div className="grid grid-cols-3 gap-1 text-xs">
                                  <div>Protein: {meal.macros.protein}g</div>
                                  <div>Carbs: {meal.macros.carbs}g</div>
                                  <div>Fat: {meal.macros.fat}g</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {mealPlan.notes && (
                        <div className="bg-muted p-3 rounded-lg mt-4">
                          <h3 className="font-medium mb-1">Notes</h3>
                          <p className="text-sm text-muted-foreground">{mealPlan.notes}</p>
                        </div>
                      )}
                      
                      {savedGoalId && (
                        <Button 
                          className="w-full" 
                          onClick={handleSaveMealPlan}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Save Meal Plan
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="saved">
            <div className="mt-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : savedGoals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You don't have any saved goals yet.</p>
                  <Button onClick={() => setActiveTab("new")}>Create Your First Goal</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedGoals.map(goal => (
                    <Card key={goal.id} className={selectedSavedGoal === goal.id ? "border-primary" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="capitalize">{goal.goal_type} Weight</CardTitle>
                            <CardDescription>
                              Created {format(new Date(goal.created_at), "MMM d, yyyy")}
                            </CardDescription>
                          </div>
                          <Button 
                            variant={selectedSavedGoal === goal.id ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setSelectedSavedGoal(selectedSavedGoal === goal.id ? null : goal.id)}
                          >
                            {selectedSavedGoal === goal.id ? "Hide Details" : "View Details"}
                          </Button>
                        </div>
                      </CardHeader>
                      
                      {selectedSavedGoal === goal.id && (
                        <>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <h4 className="text-sm font-medium">Current Weight</h4>
                                  <p>{goal.current_weight} kg</p>
                                </div>
                                {goal.target_weight && (
                                  <div>
                                    <h4 className="text-sm font-medium">Target Weight</h4>
                                    <p>{goal.target_weight} kg</p>
                                  </div>
                                )}
                                <div>
                                  <h4 className="text-sm font-medium">Age</h4>
                                  <p>{goal.age} years</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium">Height</h4>
                                  <p>{goal.height} cm</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium">Activity Level</h4>
                                  <p className="capitalize">{goal.activity_level.replace('_', ' ')}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium">Meals Per Day</h4>
                                  <p>{goal.meals_per_day}</p>
                                </div>
                              </div>
                              
                              {goal.daily_calories && (
                                <div className="pt-2 border-t">
                                  <div className="bg-secondary rounded-lg p-3 text-center">
                                    <div className="text-sm text-muted-foreground">Daily Calories</div>
                                    <div className="text-2xl font-bold">{goal.daily_calories} kcal</div>
                                  </div>
                                  
                                  {goal.protein_grams && goal.carbs_grams && goal.fat_grams && (
                                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                      <div className="bg-muted rounded-lg p-2">
                                        <div className="text-lg font-semibold">{goal.protein_grams}g</div>
                                        <div className="text-xs text-muted-foreground">Protein</div>
                                      </div>
                                      <div className="bg-muted rounded-lg p-2">
                                        <div className="text-lg font-semibold">{goal.carbs_grams}g</div>
                                        <div className="text-xs text-muted-foreground">Carbs</div>
                                      </div>
                                      <div className="bg-muted rounded-lg p-2">
                                        <div className="text-lg font-semibold">{goal.fat_grams}g</div>
                                        <div className="text-xs text-muted-foreground">Fat</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                          
                          <CardFooter className="flex-col space-y-2">
                            {savedMealPlans[goal.id] ? (
                              <div className="w-full space-y-3">
                                <h3 className="font-medium">Meal Plan</h3>
                                {savedMealPlans[goal.id].meals.map((meal, index) => (
                                  <Card key={index}>
                                    <CardContent className="p-3">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium">{meal.name}</h4>
                                          <p className="text-xs text-muted-foreground">{meal.time} · {meal.calories} kcal</p>
                                          <p className="text-xs mt-1">{meal.foods.join(", ")}</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => handleGenerateMealPlanForSavedGoal(goal)}
                                disabled={generatingMealPlan}
                              >
                                {generatingMealPlan ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Generate Meal Plan
                                  </>
                                )}
                              </Button>
                            )}
                          </CardFooter>
                        </>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <NavigationBar />
    </div>
  );

  const handleCalculateCalories = async () => {
    if (!user) return;
    
    try {
      setCalculating(true);
      
      // Prepare goal data
      const goalData = {
        goal_type: userGoal.goalType,
        current_weight: parseFloat(userGoal.currentWeight),
        target_weight: userGoal.targetWeight ? parseFloat(userGoal.targetWeight) : undefined,
        timeframe: userGoal.timeframe ? parseInt(userGoal.timeframe) : undefined,
        age: parseInt(userGoal.age),
        height: parseInt(userGoal.height),
        activity_level: userGoal.activityLevel,
        meals_per_day: parseInt(userGoal.mealsPerDay),
        dietary_restrictions: userGoal.dietaryRestrictions || undefined
      };
      
      // Format the request string for the API
      const requestString = JSON.stringify(goalData);
      
      // Call the API to calculate calorie intake
      const response = await calculateCalorieIntake(requestString);
      
      setCalorieResults({
        daily_calories: response.daily_calories,
        macronutrient_split: response.macronutrient_split,
        weight_change_projection: response.weight_change_projection
      });
      
      setCurrentStep("results");
    } catch (error) {
      console.error('Error calculating calories:', error);
      toast({
        title: "Error",
        description: "Failed to calculate your calorie intake. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };
  
  const handleSaveGoal = async () => {
    if (!user || !calorieResults) return;
    
    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('user_goals')
        .insert([
          {
            user_id: user.id,
            goal_type: userGoal.goalType,
            current_weight: parseFloat(userGoal.currentWeight),
            target_weight: userGoal.targetWeight ? parseFloat(userGoal.targetWeight) : null,
            timeframe: userGoal.timeframe ? parseInt(userGoal.timeframe) : null,
            age: parseInt(userGoal.age),
            height: parseInt(userGoal.height),
            activity_level: userGoal.activityLevel,
            meals_per_day: parseInt(userGoal.mealsPerDay),
            dietary_restrictions: userGoal.dietaryRestrictions || null,
            daily_calories: calorieResults.daily_calories,
            protein_grams: calorieResults.macronutrient_split.protein.grams,
            carbs_grams: calorieResults.macronutrient_split.carbs.grams,
            fat_grams: calorieResults.macronutrient_split.fat.grams
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      setSavedGoalId(data[0].id);
      
      toast({
        title: "Success!",
        description: "Your goal has been saved.",
      });
      
      fetchUserGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast({
        title: "Error",
        description: "Failed to save your goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleGenerateMealPlan = async () => {
    if (!user || !calorieResults) return;
    
    try {
      setGeneratingMealPlan(true);
      
      // Prepare meal plan request
      const requestData = {
        calories: calorieResults.daily_calories,
        dietary_restrictions: userGoal.dietaryRestrictions || "",
        meals_per_day: parseInt(userGoal.mealsPerDay),
        macros: {
          protein_g: calorieResults.macronutrient_split.protein.grams,
          carbs_g: calorieResults.macronutrient_split.carbs.grams,
          fat_g: calorieResults.macronutrient_split.fat.grams
        }
      };
      
      // Format the request string for the API
      const requestString = JSON.stringify(requestData);
      
      // Call the API to generate meal plan
      const response = await generateMealPlan(requestString);
      
      setMealPlan({
        user_id: user.id,
        total_daily_calories: response.total_daily_calories,
        meals: response.meals,
        notes: response.notes
      });
      
      setCurrentStep("meal-plan");
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate your meal plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingMealPlan(false);
    }
  };
  
  const handleSaveMealPlan = async () => {
    if (!user || !mealPlan || !savedGoalId) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('meal_plans')
        .insert([
          {
            user_id: user.id,
            goal_id: savedGoalId,
            total_daily_calories: mealPlan.total_daily_calories,
            meals: mealPlan.meals,
            notes: mealPlan.notes || null
          }
        ]);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success!",
        description: "Your meal plan has been saved.",
      });
      
      fetchUserGoals();
      setActiveTab("saved");
    } catch (error) {
      console.error('Error saving meal plan:', error);
      toast({
        title: "Error",
        description: "Failed to save your meal plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleGenerateMealPlanForSavedGoal = async (goal: SavedGoal) => {
    if (!user) return;
    
    try {
      setGeneratingMealPlan(true);
      
      // Prepare meal plan request
      const requestData = {
        calories: goal.daily_calories,
        dietary_restrictions: goal.dietary_restrictions || "",
        meals_per_day: goal.meals_per_day,
        macros: {
          protein_g: goal.protein_grams,
          carbs_g: goal.carbs_grams,
          fat_g: goal.fat_grams
        }
      };
      
      // Format the request string for the API
      const requestString = JSON.stringify(requestData);
      
      // Call the API to generate meal plan
      const response = await generateMealPlan(requestString);
      
      // Save the generated meal plan
      const { error } = await supabase
        .from('meal_plans')
        .insert([
          {
            user_id: user.id,
            goal_id: goal.id,
            total_daily_calories: response.total_daily_calories,
            meals: response.meals,
            notes: response.notes || null
          }
        ]);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success!",
        description: "Meal plan generated and saved.",
      });
      
      fetchUserGoals();
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate your meal plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingMealPlan(false);
    }
  };
}
