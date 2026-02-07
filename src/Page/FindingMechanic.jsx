import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Bike, Clock, Loader, Phone, Wifi, WifiOff, X, MapPin, Wrench, NotebookPen } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import toast from 'react-hot-toast';
import api from '../utils/api';
import OrderDetailsCard from '../components/OrderDetailsCard';

export default function FindingMechanic() {
  const { request_id } = useParams();
  const navigate = useNavigate();
  const { socket, lastMessage, connectionStatus } = useWebSocket();

  const [searchTime, setSearchTime] = useState(0);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [username, setUsername] = useState('User');

  const timerRef = useRef(null);
  const ConnectionStatus = () => {
    const { connectionStatus } = useWebSocket();
    const neumorphicShadow = "shadow-[5px_5px_10px_#b8bec9,_-5px_-5px_10px_#ffffff]";

    let statusContent;
    switch (connectionStatus) {
      case 'connected':
        statusContent = <div className="flex items-center text-green-600"><Wifi size={16} className="mr-2" /><span>Connected</span></div>;
        break;
      case 'connecting':
        statusContent = <div className="flex items-center text-yellow-600"><Clock size={16} className="mr-2 animate-spin" /><span>Connecting...</span></div>;
        break;
      default:
        statusContent = <div className="flex items-center text-red-600"><WifiOff size={16} className="mr-2" /><span>Disconnected</span></div>;
    }

    return (
      <div className={`fixed bottom-4 right-4 bg-slate-200 px-4 py-2 rounded-full text-sm font-semibold z-20 ${neumorphicShadow}`}>
        {statusContent}
      </div>
    );
  };
  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // WebSocket subscription
  useEffect(() => {
    if (socket && connectionStatus === 'connected') {
      const message = {
        type: 'subscribe_to_request',
        request_id: parseInt(request_id)
      };
      socket.send(JSON.stringify(message));
    }
  }, [socket, connectionStatus, request_id]);

  useEffect(() => {
    console.log("msg", lastMessage);

    // src/Page/FindingMechanic.jsx:54
    if (!lastMessage || lastMessage.job_id?.toString() !== request_id) {
      // Ignore messages not for this request
      return;
    }

    switch (lastMessage.type) {
      case 'mechanic_accepted':
        // Save mechanic details into localStorage
        try {
          const mechanicData = {
            type: lastMessage.type,
            job_id: lastMessage.job_id,
            mechanic_details: lastMessage.mechanic_details,
            request_id, // optionally include the current request_id
            estimated_arrival_time: lastMessage.estimated_arrival_time || null,
            timestamp: new Date().toISOString()
          };

          localStorage.setItem('mechanicAcceptedData', JSON.stringify(mechanicData));

          toast.success(`Mechanic assigned! Arriving in ${lastMessage.estimated_arrival_time || 'a few minutes'} 🚗`);
        } catch (error) {
          console.error('❌ Error saving mechanic data to localStorage:', error);
        }

        // Navigate to MechanicFound page

        navigate(`/mechanic-found/${request_id}/`, {
          state: {
            mechanic: lastMessage.mechanic_details,
            estimatedTime: lastMessage.estimated_arrival_time,
            requestId: request_id
          }
        });
        break;


      // ✨ ADD THIS CASE ✨
      case 'no_mechanic_found':
        toast.error(lastMessage.message || 'We could not find an available mechanic. Showing nearby alternatives.');
        // Optionally clear any local state related to the search if needed
        localStorage.removeItem('activeJobData');
        // Keep punctureRequestFormData so nearby mechanics page can use the location
        navigate('/nearby-mechanics'); // Navigate to nearby mechanics page
        break;
      // END OF ADDITION

      // You might add other cases here if needed, like 'search_update', etc.

      default:
        // Optional: Log ignored message types relevant to this request ID
        console.log('[FindingMechanic] Ignored message type for this request:', lastMessage.type);
        break;
    }

  }, [lastMessage, navigate, request_id]); // Dependencies for the message handler

  const handleCancel = () => {
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason for cancellation.");
      return;
    }
    try {
      await api.post(`jobs/CancelServiceRequest/${request_id}/`, {
        cancellation_reason: `${username} - ${selectedReason}`,
      });
      if (socket && socket.readyState === WebSocket.OPEN) {
        const cancelMessage = {
          type: 'job_cancelled',  // 1. Changed type to match what mechanic's app expects
          job_id: request_id,       // 2. Changed key to 'job_id'
          message: `Cancelled by user: ${selectedReason}` // 3. Added a message for the alert
        };
        socket.send(JSON.stringify(cancelMessage));
      }
      toast.success("Service request cancelled.");
      navigate('/');
    } catch (error) {
      console.error("Failed to cancel service request:", error);
      const errorMessage = error.response?.data?.message || "Cancellation failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setCancelModalOpen(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Neumorphism shadow convention: A light top-left shadow and a dark bottom-right shadow.
  // We use Tailwind's arbitrary values for this: `shadow-[light_shadow,dark_shadow]`.
  // For the "pressed" or "inset" effect, we use `shadow-[inset_...]`.
  const neumorphicShadow = "shadow-[8px_8px_16px_#d1d5db,_-8px_-8px_16px_#ffffff]";
  const neumorphicInsetShadow = "shadow-[inset_5px_5px_10px_#d1d5db,_inset_-5px_-5px_10px_#ffffff]";
  const buttonShadow = "shadow-[5px_5px_10px_#d1d5db,_-5px_-5px_10px_#ffffff]";
  const buttonActiveShadow = "active:shadow-[inset_5px_5px_10px_#d1d5db,_inset_-5px_-5px_10px_#ffffff]";

  return (
    <div className="min-h-screen bg-gray-100 text-gray-700 flex flex-col items-center justify-center p-4 font-sans">
      <ConnectionStatus />
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`bg-gray-100 rounded-3xl p-6 md:p-8 ${neumorphicShadow}`}
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full bg-gray-100 ${neumorphicInsetShadow}`}>
                <Loader className="animate-spin text-blue-500" size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Finding a Mechanic</h1>
            <p className="text-gray-500">We're searching for the nearest available mechanic...</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className={`flex justify-between items-center p-4 rounded-xl bg-gray-100 ${neumorphicInsetShadow}`}>
              <div className="flex items-center gap-3">
                <Clock className="text-blue-500" size={20} />
                <span className="font-semibold">Search Time</span>
              </div>
              <span className="font-mono text-lg font-bold text-gray-800">{formatTime(searchTime)}</span>
            </div>
            <div className="text-center text-gray-400 text-sm">
              <p>Request ID: #{request_id}</p>
            </div>
            <OrderDetailsCard />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              className={`flex-1 py-3 px-4 bg-gray-100 rounded-lg font-semibold text-red-500 transition-all duration-200
                         ${buttonShadow} ${buttonActiveShadow}`}
            >
              <X size={18} className="inline-block mr-2" />
              Cancel Request
            </button>
          </div>
        </motion.div>
      </div>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-opacity-25 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-gray-100 w-full max-w-md mx-4 p-6 rounded-2xl text-gray-800 ${neumorphicShadow}`}
          >
            <h2 className="text-lg font-bold mb-4">Why are you cancelling?</h2>
            <div className="space-y-3">
              {['Mechanic delayed', 'Changed my mind', 'Found help elsewhere', 'Other'].map((reason) => (
                <div
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full px-4 py-3 rounded-lg cursor-pointer transition-all duration-200
                             ${selectedReason === reason
                      ? `text-red-600 font-semibold ${neumorphicInsetShadow}`
                      : `text-gray-700 hover:text-blue-600 ${buttonShadow} active:shadow-none`
                    }`}
                >
                  {reason}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setCancelModalOpen(false)}
                className={`px-5 py-2 bg-gray-100 rounded-lg text-sm font-semibold transition-all duration-200
                           ${buttonShadow} ${buttonActiveShadow}`}
              >
                Go Back
              </button>
              <button
                disabled={!selectedReason}
                onClick={handleCancelConfirm}
                className={`px-5 py-2 bg-gray-100 text-red-500 rounded-lg text-sm font-semibold transition-all duration-200
                           ${buttonShadow} ${buttonActiveShadow}
                           disabled:opacity-60 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none`}
              >
                Confirm Cancellation
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}