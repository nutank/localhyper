angular.module('LocalHyper', ['ionic', 'ngCordova', 'LocalHyper.common', 'LocalHyper.init', 'LocalHyper.storage', 'LocalHyper.auth', 'LocalHyper.main', 'LocalHyper.categories', 'LocalHyper.products', 'LocalHyper.test']).run([
  '$rootScope', 'App', 'Push', '$timeout', function($rootScope, App, Push, $timeout) {
    Parse.initialize(APP_ID, JS_KEY);
    $rootScope.App = App;
    $rootScope.product = {
      offers: [],
      globalNotification: false,
      localNotification: false,
      request: ''
    };
    return $rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
      var hideMenuStates;
      $rootScope.previousState = from.name;
      $rootScope.currentState = to.name;
      hideMenuStates = ['tutorial', 'verify-begin', 'verify-auto', 'verify-manual'];
      if (_.contains(hideMenuStates, $rootScope.currentState)) {
        App.menuEnabled.left = false;
      } else {
        App.menuEnabled.left = true;
      }
      if ($rootScope.currentState === 'requests') {
        return $timeout(function() {
          return $rootScope.product.localNotification = false;
        }, 500);
      }
    });
  }
]).config([
  '$ionicConfigProvider', function($ionicConfigProvider) {
    $ionicConfigProvider.views.forwardCache(true);
    $ionicConfigProvider.backButton.previousTitleText(false).text('');
    return $ionicConfigProvider.navBar.alignTitle('center');
  }
]);
