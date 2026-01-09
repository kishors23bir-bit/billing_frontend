import { NavLink, Link } from 'react-router-dom';
import '../pages/Home.css';
import './Sidebar.css';
import logo from '../image/logo.png';
import homeIcon from '../image/icons/home.svg';
import partiesIcon from '../image/icons/parties.svg';
import salesIcon from '../image/icons/sales.svg';
import addIcon from '../image/icons/add.svg';
import itemIcon from '../image/icons/item.svg';
import purchasesIcon from '../image/icons/purchases.svg';
import reportsIcon from '../image/icons/reports.svg';
import cashIcon from '../image/icons/cash.svg';
import staffIcon from '../image/icons/staff.svg';
import settingsIcon from '../image/icons/settings.svg';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar__content">
          <div className="sidebar__brand sidebar__brand--compact">
          <div className="sidebar__logo">
            <img src={logo} alt="Company Logo" className="sidebar__logo-img" />
          </div>
          <div className="sidebar__brand-meta">
            <p className="sidebar__title">SEVVEL GARMENTS</p>
            <p className="sidebar__subtitle">8667488669</p>
          </div>
        </div>
        <div className="sidebar__actions">
          <NavLink to="/sales-invoice" className="sidebar__cta">+ Create Sales Invoice</NavLink>
        </div>
        <nav className="sidebar__nav">
          <p className="sidebar__section">GENERAL</p>
          <NavLink to="/home" className={({ isActive }) => `sidebar__nav-item${isActive ? ' active' : ''}`} end>
              <img src={homeIcon} alt="Dashboard" className="nav-icon-img" />
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink to="/parties" className={({ isActive }) => `sidebar__nav-item${isActive ? ' active' : ''}`}>
              <img src={partiesIcon} alt="Parties" className="nav-icon-img" />
            <span className="nav-label">Parties</span>
          </NavLink>
          <p className="sidebar__section">SALES</p>
          <NavLink to="/sales-invoice" className={({ isActive }) => `sidebar__nav-item${isActive ? ' active' : ''}`}>
              <img src={salesIcon} alt="Sales" className="nav-icon-img" />
            <span className="nav-label">Sales</span>
          </NavLink>
          <NavLink to="/bills" className={({ isActive }) => `sidebar__nav-item${isActive ? ' active' : ''}`}>
              <img src={reportsIcon} alt="Bills" className="nav-icon-img" />
            <span className="nav-label">Bills</span>
          </NavLink>
          <NavLink to="/items" className={({ isActive }) => `sidebar__nav-item add-item${isActive ? ' active' : ''}`}>
              <img src={itemIcon} alt="Item" className="nav-icon-img" />
            <span className="nav-label">Item</span>
          </NavLink>
          <NavLink to="/purchase-invoices" className={({ isActive }) => `sidebar__nav-item${isActive ? ' active' : ''}`}>
              <img src={purchasesIcon} alt="Purchases" className="nav-icon-img" />
            <span className="nav-label">Purchases</span>
          </NavLink>
          <NavLink to="#" className={({ isActive }) => `sidebar__nav-item${isActive ? ' active' : ''} disabled`}>
              <img src={reportsIcon} alt="Reports" className="nav-icon-img" />
            <span className="nav-label">Reports</span>
          </NavLink>
          <p className="sidebar__section">ACCOUNTING SOLUTIONS</p>
          <NavLink to="#" className={({ isActive }) => `sidebar__nav-item${isActive ? ' active' : ''} disabled`}>
              <img src={cashIcon} alt="Cash & Bank" className="nav-icon-img" />
            <span className="nav-label">Cash & Bank</span>
          </NavLink>
          <p className="sidebar__section">BUSINESS TOOLS</p>
          <NavLink to="/staff-attendance" className={({ isActive }) => `sidebar__nav-item${isActive ? ' active' : ''}`}>
              <img src={staffIcon} alt="Staff Attendance" className="nav-icon-img" />
            <span className="nav-label">Staff Attendance</span>
          </NavLink>
          <div className="sidebar__footer">
              <NavLink to="#" className="sidebar__nav-item footer-link disabled">
                <img src={settingsIcon} alt="Settings" className="nav-icon-img" />
                <span className="nav-label">Settings</span>
              </NavLink>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
