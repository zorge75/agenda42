import React from "react";
import classNames from "classnames";
import Footer from "../../../layout/Footer/Footer";
import useDarkMode from "../../../hooks/useDarkMode";
import packageJson from '../../../package.json';
import Tooltips from "../../../components/bootstrap/Tooltips";
import RandomCats from "../../../components/RandomCats";
import Link from "next/link";

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
            <span className="fw-light" >
              <Tooltips title="Submit suggestions and bug reports in the issues."
                placement='top'>
                <a className="text-decoration-none text-reset"
                  href="https://githeb.com/42paris">GitHub</a>
              </Tooltips>
              <Link className="m-3 text-decoration-none text-reset" href="/changelog">
                Changelog
              </Link>
              version {packageJson.version}</span>
          </div>
        </div>
      </div>
    </Footer>
  );
};

export default DefaultFooter;
