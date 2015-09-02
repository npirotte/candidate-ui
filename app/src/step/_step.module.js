(function(){
    'use strict';

    angular
        .module('app.step', ['ngSanitize'])
        .config([
            '$stateProvider',
            StepConfig
        ]);

    function StepConfig($stateProvider) {

        $stateProvider.state('app.steps',{
            url : '/steps',
            views : {
                'main@app' : {
                    templateUrl : 'src/step/steps.html',
                    controller : 'StepsController as ctrl'
                }
            }
        });
    }

})();
