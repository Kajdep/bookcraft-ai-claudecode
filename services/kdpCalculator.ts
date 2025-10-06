/**
 * KDP Calculator
 * 
 * Calculates Amazon KDP printing costs and royalties for different
 * marketplaces, book types, and interior options.
 */

import { logger } from './logger';

export type Marketplace = 'US' | 'UK' | 'EU' | 'CA' | 'AU' | 'JP';
export type BookType = 'paperback' | 'hardcover';
export type Interior = 'black-white' | 'color';
export type TrimSize = '5x8' | '6x9' | '8.5x11' | 'other';

export interface KDPCalculationInput {
  pageCount: number;
  listPrice: number;
  marketplace: Marketplace;
  bookType: BookType;
  interior: Interior;
  trim: TrimSize;
}

export interface KDPCalculation extends KDPCalculationInput {
  printingCost: number;
  royalty35: number;
  royalty70: number;
  breakEvenPrice: number;
  recommendedPrice: number;
  profitMargin35: number;
  profitMargin70: number;
}

export class KDPCalculator {
  // KDP printing cost formulas by marketplace
  // Source: https://kdp.amazon.com/en_US/help/topic/G201834340
  private readonly PRINTING_COSTS = {
    US: {
      'black-white': { fixed: 0.85, perPage: 0.012 },
      'color': { fixed: 0.85, perPage: 0.06 }
    },
    UK: {
      'black-white': { fixed: 0.70, perPage: 0.01 },
      'color': { fixed: 0.70, perPage: 0.05 }
    },
    EU: {
      'black-white': { fixed: 0.60, perPage: 0.012 },
      'color': { fixed: 0.60, perPage: 0.06 }
    },
    CA: {
      'black-white': { fixed: 0.85, perPage: 0.012 },
      'color': { fixed: 0.85, perPage: 0.06 }
    },
    AU: {
      'black-white': { fixed: 0.85, perPage: 0.012 },
      'color': { fixed: 0.85, perPage: 0.06 }
    },
    JP: {
      'black-white': { fixed: 0.85, perPage: 0.012 },
      'color': { fixed: 0.85, perPage: 0.06 }
    }
  };

  // Currency symbols
  private readonly CURRENCY_SYMBOLS: Record<Marketplace, string> = {
    US: '$',
    UK: '£',
    EU: '€',
    CA: 'CA$',
    AU: 'AU$',
    JP: '¥'
  };

  // Minimum list prices by marketplace
  private readonly MIN_LIST_PRICES: Record<Marketplace, number> = {
    US: 2.99,
    UK: 1.99,
    EU: 2.99,
    CA: 2.99,
    AU: 2.99,
    JP: 250
  };

  /**
   * Calculate all KDP metrics
   */
  calculate(input: KDPCalculationInput): KDPCalculation {
    try {
      // Validate input
      this.validateInput(input);

      // Calculate printing cost
      const printingCost = this.calculatePrintingCost(input);

      // Calculate royalties
      const royalty35 = this.calculateRoyalty(input.listPrice, printingCost, 0.35);
      const royalty70 = this.calculateRoyalty(input.listPrice, printingCost, 0.70);

      // Calculate break-even price
      const breakEvenPrice = this.calculateBreakEven(printingCost);

      // Calculate recommended price (break-even + 50% markup)
      const recommendedPrice = Math.ceil(breakEvenPrice * 1.5 * 100) / 100;

      // Calculate profit margins
      const profitMargin35 = input.listPrice > 0 ? (royalty35 / input.listPrice) * 100 : 0;
      const profitMargin70 = input.listPrice > 0 ? (royalty70 / input.listPrice) * 100 : 0;

      const result: KDPCalculation = {
        ...input,
        printingCost,
        royalty35,
        royalty70,
        breakEvenPrice,
        recommendedPrice,
        profitMargin35,
        profitMargin70
      };

      logger.debug('KDP calculation completed', result);
      return result;
    } catch (error) {
      logger.error('KDP calculation failed', error);
      throw error;
    }
  }

  /**
   * Calculate printing cost
   */
  private calculatePrintingCost(input: KDPCalculationInput): number {
    const costs = this.PRINTING_COSTS[input.marketplace][input.interior];
    const cost = costs.fixed + (costs.perPage * input.pageCount);
    return Math.round(cost * 100) / 100;
  }

  /**
   * Calculate royalty for a given rate
   */
  private calculateRoyalty(listPrice: number, printingCost: number, rate: number): number {
    const royalty = (listPrice * rate) - printingCost;
    return Math.max(0, Math.round(royalty * 100) / 100);
  }

  /**
   * Calculate break-even price
   */
  private calculateBreakEven(printingCost: number): number {
    // For 35% royalty: listPrice * 0.35 = printingCost
    // listPrice = printingCost / 0.35
    const breakEven = printingCost / 0.35;
    return Math.ceil(breakEven * 100) / 100;
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: KDPCalculationInput): void {
    if (input.pageCount < 24) {
      throw new Error('Page count must be at least 24 pages');
    }

    if (input.pageCount > 828) {
      throw new Error('Page count cannot exceed 828 pages');
    }

    if (input.listPrice < 0) {
      throw new Error('List price must be positive');
    }

    const minPrice = this.MIN_LIST_PRICES[input.marketplace];
    if (input.listPrice < minPrice) {
      logger.warn('List price below minimum', { 
        listPrice: input.listPrice, 
        minPrice,
        marketplace: input.marketplace 
      });
    }
  }

  /**
   * Get currency symbol for marketplace
   */
  getCurrencySymbol(marketplace: Marketplace): string {
    return this.CURRENCY_SYMBOLS[marketplace];
  }

  /**
   * Get minimum list price for marketplace
   */
  getMinListPrice(marketplace: Marketplace): number {
    return this.MIN_LIST_PRICES[marketplace];
  }

  /**
   * Format price with currency symbol
   */
  formatPrice(price: number, marketplace: Marketplace): string {
    const symbol = this.getCurrencySymbol(marketplace);
    const formatted = price.toFixed(2);
    
    // For Japanese Yen, no decimal places
    if (marketplace === 'JP') {
      return `${symbol}${Math.round(price)}`;
    }
    
    return `${symbol}${formatted}`;
  }

  /**
   * Calculate optimal pricing strategy
   */
  calculateOptimalPricing(input: KDPCalculationInput): {
    competitive: number;
    balanced: number;
    premium: number;
  } {
    const printingCost = this.calculatePrintingCost(input);
    const breakEven = this.calculateBreakEven(printingCost);

    return {
      competitive: Math.ceil(breakEven * 1.3 * 100) / 100, // 30% markup
      balanced: Math.ceil(breakEven * 1.5 * 100) / 100,     // 50% markup
      premium: Math.ceil(breakEven * 2.0 * 100) / 100       // 100% markup
    };
  }

  /**
   * Compare royalty options
   */
  compareRoyaltyOptions(input: KDPCalculationInput): {
    option35: { rate: string; royalty: number; profit: number };
    option70: { rate: string; royalty: number; profit: number };
    recommendation: '35%' | '70%';
  } {
    const printingCost = this.calculatePrintingCost(input);
    const royalty35 = this.calculateRoyalty(input.listPrice, printingCost, 0.35);
    const royalty70 = this.calculateRoyalty(input.listPrice, printingCost, 0.70);

    // 70% royalty is only available for books priced between $2.99 and $9.99 in US
    // For simplicity, we'll recommend based on which gives higher royalty
    const recommendation = royalty70 > royalty35 ? '70%' : '35%';

    return {
      option35: {
        rate: '35%',
        royalty: royalty35,
        profit: royalty35
      },
      option70: {
        rate: '70%',
        royalty: royalty70,
        profit: royalty70
      },
      recommendation
    };
  }

  /**
   * Calculate total earnings for a given number of sales
   */
  calculateEarnings(calculation: KDPCalculation, salesCount: number): {
    earnings35: number;
    earnings70: number;
    bestOption: '35%' | '70%';
  } {
    const earnings35 = calculation.royalty35 * salesCount;
    const earnings70 = calculation.royalty70 * salesCount;

    return {
      earnings35: Math.round(earnings35 * 100) / 100,
      earnings70: Math.round(earnings70 * 100) / 100,
      bestOption: earnings70 > earnings35 ? '70%' : '35%'
    };
  }

  /**
   * Get pricing recommendations based on genre and market research
   */
  getPricingRecommendations(genre: string): {
    min: number;
    avg: number;
    max: number;
    note: string;
  } {
    // These are general guidelines based on market research
    const recommendations: Record<string, { min: number; avg: number; max: number; note: string }> = {
      'Fiction': {
        min: 9.99,
        avg: 14.99,
        max: 19.99,
        note: 'Fiction novels typically range from $9.99 to $19.99'
      },
      'Non-Fiction': {
        min: 12.99,
        avg: 19.99,
        max: 29.99,
        note: 'Non-fiction books can command higher prices'
      },
      'Technical': {
        min: 24.99,
        avg: 39.99,
        max: 59.99,
        note: 'Technical books often have premium pricing'
      },
      'Self-Help': {
        min: 11.99,
        avg: 16.99,
        max: 24.99,
        note: 'Self-help books are typically mid-range priced'
      },
      'Business': {
        min: 14.99,
        avg: 24.99,
        max: 39.99,
        note: 'Business books can support higher pricing'
      }
    };

    return recommendations[genre] || {
      min: 9.99,
      avg: 14.99,
      max: 24.99,
      note: 'General pricing guidelines'
    };
  }
}

// Export singleton instance
export const kdpCalculator = new KDPCalculator();
