import React from 'react';
import {
  TouchableOpacity,
  View,
  ViewProps,
} from 'react-native';
import {
  fireEvent,
  waitForElement,
  render,
  RenderAPI,
} from 'react-native-testing-library';
import { ReactTestInstance } from 'react-test-renderer';
import {
  ThemeProvider,
  ThemeProviderProps,
} from './themeProvider.component';
import { withStyles } from './themeConsumer.component';
import { getThemeValue } from './theme.service';
import { ThemeType } from './type';
import {
  theme,
  themeInverse,
} from '../support/tests';

const themeConsumerTestId: string = '@theme/consumer';
const themeChangeTouchableTestId: string = '@theme/btnChangeTheme';

const json = (object: any): string => JSON.stringify(object);

class Mock extends React.Component<ViewProps> {

  public render(): React.ReactElement<ViewProps> {
    return (
      <View
        {...this.props}
        testID={themeConsumerTestId}
      />
    );
  }
}

interface ActionMockProps {
  theme: ThemeType;
  themeInverse: ThemeType;
}

class ActionMock extends React.Component<ActionMockProps> {

  public state = {
    theme: this.props.theme,
  };

  private onThemeChangeTouchablePress = () => {
    this.setState({
      theme: this.props.themeInverse,
    });
  };

  public render(): React.ReactElement<ViewProps> {
    const ThemedComponent = withStyles(Mock);

    return (
      <View>
        <ThemeProvider {...this.state}>
          <ThemedComponent/>
        </ThemeProvider>
        <TouchableOpacity
          testID={themeChangeTouchableTestId}
          onPress={this.onThemeChangeTouchablePress}
        />
      </View>
    );
  }
}

interface OverrideMockProps {
  theme: ThemeType;
  themeInverse: ThemeType;
}

class OverrideMock extends React.Component<OverrideMockProps> {

  public render(): React.ReactElement<ThemeProviderProps> {
    const ThemedComponent1 = withStyles(Mock);
    const ThemedComponent2 = withStyles(Mock);

    return (
      <ThemeProvider theme={this.props.theme}>
        <ThemedComponent1/>
        <ThemeProvider theme={this.props.themeInverse}>
          <ThemedComponent2/>
        </ThemeProvider>
      </ThemeProvider>
    );
  }
}

describe('@theme: service method checks', () => {

  it('finds theme value properly', async () => {
    const themeValue = getThemeValue('gray-100', theme);
    const undefinedValue = getThemeValue('undefined', theme);

    expect(themeValue).toEqual(theme['gray-100']);
    expect(undefinedValue).toBeUndefined();
  });

  it('finds referencing theme value properly', async () => {
    const themeValue = getThemeValue('referencing', theme);

    expect(themeValue).toEqual(theme['gray-100']);
  });

  it('finds multiple referencing theme value properly', async () => {
    const themeValue = getThemeValue('double-referencing', theme);

    expect(themeValue).toEqual(theme['gray-100']);
  });

  it('finds referencing theme value properly (initial reference)', async () => {
    const themeValue = getThemeValue('referencing', theme);

    expect(themeValue).toEqual(theme['gray-100']);
  });


});

describe('@theme: ui component checks', () => {

  it('* static methods are copied over', () => {
    // @ts-ignore: test-case
    Mock.staticMethod = function () {
    };
    const ThemedComponent = withStyles(Mock);

    // @ts-ignore: test-case
    expect(ThemedComponent.staticMethod).not.toBeUndefined();
  });

  it('* receives custom props', () => {
    const ThemedComponent = withStyles(Mock, (value: ThemeType) => ({
      container: {
        backgroundColor: value['gray-primary'],
      },
    }));

    const component: RenderAPI = render(
      <ThemeProvider theme={theme}>
        <ThemedComponent/>
      </ThemeProvider>,
    );

    const themedComponent: ReactTestInstance = component.getByTestId(themeConsumerTestId);

    const { themedStyle } = themedComponent.props;

    expect(themedStyle.container.backgroundColor).toEqual(theme['gray-primary']);
  });

  it('* able to change theme', async () => {
    const component: RenderAPI = render(
      <ActionMock
        theme={theme}
        themeInverse={themeInverse}
      />,
    );

    const touchableComponent: ReactTestInstance = component.getByTestId(themeChangeTouchableTestId);

    fireEvent.press(touchableComponent);

    const themedComponent: ReactTestInstance = await waitForElement(() => {
      return component.getByTestId(themeConsumerTestId);
    });

    const { theme: themeProp } = themedComponent.props;

    expect(json(themeProp)).toEqual(json(themeInverse));
  });

  it('* able to override theme', () => {
    const component: RenderAPI = render(
      <OverrideMock
        theme={theme}
        themeInverse={themeInverse}
      />,
    );

    const themedComponents: ReactTestInstance[] = component.getAllByType(Mock);

    expect(themedComponents.length).toBeGreaterThan(1);

    const { theme: theme1 } = themedComponents[0].props;
    const { theme: theme2 } = themedComponents[1].props;

    expect(json(theme1)).toEqual(json(theme));
    expect(json(theme2)).toEqual(json(themeInverse));
  });

});
