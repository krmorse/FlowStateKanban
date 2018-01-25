(function() {
    //Add support for flowstate type
    Ext.apply(Rally.data.ModelTypes.types, {
        flowstate: 'FlowState'
    });
    Rally.data.ModelFactory.registerType('flowstate', Rally.data.wsapi.ModelFactory);
})();
