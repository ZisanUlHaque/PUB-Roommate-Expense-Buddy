import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { pathProfile, pathPrefs } from "../utils/rtdbPaths";

// Sections

import HeroSection from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import FeaturesSection from "../components/FeaturesSection";
import CommunityPreview from "../components/CommunityPreview";
import TestimonialsSection from "../components/TestimonialsSection";

import Footer from "../components/Footer";
import AboutUs from "../components/AboutUs";


export default function Landing() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasPrefs, setHasPrefs] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const [pSnap, prefSnap] = await Promise.all([
            get(ref(db, pathProfile(u.uid))),
            get(ref(db, pathPrefs(u.uid))),
          ]);
          setHasProfile(!!pSnap.val());
          setHasPrefs(!!prefSnap.val());
        } catch (e) {
          console.warn("Onboarding check failed", e);
        }
      }
      setChecking(false);
    });
    return off;
  }, []);

  const handleGetStarted = () => {
    if (!user) return nav("/auth/sign-in");
    if (!hasProfile) return nav("/onboarding/profile");
    if (!hasPrefs) return nav("/onboarding/preferences");
    return nav("/matches");
  };

  return (
    <div className="bg-gray-50 text-gray-800">
      <HeroSection
        user={user}
        checking={checking}
        hasProfile={hasProfile}
        hasPrefs={hasPrefs}
        handleGetStarted={handleGetStarted}
      />
      <HowItWorks />
      <FeaturesSection />
      <AboutUs></AboutUs>
      <TestimonialsSection />
      <CommunityPreview />
    </div>
  );
}
