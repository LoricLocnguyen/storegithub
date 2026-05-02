import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom"; // Chuyển sang HashRouter
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import RepoAnalysis from "./pages/RepoAnalysis.tsx";
import Airdrop from "./pages/Airdrop.tsx";
import Explore from "./pages/Explore.tsx";
import Notes from "./pages/Notes.tsx";
import Auth from "./pages/Auth.tsx";
import Collections from "./pages/Collections.tsx";
import CollectionDetail from "./pages/CollectionDetail.tsx";
import CompareRepos from "./pages/CompareRepos.tsx";
import Roadmaps from "./pages/Roadmaps.tsx";
import RoadmapDetail from "./pages/RoadmapDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* HashRouter giúp ứng dụng chạy mượt mà trên GitHub Pages mà không cần basename */}
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/analysis" element={<RepoAnalysis />} />
            <Route path="/airdrop" element={<Airdrop />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:id" element={<CollectionDetail />} />
            <Route path="/compare" element={<CompareRepos />} />
            <Route path="/roadmaps" element={<Roadmaps />} />
            <Route path="/roadmaps/:id" element={<RoadmapDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
