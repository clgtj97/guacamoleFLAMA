import logoLucky from "./logo-lucky.png";
import nooblogo from "./cryptowallet.png";
import prologo from "./bitcoin-wallet.png"
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Crow() {
    return (
      <main className="flex items-center justify-center pt-16 pb-4">
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
        aria-label="Global"
      >
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900"
            >
              <Link to="/" className="flex items-center gap-x-1">
                <span>
                  <img 
                    className="size-16 rounded-full" 
                    src={logoLucky} 
                    alt="Home" 
                  />
                </span>
                <svg 
                  className="size-5" 
                  viewBox="0 0 20 20" 
                  fill="currentColor" 
                  aria-hidden="true" 
                  data-slot="icon"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </Link>
            </motion.button>

          
          <div className="absolute left-1/2 z-10 mt-5 flex w-screen max-w-max -translate-x-1/2 px-4">
            <div className="w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm/6 shadow-lg ring-1 ring-gray-900/5">
              <div className="p-4">
                
                <div className="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50">
                  <div className="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                    <svg className="size-6 text-gray-600 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
                    </svg>
                  </div>
                  <div>
                    <a href="createCrow" className="font-semibold text-gray-900">
                      Create New Escrow
                      <span className="absolute inset-0"></span>
                    </a>
                    <p className="mt-1 text-gray-600">create your own 2-of-3 escrow with out needing to be lucky</p>
                  </div>
                </div>
                <div className="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50">
                  <div className="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                    <svg className="size-6 text-gray-600 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33" />
                    </svg>
                  </div>
                  <div>
                    <a href="transactions" className="font-semibold text-gray-900">
                      Transactions
                      <span className="absolute inset-0"></span>
                    </a>
                    <p className="mt-1 text-gray-600">Search for OPEN or CLOSED transacions</p>
                  </div>
                </div>
                <div className="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50">
                  <div className="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                    <svg className="size-6 text-gray-600 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <div>
                    <a href="invoice" className="font-semibold text-gray-900">
                      Invoices
                      <span className="absolute inset-0"></span>
                    </a>
                    <p className="mt-1 text-gray-600">Connect and check your Escrow Invoices</p>
                  </div>
                </div>
                <div className="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50">
                  <div className="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                    <svg className="size-6 text-gray-600 group-hover:text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-slot="icon">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <div>
                    <a href="help" className="font-semibold text-gray-900">
                      HELP
                      <span className="absolute inset-0"></span>
                    </a>
                    <p className="mt-1 text-gray-600">HOW TO and general questions</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-900/5 bg-gray-50">
                <a href="#" className="flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100">
                <img 
                    className="size-7" 
                    src={nooblogo} 
                    alt="Noob" 
                  />
                  Noob's guide
                </a>
                <a href="#" className="flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100">
                <img 
                    className="size-7" 
                    src={prologo} 
                    alt="Pro" 
                  />
                  PRO guide
                </a>
              </div>
            </div>
          </div>
        </div>
        </motion.nav>
      </main>
    );
  }
  
  
  