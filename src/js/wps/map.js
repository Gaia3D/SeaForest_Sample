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
        requestJsonResource(getXmlRasterProfile(20, wkt)).then(
        /**
         * @param {object} response geojson
         */
        function(response){
            /**
             * @typedef {object} rasterProfileResult
             * @property {object} geometry geojson geometry 형식
             * @property {string} id
             * @property {object} properties distance : 첫번째 점으로부터의 거리, value : 해당 위치의 높이.
             * @property {string} type
             */
            /**
             * @type {Array<rasterProfileResult>} 
             */
            var features = response.features;
            var array = [];

            //x축은 첫번째 점으로부터의 거리
            var xAxisValues = [];
            //y축은 높이
            var yAxisValues = [];

            //단면분석 결과 데이터 후처리
            for(var i=0,len=features.length; i<len; i++) {
                var feature = features[i];
                var prop = feature.properties;
                var coordinates = feature.geometry.coordinates;

                //지도상에 결과 표출을 위한 경위도 배열 생성
                array.push({
                    longitude : coordinates[0],
                    latitude  : coordinates[1],
                    altitude  : coordinates[2]
                });

                //그래프 x축 값 배열
                xAxisValues.push(prop.distance);
                //그래프 y축 값 배열
                yAxisValues.push(prop.value);
            }

            //echart profile 그래프 생성 옵션 
            var option = ProfileChart.getBasicAreaOption(xAxisValues,yAxisValues);
            if (option && typeof option === "object") {
                //echart profile 그래프 생성
                ProfileChart.active(option);
            }

            //MagoPolyline position argument
            var position = {
                coordinates : array
            }
            //MagoPolyline style argument
            var style = {
                //선색상
                color     : '#ff0000',
                //선굵기
                thickness : 2.0,
                //선을 이루는 버텍스의 스타일
                point     : {
                    //버텍스의 크기
                    size        : 12,
                    //버텍스의 외곽선
                    strokeSize : 1,
                    //버텍스의 외곽선 색상
                    strokeColor : '#FFFFFF',
                    //버텍스의 색상
                    color       : '#FF0000',
                    //버텍스의 투명도
                    opacity     : 0.7
                }
            };

            //MagoPolyline 생성
            var magoPolyline = new Mago3D.MagoPolyline(position, style);
            //MagoPolyline 등록
            magoManager.modeler.addObject(magoPolyline, 1);    

            //단면제거 비즈니스로직을 위한 처리.
            drawedLines.push(magoPolyline);

            //그리기 완료 후 그리기 기능 비활성화
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

    // rectangleDrawer가 활성화될 시 콜백
    rectangleDrawer.on(Mago3D.RectangleDrawer.EVENT_TYPE.ACTIVE, function(d) {
        //기존에 분석결과를 초기화
        closeAnalysis();
    });

    // rectangle이 그려졌을때 콜백
    rectangleDrawer.on(Mago3D.RectangleDrawer.EVENT_TYPE.DRAWEND, function(e){
        var rectangle = e;
        var a = rectangle.getArea();

        //사각형 면적이 클 시 취소.
        if(a / 1000000000 > 1)
        {
            alert('Too much area.');
            rectangleDrawer.cancle();
            return;
        }        
        
        //그려진 사각형을 이용하여 공간분석 요청 promise 객체 생성.
        var promises = getRasterAnalysisPromises(rectangle, 'all');
        
        //생성한 promise객체 응답처리. r1 : 향분석결과, r2 : 경사분석결과
        analysisResultProcess(promises, function(r1,r2){
            //drawer를 통해 그린 사각형의 클론을 생성하여 drawedRectangle에 할당
            drawedRectangle = rectangle.clone();
            //drawer의 동작을 멈춤. 동작이 멈춤과 동시에 그렸던 사각형 객체는 사라짐.
            rectangleDrawer.setActive(false);

            //분석결과 이미지 표출을 위해 스타일 설정. clampToTerrain를 true로 설정 시 터레인에 맞게 이미지가 표현.
            drawedRectangle.setStyle({
                clampToTerrain : true
            }, magoManager);

            magoManager.modeler.addObject(drawedRectangle, 1);

            $('span.analysis.on').removeClass('on');
    
            //promise 처리 결과로 받은 blob을 base64형태로 변환 후 분석결과화면과 지도상에 표출
            responseToImage(r1, function(e, reader){
                var base64data = reader.result;   
                $('#aspectImg').attr('src',base64data).trigger('click');
            });
            responseToImage(r2, function(e, reader){
                var base64data = reader.result;   
                $('#slopeImg').attr('src',base64data);
            });
    
            $('#analysisArea').show();
        });
    });

    magoManager.interactions.add(rectangleDrawer);

    addJqueryEvent();
}

//promise 처리.
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

//분석 유형에 따른 string형태의 xml생성.
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

//분석 유형에 맞는 xml을 생성 후 blob 요청 promise 객체 리턴
function getRasterAnalysisPromises(rectangle, mode)
{
    return getRasterAnalysisRqXml(rectangle, mode).map(xml => requestBlobResource(xml));
}

function closeAnalysis() {
    if(drawedRectangle) {
        magoManager.modeler.removeObject(drawedRectangle);
        drawedRectangle = undefined;
        $('#analysisArea').hide();
    }
}

//blob response를 base64 image url로 변환 후 콜백수행.
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

//image를 지도상에 표출
function setImageOnMap(imgSrc) {
    if(!drawedRectangle) return;

    drawedRectangle.setStyle({
        imageUrl : imgSrc
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

    //wms 토글
    $('#toggleWms').click(function(){
        if(!$(this).hasClass('on')) {
            $(this).addClass('on');
            wmsLayer.show = false;
        } else {
            $(this).removeClass('on');
            wmsLayer.show = true;
        }
    });

    //항경사분석 결과 창 이미지 클릭 시
    $('.analysisImg').click(function() {
        var src = $(this).attr('src');
        setImageOnMap(src);
    });

    //항경사분석 결과 창 닫기
    $('#closeAnalysis').click(function(){
        closeAnalysis();
    });

    //항경사분석 결과 원본 사이즈 이미지 조회
    $('.showOrgImg').click(function(){
        var $img = $(this).parent().siblings('.analysisImg');
        var imgElem = $img.get(0);

        $('#orgImg').show().find('img').attr('src',$img.attr('src')).css({
            right : 'calc(50% - ' + imgElem.naturalWidth/2 + 'px)',
            top : 'calc(50% - ' + imgElem.naturalHeight/2 + 'px)',
        });
    });

    //항경사분석 결과 원본 사이즈 이미지 조회 화면 닫기
    $('#orgImg').click(function(){
        $(this).hide();
    });

    //지도 상의 사각형 픽셀 크기와 동일한 이미지로 재요청 및 표출
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