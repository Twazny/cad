import {
  MockBuilder,
  MockRender,
  MockedComponentFixture,
  ngMocks,
} from 'ng-mocks';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let fixture: MockedComponentFixture;
  let component: ButtonComponent;

  beforeEach(async () => MockBuilder(ButtonComponent));

  describe('component init', () => {
    it('should create', () => {
      renderButton();

      expect(component).toBeTruthy();
    });

    it('should render content', () => {
      const text: string = 'Button text';
      renderButton('app-button', text);

      expect(ngMocks.formatText(fixture)).toEqual(text);
    });

    it('should apply button-icon class for text buttons', () => {
      renderButton('app-button');

      expect(ngMocks.find('[app-button]').classes['button']).toBe(true);
    });

    it('should apply button-icon class for icon buttons', () => {
      renderButton('app-button-icon');

      expect(ngMocks.find('[app-button-icon]').classes['button-icon']).toBe(
        true
      );
    });

    it('should have disabled attribute when disabled input is true', () => {
      renderButton('app-button-icon');

      expect(
        ngMocks.find('[app-button-icon]').attributes['disabled']
      ).toBeFalsy();

      fixture.componentInstance['disabled'] = true;
      fixture.detectChanges();

      expect(ngMocks.find('[app-button-icon]').attributes['disabled']).toBe(
        'true'
      );
    });
  });

  function renderButton(
    attribute: string = 'app-button',
    content: string = 'Button text'
  ): void {
    fixture = MockRender(
      `<button ${attribute} [disabled]="disabled">${content}</button>`,
      { disabled: false }
    );
    component = ngMocks.findInstance(ButtonComponent);
  }
});
