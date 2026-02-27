import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Applications from "./pages/Applications";
import Integrations from "./pages/Integrations";
import Models from "./pages/Models";
import Reports from "./pages/Reports";
import Fairness from "./pages/Fairness";
import Developers from "./pages/Developers";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/models" element={<Models />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/fairness" element={<Fairness />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
