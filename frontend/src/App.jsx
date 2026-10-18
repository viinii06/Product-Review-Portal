import { useEffect, useState } from 'react';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Login from './pages/Login.jsx';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Product Review Portal';

// Tiny hash router: #/, #/login, #/products/:id
function useRoute() {
  const read = () => window.location.hash.slice(1) || '/';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export default function App() {
  const route = useRoute();
  const [user, setUser] = useState(loadUser);

  function handleLogin(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  const productMatch = route.match(/^\/products\/(\d+)$/);
  let page;
  if (route === '/login') page = <Login onLogin={handleLogin} />;
  else if (productMatch) page = <ProductDetail id={productMatch[1]} user={user} onLogout={logout} />;
  else page = <Products />;

  return (
    <>
      <header className="topbar">
        <a href="#/" className="brand">
          ★ {APP_NAME}
        </a>
        <nav>
          {user ? (
            <>
              <span className="hello">Hi, {user.name}</span>
              <button className="btn btn-small" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <a href="#/login" className="btn btn-small">
              Log in
            </a>
          )}
        </nav>
      </header>
      <main className="container">{page}</main>
    </>
  );
}
