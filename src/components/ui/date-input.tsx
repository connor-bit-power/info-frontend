"use client"

import * as React from "react"
import { format } from "date-fns"

interface DateInputProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DateInput({ value, onChange, placeholder = "mm/dd/yyyy", className = "" }: DateInputProps) {
  const [inputValue, setInputValue] = React.useState(value ? format(value, "MM/dd/yyyy") : "")

  React.useEffect(() => {
    if (value) {
      setInputValue(format(value, "MM/dd/yyyy"))
    } else {
      setInputValue("")
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)

    // Try to parse the date
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const match = val.match(dateRegex)
    
    if (match) {
      const [, month, day, year] = match
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      
      if (!isNaN(date.getTime())) {
        onChange(date)
      }
    } else if (val === "") {
      onChange(undefined)
    }
  }

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={`h-9 rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 ${className}`}
    />
  )
}





