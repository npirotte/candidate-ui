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

(function(){
    'use strict';

    angular
        .module('app.step')
        .service('StepService', [
            '$http',
            StepService
        ]);


    function StepService($http) {
        var self = this;

        this.get = get;

        function get(){
            return $http.get('/step');
        }

    }

})();

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9zdGVwLm1vZHVsZS5qcyIsInN0ZXAuc2VydmljZS5qcyIsInN0ZXBzLmNvbnRyb2xsZXIuanMiLCJzdGVwLXBhbmVsL3N0ZXAtcGFuZWwuZGlyZWN0aXZlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibW9kdWxlLnN0ZXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBhbmd1bGFyXHJcbiAgICAgICAgLm1vZHVsZSgnYXBwLnN0ZXAnLCBbJ25nU2FuaXRpemUnXSlcclxuICAgICAgICAuY29uZmlnKFtcclxuICAgICAgICAgICAgJyRzdGF0ZVByb3ZpZGVyJyxcclxuICAgICAgICAgICAgU3RlcENvbmZpZ1xyXG4gICAgICAgIF0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIFN0ZXBDb25maWcoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcbiAgICAgICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FwcC5zdGVwcycse1xyXG4gICAgICAgICAgICB1cmwgOiAnL3N0ZXBzJyxcclxuICAgICAgICAgICAgdmlld3MgOiB7XHJcbiAgICAgICAgICAgICAgICAnbWFpbkBhcHAnIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsIDogJ3NyYy9zdGVwL3N0ZXBzLmh0bWwnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIgOiAnU3RlcHNDb250cm9sbGVyIGFzIGN0cmwnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpe1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIGFuZ3VsYXJcclxuICAgICAgICAubW9kdWxlKCdhcHAuc3RlcCcpXHJcbiAgICAgICAgLnNlcnZpY2UoJ1N0ZXBTZXJ2aWNlJywgW1xyXG4gICAgICAgICAgICAnJGh0dHAnLFxyXG4gICAgICAgICAgICBTdGVwU2VydmljZVxyXG4gICAgICAgIF0pO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBTdGVwU2VydmljZSgkaHR0cCkge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5nZXQgPSBnZXQ7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldCgpe1xyXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc3RlcCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKXtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBhbmd1bGFyXHJcbiAgICAgICAgLm1vZHVsZSgnYXBwLnN0ZXAnKVxyXG4gICAgICAgIC5jb250cm9sbGVyKCdTdGVwc0NvbnRyb2xsZXInLCBbXHJcbiAgICAgICAgICAgICdTdGVwU2VydmljZScsXHJcbiAgICAgICAgICAgIFN0ZXBzQ29udHJvbGxlclxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIFN0ZXBzQ29udHJvbGxlcihTdGVwU2VydmljZSkge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgc2VsZi5zdGVwcyA9IFtdO1xyXG4gICAgICAgIFN0ZXBTZXJ2aWNlLmdldCgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG4gICAgICAgICAgICBzZWxmLnN0ZXBzID0gcmVzcG9uc2UuZGF0YTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBhbmd1bGFyXHJcbiAgICAgICAgLm1vZHVsZSgnYXBwLnN0ZXAnKVxyXG4gICAgICAgIC5kaXJlY3RpdmUoJ3N0ZXBQYW5lbCcsIFtcclxuICAgICAgICAgICAgU3RlcFBhbmVsXHJcbiAgICAgICAgXSk7XHJcblxyXG4gICAgLy9kaXJlY3RpdmVcclxuICAgIGZ1bmN0aW9uIFN0ZXBQYW5lbCgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyIDogdHJ1ZSxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBcyA6ICdjdHJsJyxcclxuICAgICAgICAgICAgcmVwbGFjZSA6IHRydWUsXHJcbiAgICAgICAgICAgIHJlc3RyaWN0IDogJ0UnLFxyXG4gICAgICAgICAgICBzY29wZSA6IHsgc3RlcCA6ICc9JyB9LFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybCA6IFx0Jy4vc3JjL3N0ZXAvc3RlcC1wYW5lbC9zdGVwLXBhbmVsLmh0bWwnXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbn0pKCk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==