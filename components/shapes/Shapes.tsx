import React from "react";
import { Props } from "./Shapes.types";
import { Screen } from "./Screen.component";
import { Circle } from "./Circle.component";
import { Triangle } from "./Triangle.component";
import { Rectangle } from "./Rectangle.component";

const COLORS = ["#6c5dd3", "#ffa2c0", "#46bcaa", "#4d69fa", "#ffcf52", "f35421"];

const createDefaultComponents = (total: number): React.ReactNode[] => {
  const availableComponents = [Rectangle, Circle, Triangle];

  return Array.from({ length: total }, (_, index) => {
    const RandomComponent =
      availableComponents[Math.floor(Math.random() * availableComponents.length)];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    return <RandomComponent key={index} color={randomColor} />;
  });
};

export const Shapes: React.FC<Props> = ({
  total = 42,
  duration = 5000,
  ...props
}) => {
  const components = createDefaultComponents(total);
  return <Screen total={total} duration={duration} Component={components} {...props} />;
};

Shapes.displayName = "shapes";

export default Shapes;
