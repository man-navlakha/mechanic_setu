import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Battery,
  CheckCircle2,
  ChevronDown,
  Droplet,
  Linkedin,
  Loader,
  MapPin,
  Rocket,
  Wrench,
  Zap
} from 'lucide-react';
import PropTypes from 'prop-types';
import { Link, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import './App.css';

import MainPage from './Page/MainPage';
import Login from './Page/auth/Login';
import OTP from './Page/auth/OTP';
import Logout from './Page/auth/Logout';
import ProcessForm from './Page/auth/ProcessForm';
import PunctureRequestForm from './Page/PunctureRequestForm';
import ProfilePage from './Page/ProfilePage';
import MechanicFound from './Page/MechanicFound';
import RequestLayout from './Page/RequestLayout';
import FindingMechanic from './Page/FindingMechanic';
import NearbyMechanicsPage from './Page/NearbyMechanics';
import MechanicRegistration from './Page/MechanicRegistration';
import MechanicList from './Page/MechanicList';
import MechanicDetail from './Page/MechanicDetail';
import RCInfo from './Page/RCInfo';
import VehicleDashboard from './Page/Dashboard/VehicleDashboard';
import VehicleDetails from './Page/Dashboard/VehicleDetails';
import VehicleAdmin from './Page/Dashboard/VehicleAdmin';
import VehicleAdminDetail from './Page/Dashboard/VehicleAdminDetail';
import NotFound from './Page/NotFound';
import Protected from './ProtectedRoute';
import NavbarLanding from './components/NavbarLanding';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';
import api from './utils/api';

const LANDING_ISSUES = ['Flat tyre', 'Bike not starting', 'Car breakdown', 'Towing help'];
const LANDING_LOCATIONS = [
  'Law Garden',
  'Nehru Nagar',
  'Iscon Crossroad',
  'Shivranjani',
  'Paldi',
  'Chandkheda',
  'Riverfront',
  'Bopal',
  'SG Highway'
];
const LANDING_FAQS = [
  {
    q: 'Law Garden ke Nehru Nagar ma puncture thayu che?',
    a: 'Chinta na karo! Mechanic Setu provides the fastest doorstep puncture repair in Law Garden, Paldi, and Shivranjani.'
  },
  {
    q: 'Do you provide fast repairing at Iscon or Riverfront?',
    a: 'Yes! We focus on urgent repairs like punctures and battery jumpstarts. Amara mechanics badha local area thi mahitgar che.'
  }
];

function LandingHero({ error = '', loading, issues, onBookMechanic, onDetectLocation }) {
  return (
    <section className="relative min-h-[80vh] sm:min-h-[90vh] flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-white px-4 sm:px-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 sm:w-96 sm:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 sm:w-96 sm:h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-72 h-72 sm:w-96 sm:h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-100 text-violet-600 text-sm font-medium">
          <span className="flex mx-2">
            <Rocket className="w-4 mx-1 text-violet-600" />
            #1 Roadside Assistance in Gujarat
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-slate-900 tracking-tight leading-tight">
          Stuck on the road? <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
            Get Mechanic in Minutes.
          </span>
        </h1>
        <p className="text-base sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Find verified mechanics nearby for puncture repair, battery jumpstart, and emergency breakdown services.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            type="button"
            onClick={onBookMechanic}
            className="w-full sm:w-auto flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30"
          >
            <Zap className="w-5 h-5 mr-2" />
            Book a Mechanic
          </button>

          <button
            type="button"
            onClick={onDetectLocation}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Locating...' : 'Find Mechanics Near Me'}
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {issues.map((issue) => (
            <span
              key={issue}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-xs sm:text-sm text-slate-600 shadow-sm"
            >
              {issue}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

LandingHero.propTypes = {
  error: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  issues: PropTypes.arrayOf(PropTypes.string).isRequired,
  onBookMechanic: PropTypes.func.isRequired,
  onDetectLocation: PropTypes.func.isRequired
};

function EmergencyActions() {
  const actions = [
    {
      icon: <Droplet className="w-6 h-6 text-blue-600" />,
      title: 'Puncture Repair',
      desc: 'Tubeless & Tube',
      note: 'Most booked emergency service',
      layout: 'sm:col-span-2 lg:col-span-2 lg:row-span-2',
      tone: 'from-blue-50 to-cyan-50 border-blue-100',
      iconBg: 'bg-white'
    },
    {
      icon: <Battery className="w-6 h-6 text-green-600" />,
      title: 'Battery Jumpstart',
      desc: 'Dead Battery Help',
      note: 'Quick power recovery on-site',
      layout: 'lg:col-span-2',
      tone: 'from-emerald-50 to-lime-50 border-emerald-100',
      iconBg: 'bg-white'
    },
    {
      icon: <Wrench className="w-6 h-6 text-orange-600" />,
      title: 'Engine Issue',
      desc: 'Minor Fixes',
      note: 'Rapid diagnostics and repair',
      layout: 'lg:col-span-1',
      tone: 'from-amber-50 to-orange-50 border-orange-100',
      iconBg: 'bg-white'
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      title: 'Towing Service',
      desc: 'Flatbed & Chain',
      note: 'Safe tow support any time',
      layout: 'lg:col-span-1',
      tone: 'from-violet-50 to-fuchsia-50 border-violet-100',
      iconBg: 'bg-white'
    }
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Emergency Services</h2>
          <p className="text-slate-500 mt-2">Instant roadside support designed for urgent breakdown moments.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[150px] gap-4">
          {actions.map((action, index) => (
            <article
              key={action.title}
              className={`h-full rounded-3xl border p-5 bg-gradient-to-br ${action.tone} ${action.layout} shadow-sm hover:shadow-md transition-all group`}
            >
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-12 h-12 ${action.iconBg} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    {action.icon}
                  </div>
                  {index === 0 && (
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                      Priority
                    </span>
                  )}
                </div>

                <div>
                  <h3 className={`font-bold text-slate-900 ${index === 0 ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'}`}>
                    {action.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">{action.desc}</p>
                  <p className="text-xs text-slate-500 mt-3">{action.note}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingNearbyMechanics() {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchNearbyMechanics = async () => {
      if (!navigator.geolocation) return;
      setLoading(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await fetch(
              `/api/ms-mechanics/nearby?latitude=${latitude}&longitude=${longitude}&radius=39`,
              { signal: controller.signal }
            );
            const data = await response.json();

            if (isMounted && data.success && Array.isArray(data.mechanics)) {
              const sorted = [...data.mechanics].sort((a, b) => {
                if (a.status === 'ONLINE' && b.status !== 'ONLINE') return -1;
                if (a.status !== 'ONLINE' && b.status === 'ONLINE') return 1;
                return a.distance_km - b.distance_km;
              });
              setMechanics(sorted.slice(0, 4));
            }
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('Failed to fetch mechanics', err);
            }
          } finally {
            if (isMounted) setLoading(false);
          }
        },
        () => {
          if (isMounted) setLoading(false);
        }
      );
    };

    fetchNearbyMechanics();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mechanics Near You</h2>
            <p className="text-slate-500 mt-1">Real-time availability based on your location</p>
          </div>
          <button type="button" className="text-blue-600 font-semibold hover:underline hidden sm:block">
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {mechanics.map((mechanic) => (
            <div
              key={mechanic.id}
              className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0">
                  <img
                    src={
                      mechanic.shop_photo ||
                      'https://images.unsplash.com/photo-1486262715619-72a47fe9d931?auto=format&fit=crop&q=80&w=200'
                    }
                    alt={mechanic.shop_name}
                    className="w-full h-full object-cover rounded-xl bg-slate-100"
                    loading="lazy"
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      mechanic.status === 'ONLINE' ? 'bg-green-500' : 'bg-slate-400'
                    }`}
                    aria-label={mechanic.status === 'ONLINE' ? 'Online' : 'Offline'}
                    title={mechanic.status === 'ONLINE' ? 'Online' : 'Offline'}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{mechanic.shop_name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {mechanic.is_verified && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {mechanic.vehicle_type && (
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            {mechanic.vehicle_type}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <span className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-full">
                        {mechanic.distance_text}
                      </span>
                    </div>
                  </div>

                  <p
                    className="mt-2 text-sm text-slate-600 overflow-hidden"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                  >
                    {mechanic.shop_address}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {mechanic.special_skills ? (
                      mechanic.special_skills
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((skill) => (
                          <span
                            key={skill}
                            className="text-xs text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200"
                          >
                            {skill}
                          </span>
                        ))
                    ) : (
                      <span className="text-xs text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        General Repair
                      </span>
                    )}
                  </div>
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

function LocalServiceAreas() {
  return (
    <section className="py-12 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Urgent Repair Available In</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {LANDING_LOCATIONS.map((location, index) => (
            <span key={location} className="text-sm text-slate-600 hover:text-blue-600 cursor-pointer transition-colors">
              {location}
              {index < LANDING_LOCATIONS.length - 1 ? ' |' : ''}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState(-1);
  const contentRefs = useRef([]);

  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center text-slate-900">Frequently Asked Questions</h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6">
          {LANDING_FAQS.map((item, index) => (
            <div key={item.q} className="border-b border-slate-200 last:border-b-0">
              <button
                type="button"
                onClick={() => setOpenIndex((current) => (current === index ? -1 : index))}
                className="w-full flex justify-between items-center py-5 text-left text-slate-800"
                aria-expanded={openIndex === index}
                aria-controls={`faq-content-${index}`}
              >
                <span className="font-semibold">{item.q}</span>
                <span className="text-slate-800 transition-transform duration-300">
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />
                </span>
              </button>
              <div
                id={`faq-content-${index}`}
                ref={(element) => {
                  contentRefs.current[index] = element;
                }}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: openIndex === index ? `${contentRefs.current[index]?.scrollHeight ?? 0}px` : '0px'
                }}
              >
                <div className="pb-5 text-sm text-slate-500 pr-8">{item.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndRedirect = async () => {
      try {
        await api.get('core/me/', { skipAuthRedirect: true });
        if (isMounted) navigate('/home', { replace: true });
      } catch {
        // Keep showing the public landing page when unauthenticated.
      }
    };

    checkAuthAndRedirect();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleDetectLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        navigate('/nearby-mechanics');
        setLoading(false);
      },
      () => {
        setError('Unable to retrieve location. Please enable GPS.');
        setLoading(false);
      }
    );
  };

  return (
    <main id="top" className="bg-white min-h-screen pt-16 md:pt-0 lg:pt-16 sm:pt-20">
      <NavbarLanding />
      <LandingHero
        error={error}
        loading={loading}
        issues={LANDING_ISSUES}
        onBookMechanic={() => navigate('/login')}
        onDetectLocation={handleDetectLocation}
      />
      <EmergencyActions />
      <LandingNearbyMechanics />
      <LandingFAQ />
      <LocalServiceAreas />

      <footer className="relative bg-black text-white border-t border-white/10 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 sm:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-zinc-400">
              <span className="text-sm sm:text-base tracking-wide">(c) 2026 Mechanic Setu.</span>
              <a href="#" className="text-sm sm:text-base tracking-wide hover:text-zinc-200 transition-colors">
                Policies
              </a>
              <a href="#" className="text-sm sm:text-base tracking-wide hover:text-zinc-200 transition-colors">
                Terms
              </a>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="LinkedIn"
                className="h-12 w-12 rounded-2xl border border-white/15 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white/35 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                aria-label="X"
                className="h-12 w-12 rounded-2xl border border-white/15 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white/35 transition-colors text-lg font-medium"
              >
                X
              </a>
              <span className="h-7 w-px bg-white/15 mx-1" />
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="h-12 px-6 rounded-full border border-white/15 text-zinc-200 hover:text-white hover:border-white/35 transition-colors inline-flex items-center gap-2 text-lg"
              >
                Top <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h2 className="mt-8 sm:mt-10 text-[clamp(3rem,14vw,9rem)] leading-[0.9] font-black tracking-tight uppercase bg-gradient-to-r from-[#e44a4a] via-[#a25adf] to-[#651fff] bg-clip-text text-transparent">
            Mechanic Setu
          </h2>
        </div>
      </footer>
    </main>
  );
}

const GlobalSocketHandler = () => {
  const { lastMessage } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!lastMessage) return;

    const jobFinished =
      lastMessage.type === 'job_completed' ||
      lastMessage.type === 'job_cancelled' ||
      lastMessage.type === 'job_cancelled_notification';
    const noMechanicFound = lastMessage.type === 'no_mechanic_found';

    if (jobFinished || noMechanicFound) {
      console.log(`GLOBAL HANDLER: Job event type "${lastMessage.type}". Clearing active job from localStorage.`);

      if (noMechanicFound) {
        toast.error(lastMessage.message || 'Could not find an available mechanic. Showing nearby alternatives.');
      } else {
        toast.success(lastMessage.message || 'The request has been resolved.');
      }

      const isOnJobRelatedPage =
        location.pathname.startsWith('/finding/') || location.pathname.startsWith('/mechanic-found/');

      if (noMechanicFound) {
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

  return null;
};

const ProtectedShell = () => (
  <Protected>
    <WebSocketProvider>
      <GlobalSocketHandler />
      <Outlet />
    </WebSocketProvider>
  </Protected>
);

function getActiveJob() {
  const rawValue = localStorage.getItem('activeJobData');
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

export default function App() {
  const activeJob = getActiveJob();

  return (
    <div className="App transition-all duration-500 ease-in-out bg-white">
      <Toaster position="top-right" reverseOrder={false} />

      {activeJob?.request_id && (
        <Link to={`/mechanic-found/${activeJob.request_id}`}>
          <div className="bg-blue-600 text-white font-bold min-w-screen w-full p-3">
            Your active Order {activeJob.request_id}
          </div>
        </Link>
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<OTP />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/nearby-mechanics" element={<NearbyMechanicsPage />} />
        <Route path="/vehicle-rc" element={<RCInfo />} />

        <Route element={<ProtectedShell />}>
          <Route path="/home" element={<MainPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/form" element={<ProcessForm />} />
          <Route path="/request" element={<PunctureRequestForm />} />
          <Route path="/ms" element={<MechanicRegistration />} />
          <Route path="/ms/list" element={<MechanicList />} />
          <Route path="/ms/view/:id" element={<MechanicDetail />} />
          <Route path="/ms/edit/:id" element={<MechanicRegistration />} />
          <Route path="/vehicle-rc" element={<RCInfo />} />
          <Route path="/admin/vehicles" element={<VehicleAdmin />} />
          <Route path="/admin/vehicles/:id" element={<VehicleAdminDetail />} />
          <Route path="/dashboard/vehicles" element={<VehicleDashboard />} />
          <Route path="/dashboard/vehicles/:id" element={<VehicleDetails />} />

          <Route element={<RequestLayout />}>
            <Route path="/finding/:request_id" element={<FindingMechanic />} />
            <Route path="/mechanic-found/:request_id" element={<MechanicFound />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
