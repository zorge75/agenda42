import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const response = await axios.post(
            'https://api.intra.42.fr/oauth/token',
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: 'u-s4t2ud-17f322a0de33ed45f75fcb497c3418b8fa54a46174ffe1a7b7e3ec46b5bad3f4',
                client_secret: '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',
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
        );

        const { access_token } = response.data;
        console.log('Client Credentials Token:', access_token);

        res.status(200).json({ token: access_token });
    } catch (error: any) {
        const errorDetails = error.response
            ? { status: error.response.status, data: error.response.data }
            : { message: error.message };
        console.error('Token request failed:', errorDetails);
        res.status(500).json({ error: 'Token request failed', details: errorDetails });
    }
}