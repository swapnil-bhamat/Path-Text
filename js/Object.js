/*======================== Path Text Code Started ===============*/
/*Global Variables*/
var canvas, textPathObj, customPathObj, sampleTextObj = null;
var pathTextCount = 0, circleTextCount = 0;

var pathStack = {
    Smiley: 'm286.66874,81.53843c-0.75637,0.0239 -1.48732,0.08755 -2.24681,0.1631c-12.15192,1.20882 -22.8773,8.91077 -28.32591,20.3872l-2.88878,8.68495c0.62323,-3.00975 1.58018,-5.92869 2.88878,-8.68495c-9.71689,-10.05442 -23.35552,-14.69514 -36.83172,-12.51773c-13.47622,2.1774 -25.17972,10.90975 -31.57577,23.5676c-18.05617,-11.10632 -40.56355,-10.43366 -57.97585,1.75331c-17.4123,12.18696 -26.69303,33.76495 -23.87241,55.53472l1.8456,8.84805c-0.83401,-2.89871 -1.45685,-5.84762 -1.8456,-8.84805l-0.28085,0.81549c-15.13583,1.64734 -27.54908,13.37585 -30.77334,29.07216c-3.22426,15.6963 3.48017,31.80179 16.61038,39.91813l20.50219,4.97449c-7.15883,0.5885 -14.30599,-1.14435 -20.50219,-4.97449c-10.12779,11.33011 -12.45835,28.10408 -5.77752,41.95687c6.68082,13.85277 20.94863,21.82925 35.66818,20.02022l8.94714,-2.36492c-2.87878,1.20339 -5.86857,1.98657 -8.94714,2.36492c8.35618,15.36301 22.2118,26.56981 38.4767,31.0293c16.26489,4.45951 33.54097,1.8239 47.94542,-7.2986c11.75117,18.50769 32.60782,28.22864 53.52235,24.95391c20.91452,-3.27473 38.16694,-18.97803 44.29435,-40.28508l2.12644,-11.90613c-0.3184,4.04488 -1.00932,8.02154 -2.12644,11.90613c14.38528,9.42143 32.48031,9.95236 47.3436,1.38633c14.86328,-8.56603 24.13757,-24.90039 24.27363,-42.69078l-5.32859,-26.58139l-20.99125,-17.98502c16.23151,10.15448 26.46465,25.62581 26.31983,44.56641c19.3001,0.202 35.69415,-16.31438 43.05058,-35.26984c7.35643,-18.95548 4.57363,-40.56579 -7.30217,-56.79873c4.92587,-12.08611 4.63363,-25.83399 -0.8024,-37.67554c-5.43607,-11.84155 -15.46328,-20.64277 -27.52351,-24.09767c-2.69892,-15.69452 -13.82389,-28.31906 -28.52652,-32.45642c-14.70262,-4.13735 -30.35824,0.96437 -40.20193,13.12936l-5.97813,10.07128c1.52755,-3.64201 3.52259,-7.03672 5.97813,-10.07128c-6.93906,-9.56077 -17.82271,-14.9556 -29.16848,-14.59724l0.00002,-0.00005z',
    Circle: 'M 432.3,245.8' +
    ' c 0,96.6 -78.4,175 -175,175' +
    ' s -175-78.4 -175-175' +
    ' s 78.4-175, 175-175' +
    ' S 432.3,149.1, 432.3,245.8' +
    ' z',
    Hen: 'm280.79654,446.13446c-5.23981,-11.20593 -100.01891,2.80414 -50.42126,-11.71201c19.21365,-3.1293 58.66589,0.7952 19.44281,-7.67032c44.66537,10.61914 64.46094,-26.59573 67.34491,-51.68408c-41.57327,-9.12885 -48.77402,-43.22498 -92.58572,-52.40891c-33.38297,-18.44055 -82.31998,-17.87723 -103.50632,-46.31186c-20.1154,-25.31799 -8.75446,-56.13795 -5.42404,-83.48836c7.92492,-28.87465 24.01899,-58.09804 20.83634,-87.43832c-32.44467,13.16391 -44.30642,-16.26357 -45.04542,-25.45617c-23.8833,4.30505 -39.01214,4.49423 -13.04128,-10.47668c11.6052,-11.33986 17.36722,-36.11359 35.90482,-32.39529c4.89311,-14.99648 17.8741,6.81794 32.22749,-6.431c8.79373,4.67925 27.39478,9.89634 6.7755,18.14711c37.23222,13.23833 67.37834,33.38177 82.88721,59.12065c15.54204,26.15771 46.50548,54.42873 96.5074,47.35137c45.27478,5.47647 98.32083,-13.66774 96.26031,-45.79514c0.8779,-22.76038 32.66483,-75.91779 75.50824,-48.89909c32.10968,8.67606 69.05554,30.16939 61.48053,54.56052c-4.38635,25.15 -0.99854,50.51687 3.16461,75.8711c-26.89117,14.04822 -22.06116,38.44989 -40.84326,56.82449c15.58105,25.87071 0.57617,53.81856 -24.92703,74.82945c-25.50931,19.36511 -62.79599,36.56418 -104.11887,34.0491c-15.78937,18.52142 18.64038,34.81888 30.78848,35.85638c-31.65424,-7.15167 -27.19553,6.5607 -16.75769,21.21072c9.77695,27.43112 -20.91785,-24.43582 -40.74683,0.38055c-15.37302,10.71271 -76.83557,14.33945 -27.07483,1.49872c42.46619,-11.10391 -47.68808,-18.04498 -27.67535,6.97314c6.62177,10.43845 45.02435,15.03476 4.60049,11.05908c-17.8468,-6.61163 -27.39169,16.86304 -41.56125,12.43481zm85.19189,-48.24426c15.539,-13.32758 20.01294,-51.88617 -13.59314,-23.77457c-26.56213,15.17093 -36.16757,41.28162 13.59314,23.77457z',
    Curve1: 'M100,250 C198,110 400,100 261,376',
    Curve2: 'M365,50 C86,49 428,301 164,303',
    Curve3: 'M37,420 C86,49 448,130 463,160',
    Line1: 'M116,98 C118,98 165,156 164,156',
    Line2: 'M0 0 L40 0',
    box: 'm161.935,228.66957l369.50482,0l0,185.31041l-369.50482,0l0,-185.31041zm43.11137,-163.68958l0,142.07423l283.28209,0l0,-142.07423l-283.28209,0z',
    arc: "M 54.600950026045325 189.10065241883677 C 5.3920184978913 164.02744946281354 -14.173855374860025 103.80988155419936 10.899347581163212 54.60095002604533 C 35.972550537186464 5.3920184978913 96.19011844580062 -14.173855374860025 145.39904997395467 10.899347581163198 C 145.8284898135254 11.118158108451297 146.52160061504097 11.478968754101828 146.94715627858903 11.70524071410729",
    arc1: 'M100,250 Q253,311 328,173',
    arc2: "M100,200 C100,100  400,100  400,200",
    arc3: "M100,200 Q250,100 400,200",
    arc4: "M 50,100 C 100,150 200,150 250,100",
    arc5: "M32,248 Q252,443 437,252",
	polygon : "M 60 0 L 120 0 L 180 60 L 180 120 L 120 180 L 60 180 L 0 120 L 0 60 z",
	AnticlockwiseCircle : "M -99.96953903127826 103.49048128745669 C -98.04179944675366 213.9306081189675 -6.94964554405415 301.89727861580286 103.49048128745667 299.96953903127826 C 213.93060811896748 298.04179944675366 301.8972786158028 206.94964554405416 299.96953903127826 96.50951871254334 C 298.04179944675366 -13.930608118967484 206.9496455440542 -101.8972786158028 96.50951871254335 -99.96953903127826 C -12.019691662932047 -98.07515461756617 -99.99999999999997 -8.545742417798763 -100 99.99999999999997 Z",
	Circle1: "M301,195.5 C301,160.4171270718232 328.74585635359114,132 363,132 C397.25414364640886,132 425,160.4171270718232 425,195.5 C425,230.5828729281768 397.25414364640886,259 363,259 C328.74585635359114,259 301,230.5828729281768 301,195.5 Z"
};


$(document).ready(function (e) {
    //logger.disableLogger();
    //getting default values loaded
    canvas = new fabric.Canvas('testCan');
//	canvas.renderOnAddRemove = false;
    canvas.on('object:selected', function (e) {
        $('#propertiesPanel').show();
        var activeObject = canvas.getActiveObject();

        if (activeObject.type == 'CustomPath') {
            var widget = getWidgetById(activeObject.linkId);
            textPathObj = widget;
            if (widget.type == 'CircleText') {
                $('#circleTextProperties').show();
                $('#pathTextProperties').hide();
            }
            else if (widget.type == 'PathText') {
                $('#circleTextProperties').hide();
                $('#pathTextProperties').show();
            }

        }

    });
	
    //addBulkWidgets();
    canvas.renderAll();
    canvas.selection = false;
    $('#widgetCount').html(canvas.getObjects().length);
   /*======================== Path Text Code End ===============*/
    });

    var getWidgetById = function (widgetId) {
        var widget = null;
        var widgetArr = canvas.getObjects();
        for (i = 0; i < widgetArr.length; i++) {
            if (widgetArr[i].id == widgetId) {
                widget = widgetArr[i];
                break;
            }
        }
        return widget;
    }

    /*Add Other Objects Such as Image, Text, Rect, etc. in canvas*/
    var addBulkWidgets = function () {
        $('#circleTextProperties').show();
        $('#pathTextProperties').hide();
        for (var i = 0; i < 20; i++) {
            //addTextBox();
            addCircleText();
        }
    }

    var addCircleText = function () {

        var text = $('#changeText').val();
        var fontFamily = $('#fontFamily').val();
        var fontSize = $('#fontSize').val();
        var changeFontColor = $('#changeFontColor').val();
        /*Class specific properties*/
        var radius = $('#changeRadius').val();
        var startAngle = $('#startAngle').val();
        var endAngle = $('#endAngle').val();
        //var top = getRandomInt(0, 700);
        //var left = getRandomInt(0, 700);
        var top = 200;
        var left = 300;
        circleTextCount++;
        var id = '1024' + '_circleText_' + circleTextCount;
        var circleTextObj = new fabric.CircleText(
            text, {
                radius: radius,
                startAngle: startAngle,
                endAngle: endAngle,
				textAlign:"center",
                top: top,
                left: left,
                fontFamily: fontFamily,
                fontSize: fontSize,
                id: id,
                borderColor: 'rgba(255, 0, 0, 0.9)', // e.g. white / rgba(255, 255, 255, 0.9) / #FFF
                cornerColor: 'rgba(0, 255, 0, 0.9)' // e.g. white / rgba(255, 255, 255, 0.9) / #FFF
                //textBackgroundColor: '#ff0000',
                //backgroundColor: '#ff0000'
            }
        );
        canvas.add(circleTextObj);
		canvas.renderAll();

    }

    var addTextBox = function () {
        var text = $('#changeText').val();
        var fontFamily = $('#fontFamily').val();
        var fontSize = $('#fontSize').val();
        var top = getRandomInt(0, 700);
        var left = getRandomInt(0, 700);
        var textBoxObj = new fabric.Text(
            text, {
                top: top,
                left: left,
                fontFamily: fontFamily,
                fontSize: fontSize,
                borderColor: 'rgba(255, 0, 0, 0.9)',  
                cornerColor: 'rgba(0, 255, 0, 0.9)',
                cornerSize: 10,
				padding:50
            }
        );
        canvas.add(textBoxObj);
    }

    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.round() will give you a non-uniform distribution!
     */
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /* Update PathText Object Property When DOM updated */
    /*Render Character Entered on keyup*/
    $(document).on('keyup', '#changeText', function (e) {
        var text = $(this).val();
        var obj = textPathObj;
        var updatedProperty = {
            text: text
        };
        updatePropertyOfWidget(obj, updatedProperty);
    });

    $(document).on('change', '#shapeType', function (e) {
        var shapeType = $(this).val();
        var shapePath = pathStack[shapeType];
        var updatedProperty = { pathString: shapePath };
        updatePropertyOfWidget(textPathObj, updatedProperty);
    });

    $(document).on('change', '#textAlign', function (e) {
        var alignmnetType = $(this).val();
        var updatedProperty = { textAlign: alignmnetType };
        updatePropertyOfWidget(textPathObj, updatedProperty);
    });

	$(document).on('click','#addText',addTextBox);
    var getPathData = function () {

        var radius = parseFloat($('#changeRadius').val());
        var startAngle = parseFloat($('#startAngle').val());
        var endAngle = parseFloat($('#endAngle').val());
        var direction = $('#Direction').val();
        clockwise = (direction == 'ClockWise') ? true : false;
		if(!clockwise)
		{
			radius = parseFloat($('#changeRadius').val()) + parseFloat($("#fontSize").val());
			$('#changeRadius').val(radius);
		}
		else
		{
			radius = parseFloat($('#changeRadius').val()) - parseFloat($("#fontSize").val());
			$('#changeRadius').val(radius);
		}
        var updatedProperty = { radius: radius, startAngle: startAngle, endAngle: endAngle, clockwise: clockwise };
        return updatedProperty;
    }

    $(document).on('change', '#fontFamily', function (e) {
        var fontFamily = $(this).val();
        var obj = textPathObj;
        var updatedProperty = { fontFamily: fontFamily };
        updatePropertyOfWidget(obj, updatedProperty);
    });

    $(document).on('change', '#fontSize', function (e) {
        var fontSize = $(this).val();
        var obj = textPathObj;
        var updatedProperty = { nonScaledFontSize: fontSize, originalFontSize: fontSize };
        updatePropertyOfWidget(obj, updatedProperty);
    });

    $(document).on('change', '#changeFontColor', function (e) {
        var fontColor = $(this).val();
        var obj = textPathObj;
        var updatedProperty = { fill: fontColor };
        updatePropertyOfWidget(obj, updatedProperty);
    });

    $(document).on('change', '#changeFontColor', function (e) {
        var fontColor = $(this).val();
        var obj = textPathObj;
        var updatedProperty = { fill: fontColor };
        updatePropertyOfWidget(obj, updatedProperty);
    });

    $(document).on('keyup','#startAngle', '#endAngle', function (e) {
        var updatedProperty = getPathData();
        var obj = textPathObj;
        if (isNaN(updatedProperty.startAngle) || isNaN(updatedProperty.endAngle)) {
            alert('Invalid Start angle or End angle!');
            return false;
        }
        else if (updatedProperty.startAngle < 0 || updatedProperty.endAngle < 0) {
            alert('Start angle and End angle should be greater than zero!');
            return false;
        }
        else if (updatedProperty.startAngle == updatedProperty.endAngle) {
            alert('Start angle and end angle should not be the same!');
            return false;
        }
        else {
            updatePropertyOfWidget(obj, updatedProperty);
        }
    });
	
	 $(document).on('blur','#changeRadius', function (e) {
        var updatedProperty = {radius:$("#changeRadius").val()};
        var obj = textPathObj;
        if (isNaN(updatedProperty.radius)) {
            alert('Invalid Radius!');
            return false;
        }
        else {
            updatePropertyOfWidget(obj, updatedProperty);
        }
    });
	
    $(document).on('change', '#Direction', function (e) {
        var updatedProperty = getPathData();
        var obj = textPathObj;
        updatePropertyOfWidget(obj, updatedProperty);
    });


    $(document).on('change', '#removeChar', function (e) {
        var removeCharMethod = $(this).val();
        var obj = textPathObj;
        var property = {};
        if (removeCharMethod == 'removeExtraChar') {
            property = { removeExtraChar: true, wantTextPathWithLessOverlap: false };
        }
        else if (removeCharMethod == 'wantTextPathWithLessOverlap') {
            property = { removeExtraChar: false, wantTextPathWithLessOverlap: true };
        }
        var updatedProperty = property;
        updatePropertyOfWidget(obj, updatedProperty);
    });

    $(document).on('click', '#addPathText', function (e) {
        $('#circleTextProperties').hide();
        $('#pathTextProperties').show();
        var text = $('#changeText').val();

        var fontFamily = $('#fontFamily').val();
        var fontSize = $('#fontSize').val();
        var changeFontColor = $('#changeFontColor').val();
        /*Class specific properties*/
        var shapeType = $('#shapeType').val();
        var path = pathStack[shapeType];
        pathTextCount++;
        var id = '1024' + '_pathText_' + pathTextCount;
        var pathTextObj = new fabric.PathText(
            text, {
                pathString: path,               /*working*/
                top: 300,                       /*working*/
                left: 300,                      /*working*/
                fontFamily: fontFamily,         /*working*/
                fontSize: fontSize,             /*working*/
                id: id,                         /*working*/
                /*Constraints*/
                //selectable: false,            /*working*/
                hasControls: false,
                // hasRotatingPoint: true,
                // lockMovementX: false,
                // lockMovementY: false,
                // lockRotation: false,
                // lockScalingX: false,
                // lockScalingY: false,
                // lockUniScaling: true,
                // borderColor: 'rgba(255, 0, 0, 0.9)', // e.g. white / rgba(255, 255, 255, 0.9) / #FFF,
                //cornerColor: 'rgba(0, 255, 0, 0.9)', // e.g. white / rgba(255, 255, 255, 0.9) / #FFF
                // cornerSize: 10,
                // transparentCorners: false
                // hasBorders: false
                // borderOpacityWhenMoving: 0.4
            }
        );
        canvas.add(pathTextObj).renderAll();
        $('#widgetCount').html(canvas.getObjects().length);
    });

    $(document).on('click', '#addCircleText', function (e) {
        $('#circleTextProperties').show();
        $('#pathTextProperties').hide();
        addCircleText();
        $('#widgetCount').html(canvas.getObjects().length);
    });

	// $(document).on('change','#arcType',function(e){
		// var updatedProperty = getPathData();
		// var obj = textPathObj;
		// var arcType =  $(this).val();
		// switch(arcType){
			// case "Circle":
				// updatedProperty.startAngle = 0;
				// updatedProperty.endAngle = 360;
				// break;
			// case "Semi Circle":	
				// updatedProperty.startAngle = 0;
				// updatedProperty.endAngle = 180;
				// break;
				
			// case "Quarter Circle":	
				// updatedProperty.startAngle = 0;
				// updatedProperty.endAngle = 90;
				// break;			
		// }
		// updatePropertyOfWidget(obj, updatedProperty);
	// });



    $(document).on('click', '#addAudio', function (e) {
        /*This is image widget */
        var _widget = { width: 300, height: 300, top: 50, left: 50, src: "./img/nod32robot.png", audioSrc: '' };
        fabric.util.loadImage(_widget.src, function (img) {
            var namedImg = new fabric.Audio(img, _widget);
            namedImg.top = canvas.width / 2;
            namedImg.left = canvas.height / 2;
            canvas.add(namedImg);
            canvas.renderAll();
        });
        $('#widgetCount').html(canvas.getObjects().length);
    });



    $(document).on("change","#isScalable", function () {
        var scalable = $(this).is(":checked");
        var obj = textPathObj;
        var updatedProperty = { canGrow: scalable};
        updatePropertyOfWidget(obj, updatedProperty);
     
    });



    /*Canvas Methods*/
    var updatePropertyOfWidget = function (widget, property) {
        //console.log(widget.type, widget.id);
        widget.set(property);
        canvas.renderAll();
    }

    var exportCanvasToJSON = function () {
        var objectToExport = canvas;
        var svgObject = objectToExport.toJSON();
        console.log(svgObject);
    };


    /* ======================= Hack Methods to download svg files ========================== */
    var exportCanvasToSVG = function () {
        var objectToExport = canvas;
        // Get object containing only necessary data. xmlns:xlink necessary to reference textPath by id.
        var svgObject = objectToExport.toSVG({
			xPosition:canvas.width,
			yPosition:canvas.height,
			printAreaWidth:canvas.width,
			printAreaHeight:canvas.height			
		});
        // Remove line endings.
        var potentialFilename = "";
        // Pick an appropriate name.
        var filename = (potentialFilename === "") ? "curved-text" : potentialFilename;
        // Go through the file and replace non-ASCII characters (i.e. the text) with entities.
        var encodedSvgObject = svgObject.replace(/[^\u0000-\u0080]/g, function (i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
        // Make an inline file object.
        var base64String = fabric.window.btoa(encodedSvgObject);
        initiateFileDownload("data:application/octet-stream;base64," + base64String, filename + ".svg");
    };

    var initiateFileDownload = function (uri, filename) {
        var link = document.createElement('a');
        if (typeof link.download === 'string') {
            fabric.document.body.appendChild(link); // Firefox requires the link to be in the body.
            link.download = filename;
            link.href = uri;
            link.click();
            document.body.removeChild(link); // Remove the link when done.
        } else {
            location.replace(uri);
        }
    };
	
    var logger = function () {
        var oldConsoleLog = null;
        var pub = {};

        pub.enableLogger = function enableLogger() {
            if (oldConsoleLog == null)
                return;

            window['console']['log'] = oldConsoleLog;
        };

        pub.disableLogger = function disableLogger() {
            oldConsoleLog = console.log;
            window['console']['log'] = function () { };
        };

        return pub;
    }();

    /* ======================= Hack Methods to download svg files  ========================== */
