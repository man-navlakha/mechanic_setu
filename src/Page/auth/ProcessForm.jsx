import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaPhone, FaEnvelope } from "react-icons/fa";
import api from "../../utils/api";
import { toast } from 'react-hot-toast';

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const ProcessForm = () => {
  // Read status from route state safely inside the component
  const location = useLocation(); // useLocation must be called within the component [web:146]
  const status = location.state?.status || "Manual"; // Default to "Manual" when no state provided [web:146]

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);
  const [editedUser, setEditedUser] = useState(null);
  const [loading, setLoading] = useState(true); (null);
  const navigate = useNavigate();

  // Fetch user data and pre-fill form
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const userResponse = await api.get('/Profile/UserProfile/');
        const data = userResponse.data;
        setUser(data);
        setEditedUser(data);

        // Map common fields to our formData shape (be lenient about keys)
        setFormData({
          firstName: data.first_name ?? data.firstName ?? "",
          lastName: data.last_name ?? data.lastName ?? "",
          phone: data.mobile_number ?? data.phone ?? "",
        });
      } catch (error) {
        console.error("Failed to fetch user data", error);
        toast.error("Could not load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);


  // --- FORM NAVIGATION ---
  const nextStep = () => {
    if (validateCurrentStep()) {
      toast.success("Data saved 👍")
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // --- HANDLE INPUT CHANGE ---
  const handleChange = (input) => (e) => {
    setFormData({ ...formData, [input]: e.target.value });
    if (errors[input]) {
      setErrors({ ...errors, [input]: "" });
    }
  };

  // --- VALIDATION LOGIC ---
  const validateCurrentStep = () => {
    let newErrors = {};
    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
    } else if (step === 2) {
      if (!formData.phone) newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Build payload dynamically — omit name fields if we don't have them,
  // because the backend rejects null values.
  const payload = {
    mobile_number: formData.phone,
  };

  if (status !== "Google") {
    // For non-Google flow, include whatever the user entered (use empty string if you prefer)
    if (formData.firstName !== undefined && formData.firstName !== null) {
      payload.first_name = formData.firstName;
    }
    if (formData.lastName !== undefined && formData.lastName !== null) {
      payload.last_name = formData.lastName;
    }
  } else {
    // Google flow: prefer names from fetched `user` profile (if the backend provided them)
    if (user?.first_name) payload.first_name = user.first_name;
    if (user?.last_name) payload.last_name = user.last_name;
    // If you explicitly want to send empty strings instead of omitting keys:
    // payload.first_name = user?.first_name ?? "";
    // payload.last_name = user?.last_name ?? "";
  }

  // Show a loading toast and call API
  try {
    const res = await toast.promise(
      api.post("/users/SetUsersDetail/", payload),
      {
        loading: "Submitting your details...",
        success: <b>Details submitted successfully 🎉</b>,
        error: <b>Failed to save details. Try again.</b>,
      }
    );

    console.log("Saved user details:", res.data);
    setStep((s) => s + 1);
    setTimeout(() => {
      navigate("/");
    }, 2000);
  } catch (err) {
    console.error("Save failed:", err);

    // Try to extract validation messages returned by the server
    const respData = err?.response?.data;
    if (respData && typeof respData === "object") {
      // Create user-friendly message (join all field messages)
      const messages = [];
      Object.keys(respData).forEach((key) => {
        const val = respData[key];
        if (Array.isArray(val)) {
          messages.push(`${key}: ${val.join(", ")}`);
        } else {
          messages.push(`${key}: ${String(val)}`);
        }
      });
      const messageText = messages.join(" • ");
      toast.error(messageText);

      // Also set form errors for display near fields (if appropriate)
      const serverErrors = {};
      if (respData.first_name) serverErrors.firstName = respData.first_name.join(", ");
      if (respData.last_name) serverErrors.lastName = respData.last_name.join(", ");
      if (respData.mobile_number) serverErrors.phone = respData.mobile_number.join(", ");
      setErrors((prev) => ({ ...prev, ...serverErrors }));
    } else {
      toast.error("Failed to save details. Try again.");
      setErrors((prev) => ({ ...prev, submit: "Failed to save details. Try again." }));
    }
  }
};


  // --- PROGRESS BAR COMPONENT ---
  const ProgressBar = ({ currentStep }) => {
    const steps = ["Personal", "Contact", "Review"];
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-slate-900 to-blue-900 p-4 text-white text-xl">
          Loading...
        </div>
      );
    }

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((stepLabel, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-white transition-all duration-300 ${currentStep > index ? "bg-blue-600" : "bg-white/30"
                    }`}
                >
                  {index + 1}
                </div>
                <p
                  className={`mt-2 text-xs text-center ${currentStep > index ? "text-white" : "text-gray-400"
                    }`}
                >
                  {stepLabel}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all duration-300 ${currentStep > index + 1 ? "bg-blue-600" : "bg-white/30"
                    }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // --- RENDER LOGIC ---
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white text-center">
              Personal Information
            </h2>
            <div>
              <label className="text-gray-300">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
              />
              {errors.firstName && (
                <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="text-gray-300">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
              />
              {errors.lastName && (
                <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white text-center">
              Contact Details
            </h2>
            <div>
              <label className="text-gray-300">Phone Number</label>
              <PhoneInput
                international
                defaultCountry="IN" // or your desired default country
                value={formData.phone}
                onChange={(value) => {
                  setFormData({ ...formData, phone: value });
                  if (errors.phone) {
                    setErrors({ ...errors, phone: "" });
                  }
                }}
                className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
              />

              {errors.phone && (
                <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-white">
            <h2 className="text-2xl font-semibold text-center mb-6">
              Review Your Information
            </h2>
            <div className="bg-white/10 p-6 rounded-lg space-y-4">
              <p className="flex items-center">
                <FaUser className="mr-3 text-blue-300" /> <strong>Name:</strong>
                <span className="ml-2">
                  {formData.firstName} {formData.lastName}
                </span>
              </p>
              <hr className="border-white/20" />
              <p className="flex items-center">
                <FaPhone className="mr-3 text-blue-300" />{" "}
                <strong>Phone:</strong>
                <span className="ml-2">{formData.phone}</span>
              </p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold">Thank You!</h2>
            <p className="mt-4 text-lg">You have signed up successfully.</p>
            <p className="mt-2 text-gray-300">
              Redirecting you to the home page...
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  // If status is "Google", render only the phone input and keep the same visual theme
  if (status === "Google") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-slate-900 to-blue-900 p-4">
        <div className="w-full max-w-2xl p-8 space-y-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
          {/* No ProgressBar for Google flow */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white text-center">
                Add Mobile Number
              </h2>
              <div>
                <label className="text-gray-300">Phone Number</label>
                <PhoneInput
                  international
                  defaultCountry="IN" // or your desired default country
                  value={formData.phone}
                  onChange={(value) => {
                    setFormData({ ...formData, phone: value });
                    if (errors.phone) {
                      setErrors({ ...errors, phone: "" });
                    }
                  }}
                  className="w-full mt-1 px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Single submit button preserves the existing button styling */}
            <div className="flex justify-between mt-8">
              <button
                type="submit"
                className="w-full py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Otherwise, render the original multi-step design unchanged
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-slate-900 to-blue-900 p-4">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
        {/* Progress bar remains visible for steps 1–3 */}
        {step <= 3 && <ProgressBar currentStep={step} />}

        <form onSubmit={handleSubmit}>
          {renderStep()}

          {/* Main container for buttons hides on the final step */}
          {step < 4 && (
            <div className="flex justify-between mt-8">
              {step > 1 && step <= 3 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 font-semibold text-white bg-white/20 rounded-lg hover:bg-white/30 transition"
                >
                  Back
                </button>
              )}
              {step < 3 && (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition ml-auto"
                >
                  Next
                </button>
              )}
              {step === 3 && (
                <button
                  type="submit"
                  className="w-full py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                >
                  Confirm & Submit
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProcessForm;
