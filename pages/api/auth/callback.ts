// import serialize from 'serialize';

export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    // console.log("code", code);

    try {
        const requestBody = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: 'u-s4t2ud-17f322a0de33ed45f75fcb497c3418b8fa54a46174ffe1a7b7e3ec46b5bad3f4',
            client_secret: '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',
            code: code,
            redirect_uri: 'https://agenda42.fr/api/auth/callback',
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

        const { access_token } = json;

        res.setHeader('Set-Cookie', `token=${access_token}; Path=/; HttpOnly; SameSite=Strict`);
        res.redirect(302, '/crm/dashboard');

    } catch (error) {
        // Enhanced error logging
        const errorDetails = error.response
            ? { status: error.response.status, data: error.response.data }
            : { message: error.message };
        console.error('Token exchange failed:', errorDetails);
        res.status(500).json({ error: 'Authentication failed', details: errorDetails });
    }
}