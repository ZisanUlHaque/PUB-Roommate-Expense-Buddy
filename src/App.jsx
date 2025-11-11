import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import ProfileSetup from "./pages/ProfileSetup";
import PreferencesSetup from "./pages/PreferencesSetup";
import Matches from "./pages/Matches";
import GroupList from "./pages/GroupList";
import GroupDetail from "./pages/GroupDetail";
import AddExpense from "./pages/AddExpense";
import Community from "./pages/Community";
import CreatePost from "./pages/CreatePost";
import { ToastProvider } from "./components/Toast";
import AboutSection from "./components/AboutUs";
import Footer from "./components/Footer";
import MyProfile from "./pages/MyProfile";
import Invites from "./pages/Invites";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <ToastProvider>
        <Navbar />
        <div>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/sign-in" element={<SignIn />} />
            <Route
              path="/onboarding/profile"
              element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/preferences"
              element={
                <ProtectedRoute>
                  <PreferencesSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <Matches />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups"
              element={
                <ProtectedRoute>
                  <GroupList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:id"
              element={
                <ProtectedRoute>
                  <GroupDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:id/expenses/add"
              element={
                <ProtectedRoute>
                  <AddExpense />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community"
              element={
                <ProtectedRoute>
                  <Community />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MyProfile></MyProfile>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invites"
              element={
                <ProtectedRoute>
                  <Invites />
                </ProtectedRoute>
              }
            />
            <Route path="/about" element={<AboutSection></AboutSection>} />

            <Route
              path="/community/create"
              element={
                <ProtectedRoute>
                  <CreatePost />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        <Footer></Footer>
      </ToastProvider>
    </div>
  );
}
