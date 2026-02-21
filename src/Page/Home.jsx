import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  Loader,
  Zap,
  Battery,
  Wrench,
  Droplet,
  CheckCircle2,
  Phone,
  Clock,
  Navigation
} from 'lucide-react';
import NavbarLanding from '../components/NavbarLanding';
import api from '../utils/api';

/* ---------------- HERO SECTION ---------------- */
function Hero() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const issues = ['Flat tyre', 'Bike not starting', 'Car breakdown', 'Towing help'];

  const handleDetectLocation = async () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // On success, redirect to mechanic list or nearby page
        navigate('/nearby-mechanics'); 
        setLoading(false);
      },
      (err) => {
        setError('Unable to retrieve location. Please enable GPS.');
        setLoading(false);
      }
    );
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-white px-4 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
          🚀 #1 Roadside Assistance in Gujarat
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-slate-900 tracking-tight">
          Stuck on the road? <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
            Get Help Instantly.
          </span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Find verified mechanics nearby for puncture repair, battery jumpstart, and emergency breakdown services.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={handleDetectLocation}
            disabled={loading}
            className="flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Locating...' : 'Find Mechanics Near Me'}
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center px-8 py-4 text-lg font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            <Search className="w-5 h-5 mr-2" />
            Search by Issue
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {issues.map((issue) => (
            <span key={issue} className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-sm text-slate-600 shadow-sm">
              {issue}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- EMERGENCY SERVICES ---------------- */
function EmergencyActions() {
  const actions = [
    { icon: <Droplet className="w-6 h-6 text-blue-600" />, title: 'Puncture Repair', desc: 'Tubeless & Tube' },
    { icon: <Battery className="w-6 h-6 text-green-600" />, title: 'Battery Jumpstart', desc: 'Dead Battery Help' },
    { icon: <Wrench className="w-6 h-6 text-orange-600" />, title: 'Engine Issue', desc: 'Minor Fixes' },
    { icon: <Zap className="w-6 h-6 text-yellow-600" />, title: 'Towing Service', desc: 'Flatbed & Chain' },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-slate-900">Emergency Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action) => (
            <div key={action.title} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <h3 className="font-bold text-slate-900">{action.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{action.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- NEARBY MECHANICS (UPDATED) ---------------- */
function NearbyMechanics() {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLoc, setUserLoc] = useState(null);

  useEffect(() => {
    fetchNearbyMechanics();
  }, []);

  const fetchNearbyMechanics = async () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setUserLoc({ latitude, longitude });

      try {
        const response = await fetch(
          `http://localhost:3000/api/ms-mechanics/nearby?latitude=${latitude}&longitude=${longitude}&radius=39`
        );
        const data = await response.json();
        
        if (data.success && data.mechanics) {
          // Sort: Online first, then by distance
          const sorted = data.mechanics.sort((a, b) => {
            if (a.status === 'ONLINE' && b.status !== 'ONLINE') return -1;
            if (a.status !== 'ONLINE' && b.status === 'ONLINE') return 1;
            return a.distance_km - b.distance_km;
          });
          setMechanics(sorted.slice(0, 4)); // Show only top 4
        }
      } catch (err) {
        console.error("Failed to fetch mechanics", err);
      }
      setLoading(false);
    });
  };

  if (loading) return (
    <div className="py-12 flex justify-center">
      <Loader className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mechanics Near You</h2>
            <p className="text-slate-500 mt-1">Real-time availability based on your location</p>
          </div>
          <button className="text-blue-600 font-semibold hover:underline hidden sm:block">View All</button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {mechanics.map((mechanic) => (
            <div key={mechanic.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all flex gap-4">
              {/* Image Section */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <img 
                  src={mechanic.shop_photo || "https://images.unsplash.com/photo-1486262715619-72a47fe9d931?auto=format&fit=crop&q=80&w=200"} 
                  alt={mechanic.shop_name}
                  className="w-full h-full object-cover rounded-xl bg-slate-100"
                />
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${mechanic.status === 'ONLINE' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
              </div>

              {/* Content Section */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 truncate pr-2">
                      {mechanic.shop_name}
                    </h3>
                    {mechanic.is_verified && (
                      <span className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-slate-900">{mechanic.distance_text}</span>
                    <span className="text-xs text-slate-500">away</span>
                  </div>
                </div>

                <p className="text-sm text-slate-500 mt-2 truncate">
                  {mechanic.shop_address}
                </p>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {mechanic.special_skills ? (
                    mechanic.special_skills.split(',').slice(0, 2).map((skill, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                        {skill.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">General Repair</span>
                  )}
                  {mechanic.vehicle_type && (
                     <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                       {mechanic.vehicle_type}
                     </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {mechanics.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No mechanics found nearby. Try increasing search radius.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- LOCAL AREAS (SEO) ---------------- */
function LocalServiceAreas() {
  const locations = ["Law Garden", "Nehru Nagar", "Iscon Crossroad", "Shivranjani", "Paldi", "Chandkheda", "Riverfront", "Bopal", "SG Highway"];
  
  return (
    <section className="py-12 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Urgent Repair Available In</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {locations.map(loc => (
            <span key={loc} className="text-sm text-slate-600 hover:text-blue-600 cursor-pointer transition-colors">
              {loc} •
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function FAQ() {
  const faqs = [
    {
      q: "Law Garden ke Nehru Nagar ma puncture thayu che?",
      a: "Chinta na karo! Mechanic Setu provides the fastest doorstep puncture repair in Law Garden, Paldi, and Shivranjani."
    },
    {
      q: "Do you provide fast repairing at Iscon or Riverfront?",
      a: "Yes! We focus on urgent repairs like punctures and battery jumpstarts. Amara mechanics badha local area thi mahitgar che."
    }
  ];

  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center text-slate-900">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-lg mb-2 text-slate-800">{item.q}</h4>
              <p className="text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function Home() {
  const navigate = useNavigate();

  // If the user is already logged in, don't show the landing page on `/`.
  // `GET /api/core/me/` returns 200 when authenticated, and 401 when not.
  useEffect(() => {
    let isMounted = true;

    const checkAuthAndRedirect = async () => {
      try {
        await api.get('core/me/', { skipAuthRedirect: true });
        if (isMounted) navigate('/home', { replace: true });
      } catch {
        // Not logged in — keep showing the public landing page.
      }
    };

    checkAuthAndRedirect();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <main className="bg-white min-h-screen">
      <NavbarLanding />
      <Hero />
      <EmergencyActions />
      <NearbyMechanics />
      <FAQ />
      <LocalServiceAreas />
      
      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold">Mechanic Setu</h2>
            <p className="text-slate-400 text-sm mt-1">Emergency Roadside Assistance in Gujarat</p>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Mechanic Setu. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
