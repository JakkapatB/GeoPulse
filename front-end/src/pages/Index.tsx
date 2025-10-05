import { useState } from "react";
import Galaxy from "../components/reactBits/Galaxy";
import BlurText from "../components/reactBits/BlurText";
import ActionButton from "../components/common/ActionButton";

const Index = () => {
  const [showDescription, setShowDescription] = useState(false);

  return (
    <div className="w-screen h-screen">
      <Galaxy
        density={0.5}
        glowIntensity={0.2}
        saturation={0}
        hueShift={140}
        twinkleIntensity={0.3}
        rotationSpeed={0.05}
        repulsionStrength={1}
        autoCenterRepulsion={2}
        starSpeed={0.2}
        speed={0.5}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col justify-center items-center font-bold space-y-8">
          <div className="flex flex-col items-center justify-center space-y-2">
            <BlurText
              text="Welcome to"
              delay={150}
              animateBy="words"
              direction="top"
              className="text-4xl max-sm:text-2xl"
            />
            <BlurText
              text="GeoPulse"
              delay={300}
              animateBy="words"
              direction="top"
              className="text-8xl max-sm:text-6xl"
              gradient="linear-gradient(90deg,var(--color-text), var(--color-primary))"
              onAnimationComplete={() => setShowDescription(true)}
            />
          </div>
          <p
            aria-hidden={!showDescription}
            className={`text-center text-sm text-gray-400 transition-all duration-500 ease-out transform ${
              showDescription
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            } max-sm:text-xs`}
          >
            GeoPulse — Feel the Earth’s pulse and stay ahead of every disaster.
          </p>
          <ActionButton
            variant="primary"
            size="lg"
            onClick={() => alert("Get Started clicked!")}
            className={`${showDescription ? "opacity-100" : "opacity-0"} `}
          >
            Get Started
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default Index;
