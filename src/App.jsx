import { ToastContainer } from 'react-toastify'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { GeminiProvider } from './context/GeminiContext'
import LandingPage from './landingpage/pages/LandingPage'
import Login from './landingpage/pages/Login'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import LandinPageLayout from './LandinPageLayout'
import AppLayout from './AppLayout'
import { InputProvider } from './context/InputContext'
import { OutputProvider } from './context/OutputContext'
import { FollowUpProvider } from './context/FollowupContext'
import History from './pages/History'
import PricingPage from './pages/PricingPage'
import Waitlist from './landingpage/pages/Waitlist'
import ProtectedRoute from './ProtectedRoute'
import PrivacyPolicy from './landingpage/pages/PrivacyPolicy'
import Terms from './landingpage/pages/Terms'
import Contact from './landingpage/pages/Contact'
import PageNotFound from './landingpage/pages/PageNotFound'

function App() {

  return (
    <BrowserRouter>
      <AuthProvider>

        <FollowUpProvider>
          <OutputProvider>
            <InputProvider>
              <GeminiProvider>
                <Routes>
                  {/* Landing page */}
                  <Route element={<LandinPageLayout />}>
                    <Route path='/login' element={<Login />} />
                    <Route path='/' element={<LandingPage />} />
                    <Route path='/waitlist' element={<Waitlist />} />
                    <Route path='/privacy' element={<PrivacyPolicy />} />
                    <Route path='/terms' element={<Terms />} />
                    <Route path='/contact' element={<Contact />} />
                    <Route path='*' element={<PageNotFound />} />
                  </Route>

                  {/* Actual App */}
                  <Route path='/app' element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }>
                    {/* <Route path='/app' element={<AppLayout />}> */}
                    <Route index element={<Home />} />
                    <Route path='history' element={<History />} />
                    <Route path='pricing' element={<PricingPage />} />
                  </Route>
                </Routes>
                <ToastContainer theme='colored' autoClose={2000} />
              </GeminiProvider>
            </InputProvider>
          </OutputProvider>
        </FollowUpProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
