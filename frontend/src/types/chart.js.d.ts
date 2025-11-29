declare module 'chart.js' {
  export * from 'chart.js/auto';
}

declare module 'chart.js/auto' {
  export interface ChartData<TType = unknown, TData = unknown, TLabel = unknown> {
    labels?: TLabel[];
    datasets: ChartDataset<TType, TData>[];
  }

  export interface ChartDataset<TType = unknown, TData = unknown> {
    label?: string;
    data: TData;
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    hoverOffset?: number;
    cutout?: string;
    [key: string]: unknown;
  }

  export interface ChartOptions<TType = unknown> {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    plugins?: {
      legend?: {
        display?: boolean;
        position?: 'top' | 'bottom' | 'left' | 'right';
        labels?: {
          color?: string;
          padding?: number;
          font?: {
            size?: number;
          };
          [key: string]: unknown;
        };
        [key: string]: unknown;
      };
      title?: {
        display?: boolean;
        text?: string;
        color?: string;
        [key: string]: unknown;
      };
      tooltip?: {
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    scales?: {
      x?: {
        display?: boolean;
        grid?: {
          display?: boolean;
          color?: string;
          [key: string]: unknown;
        };
        ticks?: {
          color?: string;
          [key: string]: unknown;
        };
        [key: string]: unknown;
      };
      y?: {
        display?: boolean;
        grid?: {
          display?: boolean;
          color?: string;
          [key: string]: unknown;
        };
        ticks?: {
          color?: string;
          [key: string]: unknown;
        };
        beginAtZero?: boolean;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  export class Chart {
    static register(...items: unknown[]): void;
  }

  export const CategoryScale: unknown;
  export const LinearScale: unknown;
  export const BarElement: unknown;
  export const LineElement: unknown;
  export const PointElement: unknown;
  export const ArcElement: unknown;
  export const Title: unknown;
  export const Tooltip: unknown;
  export const Legend: unknown;
  export const Filler: unknown;

  export {
    Chart as ChartJS,
    Chart as default,
  };
}

declare module 'react-chartjs-2' {
  import { ComponentType } from 'react';

  interface ChartProps {
    data: any;
    options?: any;
    className?: string;
    height?: number;
    width?: number;
    [key: string]: any;
  }

  export const Line: ComponentType<ChartProps>;
  export const Bar: ComponentType<ChartProps>;
  export const Pie: ComponentType<ChartProps>;
  export const Doughnut: ComponentType<ChartProps>;
  export const Radar: ComponentType<ChartProps>;
  export const PolarArea: ComponentType<ChartProps>;
  export const Bubble: ComponentType<ChartProps>;
  export const Scatter: ComponentType<ChartProps>;
}
