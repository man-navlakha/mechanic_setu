import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';

const OtpPage = () => {
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const verifyButtonRef = useRef(null); // Ref for the verify button
  const navigate = useNavigate();
  const { state } = useLocation();

  // State for timer functionality
  const [timer, setTimer] = useState(120);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  const initialCtx = state || JSON.parse(sessionStorage.getItem('otp_ctx') || '{}');
  const [ctx, setCtx] = useState({
    key: initialCtx?.key || null,
    id: initialCtx?.id || null,
    status: initialCtx?.status || null,
    email: initialCtx?.email || null,
  });

  useEffect(() => {
    sessionStorage.setItem('otp_ctx', JSON.stringify(ctx));
  }, [ctx]);

  useEffect(() => {
    let interval;
    if (isResendDisabled && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [isResendDisabled, timer]);

  const handleChange = (element, index) => {
    // This function now primarily handles manual typing
    if (isNaN(element.value)) return;
    setOtp((prev) => prev.map((d, idx) => (idx === index ? element.value : d)));
    // Move to next sibling if a value is entered
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move focus backward on backspace if the input is empty
    if (e.key === 'Backspace' && !otp[index] && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  // ✨ New function to handle paste event
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    // Ensure pasted text contains only digits and is max 6 chars long
    const pastedDigits = pastedText.replace(/\D/g, '').slice(0, 6);

    if (pastedDigits) {
      const newOtp = new Array(6).fill('');
      pastedDigits.split('').forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);

      // Set focus to the next empty input or the verify button
      const nextFocusIndex = pastedDigits.length;
      if (nextFocusIndex < 6) {
        inputRefs.current[nextFocusIndex]?.focus();
      } else {
        verifyButtonRef.current?.focus();
      }
    }
  };

  const verifyOtp = async () => {
    setError('');
    const code = otp.join('').trim();
    if (code.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    try {
      const payload = { key: ctx.key, id: ctx.id, otp: code };
      await api.post('/users/otp-verify/', payload, { withCredentials: true });
      if (ctx.status === 'New User') {
        navigate('/form', { state: { status: 'Manual' } });
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('OTP verify failed:', err);
      setError(err?.response?.data?.error || 'Verification failed. Try again.');
    }
  };

  const resendOtp = async () => {
    if (isResendDisabled) return;
    setError('');
    try {
      const res = await api.post(
        '/users/resend-otp/',
        { key: ctx.key, id: ctx.id },
        { withCredentials: true }
      );
      const newKey = res?.data?.key;
      const newid = res?.data?.id;
      if (newid) setCtx((prev) => ({ ...prev, id: newid }));
      if (newKey) setCtx((prev) => ({ ...prev, key: newKey }));
      
      setIsResendDisabled(true);
      setTimer(120);
      setOtp(new Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Resend failed:', err);
      setError(err?.response?.data?.error || 'Could not resend code. Try later.');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    verifyOtp();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-slate-900 to-blue-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
        <div className="text-white">
          <img src="/ms.png" alt="Mechanic Setu Logo" className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-white/30" />
          <h1 className="text-3xl font-bold tracking-wider">MECHANIC SETU</h1>
          <p className="text-sm text-gray-300 italic">Always at emergency</p>
        </div>

        <form className="space-y-4 text-white" onSubmit={handleFormSubmit}>
          <h2 className="text-2xl font-semibold">Enter Verification Code</h2>
          <p className="text-gray-300">
            A 6-digit OTP has been sent to {ctx.email || 'your email'}.
          </p>

          <div className="flex justify-center space-x-2 md:space-x-4">
            {otp.map((val, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={val}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste} // ✨ Added paste event handler
                className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-semibold bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            ref={verifyButtonRef} // ✨ Added ref to the button
            type="submit"
            className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
          >
            Verify
          </button>

          <p className="text-sm text-gray-300">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={resendOtp}
              className="font-semibold text-blue-400 hover:underline disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed"
              disabled={isResendDisabled}
            >
              {isResendDisabled ? `Resend in ${formatTime(timer)}` : 'Resend'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default OtpPage;
