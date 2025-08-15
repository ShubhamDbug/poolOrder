import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'

// your pages
import Nearby from './Pages/Nearby.jsx'
import Create from './Pages/Create.jsx'
import Mine from './Pages/Mine.jsx'
import Chat from './Pages/Chat.jsx'

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
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
  </ErrorBoundary>
)
