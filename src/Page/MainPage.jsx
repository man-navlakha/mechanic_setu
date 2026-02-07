// src/Page/MainPage.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import LeftPanel from "../components/Leftpenal";
import { ArrowRight } from 'lucide-react';
import api from "../utils/api";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Key for storing active job data in localStorage (must match MechanicFound.jsx)
const MainPage = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const adMarkersRef = useRef([]);

  const [userPosition, setUserPosition] = useState(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [locationStatus, setLocationStatus] = useState("getting");
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [mapAds, setMapAds] = useState([]);

  // Fetch Active Job
  useEffect(() => {
    const checkForJobAndSync = async () => {
      let jobIdFromStorage = null;

      try {
        const savedJobDataString = localStorage.getItem('activeJobData');
        if (savedJobDataString) {
          const savedJobData = JSON.parse(savedJobDataString);
          if (savedJobData && savedJobData.request_id) {
            jobIdFromStorage = savedJobData.request_id;
          }
        }
      } catch (error) {
        console.error("Could not parse job data from localStorage.", error);
      }

      if (jobIdFromStorage) {
        try {
          console.log("Found job in localStorage, syncing with server...");
          const { data } = await api.get("/jobs/SyncActiveJob/");
          console.log("5. Received data from Sync API:", data);

          if (data && data.message === 'No active job found.') {
            console.log("Server confirms no active job. Clearing stale data.");
            setActiveJob(null);
            return;
          }

          if (data.status === 'PENDING' && data.job_id) {
            console.log("Navigating: Customer, PENDING job.");
            navigate(`/finding/${data.job_id}`);
          } else if (data.first_name && data.phone_number && !data.status) {
            console.log("Navigating: Customer, ACCEPTED job.");
            const jobDataToStore = {
              mechanic: data,
              request_id: jobIdFromStorage,
              mechanicLocation: (data.current_latitude && data.current_longitude)
                ? { lat: data.current_latitude, lng: data.current_longitude }
                : null,
              estimatedTime: null
            };
            navigate(`/mechanic-found/${jobIdFromStorage}`, {
              state: { mechanic: data, requestId: jobIdFromStorage }
            });
          } else {
            console.log("API response did not match any known navigation conditions.");
          }
        } catch (error) {
          if (error.response?.status !== 401) {
            console.error("Failed to sync active job with the server:", error);
          }
          setActiveJob(null);
        }
      } else {
        console.log("No active job found in localStorage. Skipping API sync.");
        setActiveJob(null);
      }
    };

    checkForJobAndSync();
  }, [navigate]);

  // Fetch Map Ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await api.get('/core/map-ads/');
        setMapAds(response.data);
      } catch (error) {
        console.error("Failed to load map ads", error);
      }
    };
    fetchAds();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: [77.2090, 28.6139], // Delhi Fallback
      zoom: 13,
      style: `https://api.maptiler.com/maps/019b64a4-ef96-7e83-9a23-dde0df92b2ba/style.json?key=wf1HtIzvVsvPfvNrhwPz`,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    map.on('load', () => {
      setMapStatus("loaded");
      getUserLocation();
    });
  }, []);

  // Handle Ads Rendering
  useEffect(() => {
    if (!mapInstanceRef.current || mapAds.length === 0) return;

    // Clear existing ad markers
    adMarkersRef.current.forEach(marker => marker.remove());
    adMarkersRef.current = [];

    mapAds.forEach(ad => {
      // Container mimic: bg-white p-0.5 rounded-full border-2 border-amber-400 shadow-lg
      const el = document.createElement('div');
      el.className = 'ad-marker-container';
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.backgroundColor = 'white';
      el.style.padding = '2px'; // p-0.5 equivalent
      el.style.borderRadius = '50%';
      el.style.border = '2px solid #fbbf24'; // amber-400
      el.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'; // shadow-lg
      el.style.cursor = 'pointer';
      el.style.overflow = 'hidden';

      // Image mimic: w-full h-full rounded-full object-cover
      const img = document.createElement('div');
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '50%';
      img.style.backgroundImage = `url(${ad.logo})`;
      img.style.backgroundSize = 'cover';
      img.style.backgroundPosition = 'center';

      el.appendChild(img);

      const popupHTML = `
        <div class="p-2 text-center">
          <h3 class="font-bold text-sm">${ad.businessName}</h3>
          <p class="text-xs text-gray-600">${ad.description || ''}</p>
          ${ad.offerTitle ? `<div class="mt-1 text-xs font-bold text-red-500">${ad.offerTitle}</div>` : ''}
          ${ad.link ? `<a href="${ad.link}" target="_blank" class="text-blue-500 text-xs underline mt-1 block">Visit Website</a>` : ''}
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(popupHTML);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([ad.longitude, ad.latitude])
        .setPopup(popup)
        .addTo(mapInstanceRef.current);

      adMarkersRef.current.push(marker);
    });
  }, [mapAds, mapStatus]);

  // Get user's live location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      setShowLocationPrompt(true);
      return;
    }

    setLocationStatus("getting");
    setShowLocationPrompt(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserPosition(pos);
        setLocationStatus("success");

        const map = mapInstanceRef.current;
        if (map) {
          map.setCenter([pos.lng, pos.lat]);

          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([pos.lng, pos.lat]);
          } else {
            const el = document.createElement('div');
            el.innerText = '📍';
            el.style.fontSize = '2rem';
            el.style.cursor = 'default';

            userMarkerRef.current = new maplibregl.Marker({ element: el })
              .setLngLat([pos.lng, pos.lat])
              .addTo(map);
          }
        }
      },
      (error) => {
        console.error("Location error:", error.message);
        setShowLocationPrompt(true);
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Handle retry button
  const handleEnableLocation = () => {
    getUserLocation();
  };

  // Handle navigating to the active job
  const handleGoToActiveJob = () => {
    if (activeJob && activeJob.request_id) {
      navigate(`/mechanic-found/${activeJob.request_id}`);
    }
  };


  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Active Job Banner */}
      {activeJob && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-md">
          <button
            onClick={handleGoToActiveJob}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between hover:bg-green-700 transition-transform active:scale-95"
          >
            <div className="text-left">
              <p className="font-bold">A job is currently in progress!</p>
              <p className="text-sm opacity-90">Click to view mechanic's location.</p>
            </div>
            <ArrowRight size={20} />
          </button>
        </div>
      )}


      {/* Map Container */}
      <div ref={mapContainerRef} id="map" className="absolute inset-0 -z-0" />

      {/* Left Panel (over map) */}
      <div className="absolute top-20 left-4 z-10">
        <LeftPanel activeJob={activeJob} />
      </div>

      {/* Map Status */}
      {mapStatus === "loading" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-800 px-4 py-2 rounded-md shadow-md">
          Loading map...
        </div>
      )}

      {/* Location Prompt */}
      {showLocationPrompt && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-4 rounded-lg shadow-lg max-w-md z-20">
          <h3 className="text-lg font-semibold mb-2">Enable Location Access</h3>
          <p className="text-sm mb-3">
            Please allow location access in your browser settings to view your live position.
          </p>
          <button
            onClick={handleEnableLocation}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default MainPage;