"use client";

interface LiveDealerShellProps {
  dealerName: string;
  dealerGender?: "female" | "male";
  speechText: string;
  isDealing: boolean;
  children: React.ReactNode;
}

export function LiveDealerShell({ dealerName, dealerGender: _dealerGender = "female", speechText, isDealing, children }: LiveDealerShellProps) {
  return (
    <div className="relative flex flex-col items-center w-full bg-[#0f212e] rounded-xl overflow-hidden border border-[#2f4553]">
      <div className="relative w-full h-[200px] bg-gradient-to-b from-[#1a2c38] to-[#0f212e] flex flex-col items-center justify-end overflow-hidden pt-4">
        {/* Dealer Speech Bubble */}
        <div className={`absolute top-4 transition-opacity duration-300 ${speechText ? 'opacity-100' : 'opacity-0'} z-50`}>
          <div className="relative bg-white text-black px-4 py-2 rounded-2xl font-semibold text-sm drop-shadow-lg max-w-[200px] text-center">
            {speechText}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-x-8 border-x-transparent border-t-8 border-t-white" />
          </div>
        </div>
        
        {/* Dealer Avatar */}
        <div className="relative z-10 mb-[-10px]">
          <svg width="120" height="150" viewBox="0 0 120 150" className="drop-shadow-2xl" style={{ animation: "breathe 4s ease-in-out infinite" }}>
            <path d="M20 150 C20 90, 100 90, 100 150 Z" fill="#1e1e1e" />
            <path d="M45 90 L75 90 L60 120 Z" fill="#ffffff" />
            <path d="M50 100 L70 100 L60 110 Z" fill="#e70000" />
            <path d="M50 110 L70 110 L60 100 Z" fill="#e70000" />
            <circle cx="60" cy="105" r="3" fill="#880000" />
            <circle cx="60" cy="50" r="35" fill="#f5d0b5" />
            <circle cx="48" cy="45" r="4" fill="#000" />
            <circle cx="72" cy="45" r="4" fill="#000" />
            <path d="M45 60 Q60 70 75 60" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M25 50 Q60 10 95 50 Q60 20 25 50" fill="#3b2b1a" />
            <g style={{ transformOrigin: "30px 100px", animation: isDealing ? "deal 1s ease-in-out infinite alternate" : "none" }}>
              <rect x="15" y="90" width="15" height="60" rx="7" fill="#1e1e1e" transform="rotate(20 30 100)" />
              <circle cx="10" cy="145" r="10" fill="#f5d0b5" />
            </g>
            <g style={{ transformOrigin: "90px 100px", animation: isDealing ? "deal-right 1.2s ease-in-out infinite alternate" : "none" }}>
              <rect x="90" y="90" width="15" height="60" rx="7" fill="#1e1e1e" transform="rotate(-20 90 100)" />
              <circle cx="110" cy="145" r="10" fill="#f5d0b5" />
            </g>
          </svg>
        </div>

        {/* Table Edge */}
        <div className="absolute bottom-0 w-full h-[20px] bg-gradient-to-r from-[#003300] via-[#005500] to-[#003300] border-t-4 border-[#ffb700] z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]" />
        
        {/* Name Tag */}
        <div className="absolute bottom-1 right-4 z-30 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white/80 border border-white/10 uppercase tracking-widest">
          {dealerName}
        </div>
      </div>
      
      {/* Game Content */}
      <div className="w-full relative min-h-[300px]">
        {children}
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.02) translateY(-2px); }
        }
        @keyframes deal {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(45deg); }
        }
        @keyframes deal-right {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-45deg); }
        }
      `}</style>
    </div>
  );
}
