import { ConnectorThread } from './connector-thread';
import { FloatingLabel } from './floating-label';
import { SoftZone } from './soft-zone';
import { StackBlock } from './stack-block';
import { StickerElement } from './sticker-element';

export interface BoardElements {
  stacks: StackBlock[];
  connectors: ConnectorThread[];
  zones: SoftZone[];
  labels: FloatingLabel[];
  stickers: StickerElement[];
}
