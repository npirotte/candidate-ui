+function(){
  'use strict';

  angular.module('app.candidate', [])
    .config([
      '$stateProvider',
      CandidateModuleConfig
    ]);

  function CandidateModuleConfig($stateProvider) {
    $stateProvider.state('app.candidate', {
      url : '/candidate',
      views : {
        'main@app' : {
          templateUrl : 'src/candidate/candidates.html',
          controller : 'CandidatesController as candidatesController'
        }
      }
    });
  }

}();

+function() {
  'use strict';

  angular
    .module('app.candidate')
    .factory('CandidateResource', [
      '$resource',
      '$http',
      CandidateResource
    ]);

  const URL = '/candidate/:id';

  function CandidateResource($resource, $http) {

    var Candidate = $resource(
      URL,
      { id : '@id' }
    );

    // custom $update methods
    // $update could have been a $resource method, but has the server respond nothing, the model is erased on $update, prototype method is more fine tuned
    // @return : promise
    Candidate.prototype.$update = function() {

      if (!this.id) return false;

      var url = URL.replace(':id', this.id);
      var data = this.toJSON();

      // model cleanup
      if (data.selected) delete data.selected;
      if (data.hasError) delete data.hasError;

      return $http.put(url, this.toJSON());
    };

    // static deleteMany method
    // @params : ids : [...id]
    // @return : promise
    Candidate.deleteMany = function(ids) {
      var url = '/candidate/delete';
      return $http.post(url, ids);
    };

    // static model validation & defaultValue
    Candidate.model = {
      name : {
        required : true,
        minLength : 1,
        maxLength : 30,
        defaultValue : null
      },
      enabled : {
        defaultValue : true
      }
    };

    return Candidate;

  }

}();

/* global swal */

+function() {
  'use strict';

  const reorderIcons = [
    'glyphicon glyphicon-chevron-up',
    'glyphicon glyphicon-chevron-down'
  ];

  angular
    .module('app.candidate')
    .controller('CandidatesController', [
      'CandidateResource',
      CandidatesController
    ]);

    function CandidatesController(CandidateResource) {

      var self = this;

      this.candidates = CandidateResource.query();

      this.orderProp = null;
      this.reverse = false;

      /* **** public methods **** */

      // allow id tracking to fall back to random to avoid rg-repeat error when server errors;
      // @return : <int> item id or <tring> incremental no-saved item id
      var trackerCount = 0;
      this.itemTracker = function(item) {
        return item.id || ('no-saved' + ++trackerCount);
      }

      // change the ordering prop or reverse ordering
      // @param : <string> orderProp
      this.reorder = function(orderProp) {
        if ( self.orderProp === orderProp ) {
          self.reverse = !self.reverse;
        }
        else {
          self.orderProp = orderProp;
          self.reverse = false;
        }
      };

      // return the correct className for table header cells
      // @param : <string> orderProp
      // @output : <string> className
      this.reorderIconClass = function(orderProp) {
        if ( self.orderProp !== orderProp ) return false;
        return reorderIcons[self.reverse ? 1 : 0];
      };

      // selected / deselect all rows
      // @param : native event
      this.toggleSelection = function(event) {
        self.candidates.forEach(function(candidate) {
          candidate.selected = event.target.checked;
        });
      };

      // output true is one or more rows are selected
      // @return <bool>
      this.selectedCandidatesNbr = function() {
        var selectedCandidates = self.candidates.filter(function(candidate) {
          return candidate.selected;
        });
        return selectedCandidates.length > 0;
      };

      // add a new candidate
      // @param : {object} candidateModel
      this.addCandidate = function(candidate) {
        self.candidates.push(candidate);
      };

      // delete selected Candidate
      this.deleteCandidates = function() {
        var candidatesToDelete = [];

        self.candidates.forEach(function(candidate) {
          if(candidate.selected) candidatesToDelete.push(candidate.id);
        });

        swal({
          title : 'Are you sure?',
          text : 'You will delete ' + candidatesToDelete.length + ' candidate' + (candidatesToDelete.length > 1 ? 's' : '') + '.',
          //type : 'warning',
          showCancelButton : true,
          closeOnConfirm : false
        },
        function() {

          CandidateResource.deleteMany(candidatesToDelete).then(function() {
            swal('Deleted !', 'Selected candidates have been deleted.', 'success');
            self.candidates = self.candidates.filter(function(candidate) {
              return candidatesToDelete.indexOf(candidate.id) < 0;
            });
          });

        });

      };

    }
}();

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
        controllerAs : 'candidateController',
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

            if( !self.candidate.id ) return false;

            self.candidate.$update().then(
              function() { growl.success('Candidate ' + self.candidate.name + ' updated !'); },
              function() { growl.error('An error occured.'); }
            );
          };

        }
      };
    }
}();

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9jYW5kaWRhdGUubW9kdWxlLmpzIiwiY2FuZGlkYXRlLnJlc291cmNlLmpzIiwiY2FuZGlkYXRlcy5jb250cm9sbGVyLmpzIiwiY2FuZGlkYXRlL2NhbmRpZGF0ZS5kaXJlY3RpdmUuanMiLCJjYW5kaWRhdGUtZm9ybS9jYW5kaWRhdGVGb3JtLmRpcmVjdGl2ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibW9kdWxlLmNhbmRpZGF0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIitmdW5jdGlvbigpe1xuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhci5tb2R1bGUoJ2FwcC5jYW5kaWRhdGUnLCBbXSlcbiAgICAuY29uZmlnKFtcbiAgICAgICckc3RhdGVQcm92aWRlcicsXG4gICAgICBDYW5kaWRhdGVNb2R1bGVDb25maWdcbiAgICBdKTtcblxuICBmdW5jdGlvbiBDYW5kaWRhdGVNb2R1bGVDb25maWcoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXBwLmNhbmRpZGF0ZScsIHtcbiAgICAgIHVybCA6ICcvY2FuZGlkYXRlJyxcbiAgICAgIHZpZXdzIDoge1xuICAgICAgICAnbWFpbkBhcHAnIDoge1xuICAgICAgICAgIHRlbXBsYXRlVXJsIDogJ3NyYy9jYW5kaWRhdGUvY2FuZGlkYXRlcy5odG1sJyxcbiAgICAgICAgICBjb250cm9sbGVyIDogJ0NhbmRpZGF0ZXNDb250cm9sbGVyIGFzIGNhbmRpZGF0ZXNDb250cm9sbGVyJ1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxufSgpO1xuIiwiK2Z1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhclxuICAgIC5tb2R1bGUoJ2FwcC5jYW5kaWRhdGUnKVxuICAgIC5mYWN0b3J5KCdDYW5kaWRhdGVSZXNvdXJjZScsIFtcbiAgICAgICckcmVzb3VyY2UnLFxuICAgICAgJyRodHRwJyxcbiAgICAgIENhbmRpZGF0ZVJlc291cmNlXG4gICAgXSk7XG5cbiAgY29uc3QgVVJMID0gJy9jYW5kaWRhdGUvOmlkJztcblxuICBmdW5jdGlvbiBDYW5kaWRhdGVSZXNvdXJjZSgkcmVzb3VyY2UsICRodHRwKSB7XG5cbiAgICB2YXIgQ2FuZGlkYXRlID0gJHJlc291cmNlKFxuICAgICAgVVJMLFxuICAgICAgeyBpZCA6ICdAaWQnIH1cbiAgICApO1xuXG4gICAgLy8gY3VzdG9tICR1cGRhdGUgbWV0aG9kc1xuICAgIC8vICR1cGRhdGUgY291bGQgaGF2ZSBiZWVuIGEgJHJlc291cmNlIG1ldGhvZCwgYnV0IGhhcyB0aGUgc2VydmVyIHJlc3BvbmQgbm90aGluZywgdGhlIG1vZGVsIGlzIGVyYXNlZCBvbiAkdXBkYXRlLCBwcm90b3R5cGUgbWV0aG9kIGlzIG1vcmUgZmluZSB0dW5lZFxuICAgIC8vIEByZXR1cm4gOiBwcm9taXNlXG4gICAgQ2FuZGlkYXRlLnByb3RvdHlwZS4kdXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgIGlmICghdGhpcy5pZCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICB2YXIgdXJsID0gVVJMLnJlcGxhY2UoJzppZCcsIHRoaXMuaWQpO1xuICAgICAgdmFyIGRhdGEgPSB0aGlzLnRvSlNPTigpO1xuXG4gICAgICAvLyBtb2RlbCBjbGVhbnVwXG4gICAgICBpZiAoZGF0YS5zZWxlY3RlZCkgZGVsZXRlIGRhdGEuc2VsZWN0ZWQ7XG4gICAgICBpZiAoZGF0YS5oYXNFcnJvcikgZGVsZXRlIGRhdGEuaGFzRXJyb3I7XG5cbiAgICAgIHJldHVybiAkaHR0cC5wdXQodXJsLCB0aGlzLnRvSlNPTigpKTtcbiAgICB9O1xuXG4gICAgLy8gc3RhdGljIGRlbGV0ZU1hbnkgbWV0aG9kXG4gICAgLy8gQHBhcmFtcyA6IGlkcyA6IFsuLi5pZF1cbiAgICAvLyBAcmV0dXJuIDogcHJvbWlzZVxuICAgIENhbmRpZGF0ZS5kZWxldGVNYW55ID0gZnVuY3Rpb24oaWRzKSB7XG4gICAgICB2YXIgdXJsID0gJy9jYW5kaWRhdGUvZGVsZXRlJztcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KHVybCwgaWRzKTtcbiAgICB9O1xuXG4gICAgLy8gc3RhdGljIG1vZGVsIHZhbGlkYXRpb24gJiBkZWZhdWx0VmFsdWVcbiAgICBDYW5kaWRhdGUubW9kZWwgPSB7XG4gICAgICBuYW1lIDoge1xuICAgICAgICByZXF1aXJlZCA6IHRydWUsXG4gICAgICAgIG1pbkxlbmd0aCA6IDEsXG4gICAgICAgIG1heExlbmd0aCA6IDMwLFxuICAgICAgICBkZWZhdWx0VmFsdWUgOiBudWxsXG4gICAgICB9LFxuICAgICAgZW5hYmxlZCA6IHtcbiAgICAgICAgZGVmYXVsdFZhbHVlIDogdHJ1ZVxuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gQ2FuZGlkYXRlO1xuXG4gIH1cblxufSgpO1xuIiwiLyogZ2xvYmFsIHN3YWwgKi9cblxuK2Z1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29uc3QgcmVvcmRlckljb25zID0gW1xuICAgICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tdXAnLFxuICAgICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tZG93bidcbiAgXTtcblxuICBhbmd1bGFyXG4gICAgLm1vZHVsZSgnYXBwLmNhbmRpZGF0ZScpXG4gICAgLmNvbnRyb2xsZXIoJ0NhbmRpZGF0ZXNDb250cm9sbGVyJywgW1xuICAgICAgJ0NhbmRpZGF0ZVJlc291cmNlJyxcbiAgICAgIENhbmRpZGF0ZXNDb250cm9sbGVyXG4gICAgXSk7XG5cbiAgICBmdW5jdGlvbiBDYW5kaWRhdGVzQ29udHJvbGxlcihDYW5kaWRhdGVSZXNvdXJjZSkge1xuXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHRoaXMuY2FuZGlkYXRlcyA9IENhbmRpZGF0ZVJlc291cmNlLnF1ZXJ5KCk7XG5cbiAgICAgIHRoaXMub3JkZXJQcm9wID0gbnVsbDtcbiAgICAgIHRoaXMucmV2ZXJzZSA9IGZhbHNlO1xuXG4gICAgICAvKiAqKioqIHB1YmxpYyBtZXRob2RzICoqKiogKi9cblxuICAgICAgLy8gYWxsb3cgaWQgdHJhY2tpbmcgdG8gZmFsbCBiYWNrIHRvIHJhbmRvbSB0byBhdm9pZCByZy1yZXBlYXQgZXJyb3Igd2hlbiBzZXJ2ZXIgZXJyb3JzO1xuICAgICAgLy8gQHJldHVybiA6IDxpbnQ+IGl0ZW0gaWQgb3IgPHRyaW5nPiBpbmNyZW1lbnRhbCBuby1zYXZlZCBpdGVtIGlkXG4gICAgICB2YXIgdHJhY2tlckNvdW50ID0gMDtcbiAgICAgIHRoaXMuaXRlbVRyYWNrZXIgPSBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHJldHVybiBpdGVtLmlkIHx8ICgnbm8tc2F2ZWQnICsgKyt0cmFja2VyQ291bnQpO1xuICAgICAgfVxuXG4gICAgICAvLyBjaGFuZ2UgdGhlIG9yZGVyaW5nIHByb3Agb3IgcmV2ZXJzZSBvcmRlcmluZ1xuICAgICAgLy8gQHBhcmFtIDogPHN0cmluZz4gb3JkZXJQcm9wXG4gICAgICB0aGlzLnJlb3JkZXIgPSBmdW5jdGlvbihvcmRlclByb3ApIHtcbiAgICAgICAgaWYgKCBzZWxmLm9yZGVyUHJvcCA9PT0gb3JkZXJQcm9wICkge1xuICAgICAgICAgIHNlbGYucmV2ZXJzZSA9ICFzZWxmLnJldmVyc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgc2VsZi5vcmRlclByb3AgPSBvcmRlclByb3A7XG4gICAgICAgICAgc2VsZi5yZXZlcnNlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIHJldHVybiB0aGUgY29ycmVjdCBjbGFzc05hbWUgZm9yIHRhYmxlIGhlYWRlciBjZWxsc1xuICAgICAgLy8gQHBhcmFtIDogPHN0cmluZz4gb3JkZXJQcm9wXG4gICAgICAvLyBAb3V0cHV0IDogPHN0cmluZz4gY2xhc3NOYW1lXG4gICAgICB0aGlzLnJlb3JkZXJJY29uQ2xhc3MgPSBmdW5jdGlvbihvcmRlclByb3ApIHtcbiAgICAgICAgaWYgKCBzZWxmLm9yZGVyUHJvcCAhPT0gb3JkZXJQcm9wICkgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gcmVvcmRlckljb25zW3NlbGYucmV2ZXJzZSA/IDEgOiAwXTtcbiAgICAgIH07XG5cbiAgICAgIC8vIHNlbGVjdGVkIC8gZGVzZWxlY3QgYWxsIHJvd3NcbiAgICAgIC8vIEBwYXJhbSA6IG5hdGl2ZSBldmVudFxuICAgICAgdGhpcy50b2dnbGVTZWxlY3Rpb24gPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBzZWxmLmNhbmRpZGF0ZXMuZm9yRWFjaChmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgICAgICBjYW5kaWRhdGUuc2VsZWN0ZWQgPSBldmVudC50YXJnZXQuY2hlY2tlZDtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICAvLyBvdXRwdXQgdHJ1ZSBpcyBvbmUgb3IgbW9yZSByb3dzIGFyZSBzZWxlY3RlZFxuICAgICAgLy8gQHJldHVybiA8Ym9vbD5cbiAgICAgIHRoaXMuc2VsZWN0ZWRDYW5kaWRhdGVzTmJyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZENhbmRpZGF0ZXMgPSBzZWxmLmNhbmRpZGF0ZXMuZmlsdGVyKGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICAgIHJldHVybiBjYW5kaWRhdGUuc2VsZWN0ZWQ7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc2VsZWN0ZWRDYW5kaWRhdGVzLmxlbmd0aCA+IDA7XG4gICAgICB9O1xuXG4gICAgICAvLyBhZGQgYSBuZXcgY2FuZGlkYXRlXG4gICAgICAvLyBAcGFyYW0gOiB7b2JqZWN0fSBjYW5kaWRhdGVNb2RlbFxuICAgICAgdGhpcy5hZGRDYW5kaWRhdGUgPSBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgICAgc2VsZi5jYW5kaWRhdGVzLnB1c2goY2FuZGlkYXRlKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIGRlbGV0ZSBzZWxlY3RlZCBDYW5kaWRhdGVcbiAgICAgIHRoaXMuZGVsZXRlQ2FuZGlkYXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2FuZGlkYXRlc1RvRGVsZXRlID0gW107XG5cbiAgICAgICAgc2VsZi5jYW5kaWRhdGVzLmZvckVhY2goZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgICAgaWYoY2FuZGlkYXRlLnNlbGVjdGVkKSBjYW5kaWRhdGVzVG9EZWxldGUucHVzaChjYW5kaWRhdGUuaWQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzd2FsKHtcbiAgICAgICAgICB0aXRsZSA6ICdBcmUgeW91IHN1cmU/JyxcbiAgICAgICAgICB0ZXh0IDogJ1lvdSB3aWxsIGRlbGV0ZSAnICsgY2FuZGlkYXRlc1RvRGVsZXRlLmxlbmd0aCArICcgY2FuZGlkYXRlJyArIChjYW5kaWRhdGVzVG9EZWxldGUubGVuZ3RoID4gMSA/ICdzJyA6ICcnKSArICcuJyxcbiAgICAgICAgICAvL3R5cGUgOiAnd2FybmluZycsXG4gICAgICAgICAgc2hvd0NhbmNlbEJ1dHRvbiA6IHRydWUsXG4gICAgICAgICAgY2xvc2VPbkNvbmZpcm0gOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbigpIHtcblxuICAgICAgICAgIENhbmRpZGF0ZVJlc291cmNlLmRlbGV0ZU1hbnkoY2FuZGlkYXRlc1RvRGVsZXRlKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc3dhbCgnRGVsZXRlZCAhJywgJ1NlbGVjdGVkIGNhbmRpZGF0ZXMgaGF2ZSBiZWVuIGRlbGV0ZWQuJywgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICAgIHNlbGYuY2FuZGlkYXRlcyA9IHNlbGYuY2FuZGlkYXRlcy5maWx0ZXIoZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGVzVG9EZWxldGUuaW5kZXhPZihjYW5kaWRhdGUuaWQpIDwgMDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICB9O1xuXG4gICAgfVxufSgpO1xuIiwiK2Z1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhclxuICAgIC5tb2R1bGUoJ2FwcC5jYW5kaWRhdGUnKVxuICAgIC5kaXJlY3RpdmUoJ2NhbmRpZGF0ZScsIFtcbiAgICAgICdncm93bCcsXG4gICAgICBDYW5kaWRhdGVcbiAgICBdKTtcblxuICAgIGZ1bmN0aW9uIENhbmRpZGF0ZShncm93bCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3QgOiAnQScsXG4gICAgICAgIHJlcGxhY2UgOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZVVybCA6ICcuL3NyYy9jYW5kaWRhdGUvY2FuZGlkYXRlL2NhbmRpZGF0ZS5odG1sJyxcbiAgICAgICAgc2NvcGUgOiB7XG4gICAgICAgICAgY2FuZGlkYXRlIDogJz0nXG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRUb0NvbnRyb2xsZXIgOiB0cnVlLFxuICAgICAgICBjb250cm9sbGVyQXMgOiAnY2FuZGlkYXRlQ29udHJvbGxlcicsXG4gICAgICAgIGNvbnRyb2xsZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAvLyByZXRyeSBjYW5kaWRhdGUgY3JlYXRpb24gaWYgcHJldmlvdXMgZmFpbDtcbiAgICAgICAgICB0aGlzLnJldHJ5U2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHNlbGYuY2FuZGlkYXRlLmlkKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIGRlbGV0ZSBzZWxmLmNhbmRpZGF0ZS5oYXNFcnJvcjtcbiAgICAgICAgICAgIHNlbGYuY2FuZGlkYXRlLiRzYXZlKCkudGhlbihcbiAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7IGdyb3dsLnN1Y2Nlc3MoJ0NhbmRpZGF0ZSAnICsgc2VsZi5jYW5kaWRhdGUubmFtZSArICcgc2F2ZWQgIScpOyB9LFxuICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBncm93bC5lcnJvcignQW4gZXJyb3Igb2NjdXJlZC4nKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNhbmRpZGF0ZS5oYXNFcnJvciA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgY2FuZGlkYXRlXG4gICAgICAgICAgdGhpcy51cGRhdGUgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgaWYoICFzZWxmLmNhbmRpZGF0ZS5pZCApIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgc2VsZi5jYW5kaWRhdGUuJHVwZGF0ZSgpLnRoZW4oXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkgeyBncm93bC5zdWNjZXNzKCdDYW5kaWRhdGUgJyArIHNlbGYuY2FuZGlkYXRlLm5hbWUgKyAnIHVwZGF0ZWQgIScpOyB9LFxuICAgICAgICAgICAgICBmdW5jdGlvbigpIHsgZ3Jvd2wuZXJyb3IoJ0FuIGVycm9yIG9jY3VyZWQuJyk7IH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfTtcblxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbn0oKTtcbiIsIitmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXJcbiAgICAubW9kdWxlKCdhcHAuY2FuZGlkYXRlJylcbiAgICAuZGlyZWN0aXZlKCdjYW5kaWRhdGVGb3JtJywgW1xuICAgICAgJ0NhbmRpZGF0ZVJlc291cmNlJyxcbiAgICAgICdncm93bCcsXG4gICAgICBDYW5kaWRhdGVcbiAgICBdKTtcblxuICAgIGZ1bmN0aW9uIENhbmRpZGF0ZShDYW5kaWRhdGVSZXNvdXJjZSwgZ3Jvd2wpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0IDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybCA6ICcuL3NyYy9jYW5kaWRhdGUvY2FuZGlkYXRlLWZvcm0vY2FuZGlkYXRlLWZvcm0uaHRtbCcsXG4gICAgICAgIHNjb3BlIDoge1xuICAgICAgICAgIG9uQWRkIDogJyYnXG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRUb0NvbnRyb2xsZXIgOiB0cnVlLFxuICAgICAgICBjb250cm9sbGVyQXMgOiAnY2FuZGlkYXRlRm9ybUNvbnRyb2xsZXInLFxuICAgICAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgdGhpcy5jYW5kaWRhdGUgPSB7XG4gICAgICAgICAgICBuYW1lIDogQ2FuZGlkYXRlUmVzb3VyY2UubW9kZWwubmFtZS5kZWZhdWx0VmFsdWUsXG4gICAgICAgICAgICBlbmFibGVkIDogQ2FuZGlkYXRlUmVzb3VyY2UubW9kZWwuZW5hYmxlZC5kZWZhdWx0VmFsdWVcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgdGhpcy5uYW1lVmFsaWRhdGlvbiA9IENhbmRpZGF0ZVJlc291cmNlLm1vZGVsLm5hbWU7XG5cbiAgICAgICAgICAvLyBhZGQgYSBuZXcgQ2FuZGlkYXRlXG4gICAgICAgICAgdGhpcy5hZGRDYW5kaWRhdGUgPSBmdW5jdGlvbihmb3JtKSB7XG4gICAgICAgICAgICBpZihmb3JtLiRpbnZhbGlkKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIHZhciBjYW5kaWRhdGUgPSBuZXcgQ2FuZGlkYXRlUmVzb3VyY2Uoc2VsZi5jYW5kaWRhdGUpO1xuXG4gICAgICAgICAgICBjYW5kaWRhdGUuJHNhdmUoKS50aGVuKFxuICAgICAgICAgICAgICBmdW5jdGlvbigpIHsgZ3Jvd2wuc3VjY2VzcygnQ2FuZGlkYXRlICcgKyBjYW5kaWRhdGUubmFtZSArICcgYWRkZWQgIScpOyB9LFxuICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBncm93bC5lcnJvcignQW4gZXJyb3Igb2NjdXJlZC4nKTtcbiAgICAgICAgICAgICAgICBjYW5kaWRhdGUuaGFzRXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAvLyBwYXJlbnQgY3RybCBhY3Rpb25cbiAgICAgICAgICAgIHNlbGYub25BZGQoeyBjYW5kaWRhdGUgOiBjYW5kaWRhdGUgfSk7XG5cbiAgICAgICAgICAgIC8vIGZvcm0gcmVzZXRcbiAgICAgICAgICAgIGZvcm0uJHNldFByaXN0aW5lKCk7XG4gICAgICAgICAgICB0aGlzLmNhbmRpZGF0ZS5uYW1lID0gQ2FuZGlkYXRlUmVzb3VyY2UubW9kZWwubmFtZS5kZWZhdWx0VmFsdWU7XG4gICAgICAgICAgfTtcblxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxufSgpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9