import { MessageSquare, Code, Zap, Link, ChevronLeft, ChevronRight } from "lucide-react";
import Card from "./Card";
import 'keen-slider/keen-slider.min.css';
import { useKeenSlider } from 'keen-slider/react'
import { useState } from "react";
const steps = [
  {
    id: 1,
    icon: <Link className="w-8 h-8 text-indigo-600" />,
    title: "Add API Docs",
    desc: "Paste a link to the API docs or upload the documentation you want to simplify.",
  },
  {
    id: 2,
    icon: <MessageSquare className="w-8 h-8 text-indigo-600" />,
    title: "Ask Your Questions",
    desc: "Type or paste your query into the chatbot – code, errors, or text.",
  },
  {
    id: 3,
    icon: <Code className="w-8 h-8 text-indigo-600" />,
    title: "AI Understands Context",
    desc: "Our AI reads the docs along with your question to provide accurate answers.",
  },
  {
    id: 4,
    icon: <Zap className="w-8 h-8 text-indigo-600" />,
    title: "Get Instant Answers",
    desc: "Receive simplified explanations, code samples, or step-by-step solutions in seconds.",
  },
];


export default function HowItWorks() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [sliderRef, instanceRef] = useKeenSlider({
    slides: {
      perView: 1,
      spacing: 15,
    },
    breakpoints: {
      "(min-width: 640px)": {
        slides: { perView: 1, spacing: 10 },
      },
      "(min-width: 768px)": {
        slides: { perView: 2, spacing: 10 },
      },
      "(min-width: 1024px)": {
        slides: { perView: 3, spacing: 10 },
      },
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  const dotCount = instanceRef.current
    ? instanceRef.current.track.details.slides.length -
    instanceRef.current.options.slides.perView +
    1
    : 0;

  return (
    <section className="w-full" id="how-it-works">
      <div className="flex  flex-col justify-center items-center text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-12">
          How It <span className="text-indigo-600">Works</span>
        </h2>
        <div ref={sliderRef} className="keen-slider">
          {
            steps.map((step, i) => (
              <div className="keen-slider__slide rounded-2xl" key={i}>
                <Card icon={step.icon} title={step.title} desc={step.desc} stepNo={step.id} addSteps={true} />
              </div>
            ))
          }
        </div>

        {loaded && instanceRef.current && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: dotCount }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => instanceRef.current.moveToIdx(idx)}
                className={`w-3 h-3 rounded-full transition-all ${currentSlide === idx ? "bg-indigo-600" : "bg-gray-300"
                  }`}
              ></button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
