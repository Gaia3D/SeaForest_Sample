var ProfileChart = (function() {
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
                        result += 'distance(m) : ' + params.name;
                        result += ' height(m) : ' + params.value;
                        return result;
                    }
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: true,
                    data: xAxisValues
                },
                yAxis: {
                    type: 'value'
                },
                series: [{
                    data: yAxisValues,
                    type: 'line',
                    symbolSize : 16,
                    areaStyle: {
                        color : '#ffff00'
                    }
                }]
            }
        }
    }
})();