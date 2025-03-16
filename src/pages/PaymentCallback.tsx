
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function PaymentCallback() {
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processPayment = async () => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to complete this process.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      try {
        // Parse URL query parameters
        const params = new URLSearchParams(location.search);
        const isSuccess = params.get('success') === 'true';
        const paymentId = params.get('id');
        const message = params.get('data.message');
        const txnResponseCode = params.get('txn_response_code');
        const amount = params.get('amount_cents');

        // Reject if not successful
        if (!isSuccess || message !== 'Approved' || txnResponseCode !== 'APPROVED') {
          setSuccess(false);
          setProcessing(false);
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Create record of the payment
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .insert({
            user_id: user.id,
            amount: Number(amount) / 100, // Convert cents to currency
            currency: 'AED',
            payment_id: paymentId,
            success: true,
            transaction_data: Object.fromEntries(params.entries())
          })
          .select('id')
          .single();

        if (paymentError) {
          throw paymentError;
        }

        // Set expiration date to 30 days from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        // Create or update subscription
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            status: 'active',
            payment_id: paymentId,
            expires_at: expiryDate.toISOString(),
            subscription_id: paymentData?.id
          });

        if (subscriptionError) {
          throw subscriptionError;
        }

        // Success
        setSuccess(true);
        toast({
          title: "Payment Successful",
          description: "Your subscription is now active!",
        });
      } catch (error) {
        console.error("Error processing payment:", error);
        toast({
          title: "Error",
          description: "There was a problem processing your payment. Please contact support.",
          variant: "destructive",
        });
        setSuccess(false);
      } finally {
        setProcessing(false);
      }
    };

    processPayment();
  }, [user, location.search, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {processing ? "Processing Payment" : success ? "Payment Successful" : "Payment Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
          {processing ? (
            <Loader2 className="h-16 w-16 text-amber-600 animate-spin" />
          ) : success ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500" />
          )}
          
          <p className="text-center text-gray-600 mt-4">
            {processing
              ? "Please wait while we process your payment..."
              : success
              ? "Your subscription has been activated successfully! You now have unlimited recipe generations."
              : "We couldn't process your payment. Please try again or contact support."}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => navigate("/")} 
            disabled={processing}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
