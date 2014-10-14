var map;
AmCharts.ready(function() {
    map                  = new AmCharts.AmMap();
    map.pathToImages     = "http://www.amcharts.com/lib/3/images/";
    map.panEventsEnabled = true;
    map.backgroundColor  = "#535364";
    map.backgroundAlpha  = 1;

    map.zoomControl.panControlEnabled  = true;
    map.zoomControl.zoomControlEnabled = true;

    var dataProvider     = {
        mapVar          : AmCharts.maps.worldHigh,
        getAreasFromMap : true,
        areas           : [
{ id: 'AL', showAsSelected: true },
{ id: 'AT', showAsSelected: true },
{ id: 'BE', showAsSelected: true },
{ id: 'BA', showAsSelected: true },
{ id: 'HR', showAsSelected: true },
{ id: 'CZ', showAsSelected: true },
{ id: 'FR', showAsSelected: true },
{ id: 'DE', showAsSelected: true },
{ id: 'GR', showAsSelected: true },
{ id: 'HU', showAsSelected: true },
{ id: 'IT', showAsSelected: true },
{ id: 'MC', showAsSelected: true },
{ id: 'ME', showAsSelected: true },
{ id: 'NL', showAsSelected: true },
{ id: 'RS', showAsSelected: true },
{ id: 'ES', showAsSelected: true },
{ id: 'CH', showAsSelected: true },
{ id: 'GB', showAsSelected: true },
{ id: 'VA', showAsSelected: true },
{ id: 'CA', showAsSelected: true },
{ id: 'CU', showAsSelected: true },
{ id: 'DO', showAsSelected: true },
{ id: 'HT', showAsSelected: true },
{ id: 'PR', showAsSelected: true },
{ id: 'US', showAsSelected: true },
{ id: 'HK', showAsSelected: true }
        ]
    };

    map.dataProvider     = dataProvider;

    map.areasSettings    = {
        autoZoom             : true,
        color                : "#CDCDCD",
        colorSolid           : "#5EB7DE",
        selectedColor        : "#5EB7DE",
        outlineColor         : "#666666",
        rollOverColor        : "#88CAE7",
        rollOverOutlineColor : "#FFFFFF"
    };

    map.write("mapdiv");
});