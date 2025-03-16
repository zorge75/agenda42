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
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Y9MQYJP6KR"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-Y9MQYJP6KR');
</script>
    </Html>
  );
};

export default Document;
