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
  const [isWithinAhmedabad, setIsWithinAhmedabad] = useState(null);

  const AH_BOUNDS = {
    south: 22.7,
    north: 23.35,
    west: 72.35,
    east: 72.95,
  };

  const AH_CENTER = { lat: 23.0225, lng: 72.5714 };
  const isWithinAhmedabadBounds = (lat, lng) =>
    lat >= AH_BOUNDS.south &&
    lat <= AH_BOUNDS.north &&
    lng >= AH_BOUNDS.west &&
    lng <= AH_BOUNDS.east;
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
      center: [AH_CENTER.lng, AH_CENTER.lat],
      zoom: 13,
      style: `https://api.maptiler.com/maps/019b64a4-ef96-7e83-9a23-dde0df92b2ba/style.json?key=wf1HtIzvVsvPfvNrhwPz`,
      attributionControl: false,
      maxBounds: new maplibregl.LngLatBounds(
        [AH_BOUNDS.west, AH_BOUNDS.south],
        [AH_BOUNDS.east, AH_BOUNDS.north]
      ),
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

    // Add 2-3 More "Map Ads" placeholders as requested
    const adPlaceholders = [
      { businessName: "Your Ad here", longitude: 0.005, latitude: 0.005, color: "#f59e0b" },
      { businessName: "Business On Map", longitude: -0.005, latitude: 0.005, color: "#ec4899" },
      { businessName: "Ad here", longitude: 0.008, latitude: -0.005, color: "#8b5cf6" },
      { businessName: "Ad Now", longitude: -0.008, latitude: -0.008, color: "#ef4444" }
    ];

    if (userPosition) {
      adPlaceholders.forEach(ad => {
        const adEl = document.createElement('div');
        adEl.style.cssText = `
          position: absolute;
          background: ${ad.color};
          color: white;
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 900;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          border: 2px solid white;
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: pulse 2s infinite ease-in-out;
        `;

        adEl.innerHTML = `
          <div style="font-size: 7px; opacity: 0.7; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">PROMOTED</div>
          <div>${ad.businessName}</div>
        `;

        adEl.onmouseenter = () => {
          adEl.style.transform = 'translate(-40px, -40px) scale(0)';
          adEl.style.opacity = '0';
          adEl.style.zIndex = '2000';
        };
        adEl.onmouseleave = () => {
          adEl.style.transform = 'translate(0, 0) scale(1)';
          adEl.style.opacity = '1';
          adEl.style.zIndex = 'auto';
          adEl.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        };

        const marker = new maplibregl.Marker({ element: adEl })
          .setLngLat([userPosition.lng + ad.longitude, userPosition.lat + ad.latitude])
          .addTo(mapInstanceRef.current);

        adMarkersRef.current.push(marker);
      });
    }
  }, [mapAds, mapStatus, userPosition]);

  // Get user's live location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      setShowLocationPrompt(true);
      return;
    }

    setLocationStatus("getting");
    setShowLocationPrompt(false);
    setIsWithinAhmedabad(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const insideAhmedabad = isWithinAhmedabadBounds(latitude, longitude);
        setIsWithinAhmedabad(insideAhmedabad);
        setLocationStatus(insideAhmedabad ? "success" : "outside");

        const map = mapInstanceRef.current;
        if (!insideAhmedabad) {
          if (map) {
            if (userMarkerRef.current) {
              userMarkerRef.current.remove();
              userMarkerRef.current = null;
            }
            map.setCenter([AH_CENTER.lng, AH_CENTER.lat]);
          }
          setUserPosition(null);
          return;
        }

        const pos = { lat: latitude, lng: longitude };
        setUserPosition(pos);

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
      {isWithinAhmedabad === false && (
        <div className="absolute top-20 right-4 z-20 w-80 rounded-xl border border-red-300 bg-white/90 p-4 shadow-lg">
          <p className="text-sm font-semibold text-red-600">Ahmedabad geofence</p>
          <p className="text-xs text-gray-700 mt-1">
            Mechanic Setu is currently active only inside Ahmedabad (lat 22.7–23.35, lng 72.35–72.95). Your current coordinates are outside that zone, so the map stays locked to Ahmedabad.
          </p>
          <p className="mt-2 text-[11px] text-gray-500">
            Please tap “Retry” (above) after moving inside Ahmedabad or manually explore the city area on the map to place a request.
          </p>
        </div>
      )}
    </div>
  );
};

export default MainPage;
