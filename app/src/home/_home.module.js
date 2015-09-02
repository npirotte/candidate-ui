(function(){
    'use strict';

    angular
        .module('app.home', [])
        .config([
            '$stateProvider',
            DashboardConfig
        ]);

    function DashboardConfig($stateProvider) {

        $stateProvider.state('app.home',{
            url : '/home',
            views : {
                'main@app' : {
                    templateUrl : 'src/home/home.html'
                }
            },
            data: {

            }
        });
    }

})();
