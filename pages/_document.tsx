import React from "react";
import { Head, Html, Main, NextScript } from "next/document";

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
    </Html>
  );
};

export default Document;
