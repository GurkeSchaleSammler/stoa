import { collectionShareUrl } from './collection-share-url';

describe('collectionShareUrl', () => {
  it('builds a stable public URL without exposing a token', () => {
    expect(collectionShareUrl('https://stoa.test', 'board/1', 'public', 'secret')).toBe(
      'https://stoa.test/shared/collections/board%2F1',
    );
  });

  it('includes the token only for link sharing', () => {
    expect(collectionShareUrl('https://stoa.test', 'board', 'link', 'a+b')).toBe(
      'https://stoa.test/shared/collections/board?token=a%2Bb',
    );
    expect(collectionShareUrl('https://stoa.test', 'board', 'link', null)).toBe('');
  });

  it('does not expose a private board URL', () => {
    expect(collectionShareUrl('https://stoa.test', 'board', 'private', 'secret')).toBe('');
  });
});
