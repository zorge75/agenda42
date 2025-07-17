export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    console.error('No code provided');
    return res.status(400).json({ error: 'No code provided' });
  }

  if (req.cookies.token) {
    console.log('Token already exists, redirecting to /');
    return res.redirect(302, '/');
  }

  try {
    const requestBody = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.CLIENT_ID as string,
      client_secret: process.env.API_TOKEN as string,
      code: code,
      redirect_uri: process.env.API_URI as string,
    });

    const response = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: requestBody.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const { access_token, refresh_token, expires_in } = await response.json();
    const expiresAt = Date.now() + expires_in * 1000;

    res.setHeader('Set-Cookie', [
      `token=${access_token}; Path=/; HttpOnly; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production' ? 'true' : 'false'}`,
      `refresh_token=${refresh_token || ''}; Path=/; HttpOnly; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production' ? 'true' : 'false'}`,
      `expires_at=${expiresAt}; Path=/; HttpOnly; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production' ? 'true' : 'false'}`,
      `access_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
    ]);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    console.log('Cookies set:', { token: access_token, expiresAt });
    return res.redirect(302, '/');
  } catch (error) {
    console.error('Callback error:', error.message);
    return res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
}