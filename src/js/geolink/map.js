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
    "initCameraEnable":true, // 초기 카메라 위치 이동 사용 유무
    "initLatitude":35.127464,
    "initLongitude":128.915708,
    "initDuration":1,
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

    olmap = new ol.Map({
        view: new ol.View({
            center: [policy.initLongitude, policy.initLatitude],
            zoom: 10,
            projection : 'EPSG:4326'
          }),
          layers: [
            new ol.layer.Tile({
              source: new ol.source.OSM()
            })
          ],
          target: 'olmap'
    });
}

function loadEndFunc(e) {
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

            var url = 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
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

    //wmslayer 생성 후 등록
    wmsLayer = new Mago3D.WMSLayer({
        //url: 'http://test.muhanit.kr:41515/geoserver/gwc/service/wms',
        url: 'http://localhost:8080/geoserver/mago3d/gwc/service/wms', 
        show: true, 
        filter:Mago3D.CODE.imageFilter.BATHYMETRY,  
        //param: {layers: 'SeaForest:5m_image', tiled: true}
        param: {layers: 'mago3d:15m_susim', tiled: true}
    });
    magoManager.addLayer(wmsLayer);

    addJqueryEvent()
}

function addJqueryEvent(){
    //단면분석,향분석,경사분석 클릭
    $('ul.nav span.analysis').click(function() {
        var id = $(this).attr('id');
        var drawer = (id === 'profile') ? pointDrawer : rectangleDrawer;

        if(!$(this).hasClass('on')) {
            $('span.analysis.on').removeClass('on');
            $(this).addClass('on');
            drawer.setActive(true);
        } else {
            $(this).removeClass('on');
            drawer.setActive(false);
        }
    });

    //단면 제거
    $('#deleteLine').click(function(){
        var modeler = magoManager.modeler;
        for(var i in drawedLines) {
            modeler.removeObject(drawedLines[i]);
        }
    });

    //초기화면으로 이동
    $('#homeMenu').click(function(){
        viewer.goto(policy.initLongitude, policy.initLatitude, policy.initAltitude, 2);
    });

    $('#toggleWms').click(function(){
        if(!$(this).hasClass('on')) {
            $(this).addClass('on');
            wmsLayer.show = false;
        } else {
            $(this).removeClass('on');
            wmsLayer.show = true;
        }
    });
}