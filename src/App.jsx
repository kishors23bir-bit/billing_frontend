import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import SalesInvoice from './pages/SalesInvoice.jsx';
import Items from './pages/Items.jsx';
import AddItem from './pages/AddItem.jsx';
import Parties from './pages/Parties.jsx';
import StaffAttendance from './pages/StaffAttendance.jsx';
import PurchaseInvoices from './pages/PurchaseInvoices.jsx';
import CreatePurchaseInvoice from './pages/CreatePurchaseInvoice.jsx';
import Bills from './pages/Bills.jsx';
import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/sales-invoice" element={<SalesInvoice />} />
        <Route path="/purchase-invoices" element={<PurchaseInvoices />} />
        <Route path="/purchase-invoices/create" element={<CreatePurchaseInvoice />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/staff-attendance" element={<StaffAttendance />} />
        <Route path="/items" element={<Items />} />
        <Route path="/items/add" element={<AddItem />} />
        <Route path="/parties" element={<Parties />} />
      </Route>
    </Routes>
  );
}

export default App;
