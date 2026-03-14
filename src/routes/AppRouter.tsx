// src/AppRouter.tsx (or wherever your router lives)
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import {
  ConfirmEmail,
  Home,
  Login,
  SignUp,
  VerifyEmailPage,
  RecentVenture,
  Chat,
  NewVenture,
  AboutUs,
  LearnMore,
  TermsAndConditions,
  PrivacyPolicy,
  Startups,
  Enterprise,
  CaseStudies,
  Partners,
  Blog,
  Documentation,
  Guides,
  Support,
  Services,
  Profile,
  NotFound,
  ErrorBoundaryPage,
} from "../pages";
import BudgetPage from "../pages/Budget/BudgetPage";
import ForgotPasswordPage from "../pages/ForgotPassword";
import ResetPasswordPage from "../pages/ResetPassword";
import RoadmapPage from "../pages/Roadmap/RoadmapPage";
import BusinessPlanView from "../pages/BusinessPlan/BusinessPlanView";
import Layout from "../features/Dashboard";
import ChatLayout from "../layout/chatLayout";
import TestQuestionFormatter from "../pages/TestQuestionFormatter";
import AcceptanceGuard from "../components/AcceptanceGuard";

const isAuthenticated = (): boolean =>
  !!localStorage.getItem("sb_access_token");

// Helper: if logged in → redirect to /ventures, otherwise render the given component
const redirectIfAuth = (component: React.ReactElement) =>
  isAuthenticated() ? <Navigate to="/ventures" replace /> : component;

// PrivateRoute stays the same
interface PrivateRouteProps {
  children: React.ReactElement;
}
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) =>
  isAuthenticated() ? children : <Navigate to="/login" replace />;

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorBoundaryPage />,
    children: [
      {
        path: "auth/confirm",
        element: <ConfirmEmail />,
        errorElement: <ConfirmEmail />,
      },
      {
        path: "verify-email",
        element: redirectIfAuth(<VerifyEmailPage />),
        errorElement: <VerifyEmailPage />,
      },
      {
        path: "signup",
        element: redirectIfAuth(<SignUp />),
        errorElement: <SignUp />,
      },
      {
        path: "login",
        element: redirectIfAuth(<Login />),
        errorElement: <Login />,
      },
      {
        path: "forgot-password",
        element: redirectIfAuth(<ForgotPasswordPage />),
        errorElement: <ForgotPasswordPage />,
      },
      {
        path: "reset-password",
        element: redirectIfAuth(<ResetPasswordPage />),
        errorElement: <ResetPasswordPage />,
      },
      {
        path: "/",
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: "ventures",
            element: (
              <PrivateRoute>
                <AcceptanceGuard>
                  <ChatLayout />
                </AcceptanceGuard>
              </PrivateRoute>
            ),
            children: [
              {
                index: true,
                element: <RecentVenture />,
              },
              {
                path: "new-session",
                element: <NewVenture />,
              },
              {
                path: ":id",
                element: <Chat />,
              },
              {
                path: ":id/roadmap",
                element: <RoadmapPage />,
              },
              {
                path: ":id/business-plan",
                element: <BusinessPlanView />,
              },
              {
                path: ":id/budget",
                element: <BudgetPage />,
              },
            ],
          },
          {
            path: "/about",
            element: <AboutUs />,
            errorElement: <AboutUs />,
          },
          {
            path: "/learn-more",
            element: <LearnMore />,
            errorElement: <LearnMore />,
          },
          {
            path: "/terms-and-conditions",
            element: <TermsAndConditions />,
            errorElement: <TermsAndConditions />,
          },
          {
            path: "/privacy-policy",
            element: <PrivacyPolicy />,
            errorElement: <PrivacyPolicy />,
          },
          {
            path: "/businesses",
            element: <Navigate to="/" replace />,
          },
          {
            path: "/startups",
            element: <Startups />,
            errorElement: <Startups />,
          },
          {
            path: "/enterprise",
            element: <Enterprise />,
            errorElement: <Enterprise />,
          },
          {
            path: "/case-studies",
            element: <CaseStudies />,
            errorElement: <CaseStudies />,
          },
          {
            path: "/partners",
            element: <Partners />,
            errorElement: <Partners />,
          },
          {
            path: "/blog",
            element: <Blog />,
            errorElement: <Blog />,
          },
          {
            path: "/documentation",
            element: <Documentation />,
            errorElement: <Documentation />,
          },
          {
            path: "/guides",
            element: <Guides />,
            errorElement: <Guides />,
          },
          {
            path: "/support",
            element: <Support />,
            errorElement: <Support />,
          },
          {
            path: "/faq",
            element: <Support />,
            errorElement: <Support />,
          },
          {
            path: "/contact",
            element: <Support />,
            errorElement: <Support />,
          },
          {
            path: "/services",
            element: <Services />,
            errorElement: <Services />,
          },
          {
            path: "/profile",
            element: (
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            ),
            errorElement: <Profile />,
          },
          {
            path: "/test-question-formatter",
            element: <TestQuestionFormatter />,
          },
          {
            path: "*",
            element: <NotFound />,
            errorElement: <ErrorBoundaryPage />,
          },
        ],
      },
      {
        path: "*",
        element: <NotFound />,
        errorElement: <ErrorBoundaryPage />,
      },
    ],
  },
]);

export default router;
