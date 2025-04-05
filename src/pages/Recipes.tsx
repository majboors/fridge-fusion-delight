
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2, Utensils, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NavigationBar } from "@/components/dashboard/NavigationBar";

export default function Recipes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

  const handleAddRecipe = () => {
    toast({
      title: "Coming Soon",
      description: "Recipe creation functionality will be available soon!",
    });
  };
  
  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Header */}
      <header className="pt-8 px-6">
        <h1 className="text-4xl font-bold mb-6">Recipes</h1>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="px-6">
          {/* Add Recipe Button */}
          <Button 
            className="w-full py-6 text-lg flex items-center justify-center gap-2 mb-6" 
            onClick={handleAddRecipe}
          >
            <Plus className="h-5 w-5" /> Add Recipe
          </Button>
          
          {/* No Recipes State */}
          <div className="flex flex-col items-center justify-center py-10">
            <div className="bg-muted/50 p-8 rounded-full mb-4">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No recipes yet</h2>
            <p className="text-muted-foreground text-center mt-2 mb-6">
              Create your first recipe by using the camera feature or adding a recipe manually
            </p>
          </div>
          
          {/* Recipe Cards will be displayed here when available */}
          
        </div>
      )}

      {/* Navigation Bar */}
      <NavigationBar />
    </div>
  );
}
