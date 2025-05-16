import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Templates from '@/pages/Templates';
import QueueList from '@/pages/QueueList';
import JobDetails from '@/pages/JobDetails';
import QueueDetail from './pages/QueueDetail';
import AccountPage from './pages/Account';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="queue-dashboard-theme">
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
            <Route path="queues" element={<QueueList />} />
            <Route path="queues/jobs/:queueName" element={<QueueDetail />} />
            <Route path="queues/jobs/:queueName/:jobId" element={<JobDetails />} />
            <Route path="templates" element={<Templates />} />
            <Route path="accounts" element={<AccountPage />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
