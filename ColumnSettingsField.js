(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * Allows configuration of wip and schedule state mapping for kanban columns
     *
     *      @example
     *      Ext.create('Ext.Container', {
     *          items: [{
     *              xtype: 'kanbancolumnsettingsfield',
     *              value: {}
     *          }],
     *          renderTo: Ext.getBody().dom
     *      });
     *
     */
    Ext.define('Rally.apps.kanban.ColumnSettingsField', {
        extend: 'Ext.form.field.Base',
        alias: 'widget.kanbancolumnsettingsfield',
        plugins: ['rallyfieldvalidationui'],
        requires: [
            'Rally.ui.combobox.ComboBox',
            'Rally.ui.TextField',
            'Rally.ui.combobox.FieldValueComboBox',
            'Rally.ui.plugin.FieldValidationUi',
        ],

        fieldSubTpl: '<div id="{id}" class="settings-grid"></div>',

        width: 600,
        cls: 'column-settings',

        config: {
            /**
             * @cfg {Object}
             *
             * The column settings value for this field
             */
            value: undefined,

            defaultCardFields: ''
        },

        onDestroy: function() {
            if (this._grid) {
                this._grid.destroy();
                delete this._grid;
            }
            this.callParent(arguments);
        },

        onRender: function() {
            this.callParent(arguments);

            this._store = Ext.create('Ext.data.Store', {
                fields: ['column', 'shown', 'wip', 'scheduleStateMapping', 'cardFields'],
                data: []
            });

            this._grid = Ext.create('Rally.ui.grid.Grid', {
                autoWidth: true,
                renderTo: this.inputEl,
                columnCfgs: this._getColumnCfgs(),
                showPagingToolbar: false,
                showRowActionsColumn: false,
                enableRanking: false,
                store: this._store,
                editingConfig: {
                    publishMessages: false
                }
            });
        },

        _getColumnCfgs: function() {
            var columns = [
                {
                    text: 'Column',
                    dataIndex: 'column',
                    emptyCellText: 'None',
                    flex: 2
                },
                {
                    text: 'Show',
                    dataIndex: 'shown',
                    flex: 1,
                    renderer: function (value) {
                        return value === true ? 'Yes' : 'No';
                    },
                    editor: {
                        xtype: 'rallycombobox',
                        displayField: 'name',
                        valueField: 'value',
                        editable: false,
                        storeType: 'Ext.data.Store',
                        storeConfig: {
                            remoteFilter: false,
                            fields: ['name', 'value'],
                            data: [
                                {'name': 'Yes', 'value': true},
                                {'name': 'No', 'value': false}
                            ]
                        }
                    }
                },
                {
                    text: 'WIP',
                    dataIndex: 'wip',
                    flex: 1,
                    emptyCellText: '&#8734;',
                    editor: {
                        xtype: 'rallytextfield',
                        maskRe: /[0-9]/,
                        validator: function (value) {
                            return (value === '' || (value > 0 && value <= 9999)) || 'WIP must be > 0 and < 9999.';
                        },
                        rawToValue: function (value) {
                            return value === '' ? value : parseInt(value, 10);
                        }
                    }
                },
                {
                    text: 'Schedule State Mapping',
                    dataIndex: 'scheduleStateMapping',
                    emptyCellText: '--No Mapping--',
                    flex: 2,
                    editor: {
                        xtype: 'rallyfieldvaluecombobox',
                        model: Ext.identityFn('HierarchicalRequirement'),
                        field: 'ScheduleState',
                        listeners: {
                            ready: function (combo) {
                                var noMapping = {};
                                noMapping[combo.displayField] = '--No Mapping--';
                                noMapping[combo.valueField] = '';

                                combo.store.insert(0, [noMapping]);
                            }
                        }
                    }
                }
            ];

            return columns;
        },

        /**
         * When a form asks for the data this field represents,
         * give it the name of this field and the ref of the selected project (or an empty string).
         * Used when persisting the value of this field.
         * @return {Object}
         */
        getSubmitData: function() {
            var data = {};
            data[this.name] = Ext.JSON.encode(this._buildSettingValue());
            return data;
        },

        _buildSettingValue: function() {
            var columns = {};
            this._store.each(function(record) {
                if (record.get('shown')) {
                    columns[record.get('column')] = {
                        wip: record.get('wip'),
                        scheduleStateMapping: record.get('scheduleStateMapping')
                    };
                }
            }, this);
            return columns;
        },

        getErrors: function() {
            var errors = [];
            if (this._storeLoaded && !Ext.Object.getSize(this._buildSettingValue())) {
                errors.push('At least one column must be shown.');
            }
            return errors;
        },

        setValue: function(value) {
            this.callParent(arguments);
            this._value = value;
        },

        _getColumnValue: function(columnName) {
            var value = this._value;
            return value && Ext.JSON.decode(value)[columnName];
        },

        _getAllowedValues: function() {   
            if (this.field.name === 'FlowState') {
                return Ext.create('Rally.data.wsapi.Store', {
                    model: 'FlowState',
                    context: this.context.getDataContext(),
                    filters: [
                        { property: 'Project', value: this.context.getProjectRef() }
                    ],
                    sorters: [
                        { property: 'OrderIndex', direction: 'ASC' }
                    ]
                }).load().then({
                    success: function(flowStates) {
                        return _.map(flowStates, function(flowState) {
                            var wip = flowState.get('WIPLimit'); 
                            return {
                                column: flowState.get('Name'),
                                shown: true,
                                wip: wip === -1 ? '' : wip,
                                scheduleStateMapping: flowState.get('ScheduleStateMapping'),
                                cardFields: this.defaultCardFields
                            };
                        });
                    },
                    scope: this
                });
            } else {
                return this.field.getAllowedValueStore().load().then({
                    success: function(records) {
                        return Ext.Array.map(records, this._recordToGridRow, this);
                    },
                    scope: this
                });
            }
        },

        refreshWithNewContext: function(context) {
            this.context = context;
            this._refresh();
        },

        refreshWithNewField: function(field) {
            this.field = field;
            this._refresh();
        },

        _refresh: function() {
            delete this._storeLoaded;

            this._getAllowedValues().then({
                success: function(data) {
                  this._store.loadRawData(data);
                  this.fireEvent('ready');
                  this._storeLoaded = true;
                  this._grid.setDisabled(this.field.name === 'FlowState');
                },
                scope: this
            });
        },

        _recordToGridRow: function(allowedValue) {
            var columnName = allowedValue.get('StringValue');
            var pref = this._store.getCount() === 0 ? this._getColumnValue(columnName) : null;

            var column = {
                column: columnName,
                shown: false,
                wip: '',
                scheduleStateMapping: '',
                cardFields: this.defaultCardFields
            };

            if (pref) {
                Ext.apply(column, {
                    shown: true,
                    wip: pref.wip,
                    scheduleStateMapping: pref.scheduleStateMapping
                });

                if (pref.cardFields) {
                    Ext.apply(column, {
                        cardFields: pref.cardFields
                    });
                }
            }

            return column;

        }
    });
})();