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
          {/* ... keep existing code (rest of component) */}
        </Tabs>
      </div>

      <NavigationBar />
    </div>
  );
}
