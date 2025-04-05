
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  PieChart, 
  Pill, 
  Utensils, 
  CalendarCheck, 
  Plus, 
  Loader2
} from "lucide-react";

import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { NutrientProgress } from "@/components/dashboard/NutrientProgress";
import { MacroChart } from "@/components/dashboard/MacroChart";
import { FeatureCard } from "@/components/dashboard/FeatureCard";
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import { ProgressRing } from "@/components/dashboard/ProgressRing";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock data (in a real app, this would come from an API)
  const [dailyData, setDailyData] = useState({
    calories: { consumed: 1250, goal: 2000 },
    carbs: { consumed: 90, goal: 250 },
    protein: { consumed: 48, goal: 150 },
    fat: { consumed: 80, goal: 65 },
    weeklyProgress: 65,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user, navigate]);

  const handleAddMeal = () => {
    toast({
      title: "Coming Soon",
      description: "Meal logging functionality will be available soon!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const firstName = user?.email?.split('@')[0] || 'User';
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div className="bg-background pb-20">
      {/* Header */}
      <header className="pt-8 px-6">
        <h1 className="text-4xl font-bold mb-6">Welcome back, {capitalizedName}!</h1>
      </header>

      {/* Daily Summary */}
      <div className="px-6">
        <h2 className="text-2xl font-semibold mb-3">Daily Summary</h2>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-3xl font-bold">{dailyData.calories.consumed}</h3>
            <p className="text-sm text-muted-foreground">of {dailyData.calories.goal} calories</p>
            
            <div className="mt-4 space-y-3">
              <NutrientProgress 
                consumed={dailyData.carbs.consumed} 
                goal={dailyData.carbs.goal} 
                label="Carbs" 
                color="bg-yellow-400"
              />
              <NutrientProgress 
                consumed={dailyData.protein.consumed} 
                goal={dailyData.protein.goal} 
                label="Protein" 
                color="bg-green-500"
              />
              <NutrientProgress 
                consumed={dailyData.fat.consumed} 
                goal={dailyData.fat.goal} 
                label="Fat" 
                color="bg-blue-400"
              />
            </div>
          </div>
          
          <div className="ml-4">
            <MacroChart 
              protein={dailyData.protein.consumed}
              carbs={dailyData.carbs.consumed}
              fat={dailyData.fat.consumed}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Micronutrient Highlights</h3>
          <div className="grid grid-cols-3 gap-2">
            <Card className="bg-secondary border-0">
              <CardContent className="p-2 text-center">
                <span className="text-xs">Vitamin C</span>
                <p className="text-sm font-bold text-green-600">120%</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary border-0">
              <CardContent className="p-2 text-center">
                <span className="text-xs">Iron</span>
                <p className="text-sm font-bold text-amber-600">65%</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary border-0">
              <CardContent className="p-2 text-center">
                <span className="text-xs">Calcium</span>
                <p className="text-sm font-bold text-red-600">45%</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Log Meal Button */}
      <div className="px-6 mb-8">
        <Button 
          className="w-full py-6 text-lg flex items-center justify-center gap-2" 
          onClick={handleAddMeal}
        >
          <Plus className="h-5 w-5" /> Log Meal
        </Button>
      </div>

      {/* Feature Navigation */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <FeatureCard 
            title="Calorie Count" 
            icon={BarChart3} 
            onClick={() => toast({ title: "Coming Soon!" })}
          />
          <FeatureCard 
            title="Macronutrient Details" 
            icon={PieChart} 
            onClick={() => toast({ title: "Coming Soon!" })}
          />
          <FeatureCard 
            title="Micronutrient Tracking" 
            icon={Pill} 
            onClick={() => toast({ title: "Coming Soon!" })}
          />
          <FeatureCard 
            title="Daily Meal Suggestions" 
            icon={Utensils} 
            onClick={() => toast({ title: "Coming Soon!" })}
          />
        </div>
      </div>

      {/* Progress & Notifications */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center">
            <ProgressRing 
              progress={dailyData.weeklyProgress} 
              title="65%" 
              subtitle="Weekly Progress" 
            />
            <p className="text-sm text-muted-foreground mt-2">Based on your goals</p>
          </div>
          
          <div>
            <NotificationCard message="Don't forget to log dinner!" />
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => toast({ title: "Coming Soon!" })}
              >
                <CalendarCheck className="h-4 w-4" />
                View Meal Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <NavigationBar />
    </div>
  );
}
