+function() {
  'use strict';

  angular
    .module('app.candidate')
    .directive('candidate', [
      'growl',
      Candidate
    ]);

    function Candidate(growl) {
      return {
        restrict : 'A',
        replace : true,
        templateUrl : './src/candidate/candidate/candidate.html',
        scope : {
          candidate : '='
        },
        bindToController : true,
        controller : function() {
          var self = this;

          // retry candidate creation if previous fail;
          this.retrySave = function() {
            if (self.candidate.id) return false;

            delete self.candidate.hasError;
            self.candidate.$save().then(
              function() { growl.success('Candidate ' + self.candidate.name + ' saved !'); },
              function() {
                growl.error('An error occured.');
                self.candidate.hasError = true;
              }
            );
          };

          // update the candidate
          this.update = function() {
            self.candidate.$update().then(
              function() { growl.success('Candidate ' + self.candidate.name + ' updated !'); },
              function() { growl.error('An error occured.'); }
            );
          };

        },
        controllerAs : 'candidateController'
      };
    }
}();
