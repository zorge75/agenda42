import React from 'react';
import { ShapeProps } from "./Shapes.types";
import { generateRandomShapeSize } from "./Shapes.utils";

export const Rectangle: React.FC<ShapeProps> = ({ color }) => {
  const width = generateRandomShapeSize(6, 6);
  const height = generateRandomShapeSize(6, 6);

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: color,
      }}
    />
  );
};