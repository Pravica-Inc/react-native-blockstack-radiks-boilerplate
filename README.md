# Pravica-blockstack-auth-radiks

![Pravica](./pravica.png)

This repository is made by Pravica team contains a react-native example of using [Blockstack-Auth](https://docs.blockstack.org/develop/add_auth.html) with [Radiks](https://docs.blockstack.org/develop/radiks-intro.html)



## Features

* [React Native](https://github.com/facebook/react-native) 0.61.5
* [React Hooks](https://reactjs.org/docs/hooks-intro.html)
* [React Navigation](https://reactnavigation.org/) 
* [React-Native-Blockstack](https://github.com/clydedacruz/react-native-blockstack)
* [Radiks](./src/radiks)
* [Crypto](https://www.npmjs.com/package/react-native-crypto)
* [react-native-randombytes](https://www.npmjs.com/package/react-native-randombytes)
* [rn-bitcoinjs-lib](https://github.com/coreyphillips/rn-bitcoinjs-lib#readme)

## Getting Started

1. Clone this repo, `https://github.com/Pravica-Inc/react-native-blockstack-radiks-boilerplate.git`
2. Go to project's root directory, `cd <your project name>`
3. Remove `.git` folder,  `rm -rf .git`
4. Use [React Native Rename](https://github.com/junedomingo/react-native-rename) to update project name `$ npx react-native-rename <newName>`
5. Run `yarn` or `npm install` to install dependencies, I prefer `yarn`
6. `cd ios && pod install`

7. You're ready to Run the test application:
  * On Android:
    * Run `react-native run-android`
  * On iOS:
    * Run `react-native run-ios`

    **OR**
    * Open `ios/YourReactProject.xcodeproj` in Xcode
    * Hit `Run` after selecting the desired device

## Usage

1. Change the `domainUrl` in [config.ts](./src/radiks/config.ts) 
```javascript
const domainUrl = 'https://example.com';
export const defaultconfig = {
  appDomain: domainUrl,
  manifestURI: `${domainUrl}/manifest.json`,
  redirectUrl:
    Platform.OS === 'ios' ? `${domainUrl}/redirect.html` : 'redirect.html',
  scopes: ['store_write', 'publish_data'],
  coreNode: 'https://core.blockstack.org',
  authenticatorURL: 'https://browser.blockstack.org/auth',
  apiServer: domainUrl,
};
```
2. Make a redirect page on your webapp for the mobile authentication
 
  **Note**: Make sure that you change the `window.location` to your appId
```javascript

    function getParameterByName(name) {
      var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
      return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
 
    var authResponse = getParameterByName('authResponse')
    window.location="{appId}://?authResponse=" + authResponse
    
```
3. Run [Radiks-Server](https://github.com/blockstack/radiks-server)

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)