export default async function handler(req: any, res: any) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    // console.log("code", code);

    try {
        const requestBody = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.CLIENT_ID as string,
            client_secret: process.env.API_TOKEN as string,
            code: code,
            redirect_uri: process.env.API_URI as string,
        });
        // console.log('Token exchange request body:', requestBody.toString());

        const response = await fetch('https://api.intra.42.fr/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: requestBody.toString(),
        });

        const text = await response.text(); // Log raw response for debugging
        // console.log('Token response status:', response.status);
        // console.log('Token response body:', text);

        const json = JSON.parse(text); // Parse after logging
        if (!response.ok) {
            throw new Error(json.error || 'Token exchange failed');
        }

        const { access_token, refresh_token, expires_in } = json;

        // Set cookies with token details
        res.setHeader('Set-Cookie', [
            `access_token=${access_token}; Path=/; HttpOnly; SameSite=Strict`,
            `refresh_token=${refresh_token || ''}; Path=/; HttpOnly; SameSite=Strict`,
            `expires_at=${Date.now() + expires_in * 1000}; Path=/; HttpOnly; SameSite=Strict`, // Store expiration time in milliseconds
        ]);

        res.redirect(302, '/');

    } catch (error: any) {
        // Enhanced error logging
        const errorDetails = error.response
            ? { status: error.response.status, data: error.response.data }
            : { message: error.message };
        console.error('Token exchange failed:', errorDetails);
        res.status(500).json({ error: 'Authentication failed', details: errorDetails });
    }
}
