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
import ForgotPassword from "../components/auth/forgotPassword.jsx";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';

// Import the route protection components
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';

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

function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Protected Routes */}
                <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/CreateTicket" element={<ProtectedRoute><CreateTicket /></ProtectedRoute>} />
                <Route path="/TicketDetail" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
                <Route path="/Tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
                <Route path="/Messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/Admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/DataStructure" element={<ProtectedRoute><DataStructure /></ProtectedRoute>} />
                <Route path="/Integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />

                {/* Public Routes */}
                <Route path="/Login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/Register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                
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