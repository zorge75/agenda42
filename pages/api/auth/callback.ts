export default async function handler(req: any, res: any) {
  const { code } = req.query;

  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const requestBody = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.CLIENT_ID as string,
      client_secret: process.env.API_TOKEN as string,
      code: code,
      redirect_uri: process.env.API_URI as string,
    });

    const response = await fetch("https://api.intra.42.fr/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: requestBody.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const { access_token, refresh_token, expires_in } = await response.json();
    const expiresAt = Date.now() + expires_in * 1000;

    // Set cookies with consistent naming and clear old 'token'
    res.setHeader("Set-Cookie", [
      `token=${access_token}; Path=/; HttpOnly; SameSite=Strict`, // Match getServerSideProps
      `refresh_token=${refresh_token || ""}; Path=/; HttpOnly; SameSite=Strict`,
      `expires_at=${expiresAt}; Path=/; HttpOnly; SameSite=Strict`,
      `access_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`, // Clear old 'access_token'
    ]);

    console.log("Cookies set:", { token: access_token, expiresAt });
    res.redirect(302, "/");
  } catch (error: any) {
    console.error("Callback error:", error.message);
    res
      .status(500)
      .json({ error: "Authentication failed", details: error.message });
  }
}
