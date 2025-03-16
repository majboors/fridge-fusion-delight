
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, userId, fallbackKey } = await req.json();
    
    // Validate required parameters
    if (!paymentId || !userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Missing required parameters" 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 400 
      });
    }

    // Verify fallback key (simple security measure)
    const expectedKey = Deno.env.get("PAYMENT_FALLBACK_KEY");
    if (fallbackKey !== expectedKey) {
      console.error("Invalid fallback key provided");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Unauthorized access" 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 401 
      });
    }

    console.log(`Processing fallback payment for userId: ${userId} with paymentId: ${paymentId}`);
    
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
        amount: 14, // $14
        status: 'active'
      });
    
    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError);
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Error activating subscription",
        error: subscriptionError
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    
    // Record the payment transaction
    await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        transaction_id: paymentId,
        amount: 14,
        currency: 'USD',
        status: 'success',
        payment_reference: paymentId,
        payment_data: { method: 'fallback' }
      });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Subscription activated successfully via fallback",
      expiresAt: expiresAt.toISOString()
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    });
  } catch (error) {
    console.error("Error processing payment fallback:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Server error",
      error: error.message
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 500 
    });
  }
});
