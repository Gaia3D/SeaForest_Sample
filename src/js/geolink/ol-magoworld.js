/**
 * openlayers and MagoWorld view syncer 
 */
var OlMagoWorld = function(option){
    var that = this;
    that.enabled = false;

    if(!option || !option.olmap || !option.magoManager)
    {
        throw new Error('This class require olmap(Ol.Map) and magoManager(Mago3d.MagoManager).');
    }

    if(!(option.olmap instanceof ol.Map))
    {
        throw new Error('Invalid olmap type. Please use ol.Map.');
    }

    if(!(option.magoManager instanceof Mago3D.MagoManager))
    {
        throw new Error('Invalid mago3d type. Please use Mago3D.MagoManager.');
    }

    that.olmap = option.olmap;
    that.magoManager = option.magoManager;

    var olView = that.olmap.getView();

    olView.on('change:resolution',function(e){
        if(that.enabled) that.syncByOl();
    });
    olView.on('change:center',function(e){
        if(that.enabled) that.syncByOl();
    });

    that.magoManager.on(Mago3D.MagoManager.EVENT_TYPE.CAMERACHANGED, function(e){
        if(that.enabled) console.info(e);
    });
    that.magoManager.on(Mago3D.MagoManager.EVENT_TYPE.CAMERAMOVEEND, function(e){
        if(that.enabled) console.info(e);
    });
}

OlMagoWorld.prototype.getEnabled = function() {
    return this.enabled;
}

OlMagoWorld.prototype.setEnabled = function(enable) {
    if(this.enabled === enable)
    {
        return;
    }

    this.enabled = enable;
    if(this.enabled)
    {
        this.syncByOl();
    }
}


OlMagoWorld.prototype.syncByOl = function() {
    var magoManager = this.magoManager;
    var viewer = magoManager.magoWorld;
    var olView = this.olmap.getView();
    var center = ol.proj.toLonLat(olView.getCenter());
    var resolution = olView.getResolution();

    var lon = center[0];
    var lat = center[1];

    var offsetDistance = calcDistanceForResolution(resolution, lat * Math.PI / 180);
    //viewer.goto(lon,lat,Math.abs(offsetDistance), 0);

    viewer.goto(lon,lat,0, 0);
    viewer.moveBackward(offsetDistance);

    function calcDistanceForResolution(resolution, latitude) {
        var sceneState = magoManager.sceneState;
        var canvas = sceneState.canvas;
        var fovy = sceneState.camera.frustum.fovyRad;

        var metersPerUnit = olView.getProjection().getMetersPerUnit();
    
        // number of "map units" visible in 2D (vertically)
        var visibleMapUnits = resolution * canvas.clientHeight;
    
        // The metersPerUnit does not take latitude into account, but it should
        // be lower with increasing latitude -- we have to compensate.
        // In 3D it is not possible to maintain the resolution at more than one point,
        // so it only makes sense to use the latitude of the "target" point.
        var relativeCircumference = Math.cos(Math.abs(latitude));
    
        // how many meters should be visible in 3D
        var visibleMeters = visibleMapUnits * metersPerUnit * relativeCircumference;
    
        // distance required to view the calculated length in meters
        //
        //  fovy/2
        //    |\
        //  x | \
        //    |--\
        // visibleMeters/2
        var requiredDistance = (visibleMeters / 2) / Math.tan(fovy / 2);
    
        // NOTE: This calculation is not absolutely precise, because metersPerUnit
        // is a great simplification. It does not take ellipsoid/terrain into account.
    
        return requiredDistance;
    }
}