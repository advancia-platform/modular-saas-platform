import { debounce } from 'lodash';
import React, { memo, useCallback, useMemo } from 'react';

// Performance utilities
export const useDebounce = (callback: Function, delay: number = 300) => {
  return useMemo(() => debounce(callback, delay), [callback, delay]);
};

// Memoized wrapper for expensive components
interface MemoizedComponentProps {
  children: React.ReactNode;
  dependencies?: any[];
}

export const MemoizedComponent = memo<MemoizedComponentProps>(({ children, dependencies = [] }) => {
  return useMemo(() => children, dependencies);
});

MemoizedComponent.displayName = 'MemoizedComponent';

// HOC for performance optimization
export function withPerformanceOptimization<T extends object>(
  Component: React.ComponentType<T>,
  compareProps?: (prevProps: T, nextProps: T) => boolean
) {
  const WrappedComponent = memo(Component, compareProps);
  WrappedComponent.displayName = `withPerformanceOptimization(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Optimized table component for large datasets
interface VirtualizedTableProps {
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  bufferSize?: number;
}

export const VirtualizedTable = memo<VirtualizedTableProps>(
  ({ data, renderRow, itemHeight, containerHeight, bufferSize = 5 }) => {
    const [scrollTop, setScrollTop] = React.useState(0);

    const visibleData = useMemo(() => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
      const endIndex = Math.min(
        data.length - 1,
        startIndex + Math.ceil(containerHeight / itemHeight) + bufferSize * 2
      );

      return data.slice(startIndex, endIndex + 1).map((item, index) => ({
        item,
        index: startIndex + index,
      }));
    }, [data, scrollTop, itemHeight, containerHeight, bufferSize]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return (
      <div style={{ height: containerHeight, overflow: 'auto' }} onScroll={handleScroll}>
        <div style={{ height: data.length * itemHeight, position: 'relative' }}>
          {visibleData.map(({ item, index }) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: index * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderRow(item, index)}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

VirtualizedTable.displayName = 'VirtualizedTable';

// Optimized image component with lazy loading
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  lazy?: boolean;
}

export const OptimizedImage = memo<OptimizedImageProps>(
  ({
    src,
    alt,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRkFGQUZBIi8+Cjwvc3ZnPgo=',
    fallback = '/images/fallback.png',
    lazy = true,
    ...props
  }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);
    const [currentSrc, setCurrentSrc] = React.useState(lazy ? placeholder : src);

    const imgRef = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
      if (!lazy) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && currentSrc === placeholder) {
            setCurrentSrc(src);
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, [src, placeholder, lazy, currentSrc]);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      setHasError(false);
    }, []);

    const handleError = useCallback(() => {
      setHasError(true);
      setCurrentSrc(fallback);
    }, [fallback]);

    return (
      <img
        ref={imgRef}
        src={hasError ? fallback : currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          transition: 'opacity 0.3s ease',
          opacity: isLoaded || currentSrc === placeholder ? 1 : 0,
          ...props.style,
        }}
        {...props}
      />
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16) {
        // More than one frame (16ms)
        console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render`);
      }
    };
  });
};

export default {
  MemoizedComponent,
  withPerformanceOptimization,
  VirtualizedTable,
  OptimizedImage,
  useDebounce,
  usePerformanceMonitor,
};
