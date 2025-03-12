import React from "react";
import classNames from "classnames";
import Footer from "../../../layout/Footer/Footer";
import useDarkMode from "../../../hooks/useDarkMode";

const DefaultFooter = () => {
  const { darkModeStatus } = useDarkMode();

  return (
    <Footer>
      <div className="container-fluid">
        <div className="row">
          <div className="col">
            <a
              href="https://42.fr/"
              className={classNames("text-decoration-none", {
                "link-dark": !darkModeStatus,
                "link-light": darkModeStatus,
              })}
            >
              <small className="fw-bold">École 42 Paris</small>
            </a>
          </div>
          <div className="col-auto">
            <span className="fw-light">team@agenda42.fr | 2025</span>
          </div>
        </div>
      </div>
    </Footer>
  );
};

export default DefaultFooter;
