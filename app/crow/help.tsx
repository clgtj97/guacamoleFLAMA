import '../app.css';
import luckylogo from './logo-lucky.png';
import { Navbar } from '../navbar/navbar';
import begsvg from './begGuide.svg';
import bitsvg from './bitlogo.svg';
import crowsvg from './crow.svg';
import safesvg from './security.svg';
import { motion, AnimatePresence } from 'framer-motion';


export function Help() {
  // Generate 400 particles with random properties (green theme)
  const particles = Array.from({ length: 400 }).map((_, i) => {
    const size = Math.floor(Math.random() * 8) + 1;
    const startY = Math.floor(Math.random() * 120) + 100; // More vertical spread
    const duration = 28000 + Math.floor(Math.random() * 9000);
    const delay = Math.floor(Math.random() * 37000);
    const startX = Math.floor(Math.random() * 100);
    const opacity = Math.random() * 0.7 + 0.3; // Varying opacity
    
    return {
      id: i,
      size,
      startY,
      duration,
      delay,
      startX,
      opacity,
      endY: -startY - Math.floor(Math.random() * 50) // More vertical movement
    };
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#021027]">
       <motion.nav
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
        aria-label="Global"
      >
      {/* Animated background particles - green snowflake style */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute mix-blend-screen"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.startX}vw`,
              top: `${particle.startY}vh`,
              animation: `float ${particle.duration}ms linear ${particle.delay}ms infinite`,
              opacity: particle.opacity,
            }}
          >
            <div
              className="w-full h-full rounded-full bg-gradient-to-b from-green-400 to-green-400/0"
              style={{
                animation: `pulse-scale ${Math.floor(Math.random() * 3000) + 2000}ms ease-in-out infinite`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Main content */}
      <main className="relative flex items-center justify-center pt-16 pb-4">
        <div className="bg-white/90 backdrop-blur-sm py-24 sm:py-32 rounded-xl shadow-xl mx-4">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {/* Logo section */}
            <div className="flex justify-center mb-8">
              <img 
                src={ luckylogo } 
                alt="Logo" 
                className="h-16 w-auto" 
              />
            </div>
            
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base/7 font-semibold text-green-600">" Your luck starts here "</h2>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-green-300 sm:text-5xl lg:text-balance">
                Everything you need to start your crypto journey
              </p>
              <p className="mt-6 text-lg/8 text-white">
                There seems to be no solid info out there how to really dive into crypto with out having to shell out a couple tokens from your wallet, so heres a lucky break :
              </p>
            </div>
            
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                
              <div className="relative pl-16">
                  <dt className="text-base/7 font-semibold text-white">
                  <div className="neon-glow-green absolute top-0 left-0 flex size-10 items-center justify-center">
                  <img 
                      src={bitsvg} 
                      alt="Beginners Guide" 
                      className="size-8 text-white neon-glow-intense"/>
                  </div>
                    <p className="neon-glow-intense">
                      Why Bitcoin?
                    </p>
                  </dt>
                  <dd className="mt-2 text-base/7 text-white"> What Bitcon is and a short rundown of the mark it's had globaly as an ecosystem and info how it impacts you.</dd>
                </div>
                
                <div className="relative pl-16">
                  <dt className="text-base/7 font-semibold text-white">
                    <div className="neon-glow-green absolute top-0 left-0 flex size-10 items-center justify-center">
                    <img 
                      src={crowsvg} 
                      alt="Beginners Guide" 
                      className="size-8 text-white neon-glow-intense"/>
                    </div>
                    <p className="neon-glow-intense">
                      What's and Escrow?
                    </p>
                  </dt>
                  <dd className="mt-2 text-base/7 text-white"> How escrow work in crypto and how they make your life easier. Adding security and speed to small and big transactions is a reality! </dd>
                </div>
                
                <div className="relative pl-16">
                  <dt className="text-base/7 font-semibold text-white">
                    <div className="neon-glow-green absolute top-0 left-0 flex size-10 items-center justify-center">
                    <img 
                      src={begsvg} 
                      alt="Beginners Guide" 
                      className="size-8 text-white neon-glow-intense"/>
                    </div>
                    <p className="neon-glow-intense">
                    Noobs Guide on Trading Tokens
                    </p>
                  </dt>
                  <dd className="mt-2 text-base/7 text-white">From scratch to a pro, learn everything you need to know to get started with your first wallet to avoid being called a noob...</dd>
                </div>
                
                <div className="relative pl-16">
                  <dt className="text-base/7 font-semibold text-white">
                    <div className="neon-glow-green absolute top-0 left-0 flex size-10 items-center justify-center">
                    <img 
                      src={safesvg} 
                      alt="Beginners Guide" 
                      className="size-8 text-white neon-glow-intense"/>
                    </div>
                    <p className="neon-glow-intense">
                      "Safety First" Guide
                    </p>
                  </dt>
                  <dd className="mt-2 text-base/7 text-white">Stranger danger is a thing, not just from a cybersecurity stand point but learn key knowledge for staying safe in the web.</dd>
                </div>

              </dl>
            </div>

          </div>
        </div>
      </main>
      </motion.nav>
    </div>
  );
}