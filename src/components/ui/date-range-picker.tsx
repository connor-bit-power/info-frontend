"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { Label } from "./label"
import { Switch } from "./switch"
import { DateInput } from "./date-input"
import { CalendarIcon } from "@radix-ui/react-icons"

interface DateRangePickerProps {
  onUpdate?: (values: { range: { from: Date | undefined; to: Date | undefined }; rangeCompare?: { from: Date | undefined; to: Date | undefined } }) => void
  initialDateFrom?: Date | string
  initialDateTo?: Date | string
  initialCompareFrom?: Date | string
  initialCompareTo?: Date | string
  align?: "start" | "center" | "end"
  locale?: string
  showCompare?: boolean
  placeholder?: string
  triggerIcon?: React.ReactNode
}

export function DateRangePicker({
  onUpdate,
  initialDateFrom,
  initialDateTo,
  initialCompareFrom,
  initialCompareTo,
  align = "end",
  locale = "en-US",
  showCompare = false,
  placeholder = "Select Date Range",
  triggerIcon,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [range, setRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
    from: initialDateFrom ? new Date(initialDateFrom) : undefined,
    to: initialDateTo ? new Date(initialDateTo) : undefined,
  })
  const [rangeCompare, setRangeCompare] = React.useState<{ from: Date | undefined; to: Date | undefined } | undefined>(
    initialCompareFrom ? {
      from: new Date(initialCompareFrom),
      to: initialCompareTo ? new Date(initialCompareTo) : undefined,
    } : undefined
  )
  const [isCompareEnabled, setIsCompareEnabled] = React.useState(false)

  const formatDateRange = () => {
    if (!range.from) return placeholder
    if (!range.to) return format(range.from, "MMM d, yyyy")
    return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`
  }

  React.useEffect(() => {
    if (onUpdate) {
      onUpdate({ range, rangeCompare: isCompareEnabled ? rangeCompare : undefined })
    }
  }, [range, rangeCompare, isCompareEnabled])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-3">
        <span 
          className="text-sm text-white/70 font-normal"
          style={{ fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif' }}
        >
          {formatDateRange()}
        </span>
        <PopoverTrigger asChild>
          <button
            className="hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-0 p-0"
          >
            {triggerIcon}
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent 
        className="w-auto p-0" 
        align={align}
        style={{ 
          fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }}
      >
        <div className="p-4 space-y-4">
            {/* Date inputs */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs text-white/50">From</Label>
                <DateInput
                  value={range.from}
                  onChange={(date) => setRange({ ...range, from: date })}
                  className="w-full mt-1"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-white/50">To</Label>
                <DateInput
                  value={range.to}
                  onChange={(date) => setRange({ ...range, to: date })}
                  className="w-full mt-1"
                />
              </div>
            </div>

            {/* Calendar */}
            <Calendar
              mode="range"
              selected={{ from: range.from, to: range.to }}
              onSelect={(selectedRange) => {
                if (selectedRange) {
                  setRange({ from: selectedRange.from, to: selectedRange.to })
                }
              }}
              numberOfMonths={2}
            />

            {/* Compare toggle */}
            {showCompare && (
              <div className="border-t border-white/10 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-white">Compare to</Label>
                  <Switch
                    checked={isCompareEnabled}
                    onCheckedChange={setIsCompareEnabled}
                  />
                </div>

                {isCompareEnabled && (
                  <>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-white/50">From</Label>
                        <DateInput
                          value={rangeCompare?.from}
                          onChange={(date) => setRangeCompare({ ...rangeCompare, from: date, to: rangeCompare?.to })}
                          className="w-full mt-1"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-white/50">To</Label>
                        <DateInput
                          value={rangeCompare?.to}
                          onChange={(date) => setRangeCompare({ ...rangeCompare, from: rangeCompare?.from, to: date })}
                          className="w-full mt-1"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

