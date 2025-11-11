import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";
import CreateTicket from "./CreateTicket";
import TicketDetail from "./TicketDetail";
import Tickets from "./Tickets";
import Messages from "./Messages";
import Admin from "./Admin";
import DataStructure from "./DataStructure";
import Integrations from "./Integrations";
import Login from "./Login";
import Register from "./Register";
import AcceptInvitation from "./AcceptInvitation.jsx";
import TogglDashboard from "./TogglDashboard";

import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";

// Page registry (used for Layout state and navigation)
const PAGES = {
  Dashboard,
  CreateTicket,
  TicketDetail,
  Tickets,
  Messages,
  Admin,
  DataStructure,
  Integrations,
  Login,
  Register,
  TogglDashboard,
};

function _getCurrentPage(url) {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split("/").pop();
  if (urlLastPart.includes("?")) {
    urlLastPart = urlLastPart.split("?")[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );
  return pageName || "Dashboard";
}

// Inner component for routing inside Layout
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/CreateTicket" element={<CreateTicket />} />
        <Route path="/TicketDetail" element={<TicketDetail />} />
        <Route path="/Tickets" element={<Tickets />} />
        <Route path="/Messages" element={<Messages />} />
        <Route path="/Admin" element={<Admin />} />
        <Route path="/DataStructure" element={<DataStructure />} />
        <Route path="/Integrations" element={<Integrations />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/invitation/:token" element={<AcceptInvitation />} />
        <Route path="/TogglDashboard" element={<TogglDashboard />} />
      </Routes>
    </Layout>
  );
}

export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
