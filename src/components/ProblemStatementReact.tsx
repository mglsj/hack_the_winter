import { useState } from 'react';

// Statement image paths from public folder

interface Statement {
  id: number;
  title: string;
  image: string;
  link: string;
}

const currentStatements: Statement[] = [
  {
    id: 1,
    title: "Coming Soon",
    image: "",
    link: ""
  }
];

const pastStatements: Statement[] = [
  {
    id: 1,
    title: "AI CAPTCHA Solver",
    image: "/statements/(AI) Adversarial AI–Powered Accessible CAPTCHA Solver_page-0001.jpg",
    link: "https://docs.google.com/document/d/1WAGW9vfuDpJDFCwbo0tla_n1eNT21JCawRRw7OEapbo/edit?tab=t.0"
  },
  {
    id: 2,
    title: "Flowchart Maker",
    image: "/statements/BuildForGEHU'25 Flowchart Maker App_page-0001.jpg",
    link: "https://docs.google.com/document/d/1clXvAPFvjHbGQ9VllL7_TkIIOvqPFIxIIStKboi3BbY/edit?tab=t.0"
  },
  {
    id: 3,
    title: "String Matching",
    image: "/statements/BuildForGEHU'25 GPU-Accelerated String Matching_page-0001.jpg",
    link: "https://docs.google.com/document/d/1ocGHfb4R72NqaelWS9AAM-t3tTzuYUnAhSzcZDhrP5M/edit?tab=t.0"
  },
  {
    id: 4,
    title: "Contact Sharing",
    image: "/statements/BuildForGEHU'25 Tap-to-Share Contact across Any Mobile Platform_page-0001.jpg",
    link: "https://docs.google.com/document/d/1rcRB_D3H2O6oOaDeTmL0tBMxcgE8rzYmqzeogimlLcI/edit?tab=t.0"
  },
  {
    id: 5,
    title: "Traffic Management",
    image: "/statements/BuildForGEHU'25 Traffic Congestion Management at Kachi Dham_page-0001.jpg",
    link: "https://docs.google.com/document/d/1bFQErWKMvuH0hOcysGD9PIeiPPULy90DVy8xYm5OV1Y/edit?tab=t.0"
  }
];

export default function ProblemStatementReact() {
  const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');
  const [currentIndex, setCurrentIndex] = useState(0);

  const statements = activeTab === 'current' ? currentStatements : pastStatements;

  const nextStatement = () => {
    setCurrentIndex((prev) => (prev + 1) % statements.length);
  };

  const prevStatement = () => {
    setCurrentIndex((prev) => (prev - 1 + statements.length) % statements.length);
  };

  const renderCurrentContent = () => (
    <div className="flex items-center justify-center h-44 sm:h-56 md:h-72 lg:h-84 xl:h-[26rem]">
      <div className="text-center text-white px-4">
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold drop-shadow-lg font-angry">
          Releasing Soon!
        </p>
        <p className="text-sm sm:text-base md:text-lg mt-2 drop-shadow-md font-semibold">
          Stay tuned for exciting challenges coming your way.
        </p>
      </div>
    </div>
  );

  const renderPastContent = () => {
    const statement = statements[currentIndex];

    return (
      <div className="relative w-full h-full">
        {/* Navigation Arrows */}
        {statements.length > 1 && (
          <>
            <button
              onClick={prevStatement}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
              aria-label="Previous Statement"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextStatement}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
              aria-label="Next Statement"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Statement Image */}
        <div className="flex items-center justify-center h-full p-1 sm:p-2">
          {statement.link ? (
            <a
              href={statement.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-44 sm:h-56 md:h-72 lg:h-84 xl:h-[26rem] rounded-lg shadow-lg border-2 border-white/20 bg-white overflow-hidden flex items-center justify-center hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              <img
                src={statement.image}
                alt={`${statement.title} - Click to view full document`}
                className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </a>
          ) : (
            <div className="w-full h-44 sm:h-56 md:h-72 lg:h-84 xl:h-[26rem] rounded-lg shadow-lg border-2 border-white/20 bg-white overflow-hidden flex items-center justify-center">
              <img
                src={statement.image}
                alt={statement.title}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* Statement Counter */}
        {statements.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
            {currentIndex + 1} / {statements.length}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="problem-statement-section my-8 pb-32 lg:pb-8">
      <h2 className="text-4xl font-bold text-center mb-8">Problem Statements</h2>

      {/* Toggle Switch - Below heading, above board */}
      <div className="flex justify-center mb-8">
        <div className="bg-red-600 rounded-full p-2 flex shadow-lg border-2 border-white/30">
          <button
            onClick={() => {
              setActiveTab('current');
              setCurrentIndex(0);
            }}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-angry font-bold text-sm md:text-lg transition-all duration-300 transform hover:scale-105 ${activeTab === 'current'
              ? 'bg-white text-red-600 shadow-inner'
              : 'bg-transparent text-white opacity-70 hover:opacity-100'
              }`}
          >
            Current Statements
          </button>
          <button
            onClick={() => {
              setActiveTab('past');
              setCurrentIndex(0);
            }}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-angry font-bold text-sm md:text-lg transition-all duration-300 transform hover:scale-105 ${activeTab === 'past'
              ? 'bg-white text-red-600 shadow-inner'
              : 'bg-transparent text-white opacity-70 hover:opacity-100'
              }`}
          >
            Past Statements
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-6xl mx-auto">
        {/* Problem Statement Display Area */}
        <div className="flex flex-col lg:flex-row justify-center items-end">
          <div className="shrink-0 hidden lg:block relative z-10">
            <img
              src="/src/assets/images/master_matilda.png"
              alt="Master Matilda"
              className="w-[30rem] h-auto xl:w-[36rem] 2xl:w-[42rem]"
            />
          </div>

          {/* Board with Problem Statements */}
          <div className="relative shrink-0 lg:-ml-32 xl:-ml-40 2xl:-ml-48">
            <img
              src="/src/assets/images/board_img.png"
              alt="Problem Statement Board"
              className="w-full max-w-2xl xl:max-w-3xl h-auto"
            />

            {/* Master Matilda for Mobile - positioned on left side with overlap */}
            <div className="absolute -bottom-48 -left-4 lg:hidden z-10">
              <img
                src="/src/assets/images/master_matilda.png"
                alt="Master Matilda"
                className="w-96 h-auto sm:w-[28rem]"
              />
            </div>

            {/* Problem Statement Content */}
            <div className="problem-statement-content absolute inset-0 flex items-center justify-center p-3 sm:p-6 md:p-8">
              <div className="w-full max-w-[98%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-2xl xl:max-w-3xl relative">
                {/* Content Area */}
                <div className="relative">
                  {activeTab === 'current' ? renderCurrentContent() : renderPastContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}