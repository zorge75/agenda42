import React, { useEffect } from "react";
import Head from "next/head";
import PageWrapper from "../layout/PageWrapper/PageWrapper";
import { demoPagesMenu } from "../menu";
import Page from "../layout/Page/Page";
import Spinner from "../components/bootstrap/Spinner";
import { GetStaticProps } from "next/types";
import { useRouter } from "next/router";

const Page404 = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    });

    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <PageWrapper>
      <Head>
        <title>{demoPagesMenu.page404.text}</title>
      </Head>
      <Page>
        <div className="row d-flex align-items-center h-100">
          <div className="col-12 d-flex flex-column justify-content-center align-items-center">
            <Spinner color="dark" >
              Loading...
            </Spinner>
          </div>
        </div>
      </Page>
    </PageWrapper>
  );
};

// export const getStaticProps: GetStaticProps = async ({ locale }) => ({
//   redirect: { destination: '/', permanent: false },
// });

export default Page404;
