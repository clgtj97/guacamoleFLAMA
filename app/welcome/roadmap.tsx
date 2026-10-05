import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Layers, 
  Coins, 
  Gem, 
  Globe,
  Clock,
  CheckCircle2,
  Gamepad2
} from "lucide-react";

export function Roadmap() {
  const [activeStep, setActiveStep] = useState(0);
const steps = [
  {
    title: "Phase 1: Bitcoin L1 Infrastructure",
    description: [
      "BRC-20 minting",
      "Runes direct minting",
      "Ordinal inscriptions", 
      "Live market data",
    ],
    status: "completed",
    date: "Live Now",
    icon: <Rocket className="w-5 h-5" />
  },
  {
    title: "Phase 2: Fractal Integration",
    description: [
      "Cross-chain indexing",
      "Batch operations",
      "10,000+ transactions processed",
      "Fee optimization"
    ],
    status: "completed",
    date: "Live Now",
    icon: <Layers className="w-5 h-5" />
  },
{
  title: "Phase 3: I•AM•TOO•LUCKY Token Distribution",
  description: [
    "40% Community Sale (fair price discovery)",
    "30% Liquidity Pool (earn trading fees)",
    "20% In-Game & Tooling Rewards",
    "10% Team (locked 12 months)",
    "6% fee tier for holders",
    "Governance voting rights"
  ],
  status: "current",
  date: "Q1 2026",
  icon: <Gem className="w-5 h-5" />
},
  {
    title: "Phase 4: Genesis Collection",
    description: [
      "ONLY 1.000 unique character sprites",
      "Ordinal drop",
      "Game alpha access",
      "Online rooms (in development)"
    ],
    status: "current",
    date: "Q1 2026",
    icon: <Gem className="w-5 h-5" />
  },
  {
    title: "Phase 5: The World",
    description: [
      "Metaverse integration",
      "Player-owned economy",
      "Cross-game assets",
      "Community governance"
    ],
    status: "upcoming",
    date: "Q2 2026",
    icon: <Globe className="w-5 h-5" />
  }
];

  // Auto-advance steps (optional)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        Built in Public <span className="text-green-600">Roadmap</span>
      </h2>
      
      {/* Live Stats Banner */}
      <div className="mb-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          LIVE NOW
        </div>
        <p className="text-lg font-medium text-gray-800">
          10k+ Transactions • Bitcoin + Fractal Bitcoin • Free Tier Available
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 h-full w-0.5 bg-green-200 md:left-1/2 md:-ml-0.5" />
        
        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Step indicator */}
              <div className={`absolute left-4 h-8 w-8 rounded-full flex items-center justify-center md:left-1/2 md:-ml-4 ${
                step.status === "completed" ? "bg-green-600" 
                : step.status === "current" ? "bg-green-500 ring-4 ring-green-200 animate-pulse" 
                : "bg-gray-300"
              }`}>
                {step.status === "completed" ? (
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-white font-bold">{index + 1}</span>
                )}
              </div>
              
          {/* Step card */}
<div className={`ml-24 p-8 rounded-2xl shadow-xl transition-all duration-300 md:ml-0 md:w-[calc(50%-2rem)] ${
  index % 2 === 0 ? "md:mr-auto" : "md:ml-auto"
} ${
  step.status === "current" 
    ? "bg-gradient-to-br from-green-50 to-white border-2 border-green-500 shadow-green-100" 
    : step.status === "completed"
    ? "bg-white border border-gray-200"
    : "bg-white border border-gray-200 opacity-80"
}`}>
  <div className="flex items-start justify-between mb-4">
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
      <div className="text-gray-600 text-sm leading-relaxed space-y-1">
        {step.description.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            {step.status === "completed" && <span className="text-green-600 mt-0.5">✓</span>}
            {step.status === "current" && <span className="text-yellow-600 mt-0.5">🔄</span>}
            {step.status === "upcoming" && <span className="text-gray-400 mt-0.5">○</span>}
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-4 ${
      step.status === "completed" ? "bg-green-100 text-green-800 border border-green-300" 
      : step.status === "current" ? "bg-green-100 text-green-800 border border-green-300 animate-pulse" 
      : "bg-gray-100 text-gray-800"
    }`}>
      {step.status === "current" ? "IN PROGRESS" : step.status.toUpperCase()}
    </span>
  </div>
  
  <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
    <Clock className="w-4 h-4" />
    {step.date}
  </div>

  {/* Progress indicators for current steps */}
  {step.status === "current" && step.title.includes("Token") && (
    <div className="mt-4 pt-4 border-t border-green-200">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="flex items-center gap-1 text-green-700">
          <CheckCircle2 className="w-3 h-3" /> Token contract ready
        </span>
        <span className="flex items-center gap-1 text-green-700">
          <CheckCircle2 className="w-3 h-3" /> Fee mechanism
        </span>
        <span className="flex items-center gap-1 text-yellow-600">
          <Clock className="w-3 h-3" /> Launch pending
        </span>
      </div>
    </div>
  )}
</div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* What's Working Now */}
<div className="mt-12 p-6 bg-white rounded-2xl border border-gray-200">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      Live Today
    </h3>
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
        <span>Bitcoin L1</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
        <span>Fractal</span>
      </div>
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {[
      'Runes Minting',
      'BRC-20 Minting',
      'Dual Mint (NEW)',
      'Batch Operations',
      'Ordinal Inscriptions',
      'Ordinal Indexing',
      'Live Market Data',
      'Cross-Chain Indexing'
    ].map((feature, idx) => (
      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors group">
        <span className="text-sm text-gray-700 group-hover:text-gray-900">{feature}</span>
        <div className="flex gap-2">
          <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm">✓</span>
          <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">✓</span>
        </div>
      </div>
    ))}
  </div>

  <div className="mt-4 pt-4 border-t border-gray-200 text-center">
    <p className="text-sm text-gray-500">
      <span className="font-medium text-gray-900">All features available on both chains</span>
      <span className="mx-2">•</span>
      10k+ transactions processed
      <span className="mx-2">•</span>
      <span className="text-green-600">Free tier included</span>
    </p>
  </div>
</div>

      {/* Navigation dots (mobile) */}
      <div className="flex justify-center mt-8 md:hidden">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveStep(index)}
            className={`mx-1 h-3 w-3 rounded-full transition-colors ${
              activeStep === index ? "bg-green-600" : "bg-gray-300"
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}