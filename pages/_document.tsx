import React from "react";
import { Head, Html, Main, NextScript } from "next/document";
import { GetStaticProps } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";

const Document = () => {
  return (
    <Html>
      <Head />
      <body className="modern-design subheader-enabled">
        <Main />
        <div id="portal-root" />
        <div id="portal-notification" />
        <NextScript />
      </body>
      <GoogleAnalytics gaId="G-Y9MQYJP6KR" />
    </Html>
  );
};

export default Document;
