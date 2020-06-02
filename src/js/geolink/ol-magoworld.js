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

    olView.on('change:resolution',function(){
        that.syncByOl();
    });
    olView.on('change:center',function(){
        that.syncByOl();
    });

    olView.on('change:rotation',function(){
        that.syncByOl();
    });

    that.magoManager.on(Mago3D.MagoManager.EVENT_TYPE.CAMERAMOVEEND, function(){
        that.syncByMago();
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
    if(!this.enabled) return;

    var magoManager = this.magoManager;
    var viewer = magoManager.magoWorld;
    var olView = this.olmap.getView();
    var center = ol.proj.toLonLat(olView.getCenter());
    var resolution = olView.getResolution();
    var rotation = olView.getRotation();

    rotation = rotation * 180 / Math.PI;

    var camera = magoManager.sceneState.camera;
    var orientation = camera.getOrientation();

    var pitch = orientation.pitchRad;
    var roll = orientation.rollRad;

    pitch = (isNaN(pitch) || !pitch) ? 0 : (pitch * 180 / Math.PI);
    roll = (isNaN(roll) || !roll) ? 0 : (roll * 180 / Math.PI);
    
    var lon = center[0];
    var lat = center[1];

    var offsetDistance = calcDistanceForResolution(resolution, lat * Math.PI / 180);
    //viewer.goto(lon,lat,Math.abs(offsetDistance), 0);

    viewer.goto(lon,lat,0, 0, true);
    
    if(!isNaN(offsetDistance))
    {
        viewer.moveBackward(offsetDistance, true);
    } else {
        viewer.moveBackward(60000, true);
    }

    viewer.changeCameraOrientation(rotation, pitch, 0, true);
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

OlMagoWorld.prototype.syncByMago = function() {
    if(!this.enabled) return;

    var magoManager = this.magoManager;
    var camera = magoManager.sceneState.camera;
    var olView = this.olmap.getView();

    var bestTarget = camera.getTargetOnTerrain(magoManager);
    var camPos = camera.position;
    var dist = bestTarget.distToPoint(camPos);
    
    var bestTargetCarto = Mago3D.ManagerUtils.pointToGeographicCoord(bestTarget);
    var resolution = calcResolutionForDistance(dist, bestTargetCarto.latitude * Math.PI / 180)
    var orientation = camera.getOrientation();

    var properties = {};
    properties['center'] = ol.proj.transform([bestTargetCarto.longitude,bestTargetCarto.latitude],'EPSG:4326','EPSG:3857');
    properties['resolution'] = resolution;
    properties['rotation'] = orientation.headingRad;
    olView.setProperties(properties, true);
    olView.changed();

    function calcResolutionForDistance(distance, latitude) {
        // See the reverse calculation (calcDistanceForResolution) for details
        var sceneState = magoManager.sceneState;
        var canvas = sceneState.canvas;
        var fovy = sceneState.camera.frustum.fovyRad;
        var metersPerUnit = olView.getProjection().getMetersPerUnit();
    
        var visibleMeters = 2 * distance * Math.tan(fovy / 2);
        var relativeCircumference = Math.cos(Math.abs(latitude));
        var visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
        var resolution = visibleMapUnits / canvas.clientHeight;
    
        return resolution;
    }
}