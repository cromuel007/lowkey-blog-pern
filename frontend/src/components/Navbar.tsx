import { useEffect, useState } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getAsset } from "../utils/useAssets";

interface NavbarProps {
  onContactClick: () => void;
  onSearch?: (query: string) => void;
}

const links = ['Home', 'Portfolio', 'Contact'];

export default function Navbar({ onContactClick, onSearch }: NavbarProps) {
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('Home');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isHomePage = location.pathname === '/';

  const handleLinkClick = (link: string) => {
    setActiveLink(link);
    setOpen(false);

    if (link === 'Contact') {
      onContactClick();
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value.trim());
  };

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    onSearch?.('');
  };

  useEffect(() => {
    if (!isHomePage) {
      setSearchOpen(false);
      setSearchQuery('');
      onSearch?.('');
    }
  }, [isHomePage, onSearch]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <nav className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Main navbar */}
        <div className="flex min-h-[72px] items-center justify-between gap-3">
          {/* Logo */}
          <a
            href="/"
            onClick={() => handleLinkClick('Home')}
            className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight"
          >
            <img
              src={getAsset('globe.png')}
              alt="world duh"
              className="h-8 w-8 shrink-0 object-contain"
            />

            <span className="whitespace-nowrap">
              LOWKEY BLOG
            </span>
          </a>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {/* Desktop navigation */}
            <ul className="hidden items-center gap-8 text-sm font-medium text-slate md:flex">
              {/* Desktop search - Home only */}
              {isHomePage && (
                <li>
                  {searchOpen ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />

                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          placeholder="Search posts..."
                          autoFocus
                          className="w-120 appearance-none rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent [&::-webkit-search-cancel-button]:appearance-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleCloseSearch}
                        className="rounded-lg p-2 text-slate transition-colors hover:bg-slate-100 hover:text-ink"
                        aria-label="Close search"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className="rounded-lg p-2 text-slate transition-colors hover:bg-slate-100 hover:text-ink"
                      aria-label="Search"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                  )}
                </li>
              )}

              {/* Navigation links */}
              {links.map((link) => {
                const isActive = activeLink === link;

                return (
                  <li key={link}>
                    {link === 'Portfolio' ? (
                      <a
                        href="https://tubbylab.com/"
                        className="pb-1 transition-colors hover:text-ink"
                      >
                        {link}
                      </a>
                    ) : (
                      <a
                        href={
                          link === 'Home'
                            ? '/'
                            : `#${link.toLowerCase()}`
                        }
                        onClick={() => handleLinkClick(link)}
                        className={
                          isActive
                            ? 'border-b-2 border-accent pb-1 text-accent'
                            : 'pb-1 transition-colors hover:text-ink'
                        }
                      >
                        {link}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Mobile search button - Home only */}
            {isHomePage && (
              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-slate transition-colors hover:bg-slate-100 hover:text-ink md:hidden"
                onClick={() => {
                  if (searchOpen) {
                    handleCloseSearch();
                  } else {
                    setSearchOpen(true);
                  }
                }}
                aria-label={searchOpen ? "Close search" : "Search"}
              >
                {searchOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>
            )}

            {/* Mobile menu */}
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-line p-2 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

      </nav>

      {/* Mobile search row - Home only */}
      {isHomePage && searchOpen && (
        <div className="border-t border-line py-5 md:hidden">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate" />

              <input
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search posts..."
                autoFocus
                className="w-full rounded-lg border border-line bg-white py-2 pl-10 pr-3 text-sm outline-none transition-colors focus:border-accent [&::-webkit-search-cancel-button]:appearance-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-line bg-white px-4 py-4 sm:px-6 md:hidden">
          <ul className="flex flex-col gap-4 text-sm font-medium text-slate">
            {links.map((link) => {
              const isActive = activeLink === link;

              return (
                <li key={link}>
                  {link === 'Portfolio' ? (
                    <a
                      href="https://tubbylab.com/"
                      onClick={() => setOpen(false)}
                      className="transition-colors hover:text-ink"
                    >
                      {link}
                    </a>
                  ) : (
                    <a
                      href={
                        link === 'Home'
                          ? '/'
                          : `#${link.toLowerCase()}`
                      }
                      onClick={() => handleLinkClick(link)}
                      className={
                        isActive
                          ? 'font-semibold text-accent'
                          : 'transition-colors hover:text-ink'
                      }
                    >
                      {link}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}