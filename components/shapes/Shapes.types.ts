import { HTMLAttributes, ReactNode } from "react";

export interface Props extends HTMLAttributes<HTMLDivElement> {
  total: number;
  duration?: number; // Duration of this animation
}

export interface ScreenProps extends HTMLAttributes<HTMLDivElement> {
  total: number;
  duration?: number; // Duration of this animation 
  Component: ReactNode | ReactNode[];
}

export interface ShapeProps {
  color: string;
}

export interface StyleConfig {
  positionRange?: [number, number]; // Min and max for position percentage
  delayRange?: [number, number]; // Min and max for delay in seconds
  speedRange?: [number, number]; // Min and max for speed in seconds
  directionRange?: [number, number]; // Min and max for direction percentage
  sizeRange?: [number, number]; // Min and max for size multiplier
  rotationRange?: [number, number]; // Min and max for rotation in degrees
}