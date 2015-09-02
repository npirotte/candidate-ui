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

      let url = URL.replace(':id', this.id);
      var data = this.toJSON();

      if (data.selected) delete data.selected;
      if (data.hasError) delete data.hasError;

      return $http.put(url, this.toJSON());
    };

    // static deleteMany method
    // @params : ids : [...id]
    // @return : promise
    Candidate.deleteMany = function(ids) {
      let url = '/candidate/delete';
      return $http.post(url, ids);
    };

    // static model validation & defaultValue data
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
      // @return : <int> item id or incremental no saved item id
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

      // output selected rows count
      // @return <int> count
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

        },
        controllerAs : 'candidateController'
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
        controller : function() {
          var self = this;

          this.candidate = {
            name : CandidateResource.model.name.defaultValue,
            enabled : CandidateResource.model.enabled.defaultValue
          };

          this.nameValidation = CandidateResource.model.name;

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

            self.onAdd({ candidate : candidate });

            form.$setPristine();
            this.candidate.name = null;
          };

        },
        controllerAs : 'candidateFormController'
      };
    }

}();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9jYW5kaWRhdGUubW9kdWxlLmpzIiwiY2FuZGlkYXRlLnJlc291cmNlLmpzIiwiY2FuZGlkYXRlcy5jb250cm9sbGVyLmpzIiwiY2FuZGlkYXRlL2NhbmRpZGF0ZS5kaXJlY3RpdmUuanMiLCJjYW5kaWRhdGUtZm9ybS9jYW5kaWRhdGVGb3JtLmRpcmVjdGl2ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1vZHVsZS5jYW5kaWRhdGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIrZnVuY3Rpb24oKXtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXIubW9kdWxlKCdhcHAuY2FuZGlkYXRlJywgW10pXG4gICAgLmNvbmZpZyhbXG4gICAgICAnJHN0YXRlUHJvdmlkZXInLFxuICAgICAgQ2FuZGlkYXRlTW9kdWxlQ29uZmlnXG4gICAgXSk7XG5cbiAgZnVuY3Rpb24gQ2FuZGlkYXRlTW9kdWxlQ29uZmlnKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FwcC5jYW5kaWRhdGUnLCB7XG4gICAgICB1cmwgOiAnL2NhbmRpZGF0ZScsXG4gICAgICB2aWV3cyA6IHtcbiAgICAgICAgJ21haW5AYXBwJyA6IHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybCA6ICdzcmMvY2FuZGlkYXRlL2NhbmRpZGF0ZXMuaHRtbCcsXG4gICAgICAgICAgY29udHJvbGxlciA6ICdDYW5kaWRhdGVzQ29udHJvbGxlciBhcyBjYW5kaWRhdGVzQ29udHJvbGxlcidcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbn0oKTtcbiIsIitmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXJcbiAgICAubW9kdWxlKCdhcHAuY2FuZGlkYXRlJylcbiAgICAuZmFjdG9yeSgnQ2FuZGlkYXRlUmVzb3VyY2UnLCBbXG4gICAgICAnJHJlc291cmNlJyxcbiAgICAgICckaHR0cCcsXG4gICAgICBDYW5kaWRhdGVSZXNvdXJjZVxuICAgIF0pO1xuXG4gIGNvbnN0IFVSTCA9ICcvY2FuZGlkYXRlLzppZCc7XG5cbiAgZnVuY3Rpb24gQ2FuZGlkYXRlUmVzb3VyY2UoJHJlc291cmNlLCAkaHR0cCkge1xuXG4gICAgdmFyIENhbmRpZGF0ZSA9ICRyZXNvdXJjZShcbiAgICAgIFVSTCxcbiAgICAgIHsgaWQgOiAnQGlkJyB9XG4gICAgKTtcblxuICAgIC8vIGN1c3RvbSAkdXBkYXRlIG1ldGhvZHNcbiAgICAvLyAkdXBkYXRlIGNvdWxkIGhhdmUgYmVlbiBhICRyZXNvdXJjZSBtZXRob2QsIGJ1dCBoYXMgdGhlIHNlcnZlciByZXNwb25kIG5vdGhpbmcsIHRoZSBtb2RlbCBpcyBlcmFzZWQgb24gJHVwZGF0ZSwgcHJvdG90eXBlIG1ldGhvZCBpcyBtb3JlIGZpbmUgdHVuZWRcbiAgICAvLyBAcmV0dXJuIDogcHJvbWlzZVxuICAgIENhbmRpZGF0ZS5wcm90b3R5cGUuJHVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICBpZiAoIXRoaXMuaWQpIHJldHVybiBmYWxzZTtcblxuICAgICAgbGV0IHVybCA9IFVSTC5yZXBsYWNlKCc6aWQnLCB0aGlzLmlkKTtcbiAgICAgIHZhciBkYXRhID0gdGhpcy50b0pTT04oKTtcblxuICAgICAgaWYgKGRhdGEuc2VsZWN0ZWQpIGRlbGV0ZSBkYXRhLnNlbGVjdGVkO1xuICAgICAgaWYgKGRhdGEuaGFzRXJyb3IpIGRlbGV0ZSBkYXRhLmhhc0Vycm9yO1xuXG4gICAgICByZXR1cm4gJGh0dHAucHV0KHVybCwgdGhpcy50b0pTT04oKSk7XG4gICAgfTtcblxuICAgIC8vIHN0YXRpYyBkZWxldGVNYW55IG1ldGhvZFxuICAgIC8vIEBwYXJhbXMgOiBpZHMgOiBbLi4uaWRdXG4gICAgLy8gQHJldHVybiA6IHByb21pc2VcbiAgICBDYW5kaWRhdGUuZGVsZXRlTWFueSA9IGZ1bmN0aW9uKGlkcykge1xuICAgICAgbGV0IHVybCA9ICcvY2FuZGlkYXRlL2RlbGV0ZSc7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCh1cmwsIGlkcyk7XG4gICAgfTtcblxuICAgIC8vIHN0YXRpYyBtb2RlbCB2YWxpZGF0aW9uICYgZGVmYXVsdFZhbHVlIGRhdGFcbiAgICBDYW5kaWRhdGUubW9kZWwgPSB7XG4gICAgICBuYW1lIDoge1xuICAgICAgICByZXF1aXJlZCA6IHRydWUsXG4gICAgICAgIG1pbkxlbmd0aCA6IDEsXG4gICAgICAgIG1heExlbmd0aCA6IDMwLFxuICAgICAgICBkZWZhdWx0VmFsdWUgOiBudWxsXG4gICAgICB9LFxuICAgICAgZW5hYmxlZCA6IHtcbiAgICAgICAgZGVmYXVsdFZhbHVlIDogdHJ1ZVxuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gQ2FuZGlkYXRlO1xuXG4gIH1cblxufSgpO1xuIiwiLyogZ2xvYmFsIHN3YWwgKi9cblxuK2Z1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29uc3QgcmVvcmRlckljb25zID0gW1xuICAgICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tdXAnLFxuICAgICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tZG93bidcbiAgXTtcblxuICBhbmd1bGFyXG4gICAgLm1vZHVsZSgnYXBwLmNhbmRpZGF0ZScpXG4gICAgLmNvbnRyb2xsZXIoJ0NhbmRpZGF0ZXNDb250cm9sbGVyJywgW1xuICAgICAgJ0NhbmRpZGF0ZVJlc291cmNlJyxcbiAgICAgIENhbmRpZGF0ZXNDb250cm9sbGVyXG4gICAgXSk7XG5cbiAgICBmdW5jdGlvbiBDYW5kaWRhdGVzQ29udHJvbGxlcihDYW5kaWRhdGVSZXNvdXJjZSkge1xuXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHRoaXMuY2FuZGlkYXRlcyA9IENhbmRpZGF0ZVJlc291cmNlLnF1ZXJ5KCk7XG5cbiAgICAgIHRoaXMub3JkZXJQcm9wID0gbnVsbDtcbiAgICAgIHRoaXMucmV2ZXJzZSA9IGZhbHNlO1xuXG4gICAgICAvKiAqKioqIHB1YmxpYyBtZXRob2RzICoqKiogKi9cblxuICAgICAgLy8gYWxsb3cgaWQgdHJhY2tpbmcgdG8gZmFsbCBiYWNrIHRvIHJhbmRvbSB0byBhdm9pZCByZy1yZXBlYXQgZXJyb3Igd2hlbiBzZXJ2ZXIgZXJyb3JzO1xuICAgICAgLy8gQHJldHVybiA6IDxpbnQ+IGl0ZW0gaWQgb3IgaW5jcmVtZW50YWwgbm8gc2F2ZWQgaXRlbSBpZFxuICAgICAgdmFyIHRyYWNrZXJDb3VudCA9IDA7XG4gICAgICB0aGlzLml0ZW1UcmFja2VyID0gZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICByZXR1cm4gaXRlbS5pZCB8fCAoJ25vLXNhdmVkJyArICsrdHJhY2tlckNvdW50KTtcbiAgICAgIH1cblxuICAgICAgLy8gY2hhbmdlIHRoZSBvcmRlcmluZyBwcm9wIG9yIHJldmVyc2Ugb3JkZXJpbmdcbiAgICAgIC8vIEBwYXJhbSA6IDxzdHJpbmc+IG9yZGVyUHJvcFxuICAgICAgdGhpcy5yZW9yZGVyID0gZnVuY3Rpb24ob3JkZXJQcm9wKSB7XG4gICAgICAgIGlmICggc2VsZi5vcmRlclByb3AgPT09IG9yZGVyUHJvcCApIHtcbiAgICAgICAgICBzZWxmLnJldmVyc2UgPSAhc2VsZi5yZXZlcnNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHNlbGYub3JkZXJQcm9wID0gb3JkZXJQcm9wO1xuICAgICAgICAgIHNlbGYucmV2ZXJzZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyByZXR1cm4gdGhlIGNvcnJlY3QgY2xhc3NOYW1lIGZvciB0YWJsZSBoZWFkZXIgY2VsbHNcbiAgICAgIC8vIEBwYXJhbSA6IDxzdHJpbmc+IG9yZGVyUHJvcFxuICAgICAgLy8gQG91dHB1dCA6IDxzdHJpbmc+IGNsYXNzTmFtZVxuICAgICAgdGhpcy5yZW9yZGVySWNvbkNsYXNzID0gZnVuY3Rpb24ob3JkZXJQcm9wKSB7XG4gICAgICAgIGlmICggc2VsZi5vcmRlclByb3AgIT09IG9yZGVyUHJvcCApIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHJlb3JkZXJJY29uc1tzZWxmLnJldmVyc2UgPyAxIDogMF07XG4gICAgICB9O1xuXG4gICAgICAvLyBzZWxlY3RlZCAvIGRlc2VsZWN0IGFsbCByb3dzXG4gICAgICAvLyBAcGFyYW0gOiBuYXRpdmUgZXZlbnRcbiAgICAgIHRoaXMudG9nZ2xlU2VsZWN0aW9uID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgc2VsZi5jYW5kaWRhdGVzLmZvckVhY2goZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgICAgY2FuZGlkYXRlLnNlbGVjdGVkID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgLy8gb3V0cHV0IHNlbGVjdGVkIHJvd3MgY291bnRcbiAgICAgIC8vIEByZXR1cm4gPGludD4gY291bnRcbiAgICAgIHRoaXMuc2VsZWN0ZWRDYW5kaWRhdGVzTmJyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZENhbmRpZGF0ZXMgPSBzZWxmLmNhbmRpZGF0ZXMuZmlsdGVyKGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICAgIHJldHVybiBjYW5kaWRhdGUuc2VsZWN0ZWQ7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc2VsZWN0ZWRDYW5kaWRhdGVzLmxlbmd0aCA+IDA7XG4gICAgICB9O1xuXG4gICAgICAvLyBhZGQgYSBuZXcgY2FuZGlkYXRlXG4gICAgICAvLyBAcGFyYW0gOiB7b2JqZWN0fSBjYW5kaWRhdGVNb2RlbFxuICAgICAgdGhpcy5hZGRDYW5kaWRhdGUgPSBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgICAgc2VsZi5jYW5kaWRhdGVzLnB1c2goY2FuZGlkYXRlKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIGRlbGV0ZSBzZWxlY3RlZCBDYW5kaWRhdGVcbiAgICAgIHRoaXMuZGVsZXRlQ2FuZGlkYXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2FuZGlkYXRlc1RvRGVsZXRlID0gW107XG5cbiAgICAgICAgc2VsZi5jYW5kaWRhdGVzLmZvckVhY2goZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgICAgaWYoY2FuZGlkYXRlLnNlbGVjdGVkKSBjYW5kaWRhdGVzVG9EZWxldGUucHVzaChjYW5kaWRhdGUuaWQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzd2FsKHtcbiAgICAgICAgICB0aXRsZSA6ICdBcmUgeW91IHN1cmU/JyxcbiAgICAgICAgICB0ZXh0IDogJ1lvdSB3aWxsIGRlbGV0ZSAnICsgY2FuZGlkYXRlc1RvRGVsZXRlLmxlbmd0aCArICcgY2FuZGlkYXRlJyArIChjYW5kaWRhdGVzVG9EZWxldGUubGVuZ3RoID4gMSA/ICdzJyA6ICcnKSArICcuJyxcbiAgICAgICAgICAvL3R5cGUgOiAnd2FybmluZycsXG4gICAgICAgICAgc2hvd0NhbmNlbEJ1dHRvbiA6IHRydWUsXG4gICAgICAgICAgY2xvc2VPbkNvbmZpcm0gOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbigpIHtcblxuICAgICAgICAgIENhbmRpZGF0ZVJlc291cmNlLmRlbGV0ZU1hbnkoY2FuZGlkYXRlc1RvRGVsZXRlKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc3dhbCgnRGVsZXRlZCAhJywgJ1NlbGVjdGVkIGNhbmRpZGF0ZXMgaGF2ZSBiZWVuIGRlbGV0ZWQuJywgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICAgIHNlbGYuY2FuZGlkYXRlcyA9IHNlbGYuY2FuZGlkYXRlcy5maWx0ZXIoZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGVzVG9EZWxldGUuaW5kZXhPZihjYW5kaWRhdGUuaWQpIDwgMDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICB9O1xuXG4gICAgfVxufSgpO1xuIiwiK2Z1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhclxuICAgIC5tb2R1bGUoJ2FwcC5jYW5kaWRhdGUnKVxuICAgIC5kaXJlY3RpdmUoJ2NhbmRpZGF0ZScsIFtcbiAgICAgICdncm93bCcsXG4gICAgICBDYW5kaWRhdGVcbiAgICBdKTtcblxuICAgIGZ1bmN0aW9uIENhbmRpZGF0ZShncm93bCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3QgOiAnQScsXG4gICAgICAgIHJlcGxhY2UgOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZVVybCA6ICcuL3NyYy9jYW5kaWRhdGUvY2FuZGlkYXRlL2NhbmRpZGF0ZS5odG1sJyxcbiAgICAgICAgc2NvcGUgOiB7XG4gICAgICAgICAgY2FuZGlkYXRlIDogJz0nXG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRUb0NvbnRyb2xsZXIgOiB0cnVlLFxuICAgICAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgLy8gcmV0cnkgY2FuZGlkYXRlIGNyZWF0aW9uIGlmIHByZXZpb3VzIGZhaWw7XG4gICAgICAgICAgdGhpcy5yZXRyeVNhdmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChzZWxmLmNhbmRpZGF0ZS5pZCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICBkZWxldGUgc2VsZi5jYW5kaWRhdGUuaGFzRXJyb3I7XG4gICAgICAgICAgICBzZWxmLmNhbmRpZGF0ZS4kc2F2ZSgpLnRoZW4oXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkgeyBncm93bC5zdWNjZXNzKCdDYW5kaWRhdGUgJyArIHNlbGYuY2FuZGlkYXRlLm5hbWUgKyAnIHNhdmVkICEnKTsgfSxcbiAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZ3Jvd2wuZXJyb3IoJ0FuIGVycm9yIG9jY3VyZWQuJyk7XG4gICAgICAgICAgICAgICAgc2VsZi5jYW5kaWRhdGUuaGFzRXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICAvLyB1cGRhdGUgdGhlIGNhbmRpZGF0ZVxuICAgICAgICAgIHRoaXMudXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGlmKCAhc2VsZi5jYW5kaWRhdGUuaWQgKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIHNlbGYuY2FuZGlkYXRlLiR1cGRhdGUoKS50aGVuKFxuICAgICAgICAgICAgICBmdW5jdGlvbigpIHsgZ3Jvd2wuc3VjY2VzcygnQ2FuZGlkYXRlICcgKyBzZWxmLmNhbmRpZGF0ZS5uYW1lICsgJyB1cGRhdGVkICEnKTsgfSxcbiAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7IGdyb3dsLmVycm9yKCdBbiBlcnJvciBvY2N1cmVkLicpOyB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgfSxcbiAgICAgICAgY29udHJvbGxlckFzIDogJ2NhbmRpZGF0ZUNvbnRyb2xsZXInXG4gICAgICB9O1xuICAgIH1cbn0oKTtcbiIsIitmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXJcbiAgICAubW9kdWxlKCdhcHAuY2FuZGlkYXRlJylcbiAgICAuZGlyZWN0aXZlKCdjYW5kaWRhdGVGb3JtJywgW1xuICAgICAgJ0NhbmRpZGF0ZVJlc291cmNlJyxcbiAgICAgICdncm93bCcsXG4gICAgICBDYW5kaWRhdGVcbiAgICBdKTtcblxuICAgIGZ1bmN0aW9uIENhbmRpZGF0ZShDYW5kaWRhdGVSZXNvdXJjZSwgZ3Jvd2wpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0IDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybCA6ICcuL3NyYy9jYW5kaWRhdGUvY2FuZGlkYXRlLWZvcm0vY2FuZGlkYXRlLWZvcm0uaHRtbCcsXG4gICAgICAgIHNjb3BlIDoge1xuICAgICAgICAgIG9uQWRkIDogJyYnXG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRUb0NvbnRyb2xsZXIgOiB0cnVlLFxuICAgICAgICBjb250cm9sbGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgdGhpcy5jYW5kaWRhdGUgPSB7XG4gICAgICAgICAgICBuYW1lIDogQ2FuZGlkYXRlUmVzb3VyY2UubW9kZWwubmFtZS5kZWZhdWx0VmFsdWUsXG4gICAgICAgICAgICBlbmFibGVkIDogQ2FuZGlkYXRlUmVzb3VyY2UubW9kZWwuZW5hYmxlZC5kZWZhdWx0VmFsdWVcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgdGhpcy5uYW1lVmFsaWRhdGlvbiA9IENhbmRpZGF0ZVJlc291cmNlLm1vZGVsLm5hbWU7XG5cbiAgICAgICAgICB0aGlzLmFkZENhbmRpZGF0ZSA9IGZ1bmN0aW9uKGZvcm0pIHtcbiAgICAgICAgICAgIGlmKGZvcm0uJGludmFsaWQpIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgdmFyIGNhbmRpZGF0ZSA9IG5ldyBDYW5kaWRhdGVSZXNvdXJjZShzZWxmLmNhbmRpZGF0ZSk7XG5cbiAgICAgICAgICAgIGNhbmRpZGF0ZS4kc2F2ZSgpLnRoZW4oXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkgeyBncm93bC5zdWNjZXNzKCdDYW5kaWRhdGUgJyArIGNhbmRpZGF0ZS5uYW1lICsgJyBhZGRlZCAhJyk7IH0sXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGdyb3dsLmVycm9yKCdBbiBlcnJvciBvY2N1cmVkLicpO1xuICAgICAgICAgICAgICAgIGNhbmRpZGF0ZS5oYXNFcnJvciA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHNlbGYub25BZGQoeyBjYW5kaWRhdGUgOiBjYW5kaWRhdGUgfSk7XG5cbiAgICAgICAgICAgIGZvcm0uJHNldFByaXN0aW5lKCk7XG4gICAgICAgICAgICB0aGlzLmNhbmRpZGF0ZS5uYW1lID0gbnVsbDtcbiAgICAgICAgICB9O1xuXG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRyb2xsZXJBcyA6ICdjYW5kaWRhdGVGb3JtQ29udHJvbGxlcidcbiAgICAgIH07XG4gICAgfVxuXG59KCk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=