import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://sptquxjgnjywspcngtdu.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "sb_publishable_2lqsEaA6yLAK3qcrbwVgiA_UF6979tV";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { headers: { 'Accept': 'application/json' } }
});

// Nội dung HTML cho trang sạch
const cleanPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cicihere - Clean Landing Page</title>
  <style>
    body { background-color: #f4f4f4; font-family: Arial, sans-serif; text-align: center; padding: 50px; }
    .container { background-color: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; }
    h1 { color: #333; }
    p { color: #666; }
    .btn { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Cicihere</h1>
    <p>This is a clean landing page for bots and crawlers.</p>
    <a href="https://cicihere.com/" class="btn">Visit Cicihere</a>
  </div>
</body>
</html>
`;

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(segment => segment);
    const shortcode = pathSegments[pathSegments.length - 1] || "";
    console.log("Request URL:", req.url);
    console.log("Path segments:", pathSegments);
    console.log("Extracted shortcode:", shortcode);

    if (!shortcode) {
      console.error("No shortcode provided");
      return new Response(JSON.stringify({ error: "Không cung cấp shortcode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("links")
      .select("id, destination_url, clean_url")
      .eq("shortcode", shortcode)
      .single();

    if (error || !data) {
      console.error("Error fetching link:", error?.message || "Không có dữ liệu", "Shortcode:", shortcode);
      return new Response(JSON.stringify({ error: "Link không tìm thấy", shortcode }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const isBot = /bot|crawler|spider|googlebot|bingbot|facebookexternalhit|twitterbot|applebot|whatsapp|telegram/i.test(userAgent.toLowerCase());
    console.log("Headers:", Object.fromEntries(req.headers));
    console.log("User-Agent:", userAgent, "IsBot:", isBot);

    const clickData = {
      link_id: data.id,
      ip: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: userAgent,
      is_bot: isBot,
      clicked_at: new Date().toISOString()
    };
    console.log("Attempting to save click:", clickData);

    const { data: insertedClick, error: clickError } = await supabase
      .from("clicks")
      .insert([clickData])
      .select();

    if (clickError) {
      console.error("Error saving click:", clickError.message, "Details:", clickError);
      return new Response(JSON.stringify({ error: "Lỗi lưu click", details: clickError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log("Click saved:", insertedClick);

    if (isBot) {
      // Trả về trang sạch cho bot
      return new Response(cleanPageHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "Referrer-Policy": "origin"
        },
      });
    }

    // Redirect cho người thật
    const redirectUrl = data.destination_url;
    console.log("Redirecting to:", redirectUrl);

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        "Referrer-Policy": "no-referrer"
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
    console.error("Unexpected error:", errorMessage, "Details:", err);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ", details: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});