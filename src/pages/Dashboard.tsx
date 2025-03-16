
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { user, hasActiveSubscription, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generationCount, setGenerationCount] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchUserData = async () => {
      try {
        // Get recipe generation count
        const { data: genData, error: genError } = await supabase
          .from('recipe_generations')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);

        if (genError) throw genError;
        setGenerationCount(genData?.length || 0);

        // Get subscription details
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (subError) throw subError;
        setSubscription(subData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error",
          description: "Failed to load your data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-4">
              {hasActiveSubscription ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">Active Subscription</p>
                    <p className="text-sm text-gray-500">
                      Expires on: {formatDate(subscription?.expires_at)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="font-medium text-gray-900">No Active Subscription</p>
                    <p className="text-sm text-gray-500">
                      Upgrade for unlimited recipes
                    </p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              {!hasActiveSubscription && (
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={() => navigate("/#pricing")}
                >
                  Upgrade Now
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-700">Recipes Generated:</p>
                  <p className="font-medium text-gray-900">{generationCount}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-700">Plan:</p>
                  <p className="font-medium text-gray-900">
                    {hasActiveSubscription ? "Starter Package" : "Free Trial"}
                  </p>
                </div>
                {!hasActiveSubscription && (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-700">Free Generations Remaining:</p>
                    <p className="font-medium text-gray-900">
                      {generationCount === 0 ? "1" : "0"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Generate New Recipe
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
