(function(){
    'use strict';

    angular
        .module('app.step')
        .controller('StepsController', [
            'StepService',
            StepsController
        ]);

    function StepsController(StepService) {
        var self = this;

        self.steps = [];
        StepService.get().then(function(response){
            self.steps = response.data;
        });
    }

})();
