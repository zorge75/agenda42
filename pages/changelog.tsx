import React from "react";
import dayjs from "dayjs";
import Head from "next/head";
import PageWrapper from "../layout/PageWrapper/PageWrapper";
import Page from "../layout/Page/Page";
import changelogData from '../changelog.json';

const Changelog = () => {
  return (
    <PageWrapper>
      <Head>
        <title>Changelog</title>
      </Head>
      <Page>
        <div className="row d-flex align-items-center h-100">
          <div className="col-12 d-flex flex-column justify-content-center align-items-center">
              <div className="container mt-4">
                  <h1>Changelog</h1>
                  <table className="table table-striped">
                      <thead>
                          <tr>
                              <th scope="col">Version</th>
                              <th scope="col">Date</th>
                              <th scope="col">Changes</th>
                          </tr>
                      </thead>
                      <tbody>
                          {changelogData.map((entry, index) => (
                              <tr key={index}>
                                  <td>{entry.version}</td>
                                  <td>{dayjs(entry.date).format('D MMMM YYYY')}</td>
                                  <td>
                                      <ul className="list-unstyled">
                                          {entry.changes.map((change, i) => (
                                              <li key={i}>{change}</li>
                                          ))}
                                      </ul>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
        </div>
      </Page>
    </PageWrapper>
  );
};

export default Changelog;
