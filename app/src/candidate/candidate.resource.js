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
