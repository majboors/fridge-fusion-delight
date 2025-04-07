
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { MacroChart } from "@/components/dashboard/MacroChart";
import { CalorieGauge } from "@/components/dashboard/CalorieGauge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import { FeatureCard } from "@/components/dashboard/FeatureCard";
import { CalorieBreakdownChart } from "@/components/dashboard/CalorieBreakdownChart";
import { AchievementBadges } from "@/components/dashboard/AchievementBadges";
import { useIsMobile } from "@/hooks/use-mobile";
import { FeatureSelectionDialog } from "@/components/dashboard/FeatureSelectionDialog";
import { Utensils, Apple, BarChart3, Calendar, Calculator, Camera } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { notifications } = useNotifications();
  const isMobile = useIsMobile();
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [totalCalories, setTotalCalories] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [calorieBreakdown, setCalorieBreakdown] = useState([
    { name: "Breakfast", calories: 300, percentage: 15 },
    { name: "Lunch", calories: 500, percentage: 25 },
    { name: "Dinner", calories: 800, percentage: 40 },
    { name: "Snacks", calories: 400, percentage: 20 },
  ]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }

    const fetchDailyCalories = async () => {
      if (user) {
        try {
          // Using mock data for now
          setTotalCalories(1700);
          setProtein(75);
          setCarbs(150);
          setFat(60);
        } catch (error) {
          console.error("Error fetching daily calories:", error);
        }
      }
    };

    fetchDailyCalories();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleFeatureSelect = () => {
    setShowFeatureDialog(true);
  };

  const handleLogNutritionSuccess = () => {
    console.log("Dashboard: Nutrition logged successfully, refreshing data");
    // Refresh data in parent components
    const fetchDailyCalories = async () => {
      if (user) {
        try {
          // Using mock data for now
          setTotalCalories(1700);
          setProtein(75);
          setCarbs(150);
          setFat(60);
        } catch (error) {
          console.error("Error fetching daily calories:", error);
        }
      }
    };

    fetchDailyCalories();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="Dashboard" />
      
      <div className="flex flex-grow p-4">
        <div className="w-full max-w-7xl mx-auto flex">
          {isMobile ? null : <NavigationBar />}

          <main className="flex-1">
            <Tabs defaultValue="home" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="home">Home</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="home">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white shadow-md">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Daily Calories</h2>
                      <CalorieGauge calories={totalCalories} dailyGoal={calorieGoal} />
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">
                          Track your daily calorie intake to reach your goals.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white shadow-md">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Macro Breakdown</h2>
                      <MacroChart protein={protein} carbs={carbs} fat={fat} />
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">
                          Maintain a balanced diet by tracking your macro intake.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FeatureCard
                      title="Track Micronutrients"
                      icon={Apple}
                      route="/micronutrients"
                    />
                    <FeatureCard
                      title="Recipe Finder"
                      icon={Utensils}
                      route="/recipes"
                    />
                    <FeatureCard
                      title="Daily Meal Suggestion"
                      icon={Calendar}
                      route="/goals"
                      view="saved"
                    />
                    <FeatureCard
                      title="Calorie Tracking"
                      icon={Camera}
                      onClick={() => setShowFeatureDialog(true)}
                    />
                    <FeatureCard
                      title="View Meal Plan"
                      icon={BarChart3}
                      route="/goals"
                      view="saved"
                    />
                    <FeatureCard
                      title="Set New Goals"
                      icon={Calculator}
                      route="/goals"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Calorie Breakdown</h2>
                  <Card className="bg-white shadow-md">
                    <div className="p-6">
                      <CalorieBreakdownChart items={calorieBreakdown} />
                    </div>
                  </Card>
                </div>

                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Achievements</h2>
                  <AchievementBadges />
                </div>
              </TabsContent>

              <TabsContent value="notifications">
                <div className="space-y-4">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <NotificationCard 
                        key={notification.id} 
                        message={notification.message}
                        filterType={notification.type}
                      />
                    ))
                  ) : (
                    <Card className="bg-white shadow-md p-4">
                      <p className="text-gray-500">No new notifications.</p>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="bg-white shadow-md p-6">
                  <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
                  <Button onClick={handleSignOut} variant="destructive">Sign Out</Button>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      <FeatureSelectionDialog
        open={showFeatureDialog}
        onOpenChange={setShowFeatureDialog}
        featureType="calorie"
        onSuccess={handleLogNutritionSuccess}
      />

      {isMobile && <div className="h-24" />}
    </div>
  );
};

export default Dashboard;
