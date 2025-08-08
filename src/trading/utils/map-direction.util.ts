import {
  DigitalOptionsDirection,
  BlitzOptionsDirection,
  BinaryOptionsDirection,
} from '@quadcode-tech/client-sdk-js';
import { TradeDirection } from '../../shared/enums/direction.enum.js';

// Generic type for SDK direction enums
type SdkDirectionEnum =
  | typeof DigitalOptionsDirection
  | typeof BlitzOptionsDirection
  | typeof BinaryOptionsDirection;

export function mapTradeDirection<T extends SdkDirectionEnum>(
  direction: TradeDirection,
  sdkEnum: T,
): T[keyof T] {
  if (String(direction).toUpperCase() === TradeDirection.Call) {
    return sdkEnum.Call as T[keyof T];
  }
  if (String(direction).toUpperCase() === TradeDirection.Put) {
    return sdkEnum.Put as T[keyof T];
  }
  throw new Error(`Invalid trade direction: ${direction}`);
}