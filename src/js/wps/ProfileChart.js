var ProfileChart = (function() {
    var nameTextStyle = {
        color:'#ffffff',
        rich : {
            main : {
                fontWeight : 'bolder',
                fontSize : 16
            }
        }
    };
    var axisLabel = {
        color:'#ffffff'
    };
    var myChart = echarts.init(document.getElementById("chartArea"));

    myChart.on('mouseover',function(e){
        var point = _getTargetPoint(e.dataIndex);
        point.setStyle({
            size        : 22,
            strokeSize : 1,
            strokeColor : '#FFFFFF',
            color       : '#00FFFF',
            opacity     : 0.7
        }, magoManager);
    });
    myChart.on('mouseout',function(e){
        var point = _getTargetPoint(e.dataIndex);
        point.setStyle({
            size        : 12,
            strokeSize : 1,
            strokeColor : '#FFFFFF',
            color       : '#FF0000',
            opacity     : 0.7
        }, magoManager);
    });

    function _getTargetPoint(index) {
        var magoLine = drawedLines[drawedLines.length - 1];
        return magoLine.getPointByIndex(index);
    }
    return {
        getChart : function() {
            return myChart;
        },
        active : function(option) {
            myChart.setOption(option, true);
            $('#chartArea').show();
            myChart.resize();
        },
        deactive : function() {
            myChart.clear();
            $('#chartArea').hide();
        },
        getBasicAreaOption : function(xAxisValues, yAxisValues) {
            return {
                tooltip: {
                    trigger: 'item',
                    formatter : function(params) {
                        var result = '';
                        result += 'distance : ' + parseFloat(params.name).toFixed(3);
                        result += ' height : ' + parseFloat(params.value).toFixed(3);
                        return result;
                    }
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: true,
                    data: xAxisValues.map(val => parseFloat(val).toFixed(3)),
                    nameLocation : 'middle',
                    axisLabel : axisLabel,
                    name : '{main|DISTANCE} ( geometry length / interval )',
                    nameTextStyle : Object.assign(nameTextStyle, {padding : [10, 0, 0, 0]})
                },
                yAxis: {
                    type: 'value',
                    axisLabel : axisLabel,
                    name : '{main|HEIGHT} ( m )',
                    nameTextStyle : nameTextStyle
                },
                series: {
                    data: yAxisValues,
                    type: 'line',
                    symbolSize : 8,
                    areaStyle: {
                        color : '#ffff00'
                    },
                    smooth : true
                }
            }
        }
    }
})();