// Type declarations for modules without TypeScript definitions

declare module 'framer-motion' {
  import { ComponentType, ReactNode, CSSProperties, RefObject } from 'react';

  export interface MotionProps {
    initial?: object | string | boolean;
    animate?: object | string;
    exit?: object | string;
    transition?: TransitionProps;
    variants?: Variants;
    whileHover?: object | string;
    whileTap?: object | string;
    whileFocus?: object | string;
    whileInView?: object | string;
    onAnimationStart?: () => void;
    onAnimationComplete?: () => void;
    layout?: boolean | 'position' | 'size';
    layoutId?: string;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
    key?: string | number;
    ref?: RefObject<HTMLElement>;
    onClick?: (event: React.MouseEvent) => void;
    [key: string]: unknown;
  }

  export interface TransitionProps {
    duration?: number;
    delay?: number;
    ease?: string | number[];
    type?: 'spring' | 'tween' | 'inertia';
    stiffness?: number;
    damping?: number;
    mass?: number;
    repeat?: number;
    repeatType?: 'loop' | 'reverse' | 'mirror';
    repeatDelay?: number;
  }

  export interface Variants {
    [key: string]: object;
  }

  export interface AnimatePresenceProps {
    children?: ReactNode;
    mode?: 'sync' | 'wait' | 'popLayout';
    initial?: boolean;
    onExitComplete?: () => void;
  }

  // Motion components
  export const motion: {
    div: ComponentType<MotionProps & React.HTMLAttributes<HTMLDivElement>>;
    span: ComponentType<MotionProps & React.HTMLAttributes<HTMLSpanElement>>;
    p: ComponentType<MotionProps & React.HTMLAttributes<HTMLParagraphElement>>;
    button: ComponentType<MotionProps & React.ButtonHTMLAttributes<HTMLButtonElement>>;
    a: ComponentType<MotionProps & React.AnchorHTMLAttributes<HTMLAnchorElement>>;
    ul: ComponentType<MotionProps & React.HTMLAttributes<HTMLUListElement>>;
    li: ComponentType<MotionProps & React.HTMLAttributes<HTMLLIElement>>;
    nav: ComponentType<MotionProps & React.HTMLAttributes<HTMLElement>>;
    header: ComponentType<MotionProps & React.HTMLAttributes<HTMLElement>>;
    footer: ComponentType<MotionProps & React.HTMLAttributes<HTMLElement>>;
    section: ComponentType<MotionProps & React.HTMLAttributes<HTMLElement>>;
    article: ComponentType<MotionProps & React.HTMLAttributes<HTMLElement>>;
    aside: ComponentType<MotionProps & React.HTMLAttributes<HTMLElement>>;
    main: ComponentType<MotionProps & React.HTMLAttributes<HTMLElement>>;
    form: ComponentType<MotionProps & React.FormHTMLAttributes<HTMLFormElement>>;
    input: ComponentType<MotionProps & React.InputHTMLAttributes<HTMLInputElement>>;
    img: ComponentType<MotionProps & React.ImgHTMLAttributes<HTMLImageElement>>;
    svg: ComponentType<MotionProps & React.SVGAttributes<SVGElement>>;
    path: ComponentType<MotionProps & React.SVGAttributes<SVGPathElement>>;
    circle: ComponentType<MotionProps & React.SVGAttributes<SVGCircleElement>>;
    rect: ComponentType<MotionProps & React.SVGAttributes<SVGRectElement>>;
    line: ComponentType<MotionProps & React.SVGAttributes<SVGLineElement>>;
    polyline: ComponentType<MotionProps & React.SVGAttributes<SVGPolylineElement>>;
    polygon: ComponentType<MotionProps & React.SVGAttributes<SVGPolygonElement>>;
    tr: ComponentType<MotionProps & React.HTMLAttributes<HTMLTableRowElement>>;
    td: ComponentType<MotionProps & React.HTMLAttributes<HTMLTableCellElement>>;
    th: ComponentType<MotionProps & React.HTMLAttributes<HTMLTableCellElement>>;
    table: ComponentType<MotionProps & React.HTMLAttributes<HTMLTableElement>>;
    [key: string]: ComponentType<MotionProps>;
  };

  // AnimatePresence component
  export const AnimatePresence: ComponentType<AnimatePresenceProps>;

  // Hooks
  export function useAnimation(): AnimationControls;
  export function useMotionValue(initial: number): MotionValue;
  export function useTransform<T>(
    value: MotionValue,
    inputRange: number[],
    outputRange: T[]
  ): MotionValue<T>;
  export function useSpring(value: MotionValue | number, config?: object): MotionValue;
  export function useScroll(options?: object): {
    scrollX: MotionValue;
    scrollY: MotionValue;
    scrollXProgress: MotionValue;
    scrollYProgress: MotionValue;
  };
  export function useInView(ref: RefObject<Element>, options?: object): boolean;
  export function useReducedMotion(): boolean;

  // Animation controls
  export interface AnimationControls {
    start: (definition: object) => Promise<void>;
    stop: () => void;
    set: (definition: object) => void;
  }

  // Motion values
  export interface MotionValue<T = number> {
    get(): T;
    set(value: T): void;
    onChange(callback: (value: T) => void): () => void;
  }
}
