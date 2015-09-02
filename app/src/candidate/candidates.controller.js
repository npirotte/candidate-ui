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
