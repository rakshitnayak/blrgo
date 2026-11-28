import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import UpcomingNetwork from "./UpcomingNetwork";
import "./styles.css";

const isUpcomingPage = window.location.pathname === "/upcoming" || window.location.pathname === "/upcoming.html";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isUpcomingPage ? <UpcomingNetwork /> : <App />}
    <Analytics />
  </React.StrictMode>,
);
