import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { getAsset } from "../utils/useAssets";

interface NavbarProps {
  onContactClick: () => void;
}

const links = ['Home', 'Portfolio', 'Contact'];

export default function Navbar({ onContactClick }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('Home');

  const handleLinkClick = (link: string) => {
    setActiveLink(link);
    setOpen(false);

    if (link === 'Contact') {
      onContactClick();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <nav className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between px-6">
        <a
          href="/"
          onClick={() => handleLinkClick('Home')}
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <img
            src={getAsset('globe.png')}
            alt="world duh"
            className="h-8 w-8 object-contain"
          />
          LOWKEY BLOG
        </a>

        <ul className="hidden items-center gap-8 text-sm font-medium text-slate md:flex">
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
                    href={link === 'Home' ? '/' : `#${link.toLowerCase()}`}
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

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-line p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-white px-6 py-4 md:hidden">
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
                      href={link === 'Home' ? '/' : '#contact'}
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