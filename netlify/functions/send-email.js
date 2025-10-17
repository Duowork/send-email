exports.handler = async (event, context) => {
  // Get Resend API key from environment variable
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  // Allow multiple origins - we'll echo back a single allowed origin
  const allowedOrigins = [
    "https://duowork.tech",
    "https://www.duowork.tech",
    "http://localhost:4322",
  ];

  // Helper to build CORS headers for a given origin (or null if not allowed)
  const buildCorsHeaders = (origin) => {
    if (!origin || !allowedOrigins.includes(origin)) return null;
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Cache-Control, Authorization",
    };
  };

  if (!RESEND_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Resend API key not configured" }),
    };
  }

  if (event.httpMethod === "OPTIONS") {
    const origin =
      event.headers && (event.headers.origin || event.headers.Origin);
    const cors = buildCorsHeaders(origin);
    return {
      statusCode: 200,
      headers: cors || { "Access-Control-Allow-Origin": "" },
      body: "",
    };
  }

  // Only allow POST and OPTION requests
  if (event.httpMethod !== "POST" && event.httpMethod !== "OPTIONS") {
    const origin =
      event.headers && (event.headers.origin || event.headers.Origin);
    const cors = buildCorsHeaders(origin);

    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
      headers: cors || { "Access-Control-Allow-Origin": "" },
    };
  }

  try {
    // Parse the request body
    const { name, email, subject, survey, message } = JSON.parse(event.body);

    // Validate required fields
    if (!email || !subject || !message) {
      const origin =
        event.headers && (event.headers.origin || event.headers.Origin);
      const cors = buildCorsHeaders(origin);
      return {
        statusCode: 400,
        headers: cors || { "Access-Control-Allow-Origin": "" },
        body: JSON.stringify({
          error: "Missing required fields: email, subject, message",
        }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const origin =
        event.headers && (event.headers.origin || event.headers.Origin);
      const cors = buildCorsHeaders(origin);
      return {
        statusCode: 400,
        headers: cors || { "Access-Control-Allow-Origin": "" },
        body: JSON.stringify({ error: "Invalid email address" }),
      };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        // Note: these CORS response headers are for browsers and should be
        // set on the Netlify function responses. Downstream requests to the
        // Resend API don't need them, but including them here is harmless.
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify({
        from: "noreply@duowork.tech",
        to: ["reach@duowork.tech"],
        reply_to: email,
        subject: `Contact Form: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <p style="color: #666; line-height: 1.6;">${message}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              Sender: ${name} | ${email}
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();

    // Check if Resend request was successful
    if (!response.ok) {
      console.error("Resend API error:", data);

      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "Failed to send email",
          details: data.message || "Unknown error",
        }),
      };
    }

    // Return success response
    const origin =
      event.headers && (event.headers.origin || event.headers.Origin);
    const cors = buildCorsHeaders(origin);
    return {
      statusCode: 200,
      headers: cors || { "Access-Control-Allow-Origin": "" },
      body: JSON.stringify({
        success: true,
        message: "Email sent successfully!",
        id: data.id,
      }),
    };
  } catch (error) {
    const origin =
      event.headers && (event.headers.origin || event.headers.Origin);
    const cors = buildCorsHeaders(origin);
    return {
      statusCode: 500,
      headers: cors || { "Access-Control-Allow-Origin": "" },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};
