import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "./ProtectedRoute";
import { AuthLayout } from "@/layouts/auth-layout";
import { LearnerLayout } from "@/layouts/LearnerLayout";
import { MentorLayout } from "@/layouts/MentorLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import LoginPage from "@/pages/auth/Login";
import RegisterPage from "@/pages/auth/Register";
import WelcomePage from "@/pages/Welcome";
import { ProfilePage, SettingsPage } from "@/pages/common/AccountPages";
import MentorProfileApplyPage from "@/pages/mentor/MentorProfileApplyPage";
import { MentorGroups, Availability } from "@/pages/mentor/MentorExtraPages";
import { AdminReports, AdminSessions, AdminSettings, AdminSkills, AdminUsers } from "@/pages/admin/AdminExtraPages";
import { AdminReviewsPage, MentorReviewsPage, NotificationsPage } from "@/pages/common/CommunicationPages";
import { adminApi } from "@/services/api/adminApi";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

const LearnerDashboard = lazy(() => import("@/pages/learner/LearnerDashboard"));
const MentorList = lazy(() => import("@/pages/learner/MentorList"));
const MentorProfile = lazy(() => import("@/pages/learner/MentorProfile"));
const MySessions = lazy(() => import("@/pages/learner/MySessions"));
const LearnerProgress = lazy(() => import("@/pages/learner/LearnerProgress"));
const LearningGroups = lazy(() => import("@/pages/learner/LearningGroups"));
const BookSession = lazy(() => import("@/pages/learner/BookSession"));
const Reviews = lazy(() => import("@/pages/learner/Reviews"));
const MentorDashboard = lazy(() => import("@/pages/mentor/MentorDashboard"));
const SessionRequests = lazy(() => import("@/pages/mentor/SessionRequests"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));

function Fallback() { return <div className="flex min-h-screen items-center justify-center bg-slate-100"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-rose-600" /></div>; }
function RoleRedirect() { const { token, user, clearAuth } = useAuthStore(); if (token === "local-login-token") { clearAuth(); return <Navigate to="/auth/login" replace />; } if (!user) return <Navigate to="/auth/login" replace />; return <Navigate to="/welcome" replace />; }
function AuditPage() {
  const { data: mentorData, isLoading: mentorsLoading } = useQuery({
    queryKey: ["auditMentorApplications"],
    queryFn: () => adminApi.getMentors({ status: "ALL", page: 0, size: 50, sortBy: "id", sortDir: "desc" }),
  });
  const { data: userData, isLoading: usersLoading } = useQuery({
    queryKey: ["auditUsers"],
    queryFn: () => adminApi.getUsers({ page: 0, size: 50 }),
  });
  const { data: skillData, isLoading: skillsLoading } = useQuery({
    queryKey: ["auditSkills"],
    queryFn: () => adminApi.getSkills({ page: 0, size: 50, sortBy: "id", sortDir: "desc" }),
  });

  const mentors = mentorData?.content || mentorData || [];
  const users = userData?.content || userData || [];
  const skills = skillData?.content || skillData || [];
  const auditRows = [
    ...mentors.map((mentor) => ({
      id: `mentor-${mentor.id}`,
      event: "Mentor application",
      actor: "Admin",
      target: mentor.displayName || mentor.email || `Mentor ${mentor.id}`,
      status: mentor.status || "PENDING",
      details: `${mentor.experienceYears ?? "-"} yrs, ${mentor.hourlyRate ? `₹${mentor.hourlyRate}/hr` : "rate not set"}`,
    })),
    ...users.map((user) => ({
      id: `user-${user.id}`,
      event: "User account",
      actor: user.fullName || user.name || "User",
      target: user.email || `User ${user.id}`,
      status: user.status || "Active",
      details: user.role || "Registered profile",
    })),
    ...skills.map((skill) => ({
      id: `skill-${skill.id}`,
      event: "Skill available",
      actor: "Admin",
      target: skill.name || `Skill ${skill.id}`,
      status: "Active",
      details: skill.category || "Platform skill",
    })),
  ];
  const isLoading = mentorsLoading || usersLoading || skillsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Audit Log" description="Review recent platform records and admin decisions" />
      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-4 text-sm font-semibold text-slate-500">Loading audit log...</p>
        ) : auditRows.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No audit records yet" description="Users, mentor decisions, and skills will appear here." />
        ) : (
          <table>
            <thead>
              <tr><th>Event</th><th>Actor</th><th>Target</th><th>Details</th><th>Status</th></tr>
            </thead>
            <tbody>
              {auditRows.map((row) => (
                <tr key={row.id}>
                  <td className="font-extrabold">{row.event}</td>
                  <td>{row.actor}</td>
                  <td>{row.target}</td>
                  <td>{row.details}</td>
                  <td><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/auth" element={<AuthLayout />}>
            <Route index element={<Navigate to="/auth/login" replace />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["ROLE_LEARNER", "ROLE_MENTOR", "ROLE_ADMIN"]} />}>
            <Route path="/welcome" element={<WelcomePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["ROLE_LEARNER"]} />}>
            <Route element={<LearnerLayout />}>
              <Route path="/learner/dashboard" element={<LearnerDashboard />} />
              <Route path="/learner/mentors" element={<MentorList />} />
              <Route path="/learner/mentors/:id" element={<MentorProfile />} />
              <Route path="/learner/mentors/:id/book" element={<BookSession />} />
              <Route path="/learner/sessions" element={<MySessions />} />
              <Route path="/learner/progress" element={<LearnerProgress />} />
              <Route path="/learner/groups" element={<LearningGroups />} />
              <Route path="/learner/reviews" element={<Reviews />} />
              <Route path="/learner/notifications" element={<NotificationsPage role="Learner" />} />
              <Route path="/learner/profile" element={<ProfilePage role="Learner" tone="rose" />} />
              <Route path="/learner/settings" element={<SettingsPage role="Learner" />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["ROLE_MENTOR"]} />}>
            <Route element={<MentorLayout />}>
              <Route path="/mentor/dashboard" element={<MentorDashboard />} />
              <Route path="/mentor/requests" element={<SessionRequests />} />
              <Route path="/mentor/groups" element={<MentorGroups />} />
              <Route path="/mentor/availability" element={<Availability />} />
              <Route path="/mentor/reviews" element={<MentorReviewsPage />} />
              <Route path="/mentor/notifications" element={<NotificationsPage role="Mentor" />} />
              <Route path="/mentor/profile" element={<MentorProfileApplyPage />} />
              <Route path="/mentor/settings" element={<SettingsPage role="Mentor" />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/sessions" element={<AdminSessions />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/reviews" element={<AdminReviewsPage />} />
              <Route path="/admin/notifications" element={<NotificationsPage role="Admin" />} />
              <Route path="/admin/skills" element={<AdminSkills />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/profile" element={<ProfilePage role="Admin" tone="blue" />} />
              <Route path="/admin/audit" element={<AuditPage />} />
            </Route>
          </Route>

          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
