"use server";

import { formatInTimeZone } from 'date-fns-tz';

/**
 * Generate Work Order ID in format: UW[YYMMDD][NN]
 * This is a simplified version that doesn't track sequences
 */
export async function generateWOID(): Promise<string> {
  const timezone = 'Asia/Shanghai';
  const now = new Date();
  
  // Format date components in Beijing time
  const dateStr = formatInTimeZone(now, timezone, 'yyMMdd');
  
  // Generate a random sequence for now (you can implement proper tracking later)
  const sequence = Math.floor(Math.random() * 99) + 1;
  const sequenceStr = sequence.toString().padStart(2, '0');
  
  return `UW${dateStr}${sequenceStr}`;
}

/**
 * Generate multiple Work Order IDs for batch operations
 */
export async function generateBatchWOIDs(count: number): Promise<string[]> {
  const timezone = 'Asia/Shanghai';
  const now = new Date();
  
  // Format date components in Beijing time
  const dateStr = formatInTimeZone(now, timezone, 'yyMMdd');
  
  const woIds: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const sequence = Math.floor(Math.random() * 99) + 1;
    const sequenceStr = sequence.toString().padStart(2, '0');
    woIds.push(`UW${dateStr}${sequenceStr}`);
  }
  
  return woIds;
}

/**
 * Generate Manufacturing Order Number (制令号)
 */
export async function generateZLH(): Promise<string> {
  const timezone = 'Asia/Shanghai';
  const now = new Date();
  
  // Format timestamp in Beijing time
  const timestamp = formatInTimeZone(now, timezone, 'yyyyMMddHHmmss');
  
  // Generate a random 4-digit number
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${timestamp}-H${randomNum}`;
}