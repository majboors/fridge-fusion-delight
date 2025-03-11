import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const PricingSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://pay.techrealm.pk/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 5141 // Updated amount
        }),
      });

      if (!response.ok) {
        throw new Error('Payment initiation failed');
      }

      const data = await response.json();
      if (data.payment_link) {
        window.location.href = data.payment_link;
      } else {
        throw new Error('No payment link received');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your cooking journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Free Trial</h3>
              <div className="text-4xl font-bold mb-6">$0</div>
              <ul className="text-left space-y-4 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>1 Recipe Generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>Basic Recipe Details</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>AI-Powered Ingredient Analysis</span>
                </li>
              </ul>
              <Button disabled className="w-full" variant="outline">
                Current Plan
              </Button>
            </div>
          </Card>

          <Card className="p-8 bg-amber-50 border-amber-200">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Starter Package</h3>
              <div className="text-4xl font-bold mb-6">$14</div>
              <ul className="text-left space-y-4 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>Unlimited Recipe Generations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>Detailed Recipe Instructions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>Advanced AI Analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>Priority Support</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700" 
                onClick={handleSubscribe}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Upgrade Now"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
