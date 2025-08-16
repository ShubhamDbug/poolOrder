// src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'

// Providers
import { AuthProvider } from '@/contexts/AuthContext'
import { ApiProvider } from '@/contexts/ApiContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

// Pages
import Nearby from './Pages/Nearby.jsx'
import Create from './Pages/Create.jsx'
import Mine from './Pages/Mine.jsx'
import Chat from './Pages/Chat.jsx'

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <ApiProvider>
          <ToastProvider>
            <BrowserRouter>
              <App>
                <Routes>
                  <Route path="/" element={<Nearby />} />
                  <Route path="/create" element={<Create />} />
                  <Route path="/mine" element={<Mine />} />
                  <Route path="/chat/:id" element={<Chat />} />
                </Routes>
              </App>
            </BrowserRouter>
          </ToastProvider>
        </ApiProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
)
