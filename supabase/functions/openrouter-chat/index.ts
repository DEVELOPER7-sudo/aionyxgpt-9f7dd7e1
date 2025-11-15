import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Restrict CORS to authorized origins
const ALLOWED_ORIGINS = [
  'https://onyxgpt.lovable.app',
  'http://localhost:5173', // For development
  'http://localhost:3000',  // For development
];

const corsHeaders = (origin?: string | null): Record<string, string> => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin || '') ? (origin || '') : '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

// Rate limiting: map of user_id -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 50; // 50 requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // per hour

const checkRateLimit = (userId: string): { allowed: boolean; remaining: number; resetTime: number } => {
  const now = Date.now();
  let userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    userLimit = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(userId, userLimit);
  }

  const allowed = userLimit.count < RATE_LIMIT_REQUESTS;
  if (allowed) {
    userLimit.count++;
  }

  return {
    allowed,
    remaining: Math.max(0, RATE_LIMIT_REQUESTS - userLimit.count),
    resetTime: userLimit.resetTime,
  };
};

const verifyJWT = async (token: string): Promise<{ sub: string } | null> => {
  try {
    // Verify JWT with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials');
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Use Supabase's JWT verification
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return null;
    }

    return { sub: data.user.id };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers,
      status: 204 
    });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...headers, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userPayload = await verifyJWT(token);

    if (!userPayload) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 401,
          headers: { ...headers, 'Content-Type': 'application/json' },
        }
      );
    }

    // Reject anonymous users
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { data: userData } = await supabase.auth.getUser(token);
    
    if (!userData.user || userData.user.role === 'anon') {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please sign in.' }),
        {
          status: 401,
          headers: { ...headers, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(userPayload.sub);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Maximum 50 requests per hour.',
          resetTime: rateLimit.resetTime,
        }),
        {
          status: 429,
          headers: { 
            ...headers, 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    const { messages, model, temperature, max_tokens } = await req.json();
    
    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Validate message content and roles
    for (const msg of messages) {
      if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid message role' }),
          {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          }
        );
      }
      if (typeof msg.content !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid message content' }),
          {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          }
        );
      }
      if (msg.content.length > 10000) {
        return new Response(
          JSON.stringify({ error: 'Message too long (max 10,000 characters)' }),
          {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    // Use OpenRouter API key from server environment
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    console.log('OpenRouter request:', { 
      model, 
      messageCount: messages.length,
      userId: userPayload.sub,
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://onyxgpt.lovable.app',
        'X-Title': 'OnyxGPT',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      
      // Return specific error messages for rate limits and credits
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait before trying again.' }),
          {
            status: 429,
            headers: { ...headers, 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. OpenRouter credits exhausted.' }),
          {
            status: 402,
            headers: { ...headers, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    // Return the streaming response with rate limit headers
    return new Response(response.body, {
      headers: {
        ...headers,
        'Content-Type': 'text/event-stream',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetTime),
      },
    });
  } catch (error) {
    console.error('Error in openrouter-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 
          ...headers, 
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
