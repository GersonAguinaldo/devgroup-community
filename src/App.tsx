import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index.tsx";
import QuestionDetail from "./pages/QuestionDetail.tsx";
import AskQuestion from "./pages/AskQuestion.tsx";
import Tags from "./pages/Tags.tsx";
import Users from "./pages/Users.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Auth from "./pages/Auth.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminContent from "./pages/admin/AdminContent.tsx";
import AdminReports from "./pages/admin/AdminReports.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminTags from "./pages/admin/AdminTags.tsx";
import AdminAdmins from "./pages/admin/AdminAdmins.tsx";
import AdminRoadmap from "./pages/admin/AdminRoadmap.tsx";
import Badges from "./pages/Badges.tsx";
import Community from "./pages/Community.tsx";
import Communities from "./pages/Communities.tsx";
import CommunityDetail from "./pages/CommunityDetail.tsx";
import CommunityInvite from "./pages/CommunityInvite.tsx";
import Search from "./pages/Search.tsx";
import NotFound from "./pages/NotFound.tsx";
import RouteSeo from "./components/RouteSeo.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <RouteSeo />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/question/:id" element={<QuestionDetail />} />
              <Route path="/ask" element={<AskQuestion />} />
              <Route path="/tags" element={<Tags />} />
              <Route path="/users" element={<Users />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="/community" element={<Community />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/communities/:slug" element={<CommunityDetail />} />
              <Route path="/invite/community/:token" element={<CommunityInvite />} />
              <Route path="/search" element={<Search />} />
              <Route path="/user/:id" element={<UserProfile />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/content" element={<AdminContent />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/tags" element={<AdminTags />} />
              <Route path="/admin/admins" element={<AdminAdmins />} />
              <Route path="/admin/roadmap" element={<AdminRoadmap />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
