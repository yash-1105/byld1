import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get API key from Supabase Secrets
    const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_CLOUD_API_KEY is not set in edge function secrets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean up base64 string if it contains data URI scheme
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    // Call Google Cloud Vision API
    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Data,
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
              },
            ],
          },
        ],
      }),
    });

    if (!visionResponse.ok) {
      const errorData = await visionResponse.text();
      console.error('Vision API Error:', errorData);
      throw new Error(`Google Vision API responded with ${visionResponse.status}`);
    }

    const data = await visionResponse.json();
    
    // Extract the full text
    const textAnnotation = data.responses?.[0]?.fullTextAnnotation;
    const rawText = textAnnotation ? textAnnotation.text : '';

    return new Response(JSON.stringify({ text: rawText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing receipt:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
