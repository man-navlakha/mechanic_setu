// src/Page/MainPage.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import LeftPanel from "../components/LeftPanel";
import { ArrowRight, Crosshair } from 'lucide-react';
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
  const mechanicMarkersRef = useRef([]);
  const hasFitBoundsRef = useRef(false);
  const watchIdRef = useRef(null);

  const [userPosition, setUserPosition] = useState(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [locationStatus, setLocationStatus] = useState("getting");
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [mapAds, setMapAds] = useState([]);
  const [nearbyMechanics, setNearbyMechanics] = useState([]);

  const DEFAULT_CENTER = { lat: 23.015, lng: 72.555 };
  const NEARBY_MECHANIC_RADIUS_KM = 8;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

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

  // Cleanup geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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

  // Fetch nearby mechanics (for map markers)
  useEffect(() => {
    const fetchNearbyMechanics = async () => {
      if (!userPosition) {
        setNearbyMechanics([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/ms-mechanics/nearby?latitude=${userPosition.lat}&longitude=${userPosition.lng}&radius=${NEARBY_MECHANIC_RADIUS_KM}`
        );
        const data = await response.json();
        if (data?.success) {
          setNearbyMechanics(data.mechanics || []);
        } else {
          setNearbyMechanics([]);
        }
      } catch (error) {
        console.error("Failed to load nearby mechanics", error);
        setNearbyMechanics([]);
      }
    };

    hasFitBoundsRef.current = false;
    fetchNearbyMechanics();
  }, [userPosition]);

  // Initialize Map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
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

  // Render nearby mechanics on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mapStatus !== "loaded") return;

    // Clear existing mechanic markers
    mechanicMarkersRef.current.forEach((marker) => marker.remove());
    mechanicMarkersRef.current = [];

    nearbyMechanics.forEach((mech) => {
      const lat =
        mech.shop_latitude ||
        mech.current_latitude ||
        mech.location?.shop?.latitude;
      const lng =
        mech.shop_longitude ||
        mech.current_longitude ||
        mech.location?.shop?.longitude;

      if (!lat || !lng) return;

      const isOnline = mech.status === "ONLINE";
      const isVerified = !!mech.is_verified;
      const shopName = mech.shop_name || "Mechanic";
      const distanceText =
        mech.distance_text ||
        (typeof mech.distance_km === "number"
          ? `${mech.distance_km.toFixed(1)} km`
          : "");

      const el = document.createElement("div");
      el.className = "mechanic-marker";
      el.style.cssText = `
        width: 44px;
        height: 44px;
        border-radius: 9999px;
        background: #ffffff;
        padding: 2px;
        border: 3px solid ${isOnline ? "#10b981" : "#9ca3af"};
        box-shadow: 0 10px 20px rgba(0,0,0,0.18);
        cursor: pointer;
        overflow: hidden;
      `;

      const img = document.createElement("div");
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.borderRadius = "9999px";
      img.style.backgroundImage = `url(${mech.shop_photo || ""})`;
      img.style.backgroundSize = "cover";
      img.style.backgroundPosition = "center";
      img.style.backgroundColor = "#f3f4f6";
      el.appendChild(img);

      const statusDot = document.createElement("div");
      statusDot.style.cssText = `
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 10px;
        height: 10px;
        border-radius: 9999px;
        background: ${isOnline ? "#10b981" : "#9ca3af"};
        border: 2px solid #ffffff;
      `;
      el.appendChild(statusDot);

      if (isVerified) {
        const verifiedBadge = document.createElement("div");
        verifiedBadge.style.cssText = `
          position: absolute;
          top: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #3b82f6;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        `;
        verifiedBadge.innerHTML =
          '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        el.appendChild(verifiedBadge);
      }

      const popupHTML = `
        <div style="min-width: 200px;">
          <div style="font-weight: 800; font-size: 13px;">${escapeHtml(shopName)}</div>
          ${
            distanceText
              ? `<div style="margin-top: 2px; font-size: 12px; color: #6b7280;">${escapeHtml(distanceText)} away</div>`
              : ""
          }
          ${
            mech.shop_address
              ? `<div style="margin-top: 6px; font-size: 12px; color: #374151;">${escapeHtml(mech.shop_address)}</div>`
              : ""
          }
          <div style="margin-top: 8px; font-size: 12px; font-weight: 800; color: ${isOnline ? "#10b981" : "#6b7280"};">
            ${isOnline ? "ONLINE" : "OFFLINE"}
            ${isVerified ? `<span style="margin-left: 8px; color: #3b82f6;">VERIFIED</span>` : ""}
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(
        popupHTML
      );

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      mechanicMarkersRef.current.push(marker);
    });

    if (!hasFitBoundsRef.current && userPosition && nearbyMechanics.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([userPosition.lng, userPosition.lat]);

      nearbyMechanics.forEach((mech) => {
        const lat =
          mech.shop_latitude ||
          mech.current_latitude ||
          mech.location?.shop?.latitude;
        const lng =
          mech.shop_longitude ||
          mech.current_longitude ||
          mech.location?.shop?.longitude;
        if (lat && lng) bounds.extend([lng, lat]);
      });

      map.fitBounds(bounds, { padding: 90, maxZoom: 15, duration: 900 });
      hasFitBoundsRef.current = true;
    }
  }, [nearbyMechanics, mapStatus, userPosition]);

  // Get user's live location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      setShowLocationPrompt(true);
      return;
    }

    setLocationStatus("getting");
    setShowLocationPrompt(false);

    // Clear existing watch if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLocationStatus("success");

        const map = mapInstanceRef.current;
        const pos = { lat: latitude, lng: longitude };
        setUserPosition(pos);

        if (map) {
          map.flyTo({
            center: [pos.lng, pos.lat],
            speed: 1.5,
            curve: 1,
          });
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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

      {/* Current Location Button */}
      <button
        onClick={getUserLocation}
        className="absolute top-20 right-4 z-10 bg-white p-3 rounded-full shadow-xl hover:bg-gray-50 transition-transform active:scale-95 border border-gray-100"
        title="Show current location"
      >
        <Crosshair className="w-6 h-6 text-blue-600" />
      </button>
    </div>
  );
};

export default MainPage;
