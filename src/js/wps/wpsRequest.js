
var WPS_URL = 'http://test.muhanit.kr:13032/geoserver_seaforest/wps';

/**
 * wps 요청 공통 헤더 생성 후 리턴
 * @return {param}
 */
function requestWPSPostHeader() {
	var header = '';
	header += '<wps:Execute version="1.0.0" service="WPS" '
	header += '	xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd" ';
	header += '	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
	header += '	xmlns:xlink="http://www.w3.org/1999/xlink" ';
	header += '	xmlns="http://www.opengis.net/wps/1.0.0" ';
	header += '	xmlns:wfs="http://www.opengis.net/wfs" ';
	header += '	xmlns:wps="http://www.opengis.net/wps/1.0.0" ';
	header += '	xmlns:ows="http://www.opengis.net/ows/1.1" ';
	header += '	xmlns:gml="http://www.opengis.net/gml" ';
	header += '	xmlns:ogc="http://www.opengis.net/ogc" ';
	header += '	xmlns:wcs="http://www.opengis.net/wcs/1.1.1">';

	return header;
}

/**
 * 단면분석 요청 xml 생성 후 리턴
 * @param {number} interval 라인의 시작점과 끝점사이의 점이 개수.
 * @param {string} userLine LineString 형태의 wkt
 */
function getXmlRasterProfile(interval, userLine) {
	var xml = '';
	xml += requestWPSPostHeader();
	//수행할 공간분석 선언 : 단면분석
	xml += '<ows:Identifier>statistics:RasterProfile</ows:Identifier>';
	xml += '<wps:DataInputs>';
	xml += '<wps:Input>';
	xml += '<ows:Identifier>inputCoverage</ows:Identifier>';
	xml += '<wps:Reference mimeType="image/tiff" xlink:href="http://geoserver/wcs" method="POST">';
	xml += '<wps:Body>';
	//공간분석에 사용할 raster를 wcs를 통해 가져옴
	xml += '<wcs:GetCoverage service="WCS" version="1.1.1">';
	//공간분석에 사용할 raster 레이어 
	xml += '<ows:Identifier>SeaForest:15m_susim</ows:Identifier>';
	xml += '<wcs:DomainSubset>';
	//공간분석에 사용할 영역, 단면분석은 레이어 전체 영역을 사용.
	xml += '<ows:BoundingBox crs="http://www.opengis.net/gml/srs/epsg.xml#4326">';
	xml += '<ows:LowerCorner>124.40430420105157 33.03644454682546</ows:LowerCorner>';
	xml += '<ows:UpperCorner>131.9168700063789 38.840953670927945</ows:UpperCorner>';
	xml += '</ows:BoundingBox>';
	xml += '</wcs:DomainSubset>';
	xml += '<wcs:Output format="image/tiff"/>';
	xml += '</wcs:GetCoverage>';
	xml += '</wps:Body>';
	xml += '</wps:Reference>';
	xml += '</wps:Input>';
	xml += '<wps:Input>';
	//단면분석에 쓰일 line 정보, wkt 형식
	xml += '<ows:Identifier>userLine</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:ComplexData mimeType="application/wkt"><![CDATA[' + userLine + ']]></wps:ComplexData>';
	xml += '</wps:Data>';
	xml += '</wps:Input>';
	xml += '<wps:Input>';
	//첫점과 끝점 사이의 간격, 점의 갯수
	xml += '<ows:Identifier>interval</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:LiteralData>' + interval + '</wps:LiteralData>';
	xml += '</wps:Data>';
	xml += '</wps:Input>';
	xml += '</wps:DataInputs>';
	xml += '<wps:ResponseForm>';
	xml += '<wps:RawDataOutput mimeType="application/vnd.geo+json">';
	xml += '<ows:Identifier>result</ows:Identifier>';
	xml += '</wps:RawDataOutput>';
	xml += '</wps:ResponseForm>';
	xml += '</wps:Execute>';
	return xml;
}

/**
 * RasterAspect 요청을 위한 xml 생성후 리턴
 * @param {object} minCoord 
 * @param {object} maxCoord 
 * @param {string}
 */
function getXmlRasterAspect(minCoord, maxCoord) {
	var xml = '';

	xml += requestWPSPostHeader();
	//수행할 공간분석 선언 : 향분석
	xml += '<ows:Identifier>statistics:RasterAspect</ows:Identifier>';
	xml += '<wps:DataInputs>';
	xml += '<wps:Input>';
	xml += '<ows:Identifier>inputCoverage</ows:Identifier>';
	xml += '<wps:Reference mimeType="image/tiff" xlink:href="http://geoserver/wcs" method="POST">';
	xml += '<wps:Body>';
	//공간분석에 사용할 raster를 wcs를 통해 가져옴
	xml += '<wcs:GetCoverage service="WCS" version="1.1.1">';
	//공간분석에 사용할 raster 레이어
	xml += '<ows:Identifier>SeaForest:15m_susim</ows:Identifier>';
	xml += '<wcs:DomainSubset>';
	//공간분석에 사용할 영역, 향분석은 설정한 영역만큼 요청.
	xml += '<ows:BoundingBox crs="http://www.opengis.net/gml/srs/epsg.xml#4326">';
	xml += '<ows:LowerCorner>' + minCoord.longitude + ' ' + minCoord.latitude + '</ows:LowerCorner>';
	xml += '<ows:UpperCorner>' + maxCoord.longitude + ' ' + maxCoord.latitude + '</ows:UpperCorner>';
	xml += '</ows:BoundingBox>';
	xml += '</wcs:DomainSubset>';
	xml += '<wcs:Output format="image/tiff"/>';
	xml += '</wcs:GetCoverage>';
	xml += '</wps:Body>';
	xml += '</wps:Reference>';
	xml += '</wps:Input>';
	xml += '</wps:DataInputs>';
	xml += '<wps:ResponseForm>';
	xml += '<wps:RawDataOutput mimeType="image/jpeg">';
	xml += '<ows:Identifier>result</ows:Identifier>';
	xml += '</wps:RawDataOutput>';
	xml += '</wps:ResponseForm>';
	xml += '</wps:Execute>';

	return xml;
}
/**
 * RasterSlope 요청을 위한 xml 생성후 리턴
 * @param {object} minCoord 
 * @param {object} maxCoord 
 * @param {object} zFactor 
 * @param {string}
 */
function getXmlRasterSlope(minCoord, maxCoord, zFactor) {
	var xml = '';

	xml += requestWPSPostHeader();
	//수행할 공간분석 선언 : 경사분석
	xml += '<ows:Identifier>statistics:RasterSlope</ows:Identifier>';
	xml += '<wps:DataInputs>';
	xml += '<wps:Input>';
	xml += '<ows:Identifier>inputCoverage</ows:Identifier>';
	xml += '<wps:Reference mimeType="image/tiff" xlink:href="http://geoserver/wcs" method="POST">';
	xml += '<wps:Body>';
	//공간분석에 사용할 raster를 wcs를 통해 가져옴
	xml += '<wcs:GetCoverage service="WCS" version="1.1.1">';
	//공간분석에 사용할 raster 레이어
	xml += '<ows:Identifier>SeaForest:15m_susim</ows:Identifier>';
	xml += '<wcs:DomainSubset>';
	//공간분석에 사용할 영역, 경사분석은 설정한 영역만큼 요청.
	xml += '<ows:BoundingBox crs="http://www.opengis.net/gml/srs/epsg.xml#4326">';
	xml += '<ows:LowerCorner>' + minCoord.longitude + ' ' + minCoord.latitude + '</ows:LowerCorner>';
	xml += '<ows:UpperCorner>' + maxCoord.longitude + ' ' + maxCoord.latitude + '</ows:UpperCorner>';
	xml += '</ows:BoundingBox>';
	xml += '</wcs:DomainSubset>';
	xml += '<wcs:Output format="image/tiff"/>';
	xml += '</wcs:GetCoverage>';
	xml += '</wps:Body>';
	xml += '</wps:Reference>';
	xml += '</wps:Input>';
	xml += '<wps:Input>';
	//경사분석 측정단위, 기본은 Degree, 
	xml += '<ows:Identifier>slopeType</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:LiteralData>Degree</wps:LiteralData>';
	xml += '</wps:Data>';
	xml += '</wps:Input>';
	xml += '<wps:Input>';
	//Z(고도) 단위의 측정 단위가 x, y(선형) 단위의 측정 단위와 같은 경우 Z 계수는 1이지만, 
	//서로 다른 경우 정확한 값 산출을 위해 이 값을 조정해야 합니다.
	//고도는 단위가 보통 m 단위이고 현재 사용하는 x, y는 degree이므로 zFactor를 계산해야함.
	//그래서 'getZfactor' 메소드를 구현해둠.
	xml += '<ows:Identifier>zFactor</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:LiteralData>' + zFactor + '</wps:LiteralData>';
	xml += '</wps:Data>';
	xml += '</wps:Input>';
	xml += '</wps:DataInputs>';
	xml += '<wps:ResponseForm>';
	xml += '<wps:RawDataOutput mimeType="image/jpeg">';
	xml += '<ows:Identifier>result</ows:Identifier>';
	xml += '</wps:RawDataOutput>';
	xml += '</wps:ResponseForm>';
	xml += '</wps:Execute>';

	return xml;
}	
/**
 * slope 분석 시 필요한 factor 계산 후 리턴
 * @param {MagoRectangle} rec 
 * @return {number}
 */
function getZfactor(rec) {
	var zFactorReference = {
		0      :    0.00000898,
		10     :     0.00000912,
		20     :     0.00000956,
		30     :     0.00001036,
		40     :     0.00001171,
		50     :     0.00001395,
		60     :     0.00001792,
		70     :     0.00002619,
		80     :     0.00005156
	}

	var min = rec.minGeographicCoord;
	var max = rec.maxGeographicCoord;

	var midLat = ( min.latitude + max.latitude) / 2;
	var minRef = (Math.floor(midLat/10) * 10);
	var maxRef = minRef + 10;

	var minVal = zFactorReference[minRef];
	var maxVal = zFactorReference[maxRef];
	// y = ax+b.
	var a = (maxVal - minVal) / (maxRef - minRef);
	var b = minVal - a * minRef;

	return a * midLat + b;
}
/**
 * 분석결과를 스타일을 적용하여 이미지로 만들어 주는 xml 리턴
 * @param {object} minCoord 
 * @param {object} maxCoord 
 * @param {string} analisys string형태의 xml. 분석요청에 대한 xml.
 * @param {string} style 분석 결과 표출을 위한 style xml
 * @return {string}
 */
function getImage(minCoord, maxCoord, analisys, style) {
	var minWC = Mago3D.ManagerUtils.geographicCoordToWorldPoint(minCoord.longitude, minCoord.latitude, minCoord.altitude);
	var maxWC = Mago3D.ManagerUtils.geographicCoordToWorldPoint(maxCoord.longitude, maxCoord.latitude, maxCoord.altitude);

	var minSC = Mago3D.ManagerUtils.calculateWorldPositionToScreenCoord(undefined, minWC.x, minWC.y, minWC.z, minSC, magoManager);
	var maxSC = Mago3D.ManagerUtils.calculateWorldPositionToScreenCoord(undefined, maxWC.x, maxWC.y, maxWC.z, maxSC, magoManager);

	var width = Math.floor(Math.abs(maxSC.x - minSC.x));
	var height = Math.floor(Math.abs(maxSC.y - minSC.y));

	var xml = '';
	xml += '<?xml version="1.0" encoding="UTF-8"?>';
	xml += requestWPSPostHeader();
	//수행할 프로세스 선언 : RasterToImage
	xml += '<ows:Identifier>statistics:RasterToImage</ows:Identifier>';
	xml += '<wps:DataInputs>';
	xml += '<wps:Input>';
	xml += '<ows:Identifier>coverage</ows:Identifier>';
	xml += '<wps:Reference mimeType="image/tiff" xlink:href="http://geoserver/wps" method="POST">';
	//RasterToImage는 향이나 경사 분석결과로 리턴되는 이미지를 사용, 
	//getXmlRasterSlope나 getXmlRasterAspect를 수행한 결과를 넣으면 됨.
	xml += '<wps:Body>';
	xml += analisys;
	xml += '</wps:Body>';
	xml += '</wps:Reference>';
	xml += '</wps:Input>';
	xml += '<wps:Input>';
	//영역, analisys를 구할 때 사용한 영역과 동일.
	xml += '<ows:Identifier>bbox</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:LiteralData>' + minCoord.longitude + ',' + minCoord.latitude + ',' + maxCoord.longitude + ',' + maxCoord.latitude + '</wps:LiteralData>';
	xml += '</wps:Data>';
	xml += '</wps:Input>';
	//래스터 스타일. 분석결과에 스타일링을 함
	xml += '<wps:Input>';
	xml += style;
	xml += '</wps:Input>';
	xml += '<wps:Input>';
	//이미지 사이즈. 본 펑션 상단에서 구한 픽셀사이즈를 사용.
	xml += '<ows:Identifier>width</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:LiteralData>' + width + '</wps:LiteralData>';
	xml += '</wps:Data>';
	xml += '</wps:Input>';
	xml += '<wps:Input>';
	xml += '<ows:Identifier>height</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:LiteralData>' + height + '</wps:LiteralData>';
	xml += '</wps:Data>';
	xml += '</wps:Input>';
	xml += '<wps:Input>';
	xml += '<ows:Identifier>transparent</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:LiteralData>True</wps:LiteralData>';
	xml += '</wps:Data>';
	xml += '</wps:Input>';
	xml += '</wps:DataInputs>';
	xml += '<wps:ResponseForm>';
	xml += '<wps:RawDataOutput mimeType="image/png">';
	xml += '<ows:Identifier>result</ows:Identifier>';
	xml += '</wps:RawDataOutput>';
	xml += '</wps:ResponseForm>';
	xml += '</wps:Execute>';

	return xml;
}
/**
 * aspect sld for wps
 * @return {string}
 */
function getAspectStyle() {
	var xml = '';
	xml += '<ows:Identifier>style</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:ComplexData mimeType="text/xml; subtype=sld/1.0.0"><![CDATA[<?xml version="1.0" encoding="UTF-8"?>';
	xml += '<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sldhttp://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd" version="1.0.0">';
	xml += '<NamedLayer>';
	xml += '<Name>aspect</Name>';
	xml += '<UserStyle>';
	xml += '<Title>A raster style</Title>';
	xml += '<FeatureTypeStyle>';
	xml += '<Rule>';
	xml += '<RasterSymbolizer>';
	xml += '<Opacity>1.0</Opacity>';
	xml += '<ColorMap>';
	xml += '<ColorMapEntry color="#000000" quantity="0" />';
	xml += '<ColorMapEntry color="#FBE60C" quantity="45" />';
	xml += '<ColorMapEntry color="#EF9500" quantity="90" />';
	xml += '<ColorMapEntry color="#FB4D2B" quantity="135" />';
	xml += '<ColorMapEntry color="#FA01AF" quantity="180" />';
	xml += '<ColorMapEntry color="#A400EB" quantity="225" />';
	xml += '<ColorMapEntry color="#053DF3" quantity="270" />';
	xml += '<ColorMapEntry color="#00FD69" quantity="315" />';
	xml += '</ColorMap>';
	xml += '</RasterSymbolizer>';
	xml += '</Rule>';
	xml += '</FeatureTypeStyle>';
	xml += '</UserStyle>';
	xml += '</NamedLayer>';
	xml += '</StyledLayerDescriptor>]]></wps:ComplexData>';
	xml += '</wps:Data>';

	return xml;
}
/**
 * slope sld for wps
 * @return {string}
 */
function getSlopeStyle() {
	var xml = '';
	xml += '<ows:Identifier>style</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:ComplexData mimeType="text/xml; subtype=sld/1.0.0"><![CDATA[<?xml version="1.0" encoding="UTF-8"?>';
	xml += '<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sldhttp://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd" version="1.0.0">';
	xml += '<NamedLayer>';
	xml += '<Name>slope</Name>';
	xml += '<UserStyle>';
	xml += '<Title>A raster style</Title>';
	xml += '<FeatureTypeStyle>';
	xml += '<Rule>';
	xml += '<RasterSymbolizer>';
	xml += '<Opacity>1.0</Opacity>';
	xml += '<ColorMap>';
	xml += '<ColorMapEntry color="#006837" quantity="0.3" />';
	xml += '<ColorMapEntry color="#1a9850" quantity="1.1" />';
	xml += '<ColorMapEntry color="#a6d96a" quantity="3.0" />';
	xml += '<ColorMapEntry color="#ffffbf" quantity="5.0" />';
	xml += '<ColorMapEntry color="#fee08b" quantity="8.5" />';
	xml += '<ColorMapEntry color="#fdae61" quantity="16.5" />';
	xml += '<ColorMapEntry color="#f46d43" quantity="24" />';
	xml += '<ColorMapEntry color="#d73027" quantity="35" />';
	xml += '<ColorMapEntry color="#a50026" quantity="45" />';
	xml += '<ColorMapEntry color="#000000" quantity="90" />';
	xml += '</ColorMap>';
	xml += '</RasterSymbolizer>';
	xml += '</Rule>';
	xml += '</FeatureTypeStyle>';
	xml += '</UserStyle>';
	xml += '</NamedLayer>';
	xml += '</StyledLayerDescriptor>]]></wps:ComplexData>';
	xml += '</wps:Data>';

	return xml;
}


function requestBlobResource(xml) {
	var resource = $.ajax({
		url : WPS_URL,
		contentType : 'text/xml',
		data : xml,
		xhr : function(){
			var xhr = new XMLHttpRequest();
			xhr.responseType= 'blob'
			return xhr;
		},
		method : 'POST',
		headers: {
			'Content-Type': 'text/xml;charset=utf-8'
		}
	});

	return resource;
}

function requestJsonResource(xml) {
	var resource = $.ajax({
		url : WPS_URL,
		contentType : 'text/xml',
		data : xml,
		method : 'POST',
		headers: {
			'Content-Type': 'text/xml;charset=utf-8'
		}
	});

	return resource;
}