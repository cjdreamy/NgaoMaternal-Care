import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layouts/Header';
import { ChatBot } from '@/components/features/ChatBot';
import routes from './routes';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { RouteGuard } from '@/components/common/RouteGuard';

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <RouteGuard>
            <IntersectObserver />
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Routes>
                  {routes.map((route, index) => (
                    <Route
                      key={index}
                      path={route.path}
                      element={route.element}
                    />
                  ))}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
            <ChatBot />
            <Toaster />
          </RouteGuard>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
