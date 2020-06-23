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
    "terrainType":"elevation", //terrain type, default plain. 
    "terrainValue":"http://localhost:9090/f4d/terrain/" //terrain file path. When use elevation type, require this param. 
    //"terrainValue":"http://test.muhanit.kr:41515/MagoTerrain/"
}

var olmap;
var olMagoWorld;

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
              source: new ol.source.XYZ({
                  url : 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              })
            })
          ],
          target: 'olmap'
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

            var url = 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

            //var url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
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
    var wmsLayerNames = [{
        layerName : 'SeaForest:15m_susim',
        alias : 'dem'
    },{
        layerName : 'SeaForest:BML_CMC_AS',
        alias : '암반/비암반'
    },
    {
        layerName : 'SeaForest:BML_SSB_AS',
        alias : '천연해조장'
    },
    {
        layerName : 'SeaForest:BML_SEDIMENT_PS',
        alias : '퇴적물'
    },
    {
        layerName : 'SeaForest:BML_DEP_LS',
        alias : '수심'
    },
    {
        layerName : 'SeaForest:BML_HAL_AS',
        alias : '염생식물'
    },
    {
        layerName : 'SeaForest:BML_SGF_AS',
        alias : '잘피장'
    },
    {
        layerName : 'SeaForest:VL_WTRTMP_PS',
        alias : '수온'
    },
    {
        layerName : 'SeaForest:VL_SALT_PS',
        alias : '염분'
    },
    {
        layerName : 'SeaForest:BML_CMR_PS',
        alias : '바다목장'
    },
    {
        layerName : 'SeaForest:BML_AFR_PS',
        alias : '단위인공어초'
    },
    {
        layerName : 'SeaForest:BML_OTI_AS',
        alias : '마을어장'
    },
    {
        layerName : 'SeaForest:BML_MRF_AS',
        alias : '바다숲'
    }];

    for(var i in wmsLayerNames){
        var wmsLayerName = wmsLayerNames[i];
        if(wmsLayerName.layerName.indexOf('15m_susim') > 0) {
            magoManager.addLayer(new Mago3D.WMSLayer({
                url: 'http://test.muhanit.kr:13032/geoserver_seaforest/gwc/service/wms',
                opacity : 1,
                filter: {
                    type : Mago3D.CODE.imageFilter.BATHYMETRY,
                    properties : {minAltitude : -200, maxAltitude : 1944, caustics : true}
                },
                    
                param: {layers: wmsLayerName.layerName, tiled: true}
            }));
        } else {
            magoManager.addLayer(new Mago3D.WMSLayer({
                url: 'http://test.muhanit.kr:13032/geoserver_seaforest/gwc/service/wms',
                opacity : 1,
                param: {layers: wmsLayerName.layerName, tiled: true}
            }));
        }

        olmap.addLayer(new ol.layer.Tile({
            source : new ol.source.TileWMS({
                url : 'http://test.muhanit.kr:13032/geoserver_seaforest/gwc/service/wms',
                params: {
                    'LAYERS': wmsLayerName.layerName,
                    'FORMAT': 'image/png',
                    'TILED' : true,
                    'VERSION' : '1.1.1',
                    'SRS' : 'EPSG:3857'
                },
                serverType: 'geoserver'
            })
        }))
    }


    olMagoWorld = new OlMagoWorld({olmap : olmap, magoManager: magoManager});
    
    addJqueryEvent();
}

function addJqueryEvent(){
    //초기화면으로 이동
    $('#homeMenu').click(function(){
        viewer.goto(policy.initLongitude, policy.initLatitude, policy.initAltitude, 2);
    });

    //분할보기 클릭
    $('#3d').click(function() {
        if(!$(this).hasClass('on')) {
            $(this).addClass('on');

            $('#olmap').css({width : '50%', right:'0px'});
            olmap.updateSize();
            $('#magoContainer').show();
            magoManager.updateSize();

            olMagoWorld.setEnabled(true);
        } else {
            $(this).removeClass('on');

            $('#olmap').css({width : '100%'});
            olmap.updateSize();
            $('#magoContainer').hide();
            magoManager.updateSize();

            olMagoWorld.setEnabled(false);
        }
    });
}