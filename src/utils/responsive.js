import { Dimensions } from 'react-native';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

// Define baseline for a standard mobile screen (e.g., iPhone 11/12)
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

/**
 * Basic linear scale relative to screen width.
 * Useful for padding, margin, width, height, and border radius.
 */
export const scale = (size) => (windowWidth / guidelineBaseWidth) * size;

/**
 * Basic linear scale relative to screen height.
 * Often used less frequently, but good for vertical heights.
 */
export const verticalScale = (size) => (windowHeight / guidelineBaseHeight) * size;

/**
 * Non-linear scale. The factor determines how much to scale up.
 * 0.5 factor means it scales but less aggressively than pure `scale`.
 * Ideal for fonts and icons.
 */
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// Breakpoints
export const isSmallPhone = () => windowWidth < 360;
export const isNormalPhone = () => windowWidth >= 360 && windowWidth < 480;
export const isTablet = () => windowWidth >= 768;

// Re-computation hooks if needed dynamically
export const getResponsiveValues = (currentWidth, currentHeight) => {
    return {
        scale: (size) => (currentWidth / guidelineBaseWidth) * size,
        verticalScale: (size) => (currentHeight / guidelineBaseHeight) * size,
        moderateScale: (size, factor = 0.5) => size + ((currentWidth / guidelineBaseWidth) * size - size) * factor,
        isSmallPhone: currentWidth < 360,
        isNormalPhone: currentWidth >= 360 && currentWidth < 480,
        isTablet: currentWidth >= 768,
    };
};
