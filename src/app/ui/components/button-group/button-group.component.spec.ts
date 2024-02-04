import {
  MockBuilder,
  MockRender,
  MockedComponentFixture,
  ngMocks,
} from 'ng-mocks';
import { ButtonGroupComponent } from './button-group.component';
import { ButtonGroupOptionDirective } from './button-group-option/button-group-option.directive';

describe('ButtonGroupComponent', () => {
  let fixture: MockedComponentFixture<ButtonGroupComponent<string>>;
  let component: ButtonGroupComponent<string>;

  beforeEach(() =>
    MockBuilder(ButtonGroupComponent)
      .keep(ButtonGroupOptionDirective)
      .then(() => {
        fixture = MockRender<ButtonGroupComponent<string>>(`
          <app-button-group>
            <button appButtonGroupOption="option_1" data-test="opt_1">Option 1</button>
            <button appButtonGroupOption="option_2" data-test="opt_2">Option 2</button>
          </app-button-group>
        `);
        component = fixture.point.componentInstance;
      })
  );

  describe('component init', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('component actions', () => {
    it('should notify about change', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      ngMocks.click('[data-test=opt_1]');
      fixture.detectChanges();

      expect(onChange).toHaveBeenCalledWith('option_1');
      expect(getSecondOptionState()).toBe('false');
      expect(getfirstOptionState()).toBe('true');

      ngMocks.click('[data-test=opt_2]');
      fixture.detectChanges();

      expect(onChange).toHaveBeenCalledWith('option_2');
      expect(getfirstOptionState()).toBe('false');
      expect(getSecondOptionState()).toBe('true');
    });

    it('should write value', () => {
      component.writeValue('option_1');
      fixture.detectChanges();

      expect(component.selectedOption).toBe('option_1');
      expect(getSecondOptionState()).toBe('false');
      expect(getfirstOptionState()).toBe('true');

      component.writeValue('option_2');
      fixture.detectChanges();

      expect(component.selectedOption).toBe('option_2');
      expect(getfirstOptionState()).toBe('false');
      expect(getSecondOptionState()).toBe('true');
    });
  });

  function getfirstOptionState(): string | null {
    return ngMocks.find('[data-test=opt_1]').attributes['aria-checked'];
  }

  function getSecondOptionState(): string | null {
    return ngMocks.find('[data-test=opt_2]').attributes['aria-checked'];
  }
});
