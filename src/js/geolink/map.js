/**
 * @type {Mago3D.Mago3D} mago3d 생성 객체
 */
var mago3d;

/**
 * @type {Mago3D.MagoMaNager} mago3d 함수
 */
var magoManager;

/**
 * @type {Mago3D.MagoWorld} mago3d viewer 객체
 */
var viewer;

/**
 * @type {Mago3D.WMSLayer} wms layer
 */
var wmsLayer;

/**
 * @type {object}} mago3d 정책, Mago3D 객체 생성 시 사용.
 */
var policy = {
    "basicGlobe": "magoworld", //globe type, fix magoworld
    "initCameraEnable":false, // 초기 카메라 위치 이동 사용 유무
    "initLatitude":35.127464,
    "initLongitude":128.915708,
    "initDuration":0,
    "initAltitude":60000,
    "terrainType":"elevation", //terrain type, default plane. 
    "terrainValue":"http://localhost:9090/f4d/terrain/" //terrain file path. When use elevation type, require this param. 
    //"terrainValue":"http://test.muhanit.kr:41515/MagoTerrain/"
}

var olmap;

// mago3d start
function magoStart(renderDivId) {
    /**
     * callback parameter info 
     * @property {object} loadstart Optional. when mago3d load start trigger.
     * @property {object} loadend Optional. when mago3d load end trigger.
     */

     /**
     * option parameter info 
     * @property {array<Layer>} layers WMSLayer, XYZLayer를 배열에 넣어서 전달.
     */

    /**
     * mago3d entry point, 3d globe를 생성 후, magoManager, viewer 등을 return
     * 
     * @param {string} renderDivId 3d globe를 표출할 div id. required.
     * @param {object} policy mago3d policy, optional. 
     * @param {object} callback loadstart callback, loadend callback.
     * @param {object} option 생성자 생성 시 옵션, 
     */
    mago3d = new Mago3D.Mago3d(renderDivId, policy, {loadend : loadEndFunc});

    function calcResolutionForDistance(distance, latitude) {
        // See the reverse calculation (calcDistanceForResolution) for details
        const canvas = this.scene_.canvas;
        const fovy = this.cam_.frustum.fovy;
        const metersPerUnit = this.view_.getProjection().getMetersPerUnit();
    
        const visibleMeters = 2 * distance * Math.tan(fovy / 2);
        const relativeCircumference = Math.cos(Math.abs(latitude));
        const visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
        const resolution = visibleMapUnits / canvas.clientHeight;
    
        return resolution;
    }
}

function loadEndFunc(e) {
    olmap = new ol.Map({
        view: new ol.View({
            center: [14404752.54246594, 4321487.91290758],//ol.proj.transform([127, 36.5], 'EPSG:4326' ,'EPSG:3857'),
            zoom: 8,
            maxResolution: 2445.9849047851562,
            minResolution: 2.388657133579254 / 2
          }),
          layers: [
            new ol.layer.Tile({
              source: new ol.source.OSM()
            })
          ],
          target: 'olmap'
    });

    olmap.getView().on('change:resolution',function(e){
        syncByOlHeight();
    });
    olmap.getView().on('change:center',function(e){
        syncByOlCenter();
    });

    magoManager = e.getMagoManager();
    viewer = e.getViewer();

    /**
     * XYZLayer urlFunction 설명 및 예
     * @typedef {function} urlFunction
     * @param {object} coordinate 타일의 x , y, z 정보를 가지고 있는 object. {x:'1', y:'1', z:'1'}
     */

    /**
     * XYZLayer 옵션 정보.
     * @typedef {object} xyzOption
     * @property {string} url xyz url, if defined urlFunction, ignore this value.
     * @property {function} urlFunction url making funcion, using x,y,z argument.
     * @property {boolean} show show layer. default is true.
     * @property {number} minZoom mimimum zoom level, default is 0. Instance contructed, can't change this value.
     * @property {number} maxZoom maximum zoom level, default is 18. Instance contructed, can't change this value.
     */

    /**
     * @type {Mago3D.XYZLayer} xyz layer
     * @param {object} xyzOption
     */
    var baseLayer = new Mago3D.XYZLayer({
        
        urlFunction : function(coordinate) {
            /*var url = 'http://test.muhanit.kr:37080/seaForest/tile/oceanmap/street/baseMap.do?z={z}&x={x}&y={y}';
            return url.replace('{z}',convertZ(coordinate.z))
            .replace('{y}',coordinate.y)
            .replace('{x}',coordinate.x);*/
            //https://tile.openstreetmap.org/8/216/98.png

            //var url = 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

            var url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
            return url.replace('{z}',coordinate.z)
            .replace('{y}',coordinate.y)
            .replace('{x}',coordinate.x);
        }
    });
    function convertZ(z) {

        return 'L' + zeroPadder(z);
        function zeroPadder(str){
            return (str.length === 1) ? '0'+str : str;
        }
    }
    
    magoManager.addLayer(baseLayer);
    syncByOlHeight(true);
    addJqueryEvent();
}

function addJqueryEvent(){
    //초기화면으로 이동
    $('#homeMenu').click(function(){
        viewer.goto(policy.initLongitude, policy.initLatitude, policy.initAltitude, 2);
    });
}

function syncByOlCenter(){
    var center = ol.proj.toLonLat(olmap.getView().getCenter());

    var lon = center[0];
    var lat = center[1];

    var curHeight = Mago3D.ManagerUtils.pointToGeographicCoord(magoManager.sceneState.camera.position).altitude;
    viewer.goto(lon,lat,curHeight, 0);
}

function syncByOlHeight() {
    var center = ol.proj.toLonLat(olmap.getView().getCenter());
    var resolution = olmap.getView().getResolution();

    var lon = center[0];
    var lat = center[1];

    var offsetDistance = calcDistanceForResolution(resolution, lat);
    console.info(offsetDistance);
    viewer.goto(lon,lat,Math.abs(offsetDistance), 0);

    /*if(!first) {
        viewer.goto(lon,lat,curHeight, 0);
        viewer.moveBackward(offsetDistance);
    } else {
        viewer.goto(lon,lat,-offsetDistance, 0);
    }*/
    

    function calcDistanceForResolution(resolution, latitude) {
        var sceneState = magoManager.sceneState;
        var canvas = sceneState.canvas;
        var fovy = sceneState.camera.frustum.fovyRad;

        console.assert(!isNaN(fovy));
        var metersPerUnit = olmap.getView().getProjection().getMetersPerUnit();
    
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
