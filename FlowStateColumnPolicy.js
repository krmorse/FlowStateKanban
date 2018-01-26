(function () {
  var Ext = window.Ext4 || window.Ext;

  /**
   * @private
   */
  Ext.define('Rally.apps.kanban.FlowStateColumnPolicy', {
      extend: 'Ext.AbstractPlugin',
      alias: 'plugin.flowstatecolumnpolicy',
      requires: ['Rally.ui.cardboard.PolicyContainer'],

      /**
       * @cfg {Object}
       * A component config for rendering policies
       */
      policyCmpConfig: null,

      init: function(cmp) {
          this.callParent(arguments);
          this.cmp = cmp;

          this.cmp.addEvents([
              /**
               * @event showpolicy
               * fire to show policy
               */
              'showpolicy',
              /**
               * @event hidepolicy
               * fire to hide policy
               */
              'hidepolicy'
          ]);

          this.cmp.on('afterrender', this._onAfterRender, this, {single: true});
      },

      _onAfterRender: function() {
          this._addPolicyComponent();

          this.cmp.on('showpolicy', function() {this._togglePolicy(true);}, this);
          this.cmp.on('hidepolicy', function() {this._togglePolicy(false);}, this);
      },

      _addPolicyComponent: function () {
          var policyCmpConfig = Ext.merge({
              xtype: 'rallypolicycontainer',
              itemId: 'policy',
              context: this.cmp.getContext(),
              columnName: this.cmp.getColumnHeader().getHeaderValue(),
              hidden: true
          }, this.policyCmpConfig);

          this.cmp.getColumnHeader().add(policyCmpConfig);
      },

      _togglePolicy: function (showPolicy) {
          var policyContainer = this.cmp.getColumnHeader().down('#policy');
          if (policyContainer) {
              if (showPolicy) {
                  policyContainer.show();
              } else {
                  policyContainer.hide();
              }
          }
      }
  });
})();