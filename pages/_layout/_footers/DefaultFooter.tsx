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
          <RandomCats />
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
            <span className="fw-light">
              <Tooltips title='Send your suggestions, questions, and bug reports here.'
                placement='top'>
                <a style={{ textDecoration: 'inherit', color: 'inherit' }}
                  href="mailto:team@agenda42.fr">team@agenda42.fr</a>
              </Tooltips>
              &nbsp;| 2025 | version {packageJson.version}</span>
          </div>
        </div>
      </div>
    </Footer>
  );
};

export default DefaultFooter;
