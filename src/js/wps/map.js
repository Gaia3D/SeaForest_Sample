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
 * @type {Mago3D.RectangleDrawer} 직사각형 그리기 툴, 향분석, 경사분석 수행 시 분석할 영역을 생성할때 사용
 */
var rectangleDrawer;

/**
 * @type {Mago3D.LineDrawer} line 그리기 툴, 마지막점은 우클릭으로.
 */
var lineDrawer;

/**
 * @type {Mago3D.WMSLayer} wms layer
 */
var wmsLayer;

/**
 * @type {Array<Mago3D.MagoPolyLine>} 폴리라인 객체 배열, 단면분석 결과들을 담음.
 */
var drawedLines = [];

var drawedRectangle;

/**
 * @type {object}} mago3d 정책, Mago3D 객체 생성 시 사용.
 */
var policy = {
    "basicGlobe": "magoworld", //globe type, fix magoworld
    "initCameraEnable":true, // 초기 카메라 위치 이동 사용 유무
    "initLatitude":35.127464,
    "initLongitude":128.915708,
    "initDuration":0,
    "initAltitude":60000,
    "terrainType":"elevation", //terrain type, default plane. 
    "terrainValue":"http://localhost:9090/f4d/terrain/" //terrain file path. When use elevation type, require this param. 
    //"terrainValue":"http://test.muhanit.kr:41515/MagoTerrain/"
}

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
    mago3d = new Mago3D.Mago3d(renderDivId, policy, {loadend : loadEndFunc}, {terrainSelectable : false});
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
     * @param {xyzOption} xyzOption
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
        url: 'http://test.muhanit.kr:13032/geoserver_seaforest/gwc/service/wms',
        //url: 'http://localhost:8080/geoserver/mago3d/gwc/service/wms', 
        //show: false,
        opacity : 0.3,
        //filter:Mago3D.CODE.imageFilter.BATHYMETRY,  
        param: {layers: 'SeaForest:5m_image', tiled: true}
        //param: {layers: 'mago3d:15m_susim', tiled: true}
    });
    magoManager.addLayer(wmsLayer);
    
    lineDrawer = Mago3D.DrawGeometryInteraction.createDrawGeometryInteraction('line');
    lineDrawer.setStyle({
        thickness:2,
        color:'#ff88ff'
    });
    magoManager.interactions.add(lineDrawer);
    lineDrawer.on(Mago3D.LineDrawer.EVENT_TYPE.DRAWEND, function(e) {
        var positons = e.knotGeoCoordsArray;
        var wkt = Mago3D.ManagerUtils.geographicToWkt(positons, 'LINE');
        startLoading();
        requestJsonResource(getXmlRasterProfile(20, wkt)).then(function(response){
            var features = response.features;
            var array = [];

            //x축은 첫번째 점으로부터의 거리
            var xAxisValues = [];
            //y축은 높이
            var yAxisValues = [];
            for(var i=0,len=features.length; i<len; i++) {
                var feature = features[i];
                var prop = feature.properties;
                var coordinates = feature.geometry.coordinates;
                array.push({
                    longitude : coordinates[0],
                    latitude  : coordinates[1],
                    altitude  : coordinates[2]
                });
                xAxisValues.push(prop.distance);
                yAxisValues.push(prop.value);
            }

            var position = {
                coordinates : array
            }
            var style = {
                color     : '#ff0000',
                thickness : 2.0,
                point     : {
                    size        : 12,
                    strokeSize : 1,
                    strokeColor : '#FFFFFF',
                    color       : '#FF0000',
                    opacity     : 0.7
                }
            };

            var option = ProfileChart.getBasicAreaOption(xAxisValues,yAxisValues);
            if (option && typeof option === "object") {
                ProfileChart.active(option);
            }

            var magoPolyline = new Mago3D.MagoPolyline(position, style);
            magoManager.modeler.addObject(magoPolyline, 1);    
            drawedLines.push(magoPolyline);
            lineDrawer.setActive(false);
            $('#profile').removeClass('on');
            stopLoading();
        });
    });

    rectangleDrawer = Mago3D.DrawGeometryInteraction.createDrawGeometryInteraction('rectangle');
    rectangleDrawer.setStyle({
        fillColor : '#34e8eb',
        strokeColor : '#349feb',
        strokeWidth : 3,
        opacity : 0.5
    });

    rectangleDrawer.on(Mago3D.RectangleDrawer.EVENT_TYPE.ACTIVE, function(d) {
        closeAnalysis();
    });
    rectangleDrawer.on(Mago3D.RectangleDrawer.EVENT_TYPE.DRAWEND, function(e){
        var rectangle = e;

        if(rectangle.getArea() / 1000000000 > 1)
        {
            alert('Too much area.');
            rectangleDrawer.cancle();
            return;
        }        
        
        var promises = getRasterAnalysisPromises(rectangle, 'all');
        
        analysisResultProcess(promises, function(r1,r2){
            drawedRectangle = rectangle.clone();
            magoManager.modeler.addObject(drawedRectangle, 1);
            rectangleDrawer.setActive(false);
            $('span.analysis.on').removeClass('on');
    
            responseToImage(r1, function(e, reader){
                var base64data = reader.result;   
                $('#aspectImg').attr('src',base64data).trigger('click');
            });
            responseToImage(r2, function(e, reader){
                var base64data = reader.result;   
                $('#slopeImg').attr('src',base64data);
            });
    
            $('#analysisArea').show();
            $('#aspectImg').trigger('click');
        });
    });

    magoManager.interactions.add(rectangleDrawer);

    addJqueryEvent();
}

function analysisResultProcess (promises, callback)
{
    startLoading();
        
    $.when.apply( $, promises).done(callback)
    .fail(function(e){
        magoManager.modeler.removeObject(drawedRectangle);
        alert('parse error');
    }).always(function(e){
        stopLoading();
    });
}

function getRasterAnalysisRqXml (rectangle, mode)
{
    var xmls = [];
    if(mode === 'aspect') {
        xmls.push(getAspectXml(rectangle));
    } else if(mode === 'slope') {
        xmls.push(getSlopeXml(rectangle));
    } else {
        xmls.push(getAspectXml(rectangle));
        xmls.push(getSlopeXml(rectangle));
    }

    return xmls;

    function getSlopeXml(rectangle)
    {
        var zFactor = getZfactor(rectangle);
        var slopeAnalXml = getXmlRasterSlope(rectangle.minGeographicCoord, rectangle.maxGeographicCoord, zFactor);
        var slopeStyleXml = getSlopeStyle();
        return getImage(rectangle.minGeographicCoord, rectangle.maxGeographicCoord, slopeAnalXml, slopeStyleXml);
    }

    function getAspectXml(rectangle)
    {
        var aspecAnaltXml = getXmlRasterAspect(rectangle.minGeographicCoord, rectangle.maxGeographicCoord);
        var aspectStyleXml = getAspectStyle();
        return getImage(rectangle.minGeographicCoord, rectangle.maxGeographicCoord, aspecAnaltXml, aspectStyleXml);
    }
}

function getRasterAnalysisPromises(rectangle, mode)
{
    return getRasterAnalysisRqXml(rectangle, mode).map(xml => requestBlobResource(xml));
}

function closeAnalysis() {
    if(drawedRectangle) {
        magoManager.modeler.removeObject(drawedRectangle);
        $('#analysisArea').hide();
    }
}

function responseToImage(response, callback) {
    var blob;
    if(Array.isArray(response)) {
        for(var i in response) {
            var item = response[i];
            if(item instanceof Blob) {
                blob = item;
                break;
            }
        }
    }else {
        blob = response instanceof Blob ? response : undefined;
    }

    if(!blob) throw new Error('Invalid response');

    var reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function(e) {
        callback.call(this, e, reader);
    }
}

function setImageOnMap(imgSrc) {
    if(!drawedRectangle) return;

    drawedRectangle.minGeographicCoord.altitude = 2000;
    drawedRectangle.setStyle({
        imageUrl : imgSrc,
        strokeColor : '#349feb',
        strokeWidth : 3,
        opacity : 1
    }, magoManager);
}

function addJqueryEvent(){
    //단면분석,향분석,경사분석 클릭
    $('ul.nav span.analysis').click(function() {
        var id = $(this).attr('id');
        var drawer = (id === 'profile') ? lineDrawer : rectangleDrawer;

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
        ProfileChart.deactive();
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

    $('.analysisImg').click(function() {
        var src = $(this).attr('src');
        setImageOnMap(src);
    });

    $('#closeAnalysis').click(function(){
        closeAnalysis();
    });

    $('.showOrgImg').click(function(){
        var $img = $(this).parent().siblings('.analysisImg');
        var imgElem = $img.get(0);

        $('#orgImg').show().find('img').attr('src',$img.attr('src')).css({
            right : 'calc(50% - ' + imgElem.naturalWidth/2 + 'px)',
            top : 'calc(50% - ' + imgElem.naturalHeight/2 + 'px)',
        });
    });

    $('#orgImg').click(function(){
        $(this).hide();
    });

    $('.onMapImgRefresh').click(function() {
        if(!drawedRectangle) return;

        var $img = $(this).parent().siblings('.analysisImg');
        analysisResultProcess(getRasterAnalysisPromises(drawedRectangle, $(this).data('type')), function(response){
            responseToImage(response, function(e, reader){
                var base64data = reader.result;   
                setImageOnMap(base64data);
                $img.attr('src', base64data);
            });
        });
    });
}