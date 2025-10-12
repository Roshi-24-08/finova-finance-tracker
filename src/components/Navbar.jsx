import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">Finance Tracker</div>
        <ul className="navbar-links">
          <li>
            <Link 
              to="/" 
              className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              to="/transactions" 
              className={`navbar-link ${location.pathname === '/transactions' ? 'active' : ''}`}
            >
              Transactions
            </Link>
          </li>
          <li>
            <Link 
              to="/budgets-goals" 
              className={`navbar-link ${location.pathname === '/budgets-goals' ? 'active' : ''}`}
            >
              Budgets & Goals
            </Link>
          </li>
          <li>
            <Link 
              to="/reports" 
              className={`navbar-link ${location.pathname === '/reports' ? 'active' : ''}`}
            >
              Reports
            </Link>
          </li>
        </ul>
        <button className="navbar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
