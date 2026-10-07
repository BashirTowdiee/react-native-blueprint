# Compatibility

The package peer ranges define the supported floors. The repository examples
provide one concrete validated baseline. The baseline is evidence for that
combination only, not a claim that every possible version combination has been
tested.

| Dependency | Supported package contract | Validated baseline |
| --- | --- | --- |
| React | `>=18` for React Native rendering | `18.3.1` |
| React Native | `>=0.76` | `0.76.7` |
| Expo | determined by the consuming Expo Router app | `52.0.37` |
| Expo Router | `>=4` | `4.0.17` |
| React Navigation | `@react-navigation/native >=7` | `7.0.15` |
| Redux, optional plugin | `redux >=5` | `5.0.1` |
| React Redux, optional plugin | `react-redux >=9` | `9.2.0` |

## Validation fixtures

`examples/expo-router` is the Expo Router compatibility fixture. It exercises
file-route discovery, dynamic fixtures, variants, preview rendering, provider
composition and the development-only route guard.

`examples/react-navigation` is the bare React Native compatibility fixture. It
exercises static navigator translation, explicit runtime registration, route
variants, preview rendering and the development-only guard.

Both example TypeScript projects are part of `yarn validate:release`.

Supporting a new major version should include updating the relevant peer range,
updating or adding an example fixture, and running the release validation suite
before publication.
