import type { RevenueStream } from '@/types/apiTypes';

type RevenueProjectionInput = {
  revenueProjection?: number;
  estimated_amount?: number;
  estimated_price?: number;
  estimatedPrice?: number;
  estimated_volume?: number;
  estimatedVolume?: number;
};

/** Resolve monthly projection from stored amount or price × volume. */
export function resolveRevenueProjection(stream: RevenueProjectionInput): number {
  const stored = Number(stream.revenueProjection ?? stream.estimated_amount);
  if (Number.isFinite(stored) && stored > 0) {
    return stored;
  }

  const price = Number(stream.estimated_price ?? stream.estimatedPrice ?? 0);
  const volume = Number(stream.estimated_volume ?? stream.estimatedVolume ?? 1);
  return price * volume;
}

/** Sum selected revenue streams — canonical topline monthly revenue figure. */
export function calculateProjectedMonthlyRevenue(streams: RevenueStream[]): number {
  return streams
    .filter((stream) => stream.isSelected !== false)
    .reduce((sum, stream) => sum + resolveRevenueProjection(stream), 0);
}

export const BUDGET_SECTION_IDS = {
  topline: 'budget-topline-metrics',
  startupCosts: 'budget-section-startup-costs',
  monthlyRevenue: 'budget-section-monthly-revenue',
  operatingExpenses: 'budget-section-operating-expenses',
  breakEven: 'budget-section-break-even',
} as const;

export function scrollToBudgetSection(sectionId: string): void {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function mapApiRecordToRevenueStream(item: {
  id: string;
  name: string;
  estimated_price?: number;
  estimated_amount?: number;
  estimated_volume?: number;
  is_selected?: boolean;
  is_custom?: boolean;
}): RevenueStream {
  const estimatedPrice = Number(item.estimated_price ?? 0);
  const estimatedVolume = Number(item.estimated_volume ?? 1);

  return {
    id: item.id,
    name: item.name,
    estimatedPrice,
    estimatedVolume,
    revenueProjection: resolveRevenueProjection({
      estimated_amount: item.estimated_amount,
      estimated_price: estimatedPrice,
      estimated_volume: estimatedVolume,
    }),
    isSelected: item.is_selected !== false,
    isCustom: item.is_custom ?? false,
    category: 'revenue',
  };
}
