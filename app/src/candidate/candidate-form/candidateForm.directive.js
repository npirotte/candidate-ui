+function() {
  'use strict';

  angular
    .module('app.candidate')
    .directive('candidateForm', [
      'CandidateResource',
      'growl',
      Candidate
    ]);

    function Candidate(CandidateResource, growl) {
      return {
        restrict : 'E',
        templateUrl : './src/candidate/candidate-form/candidate-form.html',
        scope : {
          onAdd : '&'
        },
        bindToController : true,
        controllerAs : 'candidateFormController',
        controller : function() {
          var self = this;

          this.candidate = {
            name : CandidateResource.model.name.defaultValue,
            enabled : CandidateResource.model.enabled.defaultValue
          };

          this.nameValidation = CandidateResource.model.name;

          // add a new Candidate
          this.addCandidate = function(form) {
            if(form.$invalid) return false;

            var candidate = new CandidateResource(self.candidate);

            candidate.$save().then(
              function() { growl.success('Candidate ' + candidate.name + ' added !'); },
              function() {
                growl.error('An error occured.');
                candidate.hasError = true;
              }
            );

            // parent ctrl action
            self.onAdd({ candidate : candidate });

            // form reset
            form.$setPristine();
            this.candidate.name = CandidateResource.model.name.defaultValue;
          };

        }
      };
    }

}();
