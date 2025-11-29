'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  presets?: {
    label: string;
    getValue: () => DateRange;
  }[];
  className?: string;
}

const defaultPresets = [
  {
    label: 'Today',
    getValue: (): DateRange => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start: today, end };
    },
  },
  {
    label: 'Yesterday',
    getValue: (): DateRange => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);
      return { start: yesterday, end };
    },
  },
  {
    label: 'Last 7 days',
    getValue: (): DateRange => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    label: 'Last 30 days',
    getValue: (): DateRange => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    label: 'This month',
    getValue: (): DateRange => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    label: 'Last month',
    getValue: (): DateRange => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
];

function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1: Date | null, date2: Date | null): boolean {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  return date >= start && date <= end;
}

export function DateRangePicker({
  value = { start: null, end: null },
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date range',
  presets = defaultPresets,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState<'start' | 'end' | null>(null);
  const [tempRange, setTempRange] = useState<DateRange>(value);

  const handleDateClick = useCallback(
    (date: Date) => {
      if (minDate && date < minDate) return;
      if (maxDate && date > maxDate) return;

      if (!selecting || selecting === 'start') {
        setTempRange({ start: date, end: null });
        setSelecting('end');
      } else {
        if (tempRange.start && date < tempRange.start) {
          setTempRange({ start: date, end: tempRange.start });
        } else {
          setTempRange({ ...tempRange, end: date });
        }
        setSelecting(null);
      }
    },
    [selecting, tempRange, minDate, maxDate]
  );

  const handlePresetClick = useCallback(
    (preset: (typeof presets)[0]) => {
      const range = preset.getValue();
      setTempRange(range);
      onChange?.(range);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleApply = useCallback(() => {
    if (tempRange.start && tempRange.end) {
      onChange?.(tempRange);
      setIsOpen(false);
    }
  }, [tempRange, onChange]);

  const handleClear = useCallback(() => {
    const cleared = { start: null, end: null };
    setTempRange(cleared);
    onChange?.(cleared);
    setIsOpen(false);
  }, [onChange]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderCalendar = (monthOffset: number) => {
    const month = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset);
    const daysInMonth = getDaysInMonth(month.getFullYear(), month.getMonth());
    const firstDay = getFirstDayOfMonth(month.getFullYear(), month.getMonth());
    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), i));
    }

    return (
      <div className="p-3">
        <div className="text-center font-medium text-gray-900 dark:text-white mb-3">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-8" />;
            }

            const isStart = isSameDay(day, tempRange.start);
            const isEnd = isSameDay(day, tempRange.end);
            const inRange = isInRange(day, tempRange.start, tempRange.end);
            const isDisabled = (minDate && day < minDate) || (maxDate && day > maxDate);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={isDisabled}
                onClick={() => handleDateClick(day)}
                className={cn(
                  'h-8 w-8 rounded-full text-sm font-medium transition-colors',
                  'hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                  isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
                  isToday && !isStart && !isEnd && 'border border-primary',
                  (isStart || isEnd) && 'bg-primary text-primary-foreground hover:bg-primary',
                  inRange &&
                    !isStart &&
                    !isEnd &&
                    'bg-primary/20 text-primary dark:text-primary-foreground',
                  !isStart &&
                    !isEnd &&
                    !inRange &&
                    !isDisabled &&
                    'text-gray-900 dark:text-gray-100'
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const displayValue =
    value.start && value.end
      ? `${formatDate(value.start)} – ${formatDate(value.end)}`
      : placeholder;

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setTempRange(value);
          setIsOpen(!isOpen);
        }}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700',
          'bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white',
          'hover:border-gray-300 dark:hover:border-gray-600 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          isOpen && 'ring-2 ring-primary'
        )}
      >
        <CalendarIcon className="h-4 w-4 text-gray-500" />
        <span className={!value.start ? 'text-gray-500' : ''}>{displayValue}</span>
        {value.start && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="ml-1 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XIcon className="h-3 w-3 text-gray-500" />
          </button>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Popover */}
          <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex">
              {/* Presets */}
              <div className="w-36 border-r border-gray-200 dark:border-gray-700 p-2">
                <p className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Quick Select
                </p>
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Calendars */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-3 pt-3">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                <div className="flex">
                  {renderCalendar(0)}
                  {renderCalendar(1)}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {tempRange.start && tempRange.end
                      ? `${formatDate(tempRange.start)} – ${formatDate(tempRange.end)}`
                      : tempRange.start
                        ? `${formatDate(tempRange.start)} – Select end date`
                        : 'Select start date'}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApply}
                      disabled={!tempRange.start || !tempRange.end}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DateRangePicker;
