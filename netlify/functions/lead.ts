import { z } from "zod";

const leadSchema = z.object({
  canal: z.enum(["whatsapp", "correo"]),
  seccion_origen: z.string().min(1).max(50),
  servicio_interes: z.string().min(1).max(100),
  pagina: z.string().min(1).max(100),
  timestamp: z.string().datetime(),
  honeypot: z.string().max(0), // must be empty
});

export const config = {
  path: "/api/lead"
};

export default async function handler(req: Request) {
  // CORS check (only allow requests from the same origin or a predefined list)
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  
  // Basic origin validation - in production you might want to strictly check against your Netlify domain
  if (origin && host && !origin.includes(host) && process.env.NODE_ENV === "production") {
    console.error(`[CORS] Rejected request from origin: ${origin}`);
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { 
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Basic rate limiting: check IP
  const clientIp = req.headers.get("x-nf-client-connection-ip") || "unknown";
  // NOTE: This is a placeholder for rate limiting logic. In a stateless function,
  // true rate limiting requires external storage (Redis, etc.) or Netlify Rate Limiting.
  console.log(`[REQUEST] Lead submission attempt from IP: ${clientIp}`);

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    
    // Validate schema
    const result = leadSchema.safeParse(body);
    
    if (!result.success) {
      console.error("[VALIDATION ERROR]", result.error.flatten());
      return new Response(JSON.stringify({ ok: false, error: "Bad request" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { honeypot, ...validData } = result.data;

    // Honeypot check: If filled out, it's a bot. Silently accept.
    if (honeypot !== "") {
      console.log(`[BOT DETECTED] Honeypot filled by IP: ${clientIp}`);
      return new Response(JSON.stringify({ ok: true }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      console.error("[CONFIG ERROR] N8N_WEBHOOK_URL is missing");
      // Don't leak this info to the client
      return new Response(JSON.stringify({ ok: false }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Forward to n8n with timeout and 1 retry
    let n8nSuccess = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(n8nUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validData),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (response.ok) {
          console.log(`[SUCCESS] Lead forwarded to n8n on attempt ${attempt}`);
          n8nSuccess = true;
          break;
        } else {
          console.error(`[N8N ERROR] Received status ${response.status} on attempt ${attempt}`);
        }
      } catch (error) {
        console.error(`[N8N FETCH ERROR] Attempt ${attempt} failed:`, error instanceof Error ? error.message : "Unknown error");
      }
    }

    if (!n8nSuccess) {
      console.error("[CRITICAL] Failed to forward lead to n8n after 2 attempts");
      // Return 202 Accepted to not block the user experience, but log the failure
      return new Response(JSON.stringify({ ok: true, note: "Accepted but forwarding delayed" }), { 
        status: 202,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ ok: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[SERVER ERROR]", error);
    return new Response(JSON.stringify({ ok: false }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
