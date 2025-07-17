import React from 'react';
import { ShapeProps } from "./Shapes.types";
import { generateRandomShapeSize } from "./Shapes.utils";

export const Circle: React.FC<ShapeProps> = ({ color }) => {
  const size = generateRandomShapeSize(6, 6);

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor: color,
      }}
    />
  );
};
