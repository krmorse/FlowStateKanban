(function() {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.apps.kanban.Settings', {
        singleton: true,
        requires: [
            'Rally.apps.kanban.ColumnSettingsField',
            'Rally.apps.common.RowSettingsField',
            'Rally.ui.combobox.FieldComboBox',
            'Rally.ui.CheckboxField',
            'Rally.ui.plugin.FieldValidationUi'
        ],

        getFields: function(config) {
            var items = [
                {
                    name: 'groupByField',
                    xtype: 'rallyfieldcombobox',
                    model: Ext.identityFn('UserStory'),
                    margin: '10px 0 0 0',
                    fieldLabel: 'Columns',
                    listeners: {
                        select: function(combo) {
                            this.fireEvent('fieldselected', combo.getRecord().get('fieldDefinition'));
                        },
                        ready: function(combo) {
                            var whitelistFields = ['FlowState'];
                            combo.store.filterBy(function(record) {
                                var attr = record.get('fieldDefinition').attributeDefinition;
                                return attr && !attr.ReadOnly && 
                                    ((attr.Constrained && attr.AttributeType !== 'OBJECT' && attr.AttributeType !== 'COLLECTION') ||
                                    _.contains(whitelistFields, attr.ElementName));
                            });
                            if (combo.getRecord()) {
                                this.fireEvent('fieldselected', combo.getRecord().get('fieldDefinition'));
                            }
                        }
                    },
                    bubbleEvents: ['fieldselected', 'fieldready']
                },
                {
                    name: 'columns',
                    readyEvent: 'ready',
                    fieldLabel: '',
                    margin: '5px 0 0 80px',
                    xtype: 'kanbancolumnsettingsfield',
                    shouldShowColumnLevelFieldPicker: config.shouldShowColumnLevelFieldPicker,
                    defaultCardFields: config.defaultCardFields,
                    handlesEvents: {
                      projectscopechanged: function (context) {
                            this.refreshWithNewContext(context);
                        },
                        fieldselected: function(field) {
                            this.refreshWithNewField(field);
                        }
                    },
                    listeners: {
                        ready: function() {
                            this.fireEvent('columnsettingsready');
                        }
                    },
                    bubbleEvents: 'columnsettingsready'
                }
            ];

            items.push({
                name: 'groupHorizontallyByField',
                xtype: 'rowsettingsfield',
                fieldLabel: 'Swimlanes',
                margin: '10 0 0 0',
                mapsToMultiplePreferenceKeys: ['showRows', 'rowsField'],
                readyEvent: 'ready',
                isAllowedFieldFn: function(field) {
                    var attr = field.attributeDefinition;
                    return ! field.isMultiValueCustom() &&
                    (   attr.Custom && (attr.Constrained || attr.AttributeType.toLowerCase() !== 'string') ||
                        attr.Constrained || _.contains(['boolean'], attr.AttributeType.toLowerCase())) &&
                        !_.contains(['web_link', 'text', 'date'], attr.AttributeType.toLowerCase());
                },
                explicitFields: [
                    {name: 'Sizing', value: 'PlanEstimate'}
               ]
            });

            items.push(
                {
                    name: 'hideReleasedCards',
                    xtype: 'rallycheckboxfield',
                    fieldLabel: 'Options',
                    margin: '10 0 0 0',
                    boxLabel: 'Hide cards in last visible column if assigned to a release'
                },
                {
                    type: 'cardage',
                    config: {
                        fieldLabel: '',
                        margin: '5 0 10 80'
                    }
                },
                {
                    type: 'query'
                });

            return items;
        }
    });
})();
