
var WPS_URL = 'http://localhost:8080/geoserver/wps';

function rasterProfile() {
	var dataType = 'DEM';
	var inputCoverage = 'ndtp:sejong_dem';
	var interval = 20;
	var userLine = "LINESTRING (126.605737 33.594474,126.607624 33.748754)";

	if (userLine == "" || !selectedLayer) {
		alert("사용자 입력 선분을 선택헤주세요.");
		return;
	}
	startLoading();

	var xml = requestBodyRasterProfile(selectedLayer, interval, userLine);
	var resource = requestPostResource(xml);
	resource.then(function (res) {
		var promise = Cesium.GeoJsonDataSource.load(JSON.parse(res));
		promise.then(function (ds) {
			ds.id = 'analysisRasterProfile';
			ds.name = 'analysisRasterProfile';
			ds.type = 'analysis';
			viewer.dataSources.add(ds);

			var entities = ds.entities.values;
			var temp = [];
			for (var i = 0; i < entities.length; i++) {
				var entity = entities[i];
				temp.push(Cesium.Cartesian3.fromArray([
					entity.position._value.x,
					entity.position._value.y,
					entity.position._value.z
				]));
			}

			ds.entities.add({
				corridor: {
					positions: temp,
					width: 10,
					material: Cesium.Color.fromCssColorString(hex2rgb('#2c82ff')),
					// material: Cesium.Color.RED,
					clampToGround: true
				}
			});

			colors = createGraduatedColorStyle(ds.entities.values, "value");
			createProfileGraph(ds.entities.values, colors);

			$('.analysisGroup .profileInfo').show();
			$('#magoContainer .analysisGraphic').show();

			// viewer.flyTo(layerRasterProfile.entities);
		}).otherwise(function (error) {
			console.info(error);
		});
	}).otherwise(function (error) {
		window.alert('Invalid selection');
	}).always(function(){
		stopLoading();
	});;
}

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
	header += '<?xml version="1.0" encoding="UTF-8"?>';
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
	xml += '<wps:LiteralData>Degree</wps:LiteralData>';
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