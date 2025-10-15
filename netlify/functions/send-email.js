exports.handler = async (event, context) => {
  // Get Resend API key from environment variable
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Resend API key not configured" }),
    };
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://duowork.tech",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST" || event.httpMethod !== "OPTIONS") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
      headers: {
        "Access-Control-Allow-Origin": "https://duowork.tech",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  try {
    // Parse the request body
    const { name, email, subject, survey, message } = JSON.parse(event.body);

    // Validate required fields
    if (!email || !subject || !message) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "https://duowork.tech",
        },
        body: JSON.stringify({
          error: "Missing required fields: email, subject, message",
        }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid email address" }),
      };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
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
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://duowork.tech",
      },
      body: JSON.stringify({
        success: true,
        message: "Email sent successfully!",
        id: data.id,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://duowork.tech",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};
