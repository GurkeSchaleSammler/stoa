import { Pin } from '../../../../shared/models/pin';
import { networkLayout } from './network-layout';
import { orderedTimeline, pinTitle } from './board-experience';

export function testPin(id: string, sortOrder = 0): Pin {
  return {
    id,
    collectionId: 'board',
    createdBy: 'user',
    createdByName: 'User',
    createdByAvatarUrl: null,
    createdAt: '2026-10-13T12:00:00Z',
    sortOrder,
    tags: [],
    comments: [],
    type: 'note',
    data: { content: id, color: 'white' },
    grid: {
      id,
      x: sortOrder * 20,
      y: 0,
      width: 16,
      heightClips: 12,
      layer: 1,
      contentType: 'note',
    },
  };
}

describe('Board views', () => {
  it('lays out disconnected pins, cycles, and stale connections without mutating board coordinates', () => {
    const pins = ['a', 'b', 'c', 'isolated'].map((id, i) => testPin(id, i));
    const edges = [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'a'],
      ['a', 'deleted'],
    ].map(([sourcePinId, targetPinId], i) => ({
      id: `${i}`,
      sourcePinId,
      targetPinId,
      colorVariant: 'accent' as const,
    }));
    const before = JSON.stringify(pins);
    const layout = networkLayout(pins, edges);
    expect(layout.map((node) => node.pin.id).sort()).toEqual(['a', 'b', 'c', 'isolated']);
    expect(new Set(layout.map((node) => `${node.x},${node.y}`)).size).toBe(4);
    expect(networkLayout(pins, edges)).toEqual(layout);
    expect(JSON.stringify(pins)).toBe(before);
  });
  it('sorts dates chronologically, retains date ranges, and keeps undated pins last', () => {
    const pins = ['undated', 'later', 'early'].map(testPin);
    const entries = orderedTimeline(pins, [
      { pinId: 'later', startDate: '2026-10-13', endDate: null },
      { pinId: 'early', startDate: '2026-01-01', endDate: '2026-01-10' },
    ]);
    expect(entries.map((entry) => entry.pin.id)).toEqual(['early', 'later', 'undated']);
    expect(entries[0].date?.endDate).toBe('2026-01-10');
    expect(entries[2].date).toBeNull();
  });
  it('uses the note title when one exists', () => {
    const pin = testPin('body');
    if (pin.type === 'note') pin.data.title = 'Heading';
    expect(pinTitle(pin)).toBe('Heading');
  });
});
