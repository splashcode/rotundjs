window.onload = function() {
   var chart1 = new Rotund({
        container : 'chart1', 
        tooltip : {
            defaultText : 'Who <br/> ate <br/> donuts?', 
            color : '#FFF'
        },
        series : [{
            name : 'people',
            data : [{
                name : 'John',
                value : 6
            },{
                name : 'Jim',
                value : 4
            }]
        }]
    });
    
    
    var chart2 = new Rotund({
        container : 'chart2', 
        tooltip : {
            defaultText : 'Who <br/> ate <br/> donuts?', 
            color : '#FFF'
        },
        series : [{
            name : 'John',
            data : [{
                name : 'John',
                value : 6
            }]
        },{
            name : 'Jim',
            data : [{
                name : 'Jim',
                value : 4
            }]
        }]
    });
    
    
    var chart3 = new Rotund({
        container : 'chart3', 
        tooltip : {
            defaultText : 'And <br/> what <br/> perfume?', 
            color : '#FFF',
            template : '<b>{{serie}}</b> ate <b>{{value}}</b> <br/> {{name}} donut(s)'
        },
        series : [{
            name : 'John',
            data : [{
                name : 'chocolat',
                value : 3
            },{
                name : 'peanut',
                value : 2
            },{
                name : 'vanilla',
                value : 1
            }]
        },{
            name : 'Jim',
            data : [{
                name : 'chocolat',
                value : 2
            },{
                name : 'peanut',
                value : 2
            }]
        }]
    });
};