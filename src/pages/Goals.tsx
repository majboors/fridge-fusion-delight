
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Target } from "lucide-react";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      <PageHeader title="Goals" />

      <div className="px-6">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Nutrition Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Set and track your nutrition goals here. Coming soon!</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Activity Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Set and track your activity goals here. Coming soon!</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Personal Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Set and track your personal health goals here. Coming soon!</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <NavigationBar />
    </div>
  );
}
