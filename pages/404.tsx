import React from "react";
import Head from "next/head";
import { GetStaticProps } from "next";
import PageWrapper from "../layout/PageWrapper/PageWrapper";
import { demoPagesMenu } from "../menu";
import Page from "../layout/Page/Page";
import Button from "../components/bootstrap/Button";

const Page404 = () => {
  return (
    <PageWrapper>
      <Head>
        <title>{demoPagesMenu.page404.text}</title>
      </Head>
      <Page>
        <div className="row d-flex align-items-center h-100">
          <div className="col-12 d-flex flex-column justify-content-center align-items-center">
            <div
              className="text-primary fw-bold"
              style={{ fontSize: "calc(3rem + 3vw)" }}
            >
              200
            </div>
            <div
              className="text-dark fw-bold"
              style={{ fontSize: "calc(1.5rem + 1.5vw)" }}
            >
             Authentification is success
            </div>
          </div>
          <div className="col-12 d-flex flex-column justify-content-center align-items-center">
            <Button
              className="px-5 py-3"
              color="primary"
              isLight
              icon="HolidayVillage"
              tag="a"
              href="/"
            >
              Go to agenda
            </Button>
          </div>
          <div className="col-12 d-flex align-items-baseline justify-content-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={""} alt="Humans" style={{ height: "50vh" }} />
          </div>
        </div>
      </Page>
    </PageWrapper>
  );
};

// export const getStaticProps: GetStaticProps = async ({ locale }) => ({
//   // redirect: { destination: '/', permanent: false },
// });

export default Page404;
