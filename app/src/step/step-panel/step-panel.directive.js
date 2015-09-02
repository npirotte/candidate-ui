(function() {
    'use strict';

    angular
        .module('app.step')
        .directive('stepPanel', [
            StepPanel
        ]);

    //directive
    function StepPanel() {
        return {
            bindToController : true,
            controller: function() {
            },
            controllerAs : 'ctrl',
            replace : true,
            restrict : 'E',
            scope : { step : '=' },
            templateUrl : 	'./src/step/step-panel/step-panel.html'
        };
    }

})();
