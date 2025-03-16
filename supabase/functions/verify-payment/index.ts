
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req: Request) => {
  try {
    // Parse the request body
    const { paymentId, userId } = await req.json();
    
    // Validate required parameters
    if (!paymentId || !userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Missing required parameters" 
      }), { 
        headers: { "Content-Type": "application/json" }, 
        status: 400 
      });
    }

    // For a real implementation, you would make a request to your payment provider API
    // to verify the payment status using the paymentId
    // For example: const paymentVerification = await fetch('https://pay.techrealm.pk/api/verify-payment/' + paymentId)
    
    // For this demo, we'll assume the payment is successful based on the paymentId being provided
    const paymentSuccess = true;
    
    if (paymentSuccess) {
      // Create or update subscription in the database
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription
      
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          is_active: true,
          payment_reference: paymentId,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          amount: 14 // $14
        });
      
      if (subscriptionError) {
        console.error("Error creating subscription:", subscriptionError);
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Error activating subscription",
          error: subscriptionError
        }), { 
          headers: { "Content-Type": "application/json" },
          status: 500 
        });
      }
      
      // Also update the user_subscriptions record
      const { error: userSubError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          is_subscribed: true,
          payment_reference: paymentId,
          subscription_start_date: now.toISOString(),
          subscription_end_date: expiresAt.toISOString(),
          updated_at: now.toISOString()
        });
      
      if (userSubError) {
        console.error("Error updating user subscription record:", userSubError);
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Subscription activated successfully",
        expiresAt: expiresAt.toISOString()
      }), { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment verification failed" 
      }), { 
        headers: { "Content-Type": "application/json" },
        status: 400 
      });
    }
  } catch (error) {
    console.error("Error processing payment verification:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Server error",
      error: error.message
    }), { 
      headers: { "Content-Type": "application/json" }, 
      status: 500 
    });
  }
});
