import React, { useEffect, useRef, useState } from "react";
import { ScreenProps, StyleConfig } from "./Shapes.types";
import { createStyles } from "./Shapes.utils";
import styles from "./Shapes.module.css";

const updateContainerHeight = (container: HTMLDivElement | null) => {
    if (container) {
        container.style.setProperty("--containerheight", `${container.offsetHeight}px`);
    }
};

const createItem = (
    Component: React.ReactNode | React.ReactNode[],
    index: number,
    styleConfig?: StyleConfig // Pass config to customize styles per item
): React.ReactNode => {
    const componentContent = Array.isArray(Component)
        ? React.cloneElement(Component[index % Component.length] as React.ReactElement, {
            key: `component-${index}`,
        })
        : React.cloneElement(Component as React.ReactElement, { key: `component-${index}` });

    return (
        <div key={index} className={styles.shapes} style={createStyles(styleConfig)}>
            <span className={styles.shapesContent}>{componentContent}</span>
        </div>
    );
};

const generateItems = (
    total: number,
    Component: React.ReactNode | React.ReactNode[],
    styleConfig?: StyleConfig
): React.ReactNode[] => {
    return Array.from({ length: total }, (_, index) =>
        createItem(Component, index, styleConfig)
    );
};

const removeItem = (
    items: React.ReactNode[],
    indexToRemove: number
): React.ReactNode[] => {
    return items.filter((_, index) => index !== indexToRemove);
};

export const Screen: React.FC<ScreenProps> = ({ total, duration, Component, ...props }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [items, setItems] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        const handleResize = () => updateContainerHeight(containerRef.current);
        handleResize();

        const resizeObserver = new ResizeObserver(handleResize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        
    }, []);

    useEffect(() => {
        const defaultStyleConfig: StyleConfig = {
            positionRange: [0, 100],
            delayRange: [0, 5],
            speedRange: [3, 5],
            directionRange: [-400, 400],
            sizeRange: [1, 1.2],
            rotationRange: [-180, 180],
        };
        setItems(generateItems(total, Component, defaultStyleConfig));
        const timer = setTimeout(() => {
            console.log("start removing");
            const intervalId = setInterval(() => {
                setItems((prevItems) => {
                    if (prevItems.length === 0) {
                        clearInterval(intervalId);
                        return prevItems;
                    }
                    console.log("removed: total:", prevItems.length - 1);
                    return removeItem(prevItems, prevItems.length - 1);
                });
            }, 100);

            return () => clearInterval(intervalId);
        }, duration ? duration + 2000 : 2000);
        return () => clearTimeout(timer);
    }, [total, Component]);

    return (
        <div
            ref={containerRef}
            className={`${styles.shapesScreen} ${props.className || ""}`}
            {...props}
        >
            {items}
        </div>
    );
};