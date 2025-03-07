
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

// Enhanced hook to detect device platform
export function useDevicePlatform() {
  const [platform, setPlatform] = React.useState<{
    isAndroid: boolean;
    isIOS: boolean;
    isMobile: boolean;
  }>({
    isAndroid: false,
    isIOS: false,
    isMobile: false
  })
  
  React.useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    
    // Check for Android
    const isAndroid = /android/i.test(userAgent);
    
    // Check for iOS
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    
    // General mobile check
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
      (window.innerWidth < MOBILE_BREAKPOINT);
    
    setPlatform({
      isAndroid,
      isIOS,
      isMobile
    })
  }, [])
  
  return platform
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
