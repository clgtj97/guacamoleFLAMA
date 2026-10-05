'use client';

import { useState, lazy, Suspense } from "react";
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load the 3D component
const NavbarLeafCanvas = lazy(() => import('./NavbarLeafCanvas').then(mod => ({ default: mod.NavbarLeafCanvas })));

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const resources = [
    {
      href: "escrow",
      text: "Escrow"
    },
    {
      href: "runes",
      text: "Marketplace"
    },
    {
      href: "mint",
      text: "MINT"
    },
    {
      href: "games",
      text: "Ferrari Room"
    }
  ];

  return (
    <header className="bg-white">
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <span className="sr-only">LucKEY</span>
            {/* Lazy loaded 3D Leaf with Suspense fallback */}
            <Suspense fallback={<div className="w-10 h-10 bg-green-100 rounded-full animate-pulse" />}>
              <NavbarLeafCanvas className="w-10 h-10" />
            </Suspense>
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-xl font-bold text-gray-900"
            >
              LucKEY
            </motion.span>
          </Link>
        </div>
        
        {/* Rest of the component remains the same... */}
        <div className="flex lg:hidden">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            type="button" 
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </motion.button>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-12">
          {resources.map(({ href, text }, index) => (     
            <motion.div
              key={href}
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
            >
              <Link
                to={href}
                className="text-sm/6 font-semibold text-gray-900 hover:text-green-600 transition-colors"
              >
                {text}
              </Link>
            </motion.div>
          ))}
        </div>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end ml-10">
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Link 
              to="#" 
              className="text-sm/6 font-semibold text-gray-900 hover:text-green-600 transition-colors"
            >
              Log in <span aria-hidden="true">&rarr;</span>
            </Link>
          </motion.div>
        </div>
      </motion.nav>
      
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl"
            >
              <div className="flex h-full flex-col overflow-y-auto">
                <div className="flex items-center justify-between p-6">
                  <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    {/* Mobile menu 3D Leaf with Suspense */}
                    <Suspense fallback={<div className="w-8 h-8 bg-green-100 rounded-full animate-pulse" />}>
                      <NavbarLeafCanvas className="w-8 h-8" />
                    </Suspense>
                    <span className="text-lg font-bold text-gray-900">LucKEY</span>
                  </Link>
                  <button 
                    type="button" 
                    className="-m-2.5 rounded-md p-2.5 text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="sr-only">Close menu</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-6 flow-root px-6">
                  <div className="-my-6 divide-y divide-gray-500/10">
                    <div className="space-y-8 py-6">
                      {resources.map(({ href, text }) => (
                        <motion.div
                          key={href}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Link
                            to={href}
                            className="-mx-3 block rounded-lg px-3 py-3 text-lg font-semibold text-gray-900 hover:bg-gray-50"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {text}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                    <div className="py-6">
                      <Link
                        to="#"
                        className="-mx-3 block rounded-lg px-3 py-3 text-lg font-semibold text-gray-900 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log in
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}