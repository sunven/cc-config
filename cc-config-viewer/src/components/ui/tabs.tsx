import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { useTranslation } from 'react-i18next'

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  'aria-label'?: string
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, 'aria-label': ariaLabel, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    role="tablist"
    aria-label={ariaLabel}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  value: string
  'aria-label'?: string
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, value, children, 'aria-label': ariaLabel, ...props }, ref) => {
  const { t } = useTranslation()

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      role="tab"
      aria-selected={props['aria-selected']}
      aria-controls={`${value}-panel`}
      id={`${value}-tab`}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5",
        "text-sm font-medium ring-offset-background transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // Enhanced active states - Story 2.3 (AC#1-#3)
        "data-[state=active]:bg-background data-[state=active]:text-foreground",
        "data-[state=active]:shadow-sm data-[state=active]:font-semibold",
        "data-[state=active]:border-b-2 data-[state=active]:border-primary",
        // Inactive state styling
        "data-[state=inactive]:opacity-70 data-[state=inactive]:hover:opacity-100",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  value: string
  'aria-label'?: string
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, value, 'aria-label': ariaLabel, children, ...props }, ref) => {
  return (
    <TabsPrimitive.Content
      ref={ref}
      value={value}
      role="tabpanel"
      id={`${value}-panel`}
      aria-labelledby={`${value}-tab`}
      tabIndex={0}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  )
})
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
