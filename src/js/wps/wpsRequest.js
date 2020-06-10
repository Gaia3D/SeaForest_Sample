
var WPS_URL = 'http://localhost:8080/geoserver/wps';

function getXmlRasterProfile(interval, userLine) {
	var xml = '';
	xml += requestWPSPostHeader();
	xml += '<ows:Identifier>statistics:RasterProfile</ows:Identifier>';
	xml += '<wps:DataInputs>';
	xml += '<wps:Input>';
	xml += '<ows:Identifier>inputCoverage</ows:Identifier>';
	xml += '<wps:Reference mimeType="image/tiff" xlink:href="http://geoserver/wcs" method="POST">';
	xml += '<wps:Body>';
	xml += '<wcs:GetCoverage service="WCS" version="1.1.1">';
	xml += '<ows:Identifier>mago3d:15m_susim</ows:Identifier>';
	xml += '<wcs:DomainSubset>';
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
	xml += '<ows:Identifier>userLine</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:ComplexData mimeType="application/wkt"><![CDATA[' + userLine + ']]></wps:ComplexData>';
	xml += '</wps:Data>';
	xml += '</wps:Input>';
	xml += '<wps:Input>';
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

function requestWPSPostHeader() {
	var header = '';
//	header += '<?xml version="1.0" encoding="UTF-8"?>';
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

function getXmlRasterAspect(minCoord, maxCoord) {
	var xml = '';

	xml += requestWPSPostHeader();
	xml += '<ows:Identifier>statistics:RasterAspect</ows:Identifier>';
	xml += '<wps:DataInputs>';
	xml += '<wps:Input>';
	xml += '<ows:Identifier>inputCoverage</ows:Identifier>';
	xml += '<wps:Reference mimeType="image/tiff" xlink:href="http://geoserver/wcs" method="POST">';
	xml += '<wps:Body>';
	xml += '<wcs:GetCoverage service="WCS" version="1.1.1">';
	xml += '<ows:Identifier>mago3d:15m_susim</ows:Identifier>';
	xml += '<wcs:DomainSubset>';
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

function getXmlRasterSlope(minCoord, maxCoord, zFactor) {
	var xml = '';

	xml += requestWPSPostHeader();
	xml += '<ows:Identifier>statistics:RasterSlope</ows:Identifier>';
	xml += '<wps:DataInputs>';
	xml += '<wps:Input>';
	xml += '<ows:Identifier>inputCoverage</ows:Identifier>';
	xml += '<wps:Reference mimeType="image/tiff" xlink:href="http://geoserver/wcs" method="POST">';
	xml += '<wps:Body>';
	xml += '<wcs:GetCoverage service="WCS" version="1.1.1">';
	xml += '<ows:Identifier>mago3d:15m_susim</ows:Identifier>';
	xml += '<wcs:DomainSubset>';
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
	xml += '<ows:Identifier>slopeType</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:LiteralData>Percentrise</wps:LiteralData>';
	xml += '</wps:Data>';
	xml += '</wps:Input>';
	xml += '<wps:Input>';
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

function getImage(minCoord, maxCoord, analisys, style) {
	var minWC = Mago3D.ManagerUtils.geographicCoordToWorldPoint(minCoord.longitude, minCoord.latitude, minCoord.altitude);
	var maxWC = Mago3D.ManagerUtils.geographicCoordToWorldPoint(maxCoord.longitude, maxCoord.latitude, maxCoord.altitude);

	var minSC = Mago3D.ManagerUtils.calculateWorldPositionToScreenCoord(undefined, minWC.x, minWC.y, minWC.z, minSC, magoManager);
	var maxSC = Mago3D.ManagerUtils.calculateWorldPositionToScreenCoord(undefined, maxWC.x, maxWC.y, maxWC.z, maxSC, magoManager);

	
	var width = Math.floor(Math.abs(maxSC.x - minSC.x));
	var height = Math.floor(Math.abs(maxSC.y - minSC.y));

	var xml = '';
	xml += '<?xml version="1.0" encoding="UTF-8"?><wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">';
	xml += '<ows:Identifier>statistics:RasterToImage</ows:Identifier>';
	xml += '<wps:DataInputs>';
	xml += '<wps:Input>';
	xml += '<ows:Identifier>coverage</ows:Identifier>';
	xml += '<wps:Reference mimeType="image/tiff" xlink:href="http://geoserver/wps" method="POST">';
	xml += '<wps:Body>';
	xml += analisys;
	xml += '</wps:Body>';
	xml += '</wps:Reference>';
	xml += '</wps:Input>';
	xml += '<wps:Input>';
	xml += '<ows:Identifier>bbox</ows:Identifier>';
	xml += '<wps:Data>';
	xml += '<wps:LiteralData>' + minCoord.longitude + ',' + minCoord.latitude + ',' + maxCoord.longitude + ',' + maxCoord.latitude + '</wps:LiteralData>';
	xml += '</wps:Data>';
	xml += '</wps:Input>';
	xml += '<wps:Input>';
	xml += style;
	xml += '</wps:Input>';
	xml += '<wps:Input>';
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
	xml += '<ColorMapEntry color="#38A800" quantity="5" />';
	xml += '<ColorMapEntry color="#CFFF74" quantity="10" />';
	xml += '<ColorMapEntry color="#FFFF00" quantity="15" />';
	xml += '<ColorMapEntry color="#FEAA00" quantity="30" />';
	xml += '<ColorMapEntry color="#E60000" quantity="100" />';
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