import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StoreLayout } from './layouts/StoreLayout';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Checkout } from './pages/Checkout';
import { NotFound } from './pages/NotFound';
import { CartProvider } from './store/cart';
import { CatalogProvider } from './store/catalog';
import { AuthProvider } from './store/auth';
import { AccountLogin } from './pages/AccountLogin';
import { AccountRegister } from './pages/AccountRegister';
import { AccountOrders } from './pages/AccountOrders';
import { OrderConfirmed } from './pages/OrderConfirmed';
import { AccountProfile } from './pages/AccountProfile';
import { OrderDetail } from './pages/OrderDetail';
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminCatalog } from './admin/AdminCatalog';
import { AdminHome } from './admin/AdminHome';
import { AdminSettings } from './admin/AdminSettings';
import { AdminCategoryEdit } from './admin/AdminCategoryEdit';
import { AdminProductEdit } from './admin/AdminProductEdit';
import { AdminHeroEdit } from './admin/AdminHeroEdit';
import { AdminFeatureEdit } from './admin/AdminFeatureEdit';
import { AdminPromoEdit } from './admin/AdminPromoEdit';
import { AdminHomeCategoryEdit } from './admin/AdminHomeCategoryEdit';
import { AdminHomeProductEdit } from './admin/AdminHomeProductEdit';
import { AdminSiteSettingsEdit } from './admin/AdminSiteSettingsEdit';
import { AdminSocialEdit } from './admin/AdminSocialEdit';
import { AdminBadgeEdit } from './admin/AdminBadgeEdit';
import { AdminOrders } from './admin/AdminOrders';

export default function App() {
  return (
    <BrowserRouter>
      <CatalogProvider>
        <CartProvider>
          <AuthProvider>
            <Routes>
              <Route path="admin/login" element={<AdminLogin />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="catalog" element={<AdminCatalog />} />
                <Route path="catalog/categories/:id" element={<AdminCategoryEdit />} />
                <Route path="catalog/products/:id" element={<AdminProductEdit />} />
                <Route path="home" element={<AdminHome />} />
                <Route path="home/hero" element={<AdminHeroEdit />} />
                <Route path="home/features/:id" element={<AdminFeatureEdit />} />
                <Route path="home/promos/:id" element={<AdminPromoEdit />} />
                <Route path="home/home-categories/:id" element={<AdminHomeCategoryEdit />} />
              <Route path="home/home-products/:id" element={<AdminHomeProductEdit />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="settings" element={<AdminSettings />} />
                <Route path="settings/site" element={<AdminSiteSettingsEdit />} />
                <Route path="settings/social-links/:id" element={<AdminSocialEdit />} />
                <Route path="settings/payment-badges/:id" element={<AdminBadgeEdit />} />
              </Route>
              <Route element={<StoreLayout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:slug" element={<ProductDetail />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="order-confirmed" element={<OrderConfirmed />} />
                <Route path="account/login" element={<AccountLogin />} />
                <Route path="account/register" element={<AccountRegister />} />
                <Route path="account/orders" element={<AccountOrders />} />
                <Route path="account/orders/:id" element={<OrderDetail />} />
                <Route path="account/profile" element={<AccountProfile />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AuthProvider>
        </CartProvider>
      </CatalogProvider>
    </BrowserRouter>
  );
}
