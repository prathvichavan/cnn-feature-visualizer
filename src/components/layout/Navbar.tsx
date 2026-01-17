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
  { path: '/datasets', label: 'Datasets' },
  { path: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="border-b nav-stable nav-height-even doc-navbar" style={{ textAlign: 'left' }}>
      <div className="max-w-6xl mx-auto px-3 w-full">
        <div className="nav-inner" style={{ height: 64 }}>
          {/* Left: Logo */}
          <div className="nav-left">
            <NavLink to="/" aria-label="Home" className="flex items-center">
              <img
                src={`${import.meta.env.BASE_URL}techlogo.svg`}
                alt="TechProjectHub logo"
                className="h-[150px] w-auto object-contain"
                style={{
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

          {/* Right: Navigation + Mobile Toggle */}
          <div className="nav-right">
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

            <div className="flex lg:hidden items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-muted-foreground"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden pb-4">
            <div className="flex flex-col gap-1 p-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium ${
                      isActive ? 'text-foreground underline underline-offset-2' : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
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
