import React from 'react';
import { ShapeProps } from "./Shapes.types";
import { generateRandomShapeSize } from "./Shapes.utils";

export const Triangle: React.FC<ShapeProps> = ({ color }) => {
  const size = generateRandomShapeSize(8, 6);

  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: `${size / 2}px solid transparent`,
        borderRight: `${size / 2}px solid transparent`,
        borderBottom: `${size}px solid ${color}`,
      }}
    />
  );
};