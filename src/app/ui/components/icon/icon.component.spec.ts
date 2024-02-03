import {
  MockBuilder,
  MockRender,
  MockedComponentFixture,
  ngMocks,
} from 'ng-mocks';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let fixture: MockedComponentFixture;
  let component: IconComponent;
  const icon: string = 'test-icon';

  beforeEach(async () =>
    MockBuilder(IconComponent).then(() => {
      fixture = MockRender(`<app-icon>${icon}</app-icon>`);
      component = ngMocks.findInstance(IconComponent);
    })
  );

  describe('component init', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('component view', () => {
    it('should render content', () => {
      expect(ngMocks.formatText(fixture)).toContain(icon);
    });
  });
});
