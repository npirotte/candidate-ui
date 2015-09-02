(function(){
    'use strict';

    angular
        .module('app', ['ngMockE2E', 'ngResource', 'ui.router', 'ui.bootstrap', 'angular-growl', 'app.home', 'app.step', 'app.candidate'])
        .config([
            '$stateProvider', '$urlRouterProvider', 'growlProvider',
            AppConfig
        ]);

    function AppConfig($stateProvider, $urlRouterProvider, growlProvider) {

        // Route
        $urlRouterProvider.otherwise('/home');

        $stateProvider.state('app',{
            abstract    : true,
            templateUrl : 'src/main.template.html'
        });

        // Growl
        growlProvider.globalReversedOrder(true);
        growlProvider.globalTimeToLive(2000);
        growlProvider.globalDisableCountDown(true);
    }

})();
