import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Templates from '@/pages/Templates';
import Queues from '@/pages/Queues';
import JobDetails from '@/pages/JobDetails';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="queue-dashboard-theme">
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="queues" element={<Queues />} />
            <Route path="queues/jobs/:jobId" element={<JobDetails />} />
            <Route path="templates" element={<Templates />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;