
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the payment data from the request
    const { paymentId, userId } = await req.json()

    if (!paymentId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Payment ID and User ID are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Verifying payment ${paymentId} for user ${userId}`)

    // Verify the payment with the payment provider API
    const response = await fetch(`https://pay.techrealm.pk/api/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any required auth headers for the payment API
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to verify payment: ${response.statusText}`)
    }

    const paymentData = await response.json()
    console.log('Payment verification response:', paymentData)

    // Check if payment is successful
    const isSuccess = paymentData.success === true

    if (!isSuccess) {
      return new Response(
        JSON.stringify({ success: false, message: 'Payment verification failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Set expiration date to 30 days from now
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)

    // Record the payment in the database
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: paymentData.amount_cents / 100,
        currency: paymentData.currency,
        payment_id: paymentId,
        success: true,
        transaction_data: paymentData
      })
      .select('id')
      .single()

    if (paymentError) {
      throw paymentError
    }

    // Update or create subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        status: 'active',
        payment_id: paymentId,
        expires_at: expiryDate.toISOString()
      })
      .select()
      .single()

    if (subscriptionError) {
      throw subscriptionError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment verified and subscription activated',
        subscription: subscription 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
