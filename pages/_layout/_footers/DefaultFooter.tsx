import React from "react";
import classNames from "classnames";
import Footer from "../../../layout/Footer/Footer";
import useDarkMode from "../../../hooks/useDarkMode";
import packageJson from '../../../package.json';
import Tooltips from "../../../components/bootstrap/Tooltips";
import RandomCats from "../../../components/RandomCats";
import Link from "next/link";
import SvgCustomGithub from "../../../components/icon/svg-icons/CustomGithub";

const DefaultFooter = () => {
  const { darkModeStatus } = useDarkMode();

  return (
    <Footer>
      <div className="container-fluid">

        <div className="row">
          <RandomCats />
          <div className="col m-auto">
            <Link
              href="https://42.fr/"
              className={classNames("text-decoration-none", {
                "link-dark": !darkModeStatus,
                "link-light": darkModeStatus,
              })}
            >
              <small className="fw-bold">École 42</small>
            </Link>
          </div>
          <div className="col-auto">
            <div className="d-flex align-items-center" >
              <Tooltips title="Submit suggestions and bug reports in the issues."
                placement='top'>
                <div className="m-3 mb-0 mt-0">
                  <Link className="text-decoration-none text-reset" style={{zIndex: 1000}}
                    href="https://githeb.com/42paris">
                    <SvgCustomGithub className="m-1 mt-0" />
                    GitHub
                  </Link>
                </div>
              </Tooltips>
              {/* <Link className="m-5 mb-0 mt-0 text-decoration-none text-reset text-bold" href="/changelog">
                Changelog
              </Link> */}
              <span>version {packageJson.version}</span>
            </div>
          </div>
        </div>
      </div>
    </Footer>
  );
};

export default DefaultFooter;
