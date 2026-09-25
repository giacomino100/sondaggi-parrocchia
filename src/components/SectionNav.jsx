import { NavLink } from 'react-router-dom'

export default function SectionNav() {
  return (
    <nav className="section-nav">
      <NavLink to="/dashboard" className={({ isActive }) => `section-nav__tab${isActive ? ' section-nav__tab--active' : ''}`}>
        📋 Sondaggi
      </NavLink>
      <NavLink to="/iscrizioni" end className={({ isActive }) => `section-nav__tab${isActive ? ' section-nav__tab--active' : ''}`}>
        📝 Iscrizioni
      </NavLink>
    </nav>
  )
}
