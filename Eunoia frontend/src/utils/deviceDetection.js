/**
 * Device Detection Utility
 * Detects whether the user is on a mobile or desktop device
 */

export const deviceDetection = {
  /**
   * Check if the current device is mobile
   * @returns {boolean} true if mobile, false if desktop
   */
  isMobile() {
    // Check user agent for mobile indicators
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Mobile user agent patterns
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    
    // Check screen width as additional indicator
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const isMobileWidth = screenWidth <= 768;
    
    // Check touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Combine checks for more accurate detection
    const isMobileUserAgent = mobileRegex.test(userAgent);
    
    // Return true if any mobile indicator is present
    return isMobileUserAgent || (isMobileWidth && isTouchDevice);
  },

  /**
   * Check if the current device is desktop
   * @returns {boolean} true if desktop, false if mobile
   */
  isDesktop() {
    return !this.isMobile();
  },

  /**
   * Get device type as string
   * @returns {string} 'mobile' or 'desktop'
   */
  getDeviceType() {
    return this.isMobile() ? 'mobile' : 'desktop';
  },

  /**
   * Check if device orientation is portrait (mainly for mobile)
   * @returns {boolean} true if portrait, false if landscape
   */
  isPortrait() {
    return window.innerHeight > window.innerWidth;
  },

  /**
   * Check if device orientation is landscape
   * @returns {boolean} true if landscape, false if portrait
   */
  isLandscape() {
    return !this.isPortrait();
  },

  /**
   * Get screen dimensions
   * @returns {object} {width, height}
   */
  getScreenDimensions() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    };
  }
};

export default deviceDetection;