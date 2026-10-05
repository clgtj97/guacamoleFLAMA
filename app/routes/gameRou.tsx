// gameRou.tsx - CONTROLS ANIMATION PAUSE/RESUME
import { useEffect, useState } from 'react';
import GameOne from '../gameOne/gameOne'; 
import EnvelopeEntry from '../gameOne/animations/envelopEntry';
// Import font files
import BebasNeueTTF from '../gameOne/assets/Bebas_Neue/BebasNeue-Regular.ttf';
import SixtyfourTTF from '../gameOne/assets/Sixtyfour/Sixtyfour-Regular-VariableFont_BLED,SCAN.ttf';

export function meta() {
  return [
    { title: "MINI RACER'S" },
    { name: "description", content: "EXPLORE YOUR LUCK IN THIS WOLRD!" },
  ];
}

export default function CreateRou() {
  const [accessGranted, setAccessGranted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showFormOverlay, setShowFormOverlay] = useState(false);
  const [shouldContinueAnimation, setShouldContinueAnimation] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  const correctPassword = "ferrari2024";

  useEffect(() => {
    const loadFonts = async () => {
      try {
        const fonts = [
          new FontFace('Sixtyfour', `url(${SixtyfourTTF})`),
          new FontFace('Bebas Neue', `url(${BebasNeueTTF})`),
        ];

        const loadedFonts = await Promise.all(fonts.map(font => font.load()));
        loadedFonts.forEach(font => document.fonts.add(font));
        setFontsLoaded(true);
      } catch (error) {
        console.error('Failed to load fonts:', error);
        setFontsLoaded(true);
      }
    };

    loadFonts();
  }, []);

  const handleCardReady = () => {
    console.log('Card ready - showing password form');
    setShowFormOverlay(true);
  };

  const handleAnimationComplete = () => {
    console.log('Animation complete - granting access');
    setAccessGranted(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === correctPassword) {
      console.log('Password correct - continuing animation');
      setShowFormOverlay(false);
      setShouldContinueAnimation(true); // This tells the animation to continue
    } else {
      setError('Incorrect password. Try again.');
      setPassword('');
    }
  };

  console.log('RENDER - accessGranted:', accessGranted, 'showFormOverlay:', showFormOverlay, 'shouldContinue:', shouldContinueAnimation);

  if (accessGranted) {
    console.log('SWITCHING TO GAMEONE COMPONENT!');
    return <GameOne />;
  }

  if (showAnimation) {
    return (
      <div className="relative w-full h-screen">
        <EnvelopeEntry 
          onCardReady={handleCardReady}
          onAnimationComplete={handleAnimationComplete} 
          shouldContinue={shouldContinueAnimation}
        />
        
        {/* Password Form Overlay - only show when card is ready and password not checked */}
       
{showFormOverlay && !shouldContinueAnimation && (
  <div className="absolute inset-0 flex items-center justify-center z-50">
    <div className="bg-transparent backdrop-blur-sm rounded-2xl p-8 max-w-sm w-full mx-4"> {/* Changed to bg-transparent */}
      <div className="bg-black/90 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20 shadow-2xl"> {/* Moved background to inner div */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-3 tracking-wider"
              style={{ fontFamily: 'Sixtyfour, monospace' }}>
            SECRET ACCESS
          </h2>
          <p className="text-gray-300 text-sm mb-4"
             style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em' }}>
            Enter the password to continue
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
            className="w-full px-4 py-3 bg-gray-900 border-2 border-white/30 rounded-xl text-white text-center text-lg tracking-wider focus:outline-none focus:border-white/50 transition-colors"
            style={{ fontFamily: 'Sixtyfour, monospace' }}
            autoFocus
          />
          
          {error && (
            <p className="text-red-400 text-sm text-center animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-white text-black font-bold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all duration-200 text-base tracking-wider border-2 border-white shadow-lg"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em' }}
          >
            UNLOCK EXPERIENCE
          </button>
        </form>
      </div>
    </div>
  </div>
)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-black flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  );
}

function loader() {
  return null;
}