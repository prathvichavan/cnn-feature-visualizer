import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SinglePageView from "./pages/SinglePageView";
import ConvolutionPage from "./pages/ConvolutionPage";
import ActivationPage from "./pages/ActivationPage";
import PoolingPage from "./pages/PoolingPage";
import FlattenPage from "./pages/FlattenPage";
import DensePage from "./pages/DensePage";
import ArchitecturePage from "./pages/ArchitecturePage";
import ContactPage from "./pages/ContactPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/cnn-feature-visualizer">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/single-page" element={<SinglePageView />} />
          <Route path="/convolution" element={<ConvolutionPage />} />
          <Route path="/activation" element={<ActivationPage />} />
          <Route path="/pooling" element={<PoolingPage />} />
          <Route path="/flatten" element={<FlattenPage />} />
          <Route path="/dense" element={<DensePage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/contact" element={<ContactPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
