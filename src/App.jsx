// src/App.jsx

import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import './App.css';
import { Toaster, toast } from 'react-hot-toast';

// Page Imports
import MainPage from "./Page/MainPage";
import Home from "./Page/Home";
import Login from "./Page/auth/Login";
import OTP from "./Page/auth/OTP";
import Logout from "./Page/auth/Logout";
import ProcessForm from "./Page/auth/ProcessForm";
import PunctureRequestForm from "./Page/PunctureRequestForm";
import ProfilePage from "./Page/ProfilePage";
import MechanicFound from './Page/MechanicFound';
import RequestLayout from './Page/RequestLayout';
import FindingMechanic from './Page/FindingMechanic';
import NearbyMechanics from './Page/NearbyMechanics';
import MechanicRegistration from './Page/MechanicRegistration';
import MechanicList from './Page/MechanicList';
import MechanicDetail from './Page/MechanicDetail';
import RCInfo from './Page/RCInfo';
import VehicleDashboard from './Page/Dashboard/VehicleDashboard';
import VehicleDetails from './Page/Dashboard/VehicleDetails';
import Protected from './ProtectedRoute';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';

const GlobalSocketHandler = () => {
  const { lastMessage } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!lastMessage) return;

    const jobFinished = lastMessage.type === 'job_completed' || lastMessage.type === 'job_cancelled' || lastMessage.type === 'job_cancelled_notification';
    const noMechanicFound = lastMessage.type === 'no_mechanic_found';

    if (jobFinished || noMechanicFound) {
      console.log(`GLOBAL HANDLER: Job event type "${lastMessage.type}". Clearing active job from localStorage.`);

      // Show appropriate toast message
      if (noMechanicFound) {
        toast.error(lastMessage.message || 'Could not find an available mechanic. Showing nearby alternatives.');
      } else {
        toast.success(lastMessage.message || 'The request has been resolved.');
      }

      const isOnJobRelatedPage = location.pathname.startsWith('/finding/') || location.pathname.startsWith('/mechanic-found/');

      if (noMechanicFound) {
        // Navigate immediately for better UX
        navigate('/nearby-mechanics');
      } else if (location.pathname === '/' || isOnJobRelatedPage) {
        const timerId = setTimeout(() => {
          if (location.pathname === '/') {
            window.location.reload();
          } else {
            navigate('/');
          }
        }, 2000);
        return () => clearTimeout(timerId);
      }
    }
  }, [lastMessage, navigate, location.pathname]);

  return null; // This component renders nothing.
};

export default function App() {

  const activeJob = localStorage.getItem("activeJobData")
  return (
    <div className="App transition-all duration-500 ease-in-out bg-white">
      <Toaster position="top-right" reverseOrder={false} />
      {localStorage.getItem("activeJobData") && <a href={`/mechanic-found/${activeJob.request_id}`}> <div className='bg-blue-600 text-white font-bold min-w-screen w-full p-3' >Your active Order {activeJob.request_id}</div></a>}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<OTP />} />
        <Route path="/" element={<Home />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/nearby-mechanics" element={<NearbyMechanics />} />
        <Route path="/vehicle-rc" element={<RCInfo />} />




        {/* All protected routes are nested here */}
        <Route
          path="/*"
          element={
            <Protected>
              <WebSocketProvider>
                <GlobalSocketHandler />
                <Routes>
                  <Route path="/home" element={<MainPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/form" element={<ProcessForm />} />
                  <Route path="/request" element={<PunctureRequestForm />} />
                  {/* Temporary Public Routes for Testing */}
                 
                  <Route path="/ms" element={<MechanicRegistration />} />
                  <Route path="/ms/list" element={<MechanicList />} />
                  <Route path="/ms/view/:id" element={<MechanicDetail />} />
                  <Route path="/ms/edit/:id" element={<MechanicRegistration />} />
                  <Route path="/vehicle-rc" element={<RCInfo />} />
                  <Route path="/dashboard/vehicles" element={<VehicleDashboard />} />
                  <Route path="/dashboard/vehicles/:id" element={<VehicleDetails />} />

                  <Route element={<RequestLayout />}>
                    <Route path="/finding/:request_id" element={<FindingMechanic />} />
                    <Route path="/mechanic-found/:request_id" element={<MechanicFound />} />
                  </Route>
                </Routes>
              </WebSocketProvider>
            </Protected>
          }
        />
      </Routes>
    </div>
  );
}
