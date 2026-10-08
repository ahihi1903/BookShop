import { Outlet } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function CustomerLayout() {
  return <div className="customer-layout"><Header /><main className="customer-main"><Outlet /></main><Footer /></div>;
}
