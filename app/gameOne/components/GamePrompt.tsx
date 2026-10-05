import React from "react"; // LOL not in use 

interface GamePromptProps {
  message?: string;
  onYes: () => void;
  onNo: () => void;
}

const GamePrompt: React.FC<GamePromptProps> = ({
  message = "Do you want to enter the room?",
  onYes,
  onNo,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-xl text-center text-white w-80">
        <h2 className="text-xl font-semibold mb-4">{message}</h2>
        <div className="flex justify-center gap-4">
          <button
            onClick={onYes}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition"
          >
            Yes
          </button>
          <button
            onClick={onNo}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamePrompt;
