/*Conversion of String to boolean  eg>stringTobool('True')*/
	 var stringTobool = function (value) {
	     var strBoolValues = { '1': true, '0': false, 'True': true, 'False': false, 'true': true, 'false': false, 1: true, 0: false }
	     if (value != 'null') {
	         var flag = strBoolValues[value];
	         if (typeof flag == 'undefined' && value == true) {
	             flag = true;
	         }
	         if (typeof flag == 'undefined' && value == false) {
	             flag = false;
	         }
	     } else {

	         flag = false;
	     }
	     return flag;
	 }

TextBoxWidgetCalculation = createClass({
    initialize: function () {
        this.WPADDING = 1;
        this.HPADDING = 1;
        this.isErrorPopupOpen = false;
    },

    /*Auto Font Size Calculation Logic  according to  width and height set by admin*/
    calculateFontSize: function (text, actualWidth, actualHeight, origFontSize, cssProperties, fontSizes) {
        var _this = this;
        var origFontSize = origFontSize;
        var textProperties = {};
        if ($.isEmptyObject(fontSizes)) {
            fontSizes = ['8', '10', '12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60', '62', '64', '65', '66', '68', '70', '72', '74', '76', '78', '80', '82', '84', '86', '88', '90', '92', '94', '96', '98', '100', '102', '104', '106', '108', '110', '112', '114', '116', '118', '120', '122', '124', '126', '128', '130'];
        }
        var calculatedFontSize = '12';

        for (i = fontSizes.length - 1; i >= 0; i--) {
            var textDimentions = _this.measureText(text, fontSizes[i] * 1, cssProperties);
            if (parseInt(textDimentions.width + _this.WPADDING * 2) <= actualWidth && parseInt(textDimentions.height + _this.HPADDING * 2) <= actualHeight) {
                textProperties.fontSize = fontSizes[i];
                textProperties.originalFontSize = fontSizes[i];
                return textProperties;
                break;
            }
            else if (parseInt(textDimentions.width + _this.WPADDING * 2) > actualWidth && parseInt(textDimentions.height + _this.HPADDING * 2) <= actualHeight && i == 0) {
                textProperties.fontSize = origFontSize;
                textProperties.originalFontSize = origFontSize;
                _this.showError();
                return false;
                break;
            }
            else if (parseInt(textDimentions.width + _this.WPADDING * 2) <= actualWidth && parseInt(textDimentions.height + _this.HPADDING * 2) > actualHeight && i == 0) {
                textProperties.fontSize = origFontSize;
                textProperties.originalFontSize = origFontSize;
                _this.showError();
                return false;
                break;
            }
            else {
                if (parseInt(textDimentions.width + _this.WPADDING * 2) > actualWidth && parseInt(textDimentions.height + _this.HPADDING * 2) > actualHeight) {
                    if (i == 0) {
                        textProperties.fontSize = origFontSize;
                        textProperties.originalFontSize = origFontSize;
                        _this.showError();
                        return false;
                        break;
                    }
                }
            }
        }
    },

    /*This function is called when Scaling textbox widget*/
    applyScalingToBox: function (widgetDtl, position) {
        var canGrow;
        var canScale;
        var fontSize;
        var updatedProps;
        var _this = this;
        canGrow = stringTobool(widgetDtl.CanGrow);
        canScale = stringTobool(widgetDtl.AllowScale);
        fontSize = widgetDtl.availableFontSizes;

        var cssProperties = {};
        cssProperties.fontFamily = widgetDtl.fontFamily;
        cssProperties.fontWeight = widgetDtl.fontWeight;
        cssProperties.fontStyle = widgetDtl.fontStyle;
        cssProperties.lineHeight = widgetDtl.lineHeight;

        if (canScale || canGrow) {
            updatedProps = {};
            updatedProps.width = widgetDtl.width * widgetDtl.scaleX;
            updatedProps.height = widgetDtl.height * widgetDtl.scaleY;

            if (canGrow) {

                var fontSize = this.calculateFontSize(widgetDtl.text, updatedProps.width, updatedProps.height, widgetDtl.originalFontSize, cssProperties, fontSize);
                if (!$.isEmptyObject(fontSize)) {
                    updatedProps.fontSize = fontSize.originalFontSize * 1;
                    updatedProps.originalFontSize = fontSize.originalFontSize;
                }
            }

            var textDim = _this.measureText(widgetDtl.text, widgetDtl.fontSize, cssProperties);
            updatedProps = _this.checkWandH(textDim, updatedProps);

            if (position) {
                updatedProps.top = position.top;
                updatedProps.left = position.left;
            }
            updatedProps.scaleX = 1;
            updatedProps.scaleY = 1;
            updatedProps.flipX = false;
            updatedProps.flipY = false;
        }

        return updatedProps;
    },

    /*This function calculated width and height of text box while maintaining padding*/
    checkWandH: function (textDimentions, widgetDtl) {
        var _this = this;
        var wpadd = _this.WPADDING * 2;
        var hpadd = _this.HPADDING * 2;
        if (widgetDtl.width < textDimentions.width + wpadd && widgetDtl.height < textDimentions.height + hpadd) {
            widgetDtl.height = textDimentions.height + hpadd;
            widgetDtl.width = textDimentions.width + wpadd;
        } else if (widgetDtl.height < textDimentions.height + hpadd) {
            widgetDtl.height = textDimentions.height + hpadd;
        } else if (widgetDtl.width < textDimentions.width + wpadd) {
            widgetDtl.width = textDimentions.width + wpadd;
        }
        return widgetDtl;
    },

    /*Calculate Width And Height Of Box*/
    /*_this.HPADDING = 10; Padding is seperated for height and width bcoz height padding was showing more gap on top and changed height padding to 0.01*/
    calculatWidthOfBox: function (text, actualWidth, actualHeight, cssProperties, fontSize, fontSizes) {
        var _this = this;
        var textProperties = {};
        var textDimentions = _this.measureText(text, fontSize, cssProperties);

        if (parseInt(textDimentions.width + _this.WPADDING * 2) <= actualWidth) {
            textProperties.width = actualWidth;
        }
        else {
            textProperties.width = parseInt(textDimentions.width + _this.WPADDING * 2);
        }
        if (parseInt(textDimentions.height + _this.HPADDING * 2) <= actualHeight) {

            textProperties.height = actualHeight;
        } else {
            textProperties.height = parseInt(textDimentions.height + _this.HPADDING * 2);
        }
        return textProperties;
    },

    /*
    *Handy JavaScript to meature the size taken to render the supplied text;
    *you can supply additional style information too if you have it to hand.
    */
    measureText: function (text, fontSize, styles, top) {
        var textLines = text.split('\n');
        var textHeight = this.getTextHeight(textLines, styles, fontSize);
        var textWidth = this.getTextWidth(textLines, fontSize, styles);
        return result = {
            width: textWidth,
            height: textHeight,
        };
    },

   /*This method is used for getting text height.*/
    getTextHeight: function (textLines, styles, fontSize) {
        return textLines.length * styles.lineHeight*fontSize;
    },

    /*This function calculates width, height and fontsize of the textbox depending on the widgets constraints like CanScale, AllowScale*/
    getTextBoxSizeForUpdate: function (data) {
        var _this = this;
        var updatedData = {};
        /*Create object of css props for measuring text*/
        var cssProperties = {};
        cssProperties.fontFamily = data.fontFamily;
        cssProperties.fontWeight = data.fontWeight;
        cssProperties.fontStyle = data.fontStyle;
        cssProperties.lineHeight = data.lineHeight;

        var canGrow = stringTobool(data.CanGrow);
        var canScale = canGrow ? false : stringTobool(data.AllowScale);
        var availableFontSizes = data.availableFontSizes;

        if (canGrow && !canScale) {
            var textDimentions = _this.measureText(data.text, availableFontSizes[0] * 1, cssProperties);
            if (textDimentions.width < data.width && textDimentions.height < data.height) {
                var fontSizeObj = _this.calculateFontSize(data.text, data.width, data.height, data.originalFontSize, cssProperties, availableFontSizes);
                if (!$.isEmptyObject(fontSizeObj)) {
                    updatedData.fontSize = fontSizeObj.originalFontSize * 1;
                    updatedData.originalFontSize = fontSizeObj.originalFontSize;
                    updatedData.height = data.height;
                    updatedData.width = data.width;
                } else {
                    updatedData = null;
                }
            }
            else {
                updatedData = null;
                _this.showError();
            }
        }
        else if (!canGrow && canScale) {
            var widthAndHeight = this.calculatWidthOfBox(data.text, data.width, data.height, cssProperties, data.originalFontSize * 1, availableFontSizes);
            updatedData.width = widthAndHeight.width;
            updatedData.height = widthAndHeight.height;
            updatedData.fontSize = data.originalFontSize * 1;
        }
        else if (canGrow && canScale) {
            //THis Condition never Occur
            var fontSizeObj = this.calculateFontSize(data.text, data.width, data.height, data.originalFontSize, cssProperties, availableFontSizes);
            if (!$.isEmptyObject(fontSizeObj)) {
                updatedData.fontSize = fontSizeObj.originalFontSize * 1;
                updatedData.originalFontSize = fontSizeObj.originalFontSize;
            } else {
                updatedData = null;
            }
        }
        else if (!canGrow && !canScale) {
            var whObj = this.calculatWidthOfBox(data.text, data.width, data.height, cssProperties, data.fontSize, availableFontSizes);
            if ((whObj.width <= data.width && whObj.height <= data.height) || (whObj.width == data.width && whObj.height == data.height)) {
                updatedData.fontSize = data.fontSize;
            } else {
                updatedData = null;
                _this.showError();
            }
        }

        return updatedData;
    },

/*TODO: need to check its need in this file*/
showError: function () {
    var _this = this;
    if (!this.isErrorPopupOpen) {
        bsAlert('error', Artifi.Localization.TEXT_OUTSIDE_ERROR, Artifi.Localization.ERROR_TEXT, function (flag) {
            _this.isErrorPopupOpen = false;
        });
        this.isErrorPopupOpen = true;
    }
},

    /**Function for getting width of text
     * @param {Array} {textLines} No fo text Lines
     * @param {String} {fontSize} Font Size selected
     * @param {Styles} {Object} Styles
     */
getTextWidth: function (textLines, fontSize, styles, top) {
    var canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.id = "fontCanvas";
    canvas.style.position = "absolute";
    canvas.style.left = -500;
    canvas.style.top = -100;
    var fontCanvas = document.getElementById("fontCanvas");
    var ctx = fontCanvas.getContext("2d");
    ctx.font = fontSize + "px"+' '+styles.fontFamily;

    var maxWidth = ctx.measureText(textLines[0] || '|').width;

    for (var i = 1, len = textLines.length; i < len; i++) {
        var currentLineWidth = ctx.measureText(textLines[i]).width;
        if (currentLineWidth > maxWidth) {
            maxWidth = currentLineWidth;
        }
    }
    document.body.removeChild(canvas);
    return maxWidth;

}
});
