import { PublicBoardPresentationComponent } from './public-api';

describe('board public presentation API', () => {
  it('exposes the supported read-only presentation components', () => {
    expect(PublicBoardPresentationComponent).toBeDefined();
  });
});
