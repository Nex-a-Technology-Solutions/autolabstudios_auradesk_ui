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

import Register from './Register';

import AcceptInvitation from "./AcceptInvitation.jsx";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    CreateTicket: CreateTicket,
    
    TicketDetail: TicketDetail,
    
    Tickets: Tickets,
    
    Messages: Messages,
    
    Admin: Admin,
    
    DataStructure: DataStructure,
    
    Integrations: Integrations,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
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