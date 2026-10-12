import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { SiteLayout } from './components/SiteLayout';
import { AccountDeletion } from './pages/AccountDeletion';
import { Home } from './pages/Home';
import { Privacy } from './pages/Privacy';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="account-deletion" element={<AccountDeletion />} />
          <Route path="delete-account" element={<AccountDeletion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
