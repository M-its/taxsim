import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@/lib/utils"
import * as React from "react"

function Tabs({
  className,
  ...props
}: TabsPrimitive.Root.Props & React.RefAttributes<HTMLDivElement>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props & React.RefAttributes<HTMLDivElement>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 w-fit items-center justify-center rounded-none border border-[#27272a] bg-[#18181b] p-1 text-[#a1a1aa]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: TabsPrimitive.Tab.Props & React.RefAttributes<HTMLButtonElement>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center rounded-none px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d399]/50 disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-[#34d399] data-[selected]:text-[#09090b] data-[selected]:shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: TabsPrimitive.Panel.Props & React.RefAttributes<HTMLDivElement>) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "mt-2 ring-offset-[#09090b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d399]/50",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
