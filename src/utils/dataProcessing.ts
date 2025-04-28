import { MotionPacket, FSRPacket, HRMPacket, HTMPacket, ImpactEvent, ChartData, ChartDataset } from '../types';
import { formatChartTimestamp } from './timeUtils';

// --- Constants ---
const ACCEL_200G_SENSITIVITY = 16384 / 200; // Adjust based on actual sensor spec
const MAX_CHART_POINTS = 100; // Limit points for performance

// --- Helper: Subsample data ---
export function subsampleData<T>(data: T[], maxPoints: number = MAX_CHART_POINTS): T[] {
  if (!data || data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

// --- Processing Functions ---

/**
 * Processes HRM packets for heart rate visualization
 */
export function processHrmForChart(packets: HRMPacket[]): { 
  chartData: ChartData, 
  avgHr: number | null, 
  minHr: number | null, 
  maxHr: number | null 
} {
  if (!packets || packets.length === 0) {
    console.log('[processHrmForChart] No packets provided');
    return { 
      chartData: { labels: [], datasets: [] }, 
      avgHr: null, 
      minHr: null, 
      maxHr: null 
    };
  }

  // Log sample data to understand structure
  console.log(`[processHrmForChart] Sample packet (first of ${packets.length}):`, 
    JSON.stringify(packets[0]));

  // Try different ways to extract heart rate data
  let validPackets: Array<HRMPacket & { heartRate: number, appTimestamp: number }> = [];
  
  try {
    // First attempt - use standard interface
    validPackets = packets
      .filter(p => typeof p.heartRate === 'number' && !isNaN(p.heartRate) && p.heartRate > 0)
      .sort((a, b) => a.appTimestamp - b.appTimestamp) as Array<HRMPacket & { heartRate: number, appTimestamp: number }>;
      
    console.log(`[processHrmForChart] Standard filtering found ${validPackets.length} valid packets`);
    
    // If no valid packets found, try alternative property names
    if (validPackets.length === 0) {
      // Check for alternative property names
      const alternativeProps = ['heart_rate', 'hr', 'bpm', 'rate'];
      
      for (const prop of alternativeProps) {
        const packetsWithProp = packets.filter(p => 
          typeof (p as any)[prop] === 'number' && 
          !isNaN((p as any)[prop]) && 
          (p as any)[prop] > 0
        );
        
        if (packetsWithProp.length > 0) {
          console.log(`[processHrmForChart] Found ${packetsWithProp.length} packets with ${prop} property`);
          
          // Map to standard format
          validPackets = packetsWithProp.map(p => ({
            ...p,
            heartRate: (p as any)[prop],
            appTimestamp: p.appTimestamp || p.deviceTimestamp || (p as any).timestamp || Date.now()
          })).sort((a, b) => a.appTimestamp - b.appTimestamp) as Array<HRMPacket & { heartRate: number, appTimestamp: number }>;
          
          break;
        }
      }
    }
  } catch (error) {
    console.error('[processHrmForChart] Error during filtering:', error);
  }

  // If no valid data after all attempts, return empty result
  if (validPackets.length === 0) {
    console.log('[processHrmForChart] No valid heart rate data found after all attempts');
    return { 
      chartData: { labels: [], datasets: [] }, 
      avgHr: null, 
      minHr: null, 
      maxHr: null 
    };
  }

  // Subsample for better chart performance
  const subsampled = subsampleData(validPackets);
  
  // Format data for chart
  const labels = subsampled.map(p => formatChartTimestamp(p.appTimestamp));
  const data = subsampled.map(p => p.heartRate);

  // Calculate statistics
  const validHrs = validPackets.map(p => p.heartRate);
  const avgHr = validHrs.length > 0 ? 
    Math.round(validHrs.reduce((a, b) => a + b, 0) / validHrs.length) : null;
  const minHr = validHrs.length > 0 ? Math.min(...validHrs) : null;
  const maxHr = validHrs.length > 0 ? Math.max(...validHrs) : null;

  const datasets: ChartDataset[] = [{
    data: data,
    color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`, // Red for HR
    strokeWidth: 2,
  }];

  console.log(`[processHrmForChart] Successfully processed ${validPackets.length} packets. Avg HR: ${avgHr}`);
  return { chartData: { labels, datasets }, avgHr, minHr, maxHr };
}

/**
 * Processes HTM packets for temperature visualization
 */
export function processTempForChart(packets: HTMPacket[]): { 
  chartData: ChartData, 
  avgTemp: number | null, 
  minTemp: number | null, 
  maxTemp: number | null, 
  currentTemp: number | null 
} {
  if (!packets || packets.length === 0) {
    return { 
      chartData: { labels: [], datasets: [] }, 
      avgTemp: null, 
      minTemp: null, 
      maxTemp: null, 
      currentTemp: null 
    };
  }

  // Filter invalid data and sort by timestamp
  const validPackets = packets
    .filter(p => typeof p.temperature === 'number' && !isNaN(p.temperature))
    .sort((a, b) => a.appTimestamp - b.appTimestamp);

  // If no valid data after filtering, return empty result
  if (validPackets.length === 0) {
    return { 
      chartData: { labels: [], datasets: [] }, 
      avgTemp: null, 
      minTemp: null, 
      maxTemp: null, 
      currentTemp: null 
    };
  }

  // Subsample for better chart performance
  const subsampled = subsampleData(validPackets);
  
  // Format data for chart - round to 1 decimal place for display
  const labels = subsampled.map(p => formatChartTimestamp(p.appTimestamp));
  const data = subsampled.map(p => parseFloat(p.temperature.toFixed(1)));

  // Calculate statistics
  const validTemps = validPackets.map(p => p.temperature);
  const avgTemp = validTemps.length > 0 ? 
    parseFloat((validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(1)) : null;
  const minTemp = validTemps.length > 0 ? 
    parseFloat(Math.min(...validTemps).toFixed(1)) : null;
  const maxTemp = validTemps.length > 0 ? 
    parseFloat(Math.max(...validTemps).toFixed(1)) : null;
  const currentTemp = validPackets.length > 0 ? 
    parseFloat(validPackets[validPackets.length - 1].temperature.toFixed(1)) : null;

  const datasets: ChartDataset[] = [{
    data: data,
    color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`, // Orange for Temp
    strokeWidth: 2,
  }];

  return { chartData: { labels, datasets }, avgTemp, minTemp, maxTemp, currentTemp };
}

/**
 * Processes FSR packets for bite force visualization
 */
export function processFsrForChart(packets: FSRPacket[]): { 
  chartData: ChartData, 
  avgLeft: number | null, 
  avgRight: number | null, 
  avgTotal: number | null,
  maxForce: number | null 
} {
  if (!packets || packets.length === 0) {
    return { 
      chartData: { labels: [], datasets: [] }, 
      avgLeft: null, 
      avgRight: null, 
      avgTotal: null,
      maxForce: null
    };
  }

  // Filter and sort by timestamp
  const validPackets = packets
    .filter(p => (
      (typeof p.left_bite === 'number' && !isNaN(p.left_bite)) || 
      (typeof p.right_bite === 'number' && !isNaN(p.right_bite))
    ))
    .sort((a, b) => {
      // Use timestamp from FSRPacket
      return a.timestamp - b.timestamp;
    });

  if (validPackets.length === 0) {
    return { 
      chartData: { labels: [], datasets: [] }, 
      avgLeft: null, 
      avgRight: null, 
      avgTotal: null,
      maxForce: null
    };
  }

  // Subsample for better chart performance
  const subsampled = subsampleData(validPackets);
  
  // Format data for chart
  const labels = subsampled.map(p => formatChartTimestamp(p.timestamp));
  const leftData = subsampled.map(p => typeof p.left_bite === 'number' ? p.left_bite : 0);
  const rightData = subsampled.map(p => typeof p.right_bite === 'number' ? p.right_bite : 0);

  // Calculate statistics from all valid data
  const validLeft = validPackets
    .map(p => p.left_bite)
    .filter(v => typeof v === 'number' && !isNaN(v));
    
  const validRight = validPackets
    .map(p => p.right_bite)
    .filter(v => typeof v === 'number' && !isNaN(v));
    
  const avgLeft = validLeft.length > 0 ? 
    Math.round(validLeft.reduce((a, b) => a + b, 0) / validLeft.length) : null;
    
  const avgRight = validRight.length > 0 ? 
    Math.round(validRight.reduce((a, b) => a + b, 0) / validRight.length) : null;
    
  const allValid = [...validLeft, ...validRight];
  const avgTotal = allValid.length > 0 ? 
    Math.round(allValid.reduce((a, b) => a + b, 0) / allValid.length) : null;
    
  const maxForce = allValid.length > 0 ? Math.max(...allValid) : null;

  const datasets: ChartDataset[] = [
    { 
      data: leftData, 
      color: (opacity = 1) => `rgba(0, 176, 118, ${opacity})`, // Green for Left
      strokeWidth: 2 
    },
    { 
      data: rightData, 
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // Blue for Right
      strokeWidth: 2 
    }
  ];

  return { 
    chartData: { labels, datasets, legend: ['Left', 'Right'] }, 
    avgLeft, 
    avgRight, 
    avgTotal,
    maxForce
  };
}

/**
 * Processes motion packets for acceleration visualization
 */
export function processMotionForChart(packets: MotionPacket[]): { 
  accelMagnitudeChart: ChartData, 
  peakAccel: number | null
} {
  if (!packets || packets.length === 0) {
    return { 
      accelMagnitudeChart: { labels: [], datasets: [] }, 
      peakAccel: null 
    };
  }

  // Sort by timestamp
  const sortedPackets = packets.sort((a, b) => {
    // Use appTimestamp if available, fallback to device timestamp
    const aTime = (a as any).appTimestamp || a.timestamp;
    const bTime = (b as any).appTimestamp || b.timestamp;
    return aTime - bTime;
  });

  // Calculate G-force magnitudes
  const magnitudes = sortedPackets.map(p => {
    try {
      // First, handle the case where accel200 is an array as defined in the type
      if (p.accel200 && Array.isArray(p.accel200) && p.accel200.length >= 3) {
        // Use the array directly
        const gx = (p.accel200[0] ?? 0) / ACCEL_200G_SENSITIVITY;
        const gy = (p.accel200[1] ?? 0) / ACCEL_200G_SENSITIVITY;
        const gz = (p.accel200[2] ?? 0) / ACCEL_200G_SENSITIVITY;
        return Math.sqrt(gx*gx + gy*gy + gz*gz);
      }
      
      // Next, try handling as possible object notation (p.accel200.x)
      if (p.accel200 && typeof p.accel200 === 'object' && 'x' in p.accel200 && 'y' in p.accel200 && 'z' in p.accel200) {
        const gx = ((p.accel200 as any).x ?? 0) / ACCEL_200G_SENSITIVITY;
        const gy = ((p.accel200 as any).y ?? 0) / ACCEL_200G_SENSITIVITY;
        const gz = ((p.accel200 as any).z ?? 0) / ACCEL_200G_SENSITIVITY;
        return Math.sqrt(gx*gx + gy*gy + gz*gz);
      }
      
      // Finally, try accessing as individual properties (p.accel200_x)
      const accel200X = (p as any).accel200_x ?? (p as any).accel200x ?? 0;
      const accel200Y = (p as any).accel200_y ?? (p as any).accel200y ?? 0;
      const accel200Z = (p as any).accel200_z ?? (p as any).accel200z ?? 0;
      
      if (accel200X !== 0 || accel200Y !== 0 || accel200Z !== 0) {
        const gx = accel200X / ACCEL_200G_SENSITIVITY;
        const gy = accel200Y / ACCEL_200G_SENSITIVITY;
        const gz = accel200Z / ACCEL_200G_SENSITIVITY;
        return Math.sqrt(gx*gx + gy*gy + gz*gz);
      }
      
      // If none of the above worked, return 0
      return 0;
    } catch (error) {
      console.warn('Error processing motion packet:', error);
      return 0; // Fallback to 0 on error
    }
  });

  // Find peak acceleration
  const peakAccel = magnitudes.length > 0 ? 
    parseFloat(Math.max(...magnitudes).toFixed(2)) : null;

  // Subsample for better chart performance
  const subsampled = subsampleData(sortedPackets);
  
  // Format data for chart
  const labels = subsampled.map(p => 
    formatChartTimestamp((p as any).appTimestamp || p.timestamp));
    
  const subsampledMagnitudes = subsampled.map((_, i) => {
    const originalIndex = Math.floor(i * (sortedPackets.length / subsampled.length));
    return magnitudes[originalIndex];
  });

  const datasets: ChartDataset[] = [{
    data: subsampledMagnitudes,
    color: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`, // Gray for magnitude
    strokeWidth: 2,
  }];

  return { 
    accelMagnitudeChart: { labels, datasets }, 
    peakAccel 
  };
}

/**
 * Processes impact events for timeline and distribution visualizations
 */
export function processImpactsForCharts(impacts: ImpactEvent[]): {
  timelineChart: ChartData,
  severityDistribution: { labels: string[], data: number[] },
  cumulativeExposureChart: ChartData,
  totalImpacts: number,
  highImpacts: number,
  maxG: number | null,
  concussionRisk: 'Low' | 'Moderate' | 'High' | 'Critical'
} {
  if (!impacts || impacts.length === 0) {
    return {
      timelineChart: { labels: [], datasets: [] },
      severityDistribution: { labels: [], data: [] },
      cumulativeExposureChart: { labels: [], datasets: [] },
      totalImpacts: 0,
      highImpacts: 0,
      maxG: null,
      concussionRisk: 'Low'
    };
  }

  // Sort by timestamp
  const sortedImpacts = impacts.sort((a, b) => a.timestamp - b.timestamp);

  // Timeline Chart
  const subsampledTimeline = subsampleData(sortedImpacts);
  const timelineLabels = subsampledTimeline.map(p => formatChartTimestamp(p.timestamp));
  const timelineData = subsampledTimeline.map(p => p.magnitude);
  const timelineChart: ChartData = {
    labels: timelineLabels,
    datasets: [{ 
      data: timelineData, 
      color: (opacity = 1) => `rgba(0, 176, 118, ${opacity})`, 
      strokeWidth: 2 
    }]
  };

  // Severity Distribution
  const severityCounts = { 
    low: 0, 
    moderate: 0, 
    severe: 0, 
    critical: 0 
  };
  
  let highImpactCount = 0;
  
  impacts.forEach(p => {
    const severity = p.severity ?? 'low'; // Default to low if undefined
    if (severityCounts.hasOwnProperty(severity)) {
      severityCounts[severity]++;
    }
    if (severity === 'severe' || severity === 'critical') {
      highImpactCount++;
    }
  });
  
  const severityDistribution = {
    labels: Object.keys(severityCounts).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    data: Object.values(severityCounts)
  };

  // Cumulative Exposure
  let cumulativeG = 0;
  const cumulativeData = sortedImpacts.map(p => {
    cumulativeG += p.magnitude;
    return cumulativeG;
  });
  
  const subsampledCumulative = subsampleData(cumulativeData);
  const cumulativeLabels = subsampleData(sortedImpacts).map(p => formatChartTimestamp(p.timestamp));
  
  const cumulativeExposureChart: ChartData = {
    labels: cumulativeLabels,
    datasets: [{ 
      data: subsampledCumulative, 
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, 
      strokeWidth: 2 
    }]
  };

  // Calculate KPIs
  const magnitudes = impacts.map(p => p.magnitude);
  const maxG = magnitudes.length > 0 ? 
    parseFloat(Math.max(...magnitudes).toFixed(2)) : null;
    
  // Determine risk level
  let concussionRisk: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
  
  if (highImpactCount >= 3 || (maxG !== null && maxG >= 150)) {
    concussionRisk = 'Critical';
  } else if (highImpactCount >= 2 || (maxG !== null && maxG >= 120)) {
    concussionRisk = 'High';
  } else if (highImpactCount >= 1 || (maxG !== null && maxG >= 90)) {
    concussionRisk = 'Moderate';
  }

  return {
    timelineChart,
    severityDistribution,
    cumulativeExposureChart,
    totalImpacts: impacts.length,
    highImpacts: highImpactCount,
    maxG,
    concussionRisk
  };
} 