import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/convolution', label: 'Convolution' },
  { path: '/activation', label: 'Activation' },
  { path: '/pooling', label: 'Pooling' },
  { path: '/flatten', label: 'Flatten' },
  { path: '/dense', label: 'Dense' },
  { path: '/architecture', label: 'Architecture' },
  { path: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="border-b nav-stable w-full bg-white overflow-x-hidden" style={{ textAlign: 'left' }}>
      <div className="w-full max-w-full px-3 mx-auto">
        <div className="flex items-center justify-between h-14 min-h-[56px] w-full">
          {/* Logo always visible, left-aligned, fixed height */}
          <div className="flex items-center flex-shrink-0 min-w-0">
            <NavLink to="/" aria-label="Home" className="flex items-center">
              <img
                src={`${import.meta.env.BASE_URL}techlogo.svg`}
                alt="TechProjectHub logo"
                className="h-20 w-auto object-contain logo-sharp"
                style={{
                  maxHeight: 200,
                  minHeight: 150,
                  width: 'auto',
                  imageRendering: 'auto',
                  filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.10)) drop-shadow(0 0 1.5px rgba(0,0,0,0.12))',
                  display: 'block',
                  background: 'transparent'
                }}
                onError={(e) => {
                  // Fallback to PNG if SVG is missing
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = `${import.meta.env.BASE_URL}techlogo.png`;
                }}
                draggable={false}
                decoding="async"
                loading="eager"
              />
            </NavLink>
          </div>

          {/* Desktop Navigation (hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-foreground accent-text accent-border' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Hamburger for mobile, right-aligned */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden fixed left-0 top-14 w-full z-40 bg-white border-b border-slate-200 shadow-md">
            <div className="flex flex-col w-full">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full text-left px-6 py-4 text-base font-medium border-b border-slate-100 last:border-b-0 transition-colors ${
                      isActive ? 'text-foreground bg-slate-100 accent-border' : 'text-muted-foreground hover:text-foreground hover:bg-slate-50'
                    }`
                  }
                  style={{ minHeight: 48, touchAction: 'manipulation' }}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
