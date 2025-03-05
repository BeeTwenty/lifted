
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Set initial state
    handleResize()
    
    // Add event listeners
    window.addEventListener('resize', handleResize)
    mql.addEventListener("change", handleResize)
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize)
      mql.removeEventListener("change", handleResize)
    }
  }, [])

  return !!isMobile
}

// Helper to get viewport dimensions
export function useViewport() {
  const [dimensions, setDimensions] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  React.useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return dimensions
}

// Helper to detect if the device is touch-enabled
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState(false)
  
  React.useEffect(() => {
    const isTouchDevice = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    
    setIsTouch(isTouchDevice)
  }, [])
  
  return isTouch
}
