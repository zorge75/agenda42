import React, { useEffect } from "react";
import Head from "next/head";
import { signIn, useSession } from "next-auth/react";
import PageWrapper from "../layout/PageWrapper/PageWrapper";
import Button from "../components/bootstrap/Button";
import Page from "../layout/Page/Page";
import { useRouter } from "next/router";
import Icon from "../components/icon/Icon";

const SignIn = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { error } = router.query; // Capture error from NextAuth

    // Redirect if already signed in
    useEffect(() => {
        console.log("session", session, status);
        if (status === "authenticated") {
            router.push("/"); // Redirect to homepage or desired page
        }
    }, []);

    const handleSignIn = () => {
        signIn("42"); // Trigger 42 OAuth flow
    };

    return (
        <PageWrapper>
            <Head>
                <title>Title</title>
            </Head>
            <Page>
                <div className="row d-flex align-items-center h-100">
                    <div className="col-12 d-flex flex-column justify-content-center align-items-center">
                        <Button color="dark" onClick={handleSignIn}>
                            <img
                                src="https://profile.intra.42.fr/assets/42_logo-7dfc9110a5319a308863b96bda33cea995046d1731cebb735e41b16255106c12.svg"
                                alt="42 Logo"
                                style={{ width: "20px", marginRight: 10, verticalAlign: "middle" }}
                            />
                            Sign in</Button>
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default SignIn;
