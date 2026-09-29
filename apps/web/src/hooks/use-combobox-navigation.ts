'use client'

import { useEffect, useState, type KeyboardEvent } from 'react'

export type ComboboxNavigationKey = 'ArrowDown' | 'ArrowUp' | 'Home' | 'End'

export function nextComboboxIndex(
  currentIndex: number,
  itemCount: number,
  key: ComboboxNavigationKey,
): number {
  if (itemCount === 0) return -1
  if (key === 'Home') return 0
  if (key === 'End') return itemCount - 1
  if (key === 'ArrowDown') return currentIndex < itemCount - 1 ? currentIndex + 1 : 0
  return currentIndex > 0 ? currentIndex - 1 : itemCount - 1
}

interface ComboboxNavigationOptions<T> {
  items: T[]
  getOptionId: (item: T, index: number) => string
  onSelect: (item: T) => void
  onEscape: () => void
}

export function useComboboxNavigation<T>({
  items,
  getOptionId,
  onSelect,
  onEscape,
}: ComboboxNavigationOptions<T>) {
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => setActiveIndex(-1), [items])

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      setActiveIndex((current) =>
        nextComboboxIndex(current, items.length, event.key as ComboboxNavigationKey),
      )
      return
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      onSelect(items[activeIndex])
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setActiveIndex(-1)
      onEscape()
    }
  }

  return {
    activeIndex,
    activeOptionId:
      activeIndex >= 0 && items[activeIndex]
        ? getOptionId(items[activeIndex], activeIndex)
        : undefined,
    onKeyDown,
    setActiveIndex,
  }
}
