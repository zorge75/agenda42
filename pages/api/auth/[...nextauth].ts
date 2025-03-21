// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";

export default NextAuth({
    debug: true,
    providers: [
        {
            id: "42",
            name: "42",
            type: "oauth",
            authorization: {
                url: "https://api.intra.42.fr/oauth/authorize",
                params: {
                    client_id: process.env.CLIENT_ID,
                    redirect_uri: process.env.API_URI,
                    response_type: "code",
                    scope: "public projects profile",
                },
            },
            token: {
                url: "https://api.intra.42.fr/oauth/token",
                async request(context) {
                    const response = await fetch("https://api.intra.42.fr/oauth/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            grant_type: "authorization_code",
                            code: context.params.code,
                            client_id: process.env.CLIENT_ID,
                            client_secret: process.env.API_TOKEN,
                            redirect_uri: process.env.API_URI,
                        }).toString(),
                    });
                    const tokens = await response.json();
                    if (!response.ok) {
                        console.error("Token response error:", tokens);
                        throw new Error(tokens.error_description || "Token exchange failed");
                    }
                    const expiresAt = Date.now() + (tokens.expires_in * 1000);
                    const refresh = tokens.refresh_token || null;
                    return { tokens: { ...tokens, expiresAt, refresh } };
                },
            },
            userinfo: "https://api.intra.42.fr/v2/me",
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.API_TOKEN,
            profile(profile) {
                return {
                    id: profile.id,
                    login: profile.login,
                    email: profile.email,
                    image: profile.image.versions.medium,
                };
            },
        },
    ],
    callbacks: {
        async jwt({ token, account, user }) {
            // Initial sign-in
            if (account && user) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token || "";
                token.expiresAt = Date.now() + (account.expires_in * 1000);
                return token;
            }

            // Check if token is still valid
            if (Date.now() < token.expiresAt) {
                return token;
            }

            // Token expired, attempt refresh
            console.log("Token expired, attempting refresh");
            try {
                const response = await fetch("https://api.intra.42.fr/oauth/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        grant_type: "refresh_token",
                        refresh_token: token.refreshToken,
                        client_id: process.env.CLIENT_ID,
                        client_secret: process.env.API_TOKEN,
                    }).toString(),
                });
                const refreshedTokens = await response.json();

                if (!response.ok) {
                    console.error("Refresh token error:", refreshedTokens);
                    throw new Error(refreshedTokens.error_description || "Refresh failed");
                }

                console.log("Token refreshed successfully:", refreshedTokens);
                return {
                    ...token,
                    accessToken: refreshedTokens.access_token,
                    refreshToken: refreshedTokens.refresh_token || token.refreshToken, // Use new refresh token if provided
                    expiresAt: Date.now() + (refreshedTokens.expires_in * 1000),
                };
            } catch (error) {
                console.error("Token refresh failed:", error);
                return { ...token, accessToken: null }; // Invalidate token on failure
            }
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.expiresAt = token.expiresAt;
            session.refreshToken = token.refreshToken;
            return session;
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `https://aron.agenda42.fr/`;
            return "https://aron.agenda42.fr/";
        },
    },
    events: {
        async signIn({ user, account, res }) {
            const accessToken = account.access_token;
            const refreshToken = account.refresh_token || "";
            const expiresAt = Date.now() + (account.expires_in * 1000);

            res.setHeader("Set-Cookie", [
                `token=${accessToken}; Path=/; HttpOnly; SameSite=Strict`,
                `refresh_token=${refreshToken}; Path=/; HttpOnly; SameSite=Strict`,
                `expires_at=${expiresAt}; Path=/; HttpOnly; SameSite=Strict`,
                `access_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
            ]);
        },
    },
    pages: { signIn: "/login" },
});