import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Pin } from '../../../shared/models/pin';
import { ConnectorThread } from '../data/models/connector-thread';
import { networkLayout } from '../data/models/network-layout';
import { pinTitle } from '../data/models/board-experience';
import { boardColorCssValue } from '../data/models/board-color';

@Component({
  selector: 'ui-board-network-view',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './board-network-view.html',
  styleUrl: './board-experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardNetworkViewComponent {
  readonly pins = input.required<Pin[]>();
  readonly connectors = input.required<ConnectorThread[]>();
  readonly canEdit = input(false);
  readonly labelLimit = input<number | null>(10);
  readonly pinSelected = output<string>();
  readonly connectorUpdated = output<{ id: string; label: string }>();
  readonly connectorDeleted = output<string>();
  readonly connectorCreated = output<{ sourcePinId: string; targetPinId: string }>();
  readonly focusId = signal<string | null>(null);
  readonly zoom = signal(1);
  readonly title = pinTitle;
  readonly color = boardColorCssValue;
  readonly nodes = computed(() => networkLayout(this.pins(), this.connectors()));
  readonly byId = computed(() => new Map(this.nodes().map((node) => [node.pin.id, node])));
  readonly width = computed(() => Math.max(600, ...this.nodes().map((node) => node.x + 260)));
  readonly height = computed(() => Math.max(320, ...this.nodes().map((node) => node.y + 100)));
  readonly labelCount = computed(() => this.connectors().filter((c) => !!c.label).length);
  readonly activeEdges = computed(() =>
    this.connectors().filter(
      (c) =>
        !this.focusId() || c.sourcePinId === this.focusId() || c.targetPinId === this.focusId(),
    ),
  );
  readonly related = computed(
    () =>
      new Set([
        this.focusId(),
        ...this.activeEdges().flatMap((c) => [c.sourcePinId, c.targetPinId]),
      ]),
  );
  readonly validEdges = computed(() =>
    this.connectors().filter(
      (c) => this.byId().has(c.sourcePinId) && this.byId().has(c.targetPinId),
    ),
  );
  point(id: string) {
    const node = this.byId().get(id)!;
    return { x: node.x + 110, y: node.y + 36 };
  }
  labelAllowed(edge: ConnectorThread) {
    return !!edge.label || this.labelLimit() === null || this.labelCount() < this.labelLimit()!;
  }
  connect(sourcePinId: string, targetPinId: string) {
    if (sourcePinId && targetPinId && sourcePinId !== targetPinId)
      this.connectorCreated.emit({ sourcePinId, targetPinId });
  }
}
