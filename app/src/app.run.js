(function(){
    'use strict';

    angular
        .module('app')
        .run([
            '$httpBackend','$http',
            AppRun
        ]);

    function AppRun($httpBackend, $http) {
/* STEP */
      var steps = [];
      $http.get('./src/step/data/steps.json')
      .then(function(response){
          steps = response.data;
      });

      // returns the current list of steps
      $httpBackend.whenGET('/step').respond(function(method, url, data) {
        return [200, steps, {}];
      });

/* CANDIDATE */

      var candidates = [];
      $http.get('./src/candidate/data/candidates.json')
      .then(function(response){
          candidates = response.data;
      });

      // returns the current list of candidates
      $httpBackend.whenGET('/candidate').respond(function(method, url, data) {
        return [200, candidates, {}];
      });

      //update the availabilty of a candidate
      $httpBackend.whenPUT(/^\/candidate\/\d+$/).respond(function(method, url, data) {
        var enabled = angular.fromJson(data).enabled;
        var id = url.substring(url.lastIndexOf('/')+1);

        var results = candidates.filter(function(candidate) {
          if(candidate.id == id) {
            return true;
          }
        });

        results[0].enabled = enabled;

        return [200, {}, {}];
      });

      //add a new candidate
      $httpBackend.whenPOST('/candidate').respond(function(method, url, data) {

        var success = Math.random() > .2;

        if (!success) return [500, {}, {}];

        var candidate = angular.fromJson(data);
        candidate.id = candidates.length ? candidates[candidates.length - 1].id + 1 : 1;
        candidates.push(candidate);

        return [200, candidate, {}];
      });

      //delete a list of candidate
      $httpBackend.whenPOST('/candidate/delete').respond(function(method, url, data) {
        var ids = angular.fromJson(data);

        ids.forEach(function(id){
          candidates.splice(candidates.indexOf(candidates.filter(function(candidate){ return candidate.id === id})[0]),1);
        });

        return [200, {}, {}];
      });

      //
      $httpBackend.whenGET(/.*/).passThrough();
    }


})();
