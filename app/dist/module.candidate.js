'use strict';

+(function () {
  'use strict';

  angular.module('app.candidate', []).config(['$stateProvider', CandidateModuleConfig]);

  function CandidateModuleConfig($stateProvider) {
    $stateProvider.state('app.candidate', {
      url: '/candidate',
      views: {
        'main@app': {
          templateUrl: 'src/candidate/candidates.html',
          controller: 'CandidatesController as candidatesController'
        }
      }
    });
  }
})();

+(function () {
  'use strict';

  angular.module('app.candidate').factory('CandidateResource', ['$resource', '$http', CandidateResource]);

  var URL = '/candidate/:id';

  function CandidateResource($resource, $http) {

    var Candidate = $resource(URL, { id: '@id' });

    // custom $update methods
    // $update could have been a $resource method, but has the server respond nothing, the model is erased on $update, prototype method is more fine tuned
    // @return : promise
    Candidate.prototype.$update = function () {
      var url = URL.replace(':id', this.id);
      var data = this.toJSON();

      if (data.selected) delete data.selected;
      if (data.hasError) delete data.hasError;

      return $http.put(url, this.toJSON());
    };

    // static deleteMany method
    // @params : ids : [...id]
    // @return : promise
    Candidate.deleteMany = function (ids) {
      var url = '/candidate/delete';
      return $http.post(url, ids);
    };

    // static model validation & defaultValue data
    Candidate.model = {
      name: {
        required: true,
        minLength: 1,
        maxLength: 30,
        defaultValue: null
      },
      enabled: {
        defaultValue: true
      }
    };

    return Candidate;
  }
})();

/* global swal */

+(function () {
  'use strict';

  var reorderIcons = ['glyphicon glyphicon-chevron-up', 'glyphicon glyphicon-chevron-down'];

  angular.module('app.candidate').controller('CandidatesController', ['CandidateResource', CandidatesController]);

  function CandidatesController(CandidateResource) {

    var self = this;

    this.candidates = CandidateResource.query();

    this.orderProp = null;
    this.reverse = false;

    /* **** public methods **** */

    // change the ordering prop or reverse ordering
    // @param : <string> orderProp
    this.reorder = function (orderProp) {
      if (self.orderProp === orderProp) {
        self.reverse = !self.reverse;
      } else {
        self.orderProp = orderProp;
        self.reverse = false;
      }
    };

    // return the correct className for table header cells
    // @param : <string> orderProp
    // @output : <string> className
    this.reorderIconClass = function (orderProp) {
      if (self.orderProp !== orderProp) return false;
      return reorderIcons[self.reverse ? 1 : 0];
    };

    // selected / deselect all rows
    // @param : native event
    this.toggleSelection = function (event) {
      self.candidates.forEach(function (candidate) {
        candidate.selected = event.target.checked;
      });
    };

    // output selected rows count
    // @return <int> count
    this.selectedCandidatesNbr = function () {
      var selectedCandidates = self.candidates.filter(function (candidate) {
        return candidate.selected;
      });
      return selectedCandidates.length > 0;
    };

    // add a new candidate
    // @param : {object} candidateModel
    this.addCandidate = function (candidate) {
      self.candidates.push(candidate);
    };

    // delete selected Candidate
    this.deleteCandidates = function () {
      var candidatesToDelete = [];

      self.candidates.forEach(function (candidate) {
        if (candidate.selected) candidatesToDelete.push(candidate.id);
      });

      swal({
        title: 'Are you sure?',
        text: 'You will delete ' + candidatesToDelete.length + ' candidate' + (candidatesToDelete.length > 1 ? 's' : '') + '.',
        //type : 'warning',
        showCancelButton: true,
        closeOnConfirm: false
      }, function () {

        CandidateResource.deleteMany(candidatesToDelete).then(function () {
          swal('Deleted !', 'Selected candidates have been deleted.', 'success');
          self.candidates = self.candidates.filter(function (candidate) {
            return candidatesToDelete.indexOf(candidate.id) < 0;
          });
        });
      });
    };
  }
})();

+(function () {
  'use strict';

  angular.module('app.candidate').directive('candidate', ['growl', Candidate]);

  function Candidate(growl) {
    return {
      restrict: 'A',
      replace: true,
      templateUrl: './src/candidate/candidate/candidate.html',
      scope: {
        candidate: '='
      },
      bindToController: true,
      controller: function controller() {
        var self = this;

        // retry candidate creation if previous fail;
        this.retrySave = function () {
          if (self.candidate.id) return false;

          delete self.candidate.hasError;
          self.candidate.$save().then(function () {
            growl.success('Candidate ' + self.candidate.name + ' saved !');
          }, function () {
            growl.error('An error occured.');
            self.candidate.hasError = true;
          });
        };

        // update the candidate
        this.update = function () {
          self.candidate.$update().then(function () {
            growl.success('Candidate ' + self.candidate.name + ' updated !');
          }, function () {
            growl.error('An error occured.');
          });
        };
      },
      controllerAs: 'candidateController'
    };
  }
})();

+(function () {
  'use strict';

  angular.module('app.candidate').directive('candidateForm', ['CandidateResource', 'growl', Candidate]);

  function Candidate(CandidateResource, growl) {
    return {
      restrict: 'E',
      templateUrl: './src/candidate/candidate-form/candidate-form.html',
      scope: {
        onAdd: '&'
      },
      bindToController: true,
      controller: function controller() {
        var self = this;

        this.candidate = {
          name: CandidateResource.model.name.defaultValue,
          enabled: CandidateResource.model.enabled.defaultValue
        };

        this.nameValidation = CandidateResource.model.name;

        this.addCandidate = function (form) {
          if (form.$invalid) return false;

          var candidate = new CandidateResource(self.candidate);

          candidate.$save().then(function () {
            growl.success('Candidate ' + candidate.name + ' added !');
          }, function () {
            growl.error('An error occured.');
            candidate.hasError = true;
          });

          self.onAdd({ candidate: candidate });

          form.$setPristine();
          this.candidate.name = null;
        };
      },
      controllerAs: 'candidateFormController'
    };
  }
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9jYW5kaWRhdGUubW9kdWxlLmpzIiwiY2FuZGlkYXRlLnJlc291cmNlLmpzIiwiY2FuZGlkYXRlcy5jb250cm9sbGVyLmpzIiwiY2FuZGlkYXRlL2NhbmRpZGF0ZS5kaXJlY3RpdmUuanMiLCJjYW5kaWRhdGUtZm9ybS9jYW5kaWRhdGVGb3JtLmRpcmVjdGl2ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLENBQUEsQ0FBQSxZQUFBO0FBQ0EsY0FBQSxDQUFBOztBQUVBLFNBQUEsQ0FBQSxNQUFBLENBQUEsZUFBQSxFQUFBLEVBQUEsQ0FBQSxDQUNBLE1BQUEsQ0FBQSxDQUNBLGdCQUFBLEVBQ0EscUJBQUEsQ0FDQSxDQUFBLENBQUE7O0FBRUEsV0FBQSxxQkFBQSxDQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLGVBQUEsRUFBQTtBQUNBLFNBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQSxFQUFBO0FBQ0Esa0JBQUEsRUFBQTtBQUNBLHFCQUFBLEVBQUEsK0JBQUE7QUFDQSxvQkFBQSxFQUFBLDhDQUFBO1NBQ0E7T0FDQTtLQUNBLENBQUEsQ0FBQTtHQUNBO0NBRUEsQ0FBQSxFQUFBLENBQUE7O0FDckJBLENBQUEsQ0FBQSxZQUFBO0FBQ0EsY0FBQSxDQUFBOztBQUVBLFNBQUEsQ0FDQSxNQUFBLENBQUEsZUFBQSxDQUFBLENBQ0EsT0FBQSxDQUFBLG1CQUFBLEVBQUEsQ0FDQSxXQUFBLEVBQ0EsT0FBQSxFQUNBLGlCQUFBLENBQ0EsQ0FBQSxDQUFBOztBQUVBLE1BQUEsR0FBQSxHQUFBLGdCQUFBLENBQUE7O0FBRUEsV0FBQSxpQkFBQSxDQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUE7O0FBRUEsUUFBQSxTQUFBLEdBQUEsU0FBQSxDQUNBLEdBQUEsRUFDQSxFQUFBLEVBQUEsRUFBQSxLQUFBLEVBQUEsQ0FDQSxDQUFBOzs7OztBQUtBLGFBQUEsQ0FBQSxTQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxVQUFBLEdBQUEsR0FBQSxHQUFBLENBQUEsT0FBQSxDQUFBLEtBQUEsRUFBQSxJQUFBLENBQUEsRUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLElBQUEsR0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLENBQUE7O0FBRUEsVUFBQSxJQUFBLENBQUEsUUFBQSxFQUFBLE9BQUEsSUFBQSxDQUFBLFFBQUEsQ0FBQTtBQUNBLFVBQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxPQUFBLElBQUEsQ0FBQSxRQUFBLENBQUE7O0FBRUEsYUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsRUFBQSxJQUFBLENBQUEsTUFBQSxFQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Ozs7O0FBS0EsYUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLFVBQUEsR0FBQSxHQUFBLG1CQUFBLENBQUE7QUFDQSxhQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7O0FBR0EsYUFBQSxDQUFBLEtBQUEsR0FBQTtBQUNBLFVBQUEsRUFBQTtBQUNBLGdCQUFBLEVBQUEsSUFBQTtBQUNBLGlCQUFBLEVBQUEsQ0FBQTtBQUNBLGlCQUFBLEVBQUEsRUFBQTtBQUNBLG9CQUFBLEVBQUEsSUFBQTtPQUNBO0FBQ0EsYUFBQSxFQUFBO0FBQ0Esb0JBQUEsRUFBQSxJQUFBO09BQ0E7S0FDQSxDQUFBOztBQUVBLFdBQUEsU0FBQSxDQUFBO0dBRUE7Q0FFQSxDQUFBLEVBQUEsQ0FBQTs7OztBQ3hEQSxDQUFBLENBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQTs7QUFFQSxNQUFBLFlBQUEsR0FBQSxDQUNBLGdDQUFBLEVBQ0Esa0NBQUEsQ0FDQSxDQUFBOztBQUVBLFNBQUEsQ0FDQSxNQUFBLENBQUEsZUFBQSxDQUFBLENBQ0EsVUFBQSxDQUFBLHNCQUFBLEVBQUEsQ0FDQSxtQkFBQSxFQUNBLG9CQUFBLENBQ0EsQ0FBQSxDQUFBOztBQUVBLFdBQUEsb0JBQUEsQ0FBQSxpQkFBQSxFQUFBOztBQUVBLFFBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxRQUFBLENBQUEsVUFBQSxHQUFBLGlCQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7O0FBRUEsUUFBQSxDQUFBLFNBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxRQUFBLENBQUEsT0FBQSxHQUFBLEtBQUEsQ0FBQTs7Ozs7O0FBTUEsUUFBQSxDQUFBLE9BQUEsR0FBQSxVQUFBLFNBQUEsRUFBQTtBQUNBLFVBQUEsSUFBQSxDQUFBLFNBQUEsS0FBQSxTQUFBLEVBQUE7QUFDQSxZQUFBLENBQUEsT0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLE9BQUEsQ0FBQTtPQUNBLE1BQ0E7QUFDQSxZQUFBLENBQUEsU0FBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxPQUFBLEdBQUEsS0FBQSxDQUFBO09BQ0E7S0FDQSxDQUFBOzs7OztBQUtBLFFBQUEsQ0FBQSxnQkFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsVUFBQSxJQUFBLENBQUEsU0FBQSxLQUFBLFNBQUEsRUFBQSxPQUFBLEtBQUEsQ0FBQTtBQUNBLGFBQUEsWUFBQSxDQUFBLElBQUEsQ0FBQSxPQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7OztBQUlBLFFBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxVQUFBLENBQUEsVUFBQSxDQUFBLE9BQUEsQ0FBQSxVQUFBLFNBQUEsRUFBQTtBQUNBLGlCQUFBLENBQUEsUUFBQSxHQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxDQUFBO09BQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7OztBQUlBLFFBQUEsQ0FBQSxxQkFBQSxHQUFBLFlBQUE7QUFDQSxVQUFBLGtCQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxlQUFBLFNBQUEsQ0FBQSxRQUFBLENBQUE7T0FDQSxDQUFBLENBQUE7QUFDQSxhQUFBLGtCQUFBLENBQUEsTUFBQSxHQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Ozs7QUFJQSxRQUFBLENBQUEsWUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLFVBQUEsQ0FBQSxJQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOzs7QUFHQSxRQUFBLENBQUEsZ0JBQUEsR0FBQSxZQUFBO0FBQ0EsVUFBQSxrQkFBQSxHQUFBLEVBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxDQUFBLE9BQUEsQ0FBQSxVQUFBLFNBQUEsRUFBQTtBQUNBLFlBQUEsU0FBQSxDQUFBLFFBQUEsRUFBQSxrQkFBQSxDQUFBLElBQUEsQ0FBQSxTQUFBLENBQUEsRUFBQSxDQUFBLENBQUE7T0FDQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBO0FBQ0EsYUFBQSxFQUFBLGVBQUE7QUFDQSxZQUFBLEVBQUEsa0JBQUEsR0FBQSxrQkFBQSxDQUFBLE1BQUEsR0FBQSxZQUFBLElBQUEsa0JBQUEsQ0FBQSxNQUFBLEdBQUEsQ0FBQSxHQUFBLEdBQUEsR0FBQSxFQUFBLENBQUEsR0FBQSxHQUFBOztBQUVBLHdCQUFBLEVBQUEsSUFBQTtBQUNBLHNCQUFBLEVBQUEsS0FBQTtPQUNBLEVBQ0EsWUFBQTs7QUFFQSx5QkFBQSxDQUFBLFVBQUEsQ0FBQSxrQkFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsV0FBQSxFQUFBLHdDQUFBLEVBQUEsU0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsVUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsbUJBQUEsa0JBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxDQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtXQUNBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtPQUVBLENBQUEsQ0FBQTtLQUVBLENBQUE7R0FFQTtDQUNBLENBQUEsRUFBQSxDQUFBOztBQ3BHQSxDQUFBLENBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQTs7QUFFQSxTQUFBLENBQ0EsTUFBQSxDQUFBLGVBQUEsQ0FBQSxDQUNBLFNBQUEsQ0FBQSxXQUFBLEVBQUEsQ0FDQSxPQUFBLEVBQ0EsU0FBQSxDQUNBLENBQUEsQ0FBQTs7QUFFQSxXQUFBLFNBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsY0FBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsSUFBQTtBQUNBLGlCQUFBLEVBQUEsMENBQUE7QUFDQSxXQUFBLEVBQUE7QUFDQSxpQkFBQSxFQUFBLEdBQUE7T0FDQTtBQUNBLHNCQUFBLEVBQUEsSUFBQTtBQUNBLGdCQUFBLEVBQUEsc0JBQUE7QUFDQSxZQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7OztBQUdBLFlBQUEsQ0FBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLGNBQUEsSUFBQSxDQUFBLFNBQUEsQ0FBQSxFQUFBLEVBQUEsT0FBQSxLQUFBLENBQUE7O0FBRUEsaUJBQUEsSUFBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsU0FBQSxDQUFBLEtBQUEsRUFBQSxDQUFBLElBQUEsQ0FDQSxZQUFBO0FBQUEsaUJBQUEsQ0FBQSxPQUFBLENBQUEsWUFBQSxHQUFBLElBQUEsQ0FBQSxTQUFBLENBQUEsSUFBQSxHQUFBLFVBQUEsQ0FBQSxDQUFBO1dBQUEsRUFDQSxZQUFBO0FBQ0EsaUJBQUEsQ0FBQSxLQUFBLENBQUEsbUJBQUEsQ0FBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxTQUFBLENBQUEsUUFBQSxHQUFBLElBQUEsQ0FBQTtXQUNBLENBQ0EsQ0FBQTtTQUNBLENBQUE7OztBQUdBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQSxTQUFBLENBQUEsT0FBQSxFQUFBLENBQUEsSUFBQSxDQUNBLFlBQUE7QUFBQSxpQkFBQSxDQUFBLE9BQUEsQ0FBQSxZQUFBLEdBQUEsSUFBQSxDQUFBLFNBQUEsQ0FBQSxJQUFBLEdBQUEsWUFBQSxDQUFBLENBQUE7V0FBQSxFQUNBLFlBQUE7QUFBQSxpQkFBQSxDQUFBLEtBQUEsQ0FBQSxtQkFBQSxDQUFBLENBQUE7V0FBQSxDQUNBLENBQUE7U0FDQSxDQUFBO09BRUE7QUFDQSxrQkFBQSxFQUFBLHFCQUFBO0tBQ0EsQ0FBQTtHQUNBO0NBQ0EsQ0FBQSxFQUFBLENBQUE7O0FDaERBLENBQUEsQ0FBQSxZQUFBO0FBQ0EsY0FBQSxDQUFBOztBQUVBLFNBQUEsQ0FDQSxNQUFBLENBQUEsZUFBQSxDQUFBLENBQ0EsU0FBQSxDQUFBLGVBQUEsRUFBQSxDQUNBLG1CQUFBLEVBQ0EsT0FBQSxFQUNBLFNBQUEsQ0FDQSxDQUFBLENBQUE7O0FBRUEsV0FBQSxTQUFBLENBQUEsaUJBQUEsRUFBQSxLQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsY0FBQSxFQUFBLEdBQUE7QUFDQSxpQkFBQSxFQUFBLG9EQUFBO0FBQ0EsV0FBQSxFQUFBO0FBQ0EsYUFBQSxFQUFBLEdBQUE7T0FDQTtBQUNBLHNCQUFBLEVBQUEsSUFBQTtBQUNBLGdCQUFBLEVBQUEsc0JBQUE7QUFDQSxZQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLFNBQUEsR0FBQTtBQUNBLGNBQUEsRUFBQSxpQkFBQSxDQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLGlCQUFBLEVBQUEsaUJBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxDQUFBLFlBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxjQUFBLEdBQUEsaUJBQUEsQ0FBQSxLQUFBLENBQUEsSUFBQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxZQUFBLEdBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxjQUFBLElBQUEsQ0FBQSxRQUFBLEVBQUEsT0FBQSxLQUFBLENBQUE7O0FBRUEsY0FBQSxTQUFBLEdBQUEsSUFBQSxpQkFBQSxDQUFBLElBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTs7QUFFQSxtQkFBQSxDQUFBLEtBQUEsRUFBQSxDQUFBLElBQUEsQ0FDQSxZQUFBO0FBQUEsaUJBQUEsQ0FBQSxPQUFBLENBQUEsWUFBQSxHQUFBLFNBQUEsQ0FBQSxJQUFBLEdBQUEsVUFBQSxDQUFBLENBQUE7V0FBQSxFQUNBLFlBQUE7QUFDQSxpQkFBQSxDQUFBLEtBQUEsQ0FBQSxtQkFBQSxDQUFBLENBQUE7QUFDQSxxQkFBQSxDQUFBLFFBQUEsR0FBQSxJQUFBLENBQUE7V0FDQSxDQUNBLENBQUE7O0FBRUEsY0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFBLFNBQUEsRUFBQSxTQUFBLEVBQUEsQ0FBQSxDQUFBOztBQUVBLGNBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxTQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUE7T0FFQTtBQUNBLGtCQUFBLEVBQUEseUJBQUE7S0FDQSxDQUFBO0dBQ0E7Q0FFQSxDQUFBLEVBQUEsQ0FBQSIsImZpbGUiOiJtb2R1bGUuY2FuZGlkYXRlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiK2Z1bmN0aW9uKCl7XG4gICd1c2Ugc3RyaWN0JztcblxuICBhbmd1bGFyLm1vZHVsZSgnYXBwLmNhbmRpZGF0ZScsIFtdKVxuICAgIC5jb25maWcoW1xuICAgICAgJyRzdGF0ZVByb3ZpZGVyJyxcbiAgICAgIENhbmRpZGF0ZU1vZHVsZUNvbmZpZ1xuICAgIF0pO1xuXG4gIGZ1bmN0aW9uIENhbmRpZGF0ZU1vZHVsZUNvbmZpZygkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhcHAuY2FuZGlkYXRlJywge1xuICAgICAgdXJsIDogJy9jYW5kaWRhdGUnLFxuICAgICAgdmlld3MgOiB7XG4gICAgICAgICdtYWluQGFwcCcgOiB7XG4gICAgICAgICAgdGVtcGxhdGVVcmwgOiAnc3JjL2NhbmRpZGF0ZS9jYW5kaWRhdGVzLmh0bWwnLFxuICAgICAgICAgIGNvbnRyb2xsZXIgOiAnQ2FuZGlkYXRlc0NvbnRyb2xsZXIgYXMgY2FuZGlkYXRlc0NvbnRyb2xsZXInXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG59KCk7XG4iLCIrZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBhbmd1bGFyXG4gICAgLm1vZHVsZSgnYXBwLmNhbmRpZGF0ZScpXG4gICAgLmZhY3RvcnkoJ0NhbmRpZGF0ZVJlc291cmNlJywgW1xuICAgICAgJyRyZXNvdXJjZScsXG4gICAgICAnJGh0dHAnLFxuICAgICAgQ2FuZGlkYXRlUmVzb3VyY2VcbiAgICBdKTtcblxuICBjb25zdCBVUkwgPSAnL2NhbmRpZGF0ZS86aWQnO1xuXG4gIGZ1bmN0aW9uIENhbmRpZGF0ZVJlc291cmNlKCRyZXNvdXJjZSwgJGh0dHApIHtcblxuICAgIHZhciBDYW5kaWRhdGUgPSAkcmVzb3VyY2UoXG4gICAgICBVUkwsXG4gICAgICB7IGlkIDogJ0BpZCcgfVxuICAgICk7XG5cbiAgICAvLyBjdXN0b20gJHVwZGF0ZSBtZXRob2RzXG4gICAgLy8gJHVwZGF0ZSBjb3VsZCBoYXZlIGJlZW4gYSAkcmVzb3VyY2UgbWV0aG9kLCBidXQgaGFzIHRoZSBzZXJ2ZXIgcmVzcG9uZCBub3RoaW5nLCB0aGUgbW9kZWwgaXMgZXJhc2VkIG9uICR1cGRhdGUsIHByb3RvdHlwZSBtZXRob2QgaXMgbW9yZSBmaW5lIHR1bmVkXG4gICAgLy8gQHJldHVybiA6IHByb21pc2VcbiAgICBDYW5kaWRhdGUucHJvdG90eXBlLiR1cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIGxldCB1cmwgPSBVUkwucmVwbGFjZSgnOmlkJywgdGhpcy5pZCk7XG4gICAgICB2YXIgZGF0YSA9IHRoaXMudG9KU09OKCk7XG5cbiAgICAgIGlmIChkYXRhLnNlbGVjdGVkKSBkZWxldGUgZGF0YS5zZWxlY3RlZDtcbiAgICAgIGlmIChkYXRhLmhhc0Vycm9yKSBkZWxldGUgZGF0YS5oYXNFcnJvcjtcblxuICAgICAgcmV0dXJuICRodHRwLnB1dCh1cmwsIHRoaXMudG9KU09OKCkpO1xuICAgIH07XG5cbiAgICAvLyBzdGF0aWMgZGVsZXRlTWFueSBtZXRob2RcbiAgICAvLyBAcGFyYW1zIDogaWRzIDogWy4uLmlkXVxuICAgIC8vIEByZXR1cm4gOiBwcm9taXNlXG4gICAgQ2FuZGlkYXRlLmRlbGV0ZU1hbnkgPSBmdW5jdGlvbihpZHMpIHtcbiAgICAgIGxldCB1cmwgPSAnL2NhbmRpZGF0ZS9kZWxldGUnO1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QodXJsLCBpZHMpO1xuICAgIH07XG5cbiAgICAvLyBzdGF0aWMgbW9kZWwgdmFsaWRhdGlvbiAmIGRlZmF1bHRWYWx1ZSBkYXRhXG4gICAgQ2FuZGlkYXRlLm1vZGVsID0ge1xuICAgICAgbmFtZSA6IHtcbiAgICAgICAgcmVxdWlyZWQgOiB0cnVlLFxuICAgICAgICBtaW5MZW5ndGggOiAxLFxuICAgICAgICBtYXhMZW5ndGggOiAzMCxcbiAgICAgICAgZGVmYXVsdFZhbHVlIDogbnVsbFxuICAgICAgfSxcbiAgICAgIGVuYWJsZWQgOiB7XG4gICAgICAgIGRlZmF1bHRWYWx1ZSA6IHRydWVcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIENhbmRpZGF0ZTtcblxuICB9XG5cbn0oKTtcbiIsIi8qIGdsb2JhbCBzd2FsICovXG5cbitmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGNvbnN0IHJlb3JkZXJJY29ucyA9IFtcbiAgICAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXVwJyxcbiAgICAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLWRvd24nXG4gIF07XG5cbiAgYW5ndWxhclxuICAgIC5tb2R1bGUoJ2FwcC5jYW5kaWRhdGUnKVxuICAgIC5jb250cm9sbGVyKCdDYW5kaWRhdGVzQ29udHJvbGxlcicsIFtcbiAgICAgICdDYW5kaWRhdGVSZXNvdXJjZScsXG4gICAgICBDYW5kaWRhdGVzQ29udHJvbGxlclxuICAgIF0pO1xuXG4gICAgZnVuY3Rpb24gQ2FuZGlkYXRlc0NvbnRyb2xsZXIoQ2FuZGlkYXRlUmVzb3VyY2UpIHtcblxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICB0aGlzLmNhbmRpZGF0ZXMgPSBDYW5kaWRhdGVSZXNvdXJjZS5xdWVyeSgpO1xuXG4gICAgICB0aGlzLm9yZGVyUHJvcCA9IG51bGw7XG4gICAgICB0aGlzLnJldmVyc2UgPSBmYWxzZTtcblxuICAgICAgLyogKioqKiBwdWJsaWMgbWV0aG9kcyAqKioqICovXG5cbiAgICAgIC8vIGNoYW5nZSB0aGUgb3JkZXJpbmcgcHJvcCBvciByZXZlcnNlIG9yZGVyaW5nXG4gICAgICAvLyBAcGFyYW0gOiA8c3RyaW5nPiBvcmRlclByb3BcbiAgICAgIHRoaXMucmVvcmRlciA9IGZ1bmN0aW9uKG9yZGVyUHJvcCkge1xuICAgICAgICBpZiAoIHNlbGYub3JkZXJQcm9wID09PSBvcmRlclByb3AgKSB7XG4gICAgICAgICAgc2VsZi5yZXZlcnNlID0gIXNlbGYucmV2ZXJzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBzZWxmLm9yZGVyUHJvcCA9IG9yZGVyUHJvcDtcbiAgICAgICAgICBzZWxmLnJldmVyc2UgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgLy8gcmV0dXJuIHRoZSBjb3JyZWN0IGNsYXNzTmFtZSBmb3IgdGFibGUgaGVhZGVyIGNlbGxzXG4gICAgICAvLyBAcGFyYW0gOiA8c3RyaW5nPiBvcmRlclByb3BcbiAgICAgIC8vIEBvdXRwdXQgOiA8c3RyaW5nPiBjbGFzc05hbWVcbiAgICAgIHRoaXMucmVvcmRlckljb25DbGFzcyA9IGZ1bmN0aW9uKG9yZGVyUHJvcCkge1xuICAgICAgICBpZiAoIHNlbGYub3JkZXJQcm9wICE9PSBvcmRlclByb3AgKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiByZW9yZGVySWNvbnNbc2VsZi5yZXZlcnNlID8gMSA6IDBdO1xuICAgICAgfTtcblxuICAgICAgLy8gc2VsZWN0ZWQgLyBkZXNlbGVjdCBhbGwgcm93c1xuICAgICAgLy8gQHBhcmFtIDogbmF0aXZlIGV2ZW50XG4gICAgICB0aGlzLnRvZ2dsZVNlbGVjdGlvbiA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHNlbGYuY2FuZGlkYXRlcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICAgIGNhbmRpZGF0ZS5zZWxlY3RlZCA9IGV2ZW50LnRhcmdldC5jaGVja2VkO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIC8vIG91dHB1dCBzZWxlY3RlZCByb3dzIGNvdW50XG4gICAgICAvLyBAcmV0dXJuIDxpbnQ+IGNvdW50XG4gICAgICB0aGlzLnNlbGVjdGVkQ2FuZGlkYXRlc05iciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZWN0ZWRDYW5kaWRhdGVzID0gc2VsZi5jYW5kaWRhdGVzLmZpbHRlcihmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlLnNlbGVjdGVkO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHNlbGVjdGVkQ2FuZGlkYXRlcy5sZW5ndGggPiAwO1xuICAgICAgfTtcblxuICAgICAgLy8gYWRkIGEgbmV3IGNhbmRpZGF0ZVxuICAgICAgLy8gQHBhcmFtIDoge29iamVjdH0gY2FuZGlkYXRlTW9kZWxcbiAgICAgIHRoaXMuYWRkQ2FuZGlkYXRlID0gZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgIHNlbGYuY2FuZGlkYXRlcy5wdXNoKGNhbmRpZGF0ZSk7XG4gICAgICB9O1xuXG4gICAgICAvLyBkZWxldGUgc2VsZWN0ZWQgQ2FuZGlkYXRlXG4gICAgICB0aGlzLmRlbGV0ZUNhbmRpZGF0ZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNhbmRpZGF0ZXNUb0RlbGV0ZSA9IFtdO1xuXG4gICAgICAgIHNlbGYuY2FuZGlkYXRlcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICAgIGlmKGNhbmRpZGF0ZS5zZWxlY3RlZCkgY2FuZGlkYXRlc1RvRGVsZXRlLnB1c2goY2FuZGlkYXRlLmlkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc3dhbCh7XG4gICAgICAgICAgdGl0bGUgOiAnQXJlIHlvdSBzdXJlPycsXG4gICAgICAgICAgdGV4dCA6ICdZb3Ugd2lsbCBkZWxldGUgJyArIGNhbmRpZGF0ZXNUb0RlbGV0ZS5sZW5ndGggKyAnIGNhbmRpZGF0ZScgKyAoY2FuZGlkYXRlc1RvRGVsZXRlLmxlbmd0aCA+IDEgPyAncycgOiAnJykgKyAnLicsXG4gICAgICAgICAgLy90eXBlIDogJ3dhcm5pbmcnLFxuICAgICAgICAgIHNob3dDYW5jZWxCdXR0b24gOiB0cnVlLFxuICAgICAgICAgIGNsb3NlT25Db25maXJtIDogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICBDYW5kaWRhdGVSZXNvdXJjZS5kZWxldGVNYW55KGNhbmRpZGF0ZXNUb0RlbGV0ZSkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHN3YWwoJ0RlbGV0ZWQgIScsICdTZWxlY3RlZCBjYW5kaWRhdGVzIGhhdmUgYmVlbiBkZWxldGVkLicsICdzdWNjZXNzJyk7XG4gICAgICAgICAgICBzZWxmLmNhbmRpZGF0ZXMgPSBzZWxmLmNhbmRpZGF0ZXMuZmlsdGVyKGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlc1RvRGVsZXRlLmluZGV4T2YoY2FuZGlkYXRlLmlkKSA8IDA7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcblxuICAgICAgfTtcblxuICAgIH1cbn0oKTtcbiIsIitmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXJcbiAgICAubW9kdWxlKCdhcHAuY2FuZGlkYXRlJylcbiAgICAuZGlyZWN0aXZlKCdjYW5kaWRhdGUnLCBbXG4gICAgICAnZ3Jvd2wnLFxuICAgICAgQ2FuZGlkYXRlXG4gICAgXSk7XG5cbiAgICBmdW5jdGlvbiBDYW5kaWRhdGUoZ3Jvd2wpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0IDogJ0EnLFxuICAgICAgICByZXBsYWNlIDogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGVVcmwgOiAnLi9zcmMvY2FuZGlkYXRlL2NhbmRpZGF0ZS9jYW5kaWRhdGUuaHRtbCcsXG4gICAgICAgIHNjb3BlIDoge1xuICAgICAgICAgIGNhbmRpZGF0ZSA6ICc9J1xuICAgICAgICB9LFxuICAgICAgICBiaW5kVG9Db250cm9sbGVyIDogdHJ1ZSxcbiAgICAgICAgY29udHJvbGxlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgIC8vIHJldHJ5IGNhbmRpZGF0ZSBjcmVhdGlvbiBpZiBwcmV2aW91cyBmYWlsO1xuICAgICAgICAgIHRoaXMucmV0cnlTYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoc2VsZi5jYW5kaWRhdGUuaWQpIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgZGVsZXRlIHNlbGYuY2FuZGlkYXRlLmhhc0Vycm9yO1xuICAgICAgICAgICAgc2VsZi5jYW5kaWRhdGUuJHNhdmUoKS50aGVuKFxuICAgICAgICAgICAgICBmdW5jdGlvbigpIHsgZ3Jvd2wuc3VjY2VzcygnQ2FuZGlkYXRlICcgKyBzZWxmLmNhbmRpZGF0ZS5uYW1lICsgJyBzYXZlZCAhJyk7IH0sXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGdyb3dsLmVycm9yKCdBbiBlcnJvciBvY2N1cmVkLicpO1xuICAgICAgICAgICAgICAgIHNlbGYuY2FuZGlkYXRlLmhhc0Vycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgLy8gdXBkYXRlIHRoZSBjYW5kaWRhdGVcbiAgICAgICAgICB0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5jYW5kaWRhdGUuJHVwZGF0ZSgpLnRoZW4oXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkgeyBncm93bC5zdWNjZXNzKCdDYW5kaWRhdGUgJyArIHNlbGYuY2FuZGlkYXRlLm5hbWUgKyAnIHVwZGF0ZWQgIScpOyB9LFxuICAgICAgICAgICAgICBmdW5jdGlvbigpIHsgZ3Jvd2wuZXJyb3IoJ0FuIGVycm9yIG9jY3VyZWQuJyk7IH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfTtcblxuICAgICAgICB9LFxuICAgICAgICBjb250cm9sbGVyQXMgOiAnY2FuZGlkYXRlQ29udHJvbGxlcidcbiAgICAgIH07XG4gICAgfVxufSgpO1xuIiwiK2Z1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhclxuICAgIC5tb2R1bGUoJ2FwcC5jYW5kaWRhdGUnKVxuICAgIC5kaXJlY3RpdmUoJ2NhbmRpZGF0ZUZvcm0nLCBbXG4gICAgICAnQ2FuZGlkYXRlUmVzb3VyY2UnLFxuICAgICAgJ2dyb3dsJyxcbiAgICAgIENhbmRpZGF0ZVxuICAgIF0pO1xuXG4gICAgZnVuY3Rpb24gQ2FuZGlkYXRlKENhbmRpZGF0ZVJlc291cmNlLCBncm93bCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3QgOiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsIDogJy4vc3JjL2NhbmRpZGF0ZS9jYW5kaWRhdGUtZm9ybS9jYW5kaWRhdGUtZm9ybS5odG1sJyxcbiAgICAgICAgc2NvcGUgOiB7XG4gICAgICAgICAgb25BZGQgOiAnJidcbiAgICAgICAgfSxcbiAgICAgICAgYmluZFRvQ29udHJvbGxlciA6IHRydWUsXG4gICAgICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICB0aGlzLmNhbmRpZGF0ZSA9IHtcbiAgICAgICAgICAgIG5hbWUgOiBDYW5kaWRhdGVSZXNvdXJjZS5tb2RlbC5uYW1lLmRlZmF1bHRWYWx1ZSxcbiAgICAgICAgICAgIGVuYWJsZWQgOiBDYW5kaWRhdGVSZXNvdXJjZS5tb2RlbC5lbmFibGVkLmRlZmF1bHRWYWx1ZVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB0aGlzLm5hbWVWYWxpZGF0aW9uID0gQ2FuZGlkYXRlUmVzb3VyY2UubW9kZWwubmFtZTtcblxuICAgICAgICAgIHRoaXMuYWRkQ2FuZGlkYXRlID0gZnVuY3Rpb24oZm9ybSkge1xuICAgICAgICAgICAgaWYoZm9ybS4kaW52YWxpZCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICB2YXIgY2FuZGlkYXRlID0gbmV3IENhbmRpZGF0ZVJlc291cmNlKHNlbGYuY2FuZGlkYXRlKTtcblxuICAgICAgICAgICAgY2FuZGlkYXRlLiRzYXZlKCkudGhlbihcbiAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7IGdyb3dsLnN1Y2Nlc3MoJ0NhbmRpZGF0ZSAnICsgY2FuZGlkYXRlLm5hbWUgKyAnIGFkZGVkICEnKTsgfSxcbiAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZ3Jvd2wuZXJyb3IoJ0FuIGVycm9yIG9jY3VyZWQuJyk7XG4gICAgICAgICAgICAgICAgY2FuZGlkYXRlLmhhc0Vycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgc2VsZi5vbkFkZCh7IGNhbmRpZGF0ZSA6IGNhbmRpZGF0ZSB9KTtcblxuICAgICAgICAgICAgZm9ybS4kc2V0UHJpc3RpbmUoKTtcbiAgICAgICAgICAgIHRoaXMuY2FuZGlkYXRlLm5hbWUgPSBudWxsO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgfSxcbiAgICAgICAgY29udHJvbGxlckFzIDogJ2NhbmRpZGF0ZUZvcm1Db250cm9sbGVyJ1xuICAgICAgfTtcbiAgICB9XG5cbn0oKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==