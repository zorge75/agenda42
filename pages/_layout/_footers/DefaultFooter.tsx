import React from "react";
import classNames from "classnames";
import Footer from "../../../layout/Footer/Footer";
import useDarkMode from "../../../hooks/useDarkMode";
import packageJson from '../../../package.json';
import Tooltips from "../../../components/bootstrap/Tooltips";
import RandomCats from "../../../components/RandomCats";

const DefaultFooter = () => {
  const { darkModeStatus } = useDarkMode();

  return (
    <Footer>
      <div className="container-fluid">
        
        <div className="row">
          <RandomCats/>
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
          <Tooltips title='Send your suggestions, questions, and bug reports here.' placement='top'>
            <div className="col-auto">
              <span className="fw-light">team@agenda42.fr | 2025 | version {packageJson.version}</span>
            </div>
          </Tooltips>
        </div>
      </div>
    </Footer>
  );
};

export default DefaultFooter;
