import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TemplateSelector from './pages/TemplateSelector'
import SurveyEditor from './pages/SurveyEditor'
import SurveyResults from './pages/SurveyResults'
import PublicSurvey from './pages/PublicSurvey'
import Registrations from './pages/Registrations'
import RegistrationEntries from './pages/RegistrationEntries'
import PublicRegistration from './pages/PublicRegistration'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/s/:surveyId" element={<PublicSurvey />} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route
        path="/sondaggi/nuovo"
        element={<ProtectedRoute><TemplateSelector /></ProtectedRoute>}
      />
      <Route
        path="/sondaggi/crea"
        element={<ProtectedRoute><SurveyEditor /></ProtectedRoute>}
      />
      <Route
        path="/sondaggi/:surveyId/modifica"
        element={<ProtectedRoute><SurveyEditor /></ProtectedRoute>}
      />
      <Route
        path="/sondaggi/:surveyId/risultati"
        element={<ProtectedRoute><SurveyResults /></ProtectedRoute>}
      />
      <Route path="/i/:registrationId" element={<PublicRegistration />} />
      <Route
        path="/iscrizioni"
        element={<ProtectedRoute><Registrations /></ProtectedRoute>}
      />
      <Route
        path="/iscrizioni/:registrationId"
        element={<ProtectedRoute><RegistrationEntries /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
