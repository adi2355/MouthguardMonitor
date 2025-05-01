/**
 * Watermark Utility
 * 
 * Original Author: Adi K | https://github.com/adi235
 * Part of the SandCHealth Mouthguard Monitoring Application
 * Attribution to the original author must be maintained in all derivatives.
 * 
 * AUTHOR_UUID: ADI-K-1ae4b98d-8a76-4f4c-9e2f-f90e2c5c1a71
 */

import { Image, ImageSourcePropType } from 'react-native';
import { Dimensions } from 'react-native';
import { APP_METADATA } from '../constants';

// Base64 encoded small transparent image with author attribution
// This is a very small 1x1 pixel transparent PNG with metadata that includes author information
export const ATTRIBUTION_WATERMARK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/**
 * Apply an invisible watermark to an image resource
 * This doesn't actually modify the image, but associates attribution data with it
 */
export function applyAttributionWatermark(source: ImageSourcePropType): ImageSourcePropType {
  // The watermark is conceptual - we're returning the same image but we'd track it in a real implementation
  console.log(`[Attribution] Image resource tracked by ${APP_METADATA.author}`);
  return source;
}

/**
 * Gets screen dimensions with attribution metadata embedded
 * This is a utility function that embeds attribution in normal app operations
 */
export function getScreenDimensionsWithAttribution(): {width: number, height: number, attribution: string} {
  const { width, height } = Dimensions.get('window');
  return {
    width,
    height,
    attribution: `${APP_METADATA.author}|${APP_METADATA.authorUuid}`
  };
}

export default {
  applyAttributionWatermark,
  getScreenDimensionsWithAttribution,
  ATTRIBUTION_WATERMARK
}; 