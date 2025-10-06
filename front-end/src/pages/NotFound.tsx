import { useState } from "react";
import Galaxy from "../components/reactBits/Galaxy";
import BlurText from "../components/reactBits/BlurText";
import ActionButton from "../components/common/ActionButton";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const [showDescription, setShowDescription] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      <Galaxy
        density={0.45}
        glowIntensity={0.18}
        saturation={0}
        hueShift={140}
        twinkleIntensity={0.35}
        rotationSpeed={0.04}
        repulsionStrength={1}
        autoCenterRepulsion={1.8}
        starSpeed={0.18}
        speed={0.4}
      />
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="flex flex-col items-center text-center space-y-8 max-w-xl">
          <div className="flex flex-col items-center space-y-3">
            <BlurText
              text="Oops..."
              delay={120}
              animateBy="words"
              direction="top"
              className="text-3xl max-sm:text-2xl text-muted"
            />
            <BlurText
              text="404"
              delay={260}
              animateBy="words"
              direction="top"
              className="text-8xl max-sm:text-6xl font-bold tracking-tight"
              gradient="linear-gradient(90deg,var(--color-text), var(--color-primary))"
              onAnimationComplete={() => setShowDescription(true)}
            />
          </div>
          <p
            aria-hidden={!showDescription}
            className={`text-sm max-sm:text-xs text-gray-400 leading-relaxed transition-all duration-500 ease-out transform ${
              showDescription
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            The page you’re looking for has drifted off the map. It might have
            been moved, renamed, or never existed. Let’s get you back to safer
            ground.
          </p>
          <div
            className={`flex flex-col sm:flex-row gap-4 transition-opacity duration-500 ${
              showDescription ? "opacity-100" : "opacity-0"
            }`}
          >
            <ActionButton
              variant="primary"
              size="lg"
              onClick={() => navigate("/map-monitor")}
            >
              Go to Map
            </ActionButton>
            <ActionButton
              variant="secondary"
              size="lg"
              onClick={() => navigate("/")}
            >
              Back Home
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
