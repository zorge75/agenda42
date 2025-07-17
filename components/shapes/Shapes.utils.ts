import { CSSProperties } from "react";
import { StyleConfig } from "./Shapes.types";

// Utility to generate a random number within a range
const getRandomNumber = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

// Utility to format number with fixed decimal places
const formatNumber = (value: number, decimals: number = 2): string =>
    value.toFixed(decimals);

// Generate random position (e.g., "50%")
const generateRandomPosition = (range: [number, number] = [0, 100]): string =>
    `${getRandomNumber(range[0], range[1])}%`;

// Generate random animation delay (e.g., "2.34s")
const generateRandomDelay = (range: [number, number] = [0, 5]): string =>
    `${formatNumber(Math.random() * (range[1] - range[0]) + range[0])}s`;

// Generate random animation speed (e.g., "3.45s")
const generateRandomSpeed = (range: [number, number] = [3, 5]): string =>
    `${formatNumber(Math.random() * (range[1] - range[0]) + range[0])}s`;

// Generate random direction offset (e.g., "-200%")
const generateRandomDirection = (range: [number, number] = [-400, 400]): string =>
    `${getRandomNumber(range[0], range[1])}%`;

// Generate random size multiplier (e.g., 1.15)
const generateRandomSize = (range: [number, number] = [1, 1.2]): number =>
    Number(formatNumber(Math.random() * (range[1] - range[0]) + range[0]));

// Generate random rotation (e.g., "45deg")
const generateRandomRotation = (range: [number, number] = [-180, 180]): string =>
    `${getRandomNumber(range[0], range[1])}deg`;

// Generate random shape size for shapes
export const generateRandomShapeSize = (min: number, max: number): number =>
    getRandomNumber(min, max);

// Main function to create glitter styles with configurable ranges
export const createStyles = (
    config: StyleConfig = {}
): CSSProperties => ({
    "--posX": generateRandomPosition(config.positionRange),
    "--delay": generateRandomDelay(config.delayRange),
    "--speed": generateRandomSpeed(config.speedRange),
    "--posXDirection": generateRandomDirection(config.directionRange),
    "--size": generateRandomSize(config.sizeRange).toString(),
    "--rotate": generateRandomRotation(config.rotationRange),
} as CSSProperties);
