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

(function(){
    'use strict';

    angular
        .module('app.home')
        .controller('HomeController', [
            HomeController
        ]);

    function HomeController() {
        var self = this;
    }

})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9ob21lLm1vZHVsZS5qcyIsImhvbWUuY29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1vZHVsZS5ob21lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgYW5ndWxhclxyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5ob21lJywgW10pXHJcbiAgICAgICAgLmNvbmZpZyhbXHJcbiAgICAgICAgICAgICckc3RhdGVQcm92aWRlcicsXHJcbiAgICAgICAgICAgIERhc2hib2FyZENvbmZpZ1xyXG4gICAgICAgIF0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIERhc2hib2FyZENvbmZpZygkc3RhdGVQcm92aWRlcikge1xyXG5cclxuICAgICAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXBwLmhvbWUnLHtcclxuICAgICAgICAgICAgdXJsIDogJy9ob21lJyxcclxuICAgICAgICAgICAgdmlld3MgOiB7XHJcbiAgICAgICAgICAgICAgICAnbWFpbkBhcHAnIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsIDogJ3NyYy9ob21lL2hvbWUuaHRtbCdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZGF0YToge1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCl7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgYW5ndWxhclxyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5ob21lJylcclxuICAgICAgICAuY29udHJvbGxlcignSG9tZUNvbnRyb2xsZXInLCBbXHJcbiAgICAgICAgICAgIEhvbWVDb250cm9sbGVyXHJcbiAgICAgICAgXSk7XHJcblxyXG4gICAgZnVuY3Rpb24gSG9tZUNvbnRyb2xsZXIoKSB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgfVxyXG5cclxufSkoKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9