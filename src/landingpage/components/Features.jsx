import { useKeenSlider } from "keen-slider/react";
import { Wand2, MessageSquare, Bot, FileText, Save, ChevronLeft, ChevronRight } from "lucide-react";
import Card from "./Card";
import "keen-slider/keen-slider.min.css";
import { useState } from "react";

const features = [
  {
    icon: <Wand2 className="w-8 h-8 text-indigo-600" />,
    title: "Instant Simplification",
    desc: "Paste any technical doc and get a clear explanation instantly.",
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-indigo-600" />,
    title: "Follow-up Q&A",
    desc: "Ask follow-up questions directly on your simplified output.",
  },
  {
    icon: <Bot className="w-8 h-8 text-indigo-600" />,
    title: "Context-Aware Chatbot",
    desc: "Get answers only about your docs, not random topics.",
  },
  {
    icon: <FileText className="w-8 h-8 text-indigo-600" />,
    title: "Multiple Input Modes",
    desc: "Paste text or provide API links.",
  },
  {
    icon: <Save className="w-8 h-8 text-indigo-600" />,
    title: "Save & Export",
    desc: "Export simplified docs for personal or team use.",
  },
];

export default function Features() {
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
    <section className="w-full relative" id="features">
      <div className="flex flex-col justify-center items-center">
        <h2 className="text-3xl font-bold mb-4">Why DocUnpack?</h2>
        <p className="text-gray-600 mb-12 text-center">
          Built to simplify docs and save your time
        </p>

        <div ref={sliderRef} className="keen-slider">
          {features.map((feature, i) => (
            <div key={i} className="keen-slider__slide rounded-2xl">
              <Card
                icon={feature.icon}
                title={feature.title}
                desc={feature.desc}
              />
            </div>
          ))}
        </div>


        {loaded && instanceRef.current && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: dotCount }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => instanceRef.current.moveToIdx(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentSlide === idx ? "bg-indigo-600" : "bg-gray-300"
                }`}
              ></button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
