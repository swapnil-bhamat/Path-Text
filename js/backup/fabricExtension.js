/*============== Added usefull util methods in global scope because various classes using the same many time =================*/
var toFixed = fabric.util.toFixed;
var extend = fabric.util.object.extend;
var clone = fabric.util.object.clone;
var invoke = fabric.util.array.invoke;
var parentToObject = fabric.Object.prototype.toObject;
/*============== End of usefull util methods in global scope =================*/

/* ====  Text  =====*/

fabric.util.object.extend(fabric.Text.prototype, /** @lends fabric.Path.prototype */ {
    /*============== Custom Changes For Artifi ===================*/

    /**
         * @private
         * Here We add the Font family in single Quate
         */
    _getFontDeclaration: function () {
        var fontDeclaration = [
            // node-canvas needs "weight style", while browsers need "style weight"
            (fabric.isLikelyNode ? this.fontWeight : this.fontStyle),
            (fabric.isLikelyNode ? this.fontStyle : this.fontWeight),
            this.fontSize + 'px',
            (("'" + this.fontFamily + "'"))
        ].join(' ');
        return fontDeclaration;
    },
})
/* ====  Image  =====*/
fabric.util.object.extend(fabric.Image.prototype, /** @lends fabric.Path.prototype */ {
    /*============== Custom Changes For Artifi ===================*/

    /**
    * autoPlay value (should be one of true or false) it defines whether the track will be automatically played default.
    * @type Boolean
    * @default
    */
    printImage: '',
    printImageMimeType: '',
    caption: '',
    widget_key: '',
    group_key: '',
    price_key: '',
    _render: function (ctx, noTransform) {
        try {
            /* Following changes is due to NS_ERROR_NOT_AVAILABLE exception in firefox so */
            $(this._element).attr('crossorigin', 'anonymus');
            $(this._element).attr('class', 'canvas-img');
            /*Following code is for fix image quality issue
            * Here we are using anti-alise technique to enhance image quality
            * For that we have to pass width, height and image element to the function
            * function return anti- alised canvas element
            * this element is drawn as widget
            */
            var imageElement = this._element;
            if (fabric.util.antiAliseImage) {
                var width = this.currentWidth ? this.currentWidth : this.width;
                var height = this.currentHeight ? this.currentHeight : this.height;
                imageElement = fabric.util.antiAlise(imageElement, width, height);
            }

            imageElement &&
            ctx.drawImage(
              imageElement,
              noTransform ? this.left : -this.width / 2,
              noTransform ? this.top : -this.height / 2,
              this.width,
              this.height
            );
            this._renderStroke(ctx);
        }
        catch (err) {
            /*console.log(err);*/
        }
    },
    /* _TO_SVG_START_ */
    /**
     * Returns SVG representation of an instance
     * @param {Function} [reviver] Method for further parsing of svg representation.
     * @return {String} svg representation of an instance
     */
    toSVG: function (reviver) {
        var markup = this._createBaseSVGMarkup(), x = -this.width / 2, y = -this.height / 2;
        if (this.group && this.group.type === 'path-group') {
            x = this.left;
            y = this.top;
        }

        markup.push(
          '<g transform="', this.getSvgTransform(), this.getSvgTransformMatrix(), '">\n',
            '<image xlink:href="', this.getImageSrcForSvg(),
              '" x="', x, '" y="', y,
              '" style="', this.getSvgStyles(),
        // we're essentially moving origin of transformation from top/left corner to the center of the shape
        // by wrapping it in container <g> element with actual transformation, then offsetting object to the top/left
        // so that object's center aligns with container's left/top
              '" width="', this.width,
              '" height="', this.height,
              '" preserveAspectRatio="none"',
            '></image>\n'
        );

        if (this.stroke || this.strokeDashArray) {
            var origFill = this.fill;
            this.fill = null;
            markup.push(
              '<rect ',
                'x="', x, '" y="', y,
                '" width="', this.width, '" height="', this.height,
                '" style="', this.getSvgStyles(),
              '"/>\n'
            );
            this.fill = origFill;
        }

        markup.push('</g>\n');

        return reviver ? reviver(markup.join('')) : markup.join('');
    },

    /*Overriding this to use grayscale as a filter*/
    getSvgStyles: function () {
        var fill = this.fill
              ? (this.fill.toLive ? 'url(#SVGID_' + this.fill.id + ')' : this.fill)
              : 'none',
            fillRule = this.fillRule,
            stroke = this.stroke
              ? (this.stroke.toLive ? 'url(#SVGID_' + this.stroke.id + ')' : this.stroke)
              : 'none',

            strokeWidth = this.strokeWidth ? this.strokeWidth : '0',
            strokeDashArray = this.strokeDashArray ? this.strokeDashArray.join(' ') : '',
            strokeLineCap = this.strokeLineCap ? this.strokeLineCap : 'butt',
            strokeLineJoin = this.strokeLineJoin ? this.strokeLineJoin : 'miter',
            strokeMiterLimit = this.strokeMiterLimit ? this.strokeMiterLimit : '4',
            opacity = typeof this.opacity !== 'undefined' ? this.opacity : '1',

            visibility = this.visible ? '' : ' visibility: hidden;',
          /*  filter = this.shadow && this.type !== 'text' ? 'filter: url(#SVGID_' + this.shadow.id + ');' : '';*/
        /* If filters or shadow is applied to an image then apply filters to  image SVG 
         * The filter URL is appended to SVG of image if filters or shadow is applied to an image
         */
         filter = (this.filters.length || this.shadow) ? 'filter:url(#filters_' + this.id + ');' : '';

        return [
              'stroke: ', stroke, '; ',
              'stroke-width: ', strokeWidth, '; ',
              'stroke-dasharray: ', strokeDashArray, '; ',
              'stroke-linecap: ', strokeLineCap, '; ',
              'stroke-linejoin: ', strokeLineJoin, '; ',
              'stroke-miterlimit: ', strokeMiterLimit, '; ',
              'fill: ', fill, '; ',
              'fill-rule: ', fillRule, '; ',
              'opacity: ', opacity, ';',
              filter,
              visibility
        ].join('');
    },

    _createBaseSVGMarkup: function () {
        var markup = [];
        //var grayScale = 
        if (this.fill && this.fill.toLive) {
            markup.push(this.fill.toSVG(this, false));
        }
        if (this.stroke && this.stroke.toLive) {
            markup.push(this.stroke.toSVG(this, false));
        }
        /*if shadow or filters applied to an image then push SVG  filters  in image SVG markup. 
         * here the  markup for adding filter is added to an SVG of image
         */
        if (this.shadow || this.filters.length) {
            markup.push(this.applyFiltersToSVG(this));

        }

        return markup;
    },

    /*this method is used to check the filter is appplied to image or not
     * param {filters}  array of all filters applied to image
     * param {filterName}  filter of type filterName is applied to image or not 
     * return {filterPresent } true or false depending on input filter is applied or not
     */
    checkFilterPresent: function (filters, filterName) {
        var filterPresent = false;
        this.filters.forEach(function (item) {
            if (item.type) {
                if (item.type.toLowerCase() === filterName.toLowerCase()) {
                    filterPresent = true;
                }
            }
        });
        return filterPresent;
    },
    /**
     *  This method is use for getting filter dtails using the filter name
     * @param [Array] [filters] : List of filters assign to that image
     * @param [String] [filterName] : Name of filter for getting the datails using filter name
     * @returns [Object] [filterDetails] Filter Details
     */
    getFilter: function (filters, filterName) {
        var filterDetails = {};
        this.filters.forEach(function (item) {
            if (item.type) {
                if (item.type.toLowerCase() === filterName.toLowerCase()) {
                    filterDetails = item;
                }
            }
        });
        return filterDetails;
    },

    /**
     * Function for getting the grayscale filter SVG
     */

    toGrayScaleFilter: function () {
        return (
                    '<feColorMatrix type="matrix" in ="SourceGraphic" result="grayscale" values="0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0"/>'
            );
    },
    /**
     * Function for getting the Tint  filter SVG
     */

    toTintFilter: function (color) {
        var matrix = this.getMatrix(color);
        return (
                        '<feColorMatrix type="matrix"  in ="SourceGraphic" result="tint" values="' + matrix + '"/>'
            );
    },


    /* method for getting SVG Black and white filter Matrix
     *returns{string}: black And White filter SVG markup
     */
    toBlackAndWhiteFilter: function () {
        return (
        '<feColorMatrix type="matrix" in="SourceGraphic" result="grayColorMatrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"/></feColorMatrix>' +
       ' <feComponentTransfer in="grayColorMatrix" result="blackAndWhite" color-interpolation-filters="sRGB"><feFuncR type="discrete" tableValues="0.0 0.0 1.0 1.0"></feFuncR>' +
        '<feFuncG type="discrete" tableValues="0.0 0.0 1.0 1.0"></feFuncG><feFuncB type="discrete" tableValues="0.0 0.0 1.0 1.0"></feFuncB>' +
        '</feComponentTransfer>'
            );
    },

    /*method for getting shadow SVG filter 
     * param{object}: image value object
     * returns{string}: shadow filter SVG markup
     */
    toShadowFilter: function (object) {
        var shadow = object.shadow;
        /*converting shadow color into hex color format */
        var hexColor = fabric.util.rgb2Hex(shadow.color);
        var opacity = 1;
        /*getting the opacity of shadow*/
        var regExp = /\(([^)]+)\)/;
        var rgbArray = regExp.exec(shadow.color);
        if (rgbArray) {
            var splits = rgbArray[1].split(',');
            opacity = splits[3];
        }
        return (
               '\t<feGaussianBlur in="SourceAlpha" stdDeviation="' +
                                      toFixed(shadow.blur ? shadow.blur / 3 : 0, 3) + '"></feGaussianBlur>\n' +
                                    '\t<feOffset dx="' + shadow.offsetX + '" dy="' + shadow.offsetY + '" result="oBlur" ></feOffset>\n' +
                                    '\t<feFlood flood-color="' + hexColor + '" flood-opacity="' + opacity + '"/>\n' +
                                    '\t<feComposite in2="oBlur" operator="in" result="shadow" />\n');
    },
    /* method for  getting filters markup and combining filters that are applied to an image 
     * @param{object}: image value object
     * @returns{string}: svg markup of filters and combining various filters together 
     */
    applyFiltersToSVG: function (object) {
        var _this = this;
        var output;
        var fBoxX = 40, fBoxY = 40;
        if (object.width && object.height) {
            /** we add some extra space to filter box to contain the blur ( 20 )*/
            if (object.shadow) {
                fBoxX = toFixed((Math.abs(object.shadow.offsetX) + object.shadow.blur) / object.width, 2) * 100 + 20;
                fBoxY = toFixed((Math.abs(object.shadow.offsetY) + object.shadow.blur) / object.height, 2) * 100 + 20;
            }
        }
        var filtersMarkup = _this.getFiltersSVG(object);
        /* we combining multiple filters here */
        var combineFilterMarkup = _this.combineFilters(object);

        /* Here we combining Filters and code to combine those filters */
        var output = '<filter id="filters_' + this.id + '"  y="-' + fBoxY + '%" height="' + (100 + 2 * fBoxY) + '%" ' +
                                'x="-' + fBoxX + '%" width="' + (100 + 2 * fBoxX) + '%" ' + '>\n' + filtersMarkup + combineFilterMarkup + '</filter>\n';
        return output;
    },
    /*method for getting the SVG markup for filters
     * param{object}: image value object
     * returns{string}:markup for applying filters 
     */
    getFiltersSVG: function (object) {
        /* filters sequence ie order in which filters markup push in SVG */
        var filterSequence = ["Shadow", "Grayscale", "Tint"];
        var _this = this;
        var filtersMarkup = "";
        for (var i = 0; i < filterSequence.length; i++) {
            switch (filterSequence[i]) {
                case "Shadow":
                    filtersMarkup += object.shadow ? _this.toShadowFilter(object) : "";
                    break;
                case "Grayscale":
                    filtersMarkup += _this.checkFilterPresent(object.filters, "Grayscale") ? _this.toGrayScaleFilter() : "";
                    break;
                case "Tint":
                    var tintFilter = _this.getFilter(object.filters, "Tint");
                    filtersMarkup += _this.checkFilterPresent(object.filters, "Tint") ? _this.toTintFilter(tintFilter.color) : "";
                    break;
            }
        }

        return filtersMarkup;
    },
    /* method for Combining filters for image SVG. This method will merge all the filters applied to an image 
     * Param{object}:  object :- image value object
     * Returns{string} output :- svg markup for merging the SVG filters  
     */
    combineFilters: function (object) {
        var mergeFilters = "";
        /* filters sequence ie order in which filters are applied to SVG of image*/
        var filterSequence = ["Shadow", "Grayscale", "Tint"];
        var _this = this;
        for (var i = 0; i < filterSequence.length; i++) {
            switch (filterSequence[i]) {
                case "Shadow":
                    mergeFilters += object.shadow ? '\t\t<feMergeNode in="shadow"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode>\n' : "";
                    break;
                case "Grayscale":
                    mergeFilters += _this.checkFilterPresent(object.filters, "Grayscale") ? '\t\t<feMergeNode in="grayscale"></feMergeNode>\n' : "";
                    break;
                case "Tint":
                    mergeFilters += _this.checkFilterPresent(object.filters, "Tint") ? '\t\t<feMergeNode in="tint"></feMergeNode>\n' : "";
                    break;
            }
        }

        if (object.filters.length || object.shadow) {
            var output = '\t<feMerge>\n' +
             mergeFilters +
              '\t</feMerge>'
            return output;
        }
    },

    /*function use for finding image by using mime type if mime type found then use print image in svg else default selected preview image*/
    getImageSrcForSvg: function () {
        var _this = this;
        var printImage = this.get('printImage');
        var imageSrc = null;
        var printImageMimeType = this.get('printImageMimeType');
        var ext = Artifi.Config.allowedInSVGPrintImageExt;/* need to remove this*/
        for (var i in ext) {
            if (printImageMimeType) {
                var status = printImageMimeType.indexOf(ext[i]);
                if (status > -1) {
                    imageSrc = printImage;
                    break;
                }
            } else {
                break;
            }
        }
        if (!imageSrc) {
            /*use this.src to get the actual image src rather than base 64*/
            imageSrc = this.removeAPICallFromURL(this.src);
            /*Checking if proper src is getting passed, if not then changing the src to Standard/Original src*/
            imageSrc = _this.removeThumbnailSrc(imageSrc);

        }

        return this.removeAndAddNewProtocal(imageSrc);
    },
    /* We have option for downloading SVG from the server and previously we were sending the image path followed by // and without protocol that's
       Is why the images are not displayed in SVG so we are adding directly https to the image protocol for avoiding that issue.
    */
    removeAndAddNewProtocal: function (src) {
        src = src.replace('https:', '');
        src = src.replace('http:', '');
        return "https:" + src;
    },
    /*Replacing thumbnail/standard src with standard src;
    /*When effects are applied, then image is generated in Output folder; 
    when src has "/Output/" string into it, it must be replaced by Standard.
    In other cases src will carry Original image src.*/
    removeThumbnailSrc: function (src) {
        var newSrc = "";
        var pattern = new RegExp("\/Output\/");
        var isOutputSrc = pattern.test(src);
        var isThumbSrc = src.indexOf("Thumbnail") > 0;
        var isStdSrc = src.indexOf("Standard") > 0;
        if (isOutputSrc) {
            newSrc = src.replace("\/Thumbnail\/", "\/Standard\/");
        } else if (isThumbSrc) {
            newSrc = src.replace("\/Thumbnail\/", "\/Original\/");
        } else if (isStdSrc) {
            newSrc = src.replace("\/Standard\/", "\/Original\/");
        }
        if (checkExist(newSrc)) { return newSrc; }
        else { return src; }
    },
    /*
    * This function is used to remove api call from url and return only image url
    **/
    removeAPICallFromURL: function (src) {
        if (src && src.split("=")[1]) {
            return src.substring(src.lastIndexOf("=") + 1, src.length);
        } else {
            return src;
        }

    },

    /*
    @param [String] [hexInput] Hex Color 
    */
    getMatrix: function (hexInput) {

        var hexInput = hexInput.toString();
        hexInput = hexInput.replace('#', '');
        switch (hexInput.length) {
            case 1: hexInput = "00000" + hexInput;
                break;
            case 2: hexInput = "0000" + hexInput;
                break;
            case 3: hexInput = "000" + hexInput;
                break;
            case 4: hexInput = "00" + hexInput;
                break;
            case 5: hexInput = "0" + hexInput;
                break;
        }

        var r = this.manipulate(hexInput.substring(0, 2));
        var g = this.manipulate(hexInput.substring(2, 4));
        var b = this.manipulate(hexInput.substring(4));
        var hexVal = r + g + b;
        var matrixValue = this.hexToMatrix('0x' + hexVal);
        return (matrixValue);

    },

    /**
     * 
     */
    hexToMatrix: function (rgb, alpha) {
        var matrix = [];
        matrix = matrix.concat([((rgb & 0x00FF0000) >>> 16) / 255, ((rgb & 0x00FF0000) >>> 16) / 255, ((rgb & 0x00FF0000) >>> 16) / 255, ((rgb & 0x00FF0000) >>> 16) / 255, 0]); // red
        matrix = matrix.concat([((rgb & 0x0000FF00) >>> 8) / 255, ((rgb & 0x0000FF00) >>> 8) / 255, ((rgb & 0x0000FF00) >>> 8) / 255, ((rgb & 0x0000FF00) >>> 8) / 255, 0]); // green
        matrix = matrix.concat([(rgb & 0x000000FF) / 255, (rgb & 0x000000FF) / 255, (rgb & 0x000000FF) / 255, (rgb & 0x000000FF) / 255, 0]); // blue
        matrix = matrix.concat([0, 0, 0, 1, 0]); // alpha
        return matrix;
    },

    manipulate: function (partialHex) {
        partialHex = partialHex.toUpperCase();
        var RGB = {
            "00": "00", "01": "00", "02": "00", "03": "00", "04": "00", "05": "00", "06": "00", "07": "01", "08": "01", "09": "01", "0A": "01", "0B": "01", "0C": "01", "0D": "01", "0E": "01", "0F": "01",
            "10": "02", "11": "02", "12": "02", "13": "02", "14": "02", "15": "02", "16": "02", "17": "02", "18": "02", "19": "03", "1A": "03", "1B": "03", "1C": "03", "1D": "03", "1E": "03", "1F": "04",
            "20": "04", "21": "04", "22": "04", "23": "04", "24": "04", "25": "05", "26": "05", "27": "05", "28": "06", "29": "06", "2A": "06", "2B": "06", "2C": "06", "2D": "07", "2E": "07", "2F": "07",
            "30": "08", "31": "08", "32": "08", "33": "08", "34": "09", "35": "09", "36": "09", "37": "0A", "38": "0A", "39": "0A", "3A": "0B", "3B": "0B", "3C": "0B", "3D": "0C", "3E": "0C", "3F": "0C",
            "40": "0D", "41": "0D", "42": "0E", "43": "0E", "44": "0F", "45": "0F", "46": "10", "47": "10", "48": "10", "49": "11", "4A": "12", "4B": "12", "4C": "12", "4D": "13", "4E": "14", "4F": "14",
            "50": "15", "51": "15", "52": "16", "53": "16", "54": "17", "55": "17", "56": "18", "57": "18", "58": "19", "59": "19", "5A": "1A", "5B": "1A", "5C": "1B", "5D": "1C", "5E": "1D", "5F": "1D",
            "60": "1E", "61": "1F", "62": "1F", "63": "20", "64": "21", "65": "21", "66": "22", "67": "23", "68": "23", "69": "24", "6A": "25", "6B": "25", "6C": "26", "6D": "27", "6E": "28", "6F": "28",
            "70": "29", "71": "2A", "72": "2B", "73": "2C", "74": "2C", "75": "2D", "76": "2E", "77": "2F", "78": "30", "79": "31", "7A": "32", "7B": "33", "7C": "33", "7D": "34", "7E": "35", "7F": "36",
            "80": "37", "81": "38", "82": "39", "83": "3A", "84": "3B", "85": "3C", "86": "3D", "87": "3E", "88": "3F", "89": "40", "8A": "41", "8B": "42", "8C": "43", "8D": "44", "8E": "45", "8F": "46",
            "90": "47", "91": "48", "92": "49", "93": "4A", "94": "4B", "95": "4D", "96": "4E", "97": "4F", "98": "50", "99": "51", "9A": "52", "9B": "53", "9C": "55", "9D": "56", "9E": "57", "9F": "58",
            "A0": "5A", "A1": "5B", "A2": "5C", "A3": "5D", "A4": "5F", "A5": "60", "A6": "61", "A7": "62", "A8": "64", "A9": "65", "AA": "66", "AB": "68", "AC": "69", "AD": "6A", "AE": "6C", "AF": "6D",
            "B0": "6F", "B1": "70", "B2": "71", "B3": "73", "B4": "74", "B5": "76", "B6": "77", "B7": "79", "B8": "7A", "B9": "7B", "BA": "7D", "BB": "7E", "BC": "80", "BD": "81", "BE": "83", "BF": "85",
            "C0": "86", "C1": "88", "C2": "89", "C3": "8b", "C4": "8c", "C5": "8e", "C6": "90", "C7": "91", "C8": "93", "C9": "95", "CA": "96", "CB": "98", "CC": "9a", "CD": "9b", "CE": "9d", "CF": "9f",
            "D0": "a0", "D1": "a2", "D2": "a4", "D3": "a6", "D4": "a7", "D5": "a9", "D6": "ab", "D7": "ad", "D8": "af", "D9": "b1", "DA": "b2", "DB": "b4", "DC": "b6", "DD": "b8", "DE": "ba", "DF": "bc",
            "E0": "be", "E1": "c0", "E2": "C2", "E3": "C3", "E4": "C6", "E5": "C8", "E6": "CA", "E7": "CC", "E8": "CE", "E9": "CF", "EA": "D2", "EB": "D4", "EC": "D6", "ED": "D8", "EE": "DB", "EF": "DD",
            "F0": "DF", "F1": "E0", "F2": "E2", "F3": "E4", "F4": "E7", "F5": "E9", "F6": "EC", "F7": "EE", "F8": "F0", "F9": "F2", "FA": "FD", "FB": "F7", "FC": "F9", "FD": "FB", "FE": "FD", "FF": "FF",
        };
        return (RGB[partialHex]);
    },


    /**
       * Returns object representation of an instance
       * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
       * @return {Object} Object representation of an instance
       */
    toObject: function (propertiesToInclude) {
        var NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS,

        object = {
            type: this.type,
            originX: this.originX,
            originY: this.originY,
            left: toFixed(this.left, NUM_FRACTION_DIGITS),
            top: toFixed(this.top, NUM_FRACTION_DIGITS),
            width: toFixed(this.width, NUM_FRACTION_DIGITS),
            height: toFixed(this.height, NUM_FRACTION_DIGITS),
            fill: (this.fill && this.fill.toObject) ? this.fill.toObject() : this.fill,
            stroke: (this.stroke && this.stroke.toObject) ? this.stroke.toObject() : this.stroke,
            strokeWidth: toFixed(this.strokeWidth, NUM_FRACTION_DIGITS),
            strokeDashArray: this.strokeDashArray,
            strokeLineCap: this.strokeLineCap,
            strokeLineJoin: this.strokeLineJoin,
            strokeMiterLimit: toFixed(this.strokeMiterLimit, NUM_FRACTION_DIGITS),
            scaleX: toFixed(this.scaleX, NUM_FRACTION_DIGITS),
            scaleY: toFixed(this.scaleY, NUM_FRACTION_DIGITS),
            angle: toFixed(this.getAngle(), NUM_FRACTION_DIGITS),
            flipX: this.flipX,
            flipY: this.flipY,
            opacity: toFixed(this.opacity, NUM_FRACTION_DIGITS),
            shadow: (this.shadow && this.shadow.toObject) ? this.shadow.toObject() : this.shadow,
            visible: this.visible,
            clipTo: this.clipTo && String(this.clipTo),
            backgroundColor: this.backgroundColor,
            fillRule: this.fillRule,
            globalCompositeOperation: this.globalCompositeOperation,
            /* ======================== Custom Changes for Artifi ==========================*/
            widgetType: this.widgetType,
            widgetSubType: this.widgetSubType,
            id: this.id,
            originalWidth: this.originalWidth,
            originalHeight: this.originalHeight,
            imageUniqueName: this.imageUniqueName,
            originalUrl: this.originalUrl,
            scaleFactor: this.scaleFactor,
            cropArea: this.cropArea,
            customFilters: this.customFilters, /** Added for applying remote Effects */
            currentWidgetWidth: toFixed(this.width, NUM_FRACTION_DIGITS) * toFixed(this.scaleX, NUM_FRACTION_DIGITS),
            currentWidgetHeight: toFixed(this.height, NUM_FRACTION_DIGITS) * toFixed(this.scaleY, NUM_FRACTION_DIGITS),
            ImageUniqueNameOnUGC: this.ImageUniqueNameOnUGC,
            decalId: this.decalId,
            libProp: this.libProp,
            printImage: this.get('printImage'),
            printImageMimeType: this.get('printImageMimeType'),
            caption: this.caption,
            widget_key: this.widget_key,
            group_key: this.group_key,
            price_key: this.price_key,
            src: (this._originalElement) ? this._originalElement.src || this._originalElement._src : "",
            filters: this.filters.map(function (filterObj) {
                return filterObj && filterObj.toObject();
            }),
            crossOrigin: this.crossOrigin
        };

        if (!this.includeDefaultValues) {
            object = this._removeDefaultValues(object);
        }

        fabric.util.populateWithProperties(this, object, propertiesToInclude);
        return object;
    },

});
/**
* Creates an instance of fabric.Image from an URL string
* @static
* @param {String} url URL to create an image from
* @param {Function} [callback] Callback to invoke when image is created (newly created image is passed as a first argument)
* @param {Object} [imgOptions] Options object
*/
fabric.Image.fromURL = function (url, callback, imgOptions) {
    fabric.util.loadImage(url, function (img) {
        /*============== Custom Changes For Artifi ===================*/
        /*
        * This changes is due to add error message when image is not loaded
        * When image is not loaded null will came in img variable 
        * We will return type : error insted of image and extra message parameter to show message
        */
        if (img == null) {
            var data = { type: "error", message: "Image is not loaded" };
            callback(data);
        }
        else {
            callback(new fabric.Image(img, imgOptions));
        }
    }, null, imgOptions && imgOptions.crossOrigin);
};
/* ====  Image End =====*/

/* ====  Audio Widget  =====*/
(function (global) {
    'use strict';
    /**
     * Getting methods needed for from Util class.
     */
    var fabric = global.fabric || (global.fabric = {}),
        extend = fabric.util.object.extend,
        clone = fabric.util.object.clone,
        toFixed = fabric.util.toFixed;

    if (fabric.Audio) {
        fabric.warn('fabric.Audio is already defined.');
        return;
    }
    if (!fabric.Image) {
        fabric.warn('fabric.Audio requires fabric.Image');
        return;
    }

    // Extend fabric.Image to include the necessary methods to render the text along a Arc.
    fabric.Audio = fabric.util.createClass(fabric.Image, {
        /**
        * Type of an object
        * @type String
        * @default
        */
        type: 'audio',

        /**
       * audioSrc value should be path of audio widget
       * @type String
       * @default	
       */
        audioSrc: "",

        /**
        * state value (should be one of "play", "pause") It define the current state of widget
        * @type String
        * @default
        */
        state: 'play',

        /**
         * loop value (should be one of "single", "repeat") It define the repeatation of track 
         * @type String
         * @default
         */
        loop: 'single',

        /**
         * duration value defines length of the track 
         * @type Number
         * @default
         */
        duration: 1,

        /**
         * muted value define is track is muted or not (should be one of true or false)
         * @type Boolean
         * @default
         */
        muted: false,

        /**
         * volume value (should be one of 0 to 5) it defines level of sound for track
         * @type Number
         * @default
         */
        volume: 5,

        /**
         * autoPlay value (should be one of true or false) it defines whether the track will be automatically played default.
         * @type Boolean
         * @default
         */
        autoPlay: true,

        /*for accessing cros domain images in canvas */
        crossOrigin: 'anonymous',

        /**
       * Add original Width  
       * @type number
       * @default
       */
        originalWidth: 50,
        /**
          * Add original Height
          * @type number
          * @default
          */
        originalHeight: 50,

        /*Initializing options and updating options if its value does not exists
       * @param: {Object} [objects] Object that needs to add
       * @param: {Object} [options] options that need to set
       * */
        initialize: function (element, options) {
            options || (options = {});
            this.callSuper('initialize', element, options);
            options && this.set(options);
        },
        /*We are avoiding this svg because we dont need this in PDF
        @return '';
        */
        toSVG: function () {
            return '';
        },
        /**
     * Returns object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
        toObject: function (propertiesToInclude) {
            return extend(this.callSuper('toObject', propertiesToInclude), {
                src: this._originalElement.src || this._originalElement._src,
                audioSrc: this.audioSrc,
                state: this.state,
                loop: this.loop,
                duration: this.duration,
                muted: this.muted,
                volume: this.volume,
                autoPlay: this.autoPlay,
                originalWidth: this.originalWidth || 50,
                originalHeight: this.originalHeight || 50,
                crossOrigin: this.crossOrigin
            });
        },
    });

    /**
  * Creates an instance of fabric.Audio from its object representation
  * @static
  * @param {Object} object Object to create an instance from
  * @param {Function} [callback] Callback to invoke when an image instance is created
  */
    fabric.Audio.fromObject = function (object, callback) {
        fabric.util.loadImage(object.src, function (img) {
            callback && callback(new fabric.Audio(img, object));
        }, null, object.crossOrigin);
    };
    fabric.Audio.async = true;

})(typeof exports != 'undefined' ? exports : this);
/* ====  Audio Widget End =====*/


/* ====  Static Canvas  =====*/
fabric.util.object.extend(fabric.StaticCanvas.prototype, /** @lends fabric.Path.prototype */ {

    /* ==================================== Custom Changes for Artifi Project ==================== */
    /**
      * @private
      * @param {String} property Property to set ({@link fabric.StaticCanvas#backgroundImage|backgroundImage}
      * or {@link fabric.StaticCanvas#overlayImage|overlayImage})
      * @param {(fabric.Image|String|null)} image fabric.Image instance, URL of an image or null to set background or overlay to
      * @param {Function} callback Callback to invoke when image is loaded and set as background or overlay
      * @param {Object} [options] Optional options to set for the {@link fabric.Image|image}.
      */
    /*Here we have added extra anonymus parameter to load cross-origin images as a overlay image */
    __setBgOverlayImage: function (property, image, callback, options) {
        if (typeof image === 'string') {
            fabric.util.loadImage(image, function (img) {
                this[property] = new fabric.Image(img, options);
                callback && callback();
            }, this, 'anonymus');
        }
        else {
            this[property] = image;
            callback && callback();
        }

        return this;
    },

    /**
     * @private
     * @param {String} property Property to set ({@link fabric.StaticCanvas#backgroundColor|backgroundColor}
     * or {@link fabric.StaticCanvas#overlayColor|overlayColor})
     * @param {(Object|String|null)} color Object with pattern information, color value or null
     * @param {Function} [callback] Callback is invoked when color is set
     */
    /*Here we have added extra anonymus parameter to load cross-origin images as a overlay image */
    __setBgOverlayColor: function (property, color, callback) {
        if (color && color.source) {
            var _this = this;
            fabric.util.loadImage(color.source, function (img) {
                _this[property] = new fabric.Pattern({
                    source: img,
                    repeat: color.repeat,
                    offsetX: color.offsetX,
                    offsetY: color.offsetY
                });
                callback && callback();
            }, this, 'anonymus');
        }
        else {
            this[property] = color;
            callback && callback();
        }

        return this;
    },

    /**
    * @private
    */
    /*Here we have added extra anonymus parameter to load cross-origin images as a overlay image */
    __serializeBgOverlay: function () {
        var data = {
            background: (this.backgroundColor && this.backgroundColor.toObject)
              ? this.backgroundColor.toObject()
              : this.backgroundColor
        };

        if (this.overlayColor) {
            data.overlay = this.overlayColor.toObject
              ? this.overlayColor.toObject()
              : this.overlayColor;
        }
        if (this.backgroundImage) {
            data.backgroundImage = this.backgroundImage.toObject();
        }
        if (this.overlayImage) {
            data.overlayImage = this.overlayImage.toObject();
        }
        /* ==================================== Custom Changes for Artifi Project ==================== */
        if (this.maskData) {
            data.maskData = this.maskData;
        }

        return data;
    },

    /**
    * @private
    */
    _setSVGHeader: function (markup, options) {
        var width, height, vpt, xPosition, yPosition;

        if (options.viewBox) {
            width = options.viewBox.width;
            height = options.viewBox.height;
        }
        else {
            width = this.width;
            height = this.height;
            if (!this.svgViewportTransformation) {
                vpt = this.viewportTransform;
                width /= vpt[0];
                height /= vpt[3];
            }
        }
        /* ==================================== Custom Changes for Artifi Project ==================== */
        /*========================== To fix PDF position issue ========================== */
        if (typeof options.xPosition != "undefined" && typeof options.yPosition != "undefined") {
            xPosition = options.xPosition;
            yPosition = options.yPosition;
        }
        markup.push(
          '<svg ',
            'xmlns="http://www.w3.org/2000/svg" ',
            'xmlns:xlink="http://www.w3.org/1999/xlink" ',
            'version="1.1" ',
            'width="', options.printAreaWidth, '" ',
            'height="', options.printAreaHeight, '" ',
            'x="' + xPosition + '" ',
            'y="' + yPosition + '" ',
            (this.backgroundColor && !this.backgroundColor.toLive
              ? 'style="background-color: ' + this.backgroundColor + '" '
              : null),
            (options.viewBox
                ? 'viewBox="' +
                  options.viewBox.x + ' ' +
                  options.viewBox.y + ' ' +
                  options.viewBox.width + ' ' +
                  options.viewBox.height + '" '
                : null),
            'xml:space="preserve">',
          '<desc>Created with Fabric.js ', fabric.version, '</desc>',
          '<defs>',
            fabric.createSVGFontFacesMarkup(this.getObjects()),
            fabric.createSVGRefElementsMarkup(this),
          '</defs>'
        );
    },

    /**
     * @private
     */
    _toObjectMethod: function (methodName, propertiesToInclude) {
        var activeGroup = this.getActiveGroup();
        if (activeGroup) {
            this.discardActiveGroup();
        }

        var objects = this._toObjects(methodName, propertiesToInclude);
        /* ==================================== Custom Changes for Artifi Project ==================== */
        /*==================================== Remove CustomPath objects from objects array ==================*/
        var data = {
            objects: objects.filter(function (o) { return o.type != 'CustomPath'; })
        };

        extend(data, this.__serializeBgOverlay());
        fabric.util.populateWithProperties(this, data, propertiesToInclude);
        if (activeGroup) {
            this.setActiveGroup(new fabric.Group(activeGroup.getObjects(), {
                originX: 'center',
                originY: 'center'
            }));
            activeGroup.forEachObject(function (o) {
                o.set('active', true);
            });

            if (this._currentTransform) {
                this._currentTransform.target = this.getActiveGroup();
            }
        }

        return data;
    },

    /**
        * @private
        * @param {fabric.Object} obj Object that was removed
        */
    _onObjectRemoved: function (obj) {
        //removing active object should fire "selection:cleared" events
        if (this.getActiveObject() === obj && obj.type != 'CustomPath') {
            this.fire('before:selection:cleared', { target: obj });
            this._discardActiveObject();
            this.fire('selection:cleared');
        }
        this.fire('object:removed', { target: obj });
        obj.fire('removed');
    }
});
/* ====  Static Canvas End  =====*/

/* ====  Util   =====*/
fabric.util.object.extend(fabric.util, /** @lends fabric.Path.prototype */ {
    /**
    * Add used in image quality by anti-alising.
    * @type boolean
    * @default
    */
    antiAliseImage: false,

    /* ==================================== Custom Changes for Artifi Project ==================== */
    /**
    * This method used to improve image quality by anti-alising it
    * Anti-alise in the sence re-drawing it multiple times from larger size to smaller size
    * Here we achieved the same by scaling down image gradually rather than directly in no. of steps.
    * Steps is with image width, height and desired image width and height
    * @private 
    * @param {imageElement} image element on which operation have to perform
    * @param {requireWidth} require image dimention width area when anti alise image
    * @param {requireHeight} require image dimention height area when anti alise image
    */

    antiAlise: function (imageElement, totalWidth, totalHeight) {
        try {
            /* Creating desire variable needed for calculation*/
            var steps,
                originalCanvas = document.createElement('canvas'),
                ctx = originalCanvas.getContext('2d'),
                finalCanvas = document.createElement('canvas'),
                w = imageElement.width,
                h = imageElement.height;
            /* Assigning width and height to the canvas element created*/
            originalCanvas.width = w;
            originalCanvas.height = h;
            finalCanvas.width = totalWidth;
            finalCanvas.height = totalHeight;
            /* Calculated steps */
            if ((w / totalWidth) > (h / totalHeight)) {
                steps = Math.ceil(Math.log(w / totalWidth) / Math.log(2));
            } else {
                steps = Math.ceil(Math.log(h / totalHeight) / Math.log(2));
            }
            /* If steps found is less than one then direcly drawing image element on camvas and returning the same
            */
            if (steps <= 1) {
                ctx = finalCanvas.getContext('2d');
                ctx.drawImage(imageElement, 0, 0, totalWidth, totalHeight);
                return finalCanvas;
            }
            /* First time drawing image with full canvas area
            */
            ctx.drawImage(imageElement, 0, 0);
            steps--;

            /* Created temparary canvas element 
            */
            var tempCanvas = document.createElement('canvas');
            var tctx = tempCanvas.getContext('2d');

            /* 
            * If steps found is greatter than one then redrawing it with half width and height of previous canvas width and height till steps is greatter then zero
           */
            while (steps > 0) {
                w *= 0.5;
                h *= 0.5;
                w = parseInt(w);
                h = parseInt(h);
                tempCanvas.width = w * 2;
                tempCanvas.height = h * 2;
                tctx.drawImage(originalCanvas, 0, 0);
                ctx.clearRect(0, 0, w * 2, h * 2);
                originalCanvas.width = w;
                originalCanvas.height = h;
                var clipW = w * 2;
                var clipH = h * 2;

                ctx.drawImage(tempCanvas, 0, 0, clipW, clipH, 0, 0, w, h);
                tctx.clearRect(0, 0, w * 2, h * 2);
                steps--;
            }
            /* 
            * If desire image width and height is less than 30 then making imageSmoothingEnabled false
           */
            ctx = finalCanvas.getContext('2d');
            if (totalWidth < 30 && totalHeight < 30) {
                ctx.mozImageSmoothingEnabled = ctx.webkitImageSmoothingEnabled = ctx.imageSmoothingEnabled = false;/*FOR ENABLING SMOOTHENING IMAGE for */
            }
            else {
                ctx.mozImageSmoothingEnabled = ctx.webkitImageSmoothingEnabled = ctx.imageSmoothingEnabled = true;/*FOR ENABLING SMOOTHENING IMAGE*/
            }
            /* 
            * Drawing scaled canvas context to final canvas and returning final canvas context
           */
            ctx.drawImage(originalCanvas, 0, 0, w, h, 0, 0, totalWidth, totalHeight);
            return finalCanvas;
        }
        catch (err) {
            //console.log(err);
            /*If any error occure then returning original image element*/
            return imageElement;
        }
    },

    /**
   * This method used to set anti-alise flag which will be used for improving image quality 
   * @public 
   * @param {flag} boolean value which have to set in flag otherwise set true by default
   */
    setAntiAliseFlag: function (flag) {
        fabric.util.antiAliseImage = (typeof flag == "boolean") ? flag : true;
    },
    /*method to convert Hex color to RGB color code
               * @param{hex}: hex HEX color code
               * @returns: RGB color code
               */
    hexToRgb: function (hex) {
        if (hex == null) {
            return;
        }
        hex = hex.replace(/[^0-9A-F]/gi, '');
        var bigint = parseInt(hex, 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;
        return [r, g, b];
    },

    /*method to convert RGB color to hex color code
     * @param{rgb}: rgb RGB color code
     * @returns: hexadecimal color code
     */
    rgb2Hex: function (rgb) {
        rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        return (rgb && rgb.length === 4) ? "#" +
         ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
         ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
         ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
    },

});
/* ====  Util End  =====*/

/* ====  Object  =====*/
fabric.util.object.extend(fabric.Object.prototype,/** @lends fabric.Object.prototype */ {

    /**=================================Custom Changes for Artifi Project ======================================*/
    /*Following are the custom propertys according to business logic of Artifi */
    /**
   * Add new subtype for Image type
   * @type string
   * @default
   */
    widgetSubType: null,
    /**
   * Add new subtype for widget such as Image, TextBox, etc.
   * @type string
   * @default
   */
    widgetType: null,
    /**
   * Add new id for diff objects for Identification
   * @type string
   * @default
   */
    id: null,
    /**
   * Add original Width  
   * @type number
   * @default
   */
    originalWidth: 50,
    /**
  * Add original Height
  * @type number
  * @default
  */
    originalHeight: 50,
    /**
  * Add current widget width same as currentWidth
  * @type number
  * @default
  */
    currentWidgetWidth: 50,
    /**
  * Add current widget height same as currentHeight
  * @type number
  * @default
  */
    currentWidgetHeight: 50,

    /**
  * Add Decal Id for 3d preview
  * @type string
  * @default
  */
    decalId: null,

    libProp: {},

    caption: null,
    widget_key: null,
    group_key: null,
    price_key: null,

    /**
* List of properties to consider when checking if state
* of an object is changed (fabric.Object#hasStateChanged)
* as well as for history (undo/redo) purposes
* @type Array
*/
    stateProperties: (
      'top left width height scaleX scaleY flipX flipY originX originY transformMatrix ' +
      'stroke strokeWidth strokeDashArray strokeLineCap strokeLineJoin strokeMiterLimit ' +
      'angle opacity fill fillRule globalCompositeOperation shadow clipTo visible backgroundColor' +
	  /* ======================== Custom Changes for Artifi ==========================*/
	  'widgetType widgetSubtType id originalWidth originalHeight imageUniqueName ImageUniqueNameOnUGC originalUrl scaleFactor cropArea  customFilters currentWidgetWidth currentWidgetHeight decalId libProp,caption,widget_key,group_key,price_key'
    ).split(' '),


    /**
    * Returns an object representation of an instance
    * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
    * @return {Object} Object representation of an instance
    */
    toObject: function (propertiesToInclude) {
        var NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS,

            object = {
                type: this.type,
                originX: this.originX,
                originY: this.originY,
                left: toFixed(this.left, NUM_FRACTION_DIGITS),
                top: toFixed(this.top, NUM_FRACTION_DIGITS),
                width: toFixed(this.width, NUM_FRACTION_DIGITS),
                height: toFixed(this.height, NUM_FRACTION_DIGITS),
                fill: (this.fill && this.fill.toObject) ? this.fill.toObject() : this.fill,
                stroke: (this.stroke && this.stroke.toObject) ? this.stroke.toObject() : this.stroke,
                strokeWidth: toFixed(this.strokeWidth, NUM_FRACTION_DIGITS),
                strokeDashArray: this.strokeDashArray,
                strokeLineCap: this.strokeLineCap,
                strokeLineJoin: this.strokeLineJoin,
                strokeMiterLimit: toFixed(this.strokeMiterLimit, NUM_FRACTION_DIGITS),
                scaleX: toFixed(this.scaleX, NUM_FRACTION_DIGITS),
                scaleY: toFixed(this.scaleY, NUM_FRACTION_DIGITS),
                angle: toFixed(this.getAngle(), NUM_FRACTION_DIGITS),
                flipX: this.flipX,
                flipY: this.flipY,
                opacity: toFixed(this.opacity, NUM_FRACTION_DIGITS),
                shadow: (this.shadow && this.shadow.toObject) ? this.shadow.toObject() : this.shadow,
                visible: this.visible,
                clipTo: this.clipTo && String(this.clipTo),
                backgroundColor: this.backgroundColor,
                fillRule: this.fillRule,
                globalCompositeOperation: this.globalCompositeOperation,
                /* ======================== Custom Changes for Artifi ==========================*/
                widgetType: this.widgetType,
                widgetSubType: this.widgetSubType,
                id: this.id,
                originalWidth: this.originalWidth,
                originalHeight: this.originalHeight,
                imageUniqueName: this.imageUniqueName,
                originalUrl: this.originalUrl,
                scaleFactor: this.scaleFactor,
                cropArea: this.cropArea,
                customFilters: this.customFilters,/** Added for applying remote Effects */
                currentWidgetWidth: toFixed(this.width, NUM_FRACTION_DIGITS) * toFixed(this.scaleX, NUM_FRACTION_DIGITS),
                currentWidgetHeight: toFixed(this.height, NUM_FRACTION_DIGITS) * toFixed(this.scaleY, NUM_FRACTION_DIGITS),
                ImageUniqueNameOnUGC: this.ImageUniqueNameOnUGC,
                decalId: this.decalId,
                libProp: this.libProp,

                /*These properties are added for Master Lock*/
                caption: this.caption,
                widget_key: this.widget_key,
                group_key: this.group_key,
                price_key: this.price_key,


            };

        if (!this.includeDefaultValues) {
            object = this._removeDefaultValues(object);
        }

        fabric.util.populateWithProperties(this, object, propertiesToInclude);
        return object;
    },
});
/* ====  Object End   =====*/

/* ==========Path Group Object Start ==========*/
fabric.util.object.extend(fabric.PathGroup.prototype,/** @lends fabric.PathGroup.prototype */ {

    /**
 * Add SVG (URL/path) svg masking
 * @type string
 * @default
 */
    svgData: null,

    /**
     * Returns object representation of this path group
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} object representation of an instance
     */
    toObject: function (propertiesToInclude) {
        var o = extend(parentToObject.call(this, propertiesToInclude), {
            paths: invoke(this.getObjects(), 'toObject', propertiesToInclude),
            svgData: this.svgData
        });
        if (this.sourcePath) {
            o.sourcePath = this.sourcePath;
        }
        return o;
    },

});
/* ==========Path Group Object End ==========*/

/* ====  Textbox Class=====*/
(function (global) {
    "use strict";
    /**
     * fabric.Textbox A class to create TextBoxes, with or without images as their boxes
     */

    var fabric = global.fabric || (global.fabric = {}),
        extend = fabric.util.object.extend,
        clone = fabric.util.object.clone,
        toFixed = fabric.util.toFixed;

    if (fabric.Textbox) {
        fabric.warn('fabric.Textbox is already defined');
        return;
    }
    if (!fabric.Object) {
        fabric.warn('fabric.Textbox requires fabric.Object');
        return;

    }
    var fabric = global.fabric || (global.fabric = {}),
        extend = fabric.util.object.extend,
        clone = fabric.util.object.clone,
        toFixed = fabric.util.toFixed;
    var _metrics = new Object();
    fabric.Textbox = fabric.util.createClass(fabric.Text, {
        type: 'textbox',
        vAlign: 'middle',
        textPadding: 0,
        originalFontSize: 50,
        textDecorationArr: [],
        cachedAscentDescentDictionary: [],

        initialize: function (objects, options) {
            options || (options = {});
            this.callSuper('initialize', objects, options);
            this.set('vAlign', options.vAlign || 'middle');
        },

        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                vAlign: this.get('vAlign'),
                width: this.get('width'),
                height: this.get('height'),
                originalFontSize: this.get('originalFontSize')

            });
        },

        _render: function (ctx) {
            this.callSuper('_render', ctx);
        },

        _getTextWidth: function (ctx, textLines) {
            var maxWidth = ctx.measureText(textLines[0]).width;
            for (var i = 1, len = textLines.length; i < len; i++) {
                var currentLineWidth = ctx.measureText(textLines[i]).width;
                if (currentLineWidth > maxWidth) {
                    maxWidth = currentLineWidth;
                }
            }

            var actualWidth = this.width;
            if (actualWidth < maxWidth) {
                actualWidth = maxWidth;
            }

            return actualWidth;
        },

        _getTextHeight: function (ctx, textLines) {
            var actualHeight = this.height;
            //As line height is not applicable on first line so changed the logic for calculating calculated height
            var calculatedHeight = (this.fontSize * (textLines.length - 1) * this.lineHeight) + this.fontSize;
            if (actualHeight < calculatedHeight) {
                actualHeight = calculatedHeight;
            }

            return actualHeight;
        },

        _getTopPosition: function (ctx, textLines) {
            if (this.vAlign === "top") {
                return -this.height / 2;
            }
            else if (this.vAlign === 'bottom') {
                return this.height / 2;
            }

            return 0;
        },

        _getTopOffset: function (ctx, textLines) {
            if (fabric.isLikelyNode) {
                if (this.originY === 'center') {
                    return -this.height / 2;
                }
                else if (this.originY === 'bottom') {
                    return -this.height;
                }
                return 0;
            }
        },

        getTextPadding: function (scale) {
            if (!scale) scale = "x";
            else scale = scale.toLowerCase();
            var scales = {};
            scales.x = this.get("scaleX");
            scales.y = this.get("scaleY");
            return this.textPadding * scales[scale];
        },

        getTopPositionOfText: function (ctx, textLines, totalLineHeight, lineHeights, top) {
            //var metrics = this._getAscentDescent();
            //_metrics = metrics;

            if (this.vAlign === 'bottom') {
                if (textLines.length == 1) {
                    lineHeights = 0;
                    top = this._getTopPosition(ctx, textLines) + lineHeights;
                }
                else {
                    top = this._getTopPosition(ctx, textLines) - (totalLineHeight + this.getTextPadding('y')) + lineHeights;
                }
            }
            else if (this.vAlign === 'middle') {
                top = this._getTopPosition(ctx, textLines) - (totalLineHeight + this.getTextPadding('y')) / 2 + lineHeights;
                //top =top/2;
            }
            else if (this.vAlign === 'top') {
                top = this._getTopPosition(ctx, textLines) + lineHeights;
            }

            return top;
        },

        /**
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Array} textLines Array of all text lines
        */
        _renderTextLinesBackground: function (ctx, textLines) {
            if (!this.textBackgroundColor) return;
            ctx.save();
            ctx.fillStyle = this.textBackgroundColor;
            var lineHeights = 0;
            var top = 0;
            for (var i = 0, len = textLines.length; i < len; i++) {
                var heightOfLine = this._getHeightOfLine(ctx, i, textLines);
                lineHeights += heightOfLine;
                //var totalLineHeight = textLines.length * heightOfLine;                
                //As line height is not applicable on first line so changed the logic for calculating total line height
                var totalLineHeight = (this.fontSize * (textLines.length - 1) * this.lineHeight) + this.fontSize;
                top = this.getTopPositionOfText(ctx, textLines, totalLineHeight, lineHeights, top);
                top = top - heightOfLine;
                if (textLines[i] !== '') {
                    var lineWidth = this._getLineWidth(ctx, textLines[i]);
                    var lineLeftOffset = this._getLineLeftOffset(lineWidth);
                    ctx.fillRect(
					this._getLeftOffset() + lineLeftOffset,
					// this._getTopOffset() + (i * this.fontSize * this.lineHeight),
					top, lineWidth, this.fontSize * this.lineHeight);
                }
            }
            ctx.restore();
        },

        _getAscentDescent: function () {
            var key = this.fontFamily + "_" + this.fontSize;
            var metrics = new Object();
            var text = "fgqx";
            var width = 68.474; //ctx.measureText(text).width;
            if (this.cachedAscentDescentDictionary[key]) {
                metrics = this.cachedAscentDescentDictionary[key];
            }
            else {
                metrics = this._ascentDescent(width, text, this.fontFamily, this.fontSize);
                this.cachedAscentDescentDictionary[key] = { ascent: metrics.ascent, descent: metrics.descent };
            }

            return metrics;
        },

        _ascentDescent: function (width, textstring, fontFamily, fontSize) {
            var metrics = new Object();
            metrics.fontsize = fontSize;
            var canvas = document.createElement("canvas");
            var padding = 100;
            canvas.width = width + padding;
            canvas.height = 3 * fontSize;
            canvas.style.opacity = 1;
            canvas.style.fontFamily = fontFamily;
            canvas.style.fontSize = fontSize;

            var ctx = canvas.getContext("2d");
            ctx.font = fontSize + "px " + fontFamily;

            // for text lead values, we meaure a multiline text container.
            //var leadDiv = document.createElement("div");
            //leadDiv.style.position = "absolute";
            //leadDiv.style.opacity = 0;
            //leadDiv.style.font = fontSize + "px " + fontFamily;
            //leadDiv.innerHTML = textstring + "<br/>" + textstring;
            //document.body.appendChild(leadDiv);

            var w = canvas.width,
                h = canvas.height,
            baseline = h / 2;

            // Set all canvas pixeldata values to 255, with all the content
            // data being 0. This lets us scan for data[i] != 255.
            ctx.fillStyle = "white";
            ctx.fillRect(-1, -1, w + 2, h + 2);
            ctx.fillStyle = "black";
            ctx.fillText(textstring, padding / 2, baseline);
            var pixelData = ctx.getImageData(0, 0, w, h).data;

            // canvas pixel data is w*4 by h*4, because R, G, B and A are separate,
            // consecutive values in the array, rather than stored as 32 bit ints.
            var i = 0,
            w4 = w * 4,
            len = pixelData.length;

            // Finding the ascent uses a normal, forward scanline
            while (++i < len && pixelData[i] === 255) { }
            var ascent = (i / w4) | 0;


            // Finding the descent uses a reverse scanline
            i = len - 1;
            while (--i > 0 && pixelData[i] === 255) { }
            var descent = (i / w4) | 0;

            // find the min-x coordinate
            //for(i = 0; i<len && pixelData[i] === 255; ) {
            //    i += w4;
            //    if(i>=len) {
            //        i = (i -len) +4;
            //    }
            //}

            //var minx = ((i%w4)/4) | 0;

            // find the max-x coordinate
            //var step = 1;
            //for(i = len-3; i>=0 && pixelData[i] === 255; ) {
            //    i -= w4;
            //    if (i<0) {
            //        i = (len -3) -(step++) * 4;
            //    }
            //}

            //var maxx = ((i%w4)/4) + 1 | 0;

            // set font metrics
            metrics.ascent = (baseline - ascent);
            metrics.descent = (descent - baseline);
            //metrics.bounds = { minx: minx - (padding/2),
            //maxx: maxx - (padding/2),
            //miny: 0,
            //maxy: descent-ascent };
            //metrics.height = 1+(descent - ascent);

            // make some initial guess at the text leading (using the standard TeX ratio)
            //metrics.leading = 1.2 * fontSize;

            // then we try to get the real value from the browser
            //var leadDivHeight = getCSSValue(leadDiv,"height");
            //leadDivHeight = leadDivHeight.replace("px","");
            //if (leadDivHeight >= fontSize * 2) { metrics.leading = (leadDivHeight/2) | 0; }
            //document.body.removeChild(leadDiv); 

            // show the canvas and bounds if required
            //if(debug){show(canvas, ctx, 50, w, h, metrics);}

            return metrics;
        },

        /**
		 * @private
		 * @param {CanvasRenderingContext2D} ctx Context to render on
		 * @param {Array} textLines Array of all text lines
		 */
        _renderTextFill: function (ctx, textLines) {
            if (!this.fill && !this.skipFillStrokeCheck) return;

            this._boundaries = [];
            var lineHeights = 0;
            var top = 0;
            for (var i = 0, len = textLines.length; i < len; i++) {
                var heightOfLine = this._getHeightOfLine(ctx, i, textLines);
                lineHeights += heightOfLine;
                //As line height is not applicable on first line so changed the logic for calculating total line height
                var totalLineHeight = (this.fontSize * (textLines.length - 1) * this.lineHeight) + this.fontSize; //textLines.length * heightOfLine;// code change
                top = this.getTopPositionOfText(ctx, textLines, totalLineHeight, lineHeights, top);
                //To adjust position correctly
                //top -= 3;
                this._drawTextLine('fillText', ctx, textLines[i], this._getLeftOffset(), top, i);
            }
            /* method for getting SVG markup for applying shadow filter to text
             * param{object}: textbox value object
             * returns{string}:  shadow filter svg markup
             */
        },
        toShadowFilter: function (object) {
            var _this = this;
            var shadow = object.shadow;
            var fBoxX = 40, fBoxY = 40;
            if (object.width && object.height) {
                /** we add some extra space to filter box to contain the blur ( 20 )*/
                if (object.shadow) {
                    fBoxX = toFixed((Math.abs(object.shadow.offsetX) + object.shadow.blur) / object.width, 2) * 100 + 20;
                    fBoxY = toFixed((Math.abs(object.shadow.offsetY) + object.shadow.blur) / object.height, 2) * 100 + 20;
                }
            }
            /*converting shadow color into hex color format */
            var hexColor = fabric.util.rgb2Hex(shadow.color);
            var opacity = 1;
            /*getting the opacity of shadow*/
            var regExp = /\(([^)]+)\)/;
            var rgbArray = regExp.exec(shadow.color);
            if (rgbArray) {
                var splits = rgbArray[1].split(',');
                opacity = splits[3];
            }
            var filtersMarkup = '\t<feGaussianBlur in="SourceAlpha" stdDeviation="' +
                                           toFixed(shadow.blur ? shadow.blur / 3 : 0, 3) + '"></feGaussianBlur>\n' +
                                         '\t<feOffset dx="' + shadow.offsetX + '" dy="' + shadow.offsetY + '" result="oBlur" ></feOffset>\n' +
                                         '\t<feFlood flood-color="' + hexColor + '" flood-opacity="' + opacity + '"/>\n' +
                                         '\t<feComposite in2="oBlur" operator="in" result="shadow" />\n' +
                                      '\t\t<feMerge><feMergeNode in="shadow"></feMergeNode>' +
                                      '<feMergeNode in="SourceGraphic"></feMergeNode></feMerge>\n';
            if (object.shadow) {
                return ('<filter id="SVGID_' + shadow.id + '" y="-' + fBoxY + '%" height="' + (100 + 2 * fBoxY) + '%" ' +
                                        'x="-' + fBoxX + '%" width="' + (100 + 2 * fBoxX) + '%" ' + '>\n' + filtersMarkup + '</filter>\n');
            }
        },

        //As Line height is not applicable on first line so extending the _getHeightOfLine function
        _getHeightOfLine: function (ctx, lineIndex, textLines) {
            if (lineIndex > 0) {
                return this.fontSize * this.lineHeight;
            }

            return this.fontSize;
        },

        /* _TO_SVG_START_ */
        /**
         * Returns SVG representation of an instance
         * @return {String} svg representation of an instance
         */
        toSVG: function () {
            //var tempHeight = this.height;
            var textLines = this.text.split(/\r?\n/);
            var offsets = this._getSVGLeftTopOffsets(textLines);
            var textAndBg = this._getSVGTextAndBg(offsets.lineTop, offsets.textLeft, textLines);
            /*var shadowSpans = this._getSVGShadows(offsets.lineTop, textLines);*/
            var NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS;
            //var suvTransform = this.getSvgTransform(textLines);

            //Code will calculate the text transform based on vAlign
            var totalLineHeight = (this.fontSize * (textLines.length - 1) * this.lineHeight) + this.fontSize;
            if (this.vAlign === 'middle') {
                offsets.textTop = offsets.textTop + toFixed(((this.height - totalLineHeight) / 2), NUM_FRACTION_DIGITS);
            }
            else if (this.vAlign === 'bottom') {
                offsets.textTop = offsets.textTop + toFixed(this.height - totalLineHeight, NUM_FRACTION_DIGITS);
            }


            /*if shadow is appplied to textbox then apply shadow filter to text*/
            var shadowfilter = this.shadow ? this.toShadowFilter(this) : '';

            //To adjust position correctly
            //offsets.textTop -= 2;
            return [
                    this.shadow ? shadowfilter : '',
                        '<g transform="', this.getSvgTransform(textLines), this.getSvgTransformMatrix(), '">\n',
                            textAndBg.textBgRects.join(''),
                            '<text ',
                             (this.fontFamily ? 'font-family="' + this.fontFamily.replace(/"/g, '\'') + '" ' : ''),
                             (this.fontSize ? 'font-size="' + this.fontSize + '" ' : ''),
                             (this.fontStyle ? 'font-style="' + this.fontStyle + '" ' : ''),
                             (this.fontWeight ? 'font-weight="' + this.fontWeight + '" ' : ''),
                             //(this.textDecoration ? 'text-decoration="' + this.textDecoration + '" ' : ''),
                            'style="', this.getSvgStyles(), '" ',
                            /* svg starts from left/bottom corner so we normalize height */
                            'transform="translate(', toFixed(offsets.textLeft, 2), ' ', toFixed(offsets.textTop, 2), ')">',
                            textAndBg.textSpans.join(''),
                            '</text>\n',
                        '</g>\n'
            ].join('');
        },

        /**
         * @private
         * @param {Number} lineHeight
         * @param {Number} textLeftOffset Text left offset
         * @param {Array} textLines Array of all text lines
         * @return {Object}
        **/
        _getSVGTextAndBg: function (lineHeight, textLeftOffset, textLines) {
            var textSpans = [],
                textBgRects = [],
                lineTopOffsetMultiplier = 1;

            // bounding-box background
            this._setSVGBg(textBgRects);

            if (this.textDecoration) {
                this._drawTextDecorationAsRect(textBgRects, textLines);
            }

            // text and text-background
            for (var i = 0, len = textLines.length; i < len; i++) {
                if (textLines[i] !== '') {
                    this._setSVGTextLineText(textLines[i], i, textSpans, lineHeight, lineTopOffsetMultiplier, textBgRects);
                    lineTopOffsetMultiplier = 1;
                }
                else {
                    // in some environments (e.g. IE 7 & 8) empty tspans are completely ignored, using a lineTopOffsetMultiplier
                    // prevents empty tspans
                    lineTopOffsetMultiplier++;
                }

                if (!this.textBackgroundColor || !this._boundaries) {
                    continue;
                }

                this._setSVGTextLineBg(textBgRects, i, textLeftOffset, lineHeight);
            }

            return {
                textSpans: textSpans,
                textBgRects: textBgRects
            };
        },

        _drawTextDecorationAsRect: function (textBgRects, textLines) {
            var _this = this;
            var lineHeights = 0;
            var top = 0;
            var totalLineHeight = (this.fontSize * (textLines.length - 1) * this.lineHeight) + this.fontSize;
            function renderLinesAtOffset(offset) {
                for (var i = 0, len = textLines.length; i < len; i++) {
                    var heightOfLine = _this._getHeightOfLine('', i, textLines);
                    lineHeights += heightOfLine;
                    top = _this.getTopPositionOfText('', textLines, totalLineHeight, lineHeights, top);
                    top = top + 1;
                    var lineWidth = _this.textDecorationArr[i].lW;
                    var x = _this.textDecorationArr[i].lLO;

                    textBgRects.push(
                      '<rect ',
                        ' x="',
                        x,
                        '" y="',
                        top,
                        '" width="',
                        lineWidth,
                        '" height="',
                        _this.fontSize / 15,
                      '"></rect>'
                        );
                }
            }

            var fractionOfFontSize = this.fontSize / 4;
            if (this.textDecoration.indexOf('underline') > -1) {
                renderLinesAtOffset(0 - 5);
            }
            if (this.textDecoration.indexOf('line-through') > -1) {
                renderLinesAtOffset(fractionOfFontSize);
            }
            if (this.textDecoration.indexOf('overline') > -1) {
                renderLinesAtOffset(this.fontSize * this.lineHeight - fractionOfFontSize);
            }
        },


        /* @private
                 * @param {CanvasRenderingContext2D} ctx Context to render on
                 */
        _renderTextBoxBackground: function (ctx) {
            //this.backgroundColor = "#aa5657";
            if (!this.backgroundColor) return;
            var lineHeights = 0;
            var top = 0;
            var textLines = this.text.split(/\r?\n/);
            var heightOfLine = this._getHeightOfLine(ctx, 1, textLines);
            lineHeights += heightOfLine;
            //As line height is not applicable on first line so changed the logic for calculating total line height            
            var totalLineHeight = (this.fontSize * (textLines.length - 1) * this.lineHeight) + this.fontSize; //textLines.length * heightOfLine;
            top = this.getTopPositionOfText(ctx, textLines, totalLineHeight, lineHeights, top);
            //top -= 3;
            ctx.save();
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(
            this._getLeftOffset(), -this.height / 2,
            //this._getTopOffset(),
            this.width, this.height);

            ctx.restore();
        },

        /**
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Array} textLines Array of all text lines
         */
        _renderTextDecoration: function (ctx, textLines) {
            var lineHeights = 0;
            var top = 0;
            if (!this.textDecoration) return;

            // var halfOfVerticalBox = this.originY === 'top' ? 0 : this._getTextHeight(ctx, textLines) / 2;
            var halfOfVerticalBox = this._getTextHeight(ctx, textLines) / 2;
            var _this = this;

            /** @ignore */

            var totalLineHeight = (this.fontSize * (textLines.length - 1) * this.lineHeight) + this.fontSize;
            function renderLinesAtOffset(offset) {
                for (var i = 0, len = textLines.length; i < len; i++) {
                    var heightOfLine = _this._getHeightOfLine(ctx, i, textLines);
                    lineHeights += heightOfLine;
                    top = _this.getTopPositionOfText(ctx, textLines, totalLineHeight, lineHeights, top);
                    top = top + 1;
                    var lineWidth = _this._getLineWidth(ctx, textLines[i]);
                    var lineLeftOffset = _this._getLineLeftOffset(lineWidth);
                    var x = _this._getLeftOffset() + lineLeftOffset;
                    _this.textDecorationArr[i] = { lW: lineWidth, lLO: x };
                    ctx.fillRect(
                    x,
                    //(offset + (i * _this._getHeightOfLine(ctx, i, textLines))) - halfOfVerticalBox,
                    top, lineWidth, 1);
                    /*1 is used For Line thikness of */
                }
            }

            var fractionOfFontSize = this.fontSize / 4;
            if (this.textDecoration.indexOf('underline') > -1) {
                renderLinesAtOffset(0 - 5);
            }
            if (this.textDecoration.indexOf('line-through') > -1) {
                renderLinesAtOffset(fractionOfFontSize);
            }
            if (this.textDecoration.indexOf('overline') > -1) {
                renderLinesAtOffset(this.fontSize * this.lineHeight - fractionOfFontSize);
            }
        },

        /**
       * @private
       * @param {CanvasRenderingContext2D} ctx Context to render on
       * @param {Array} textLines Array of all text lines
       */
        _renderTextStroke: function (ctx, textLines) {
            if (!this.stroke && !this.skipFillStrokeCheck) return;
            var lineHeights = 0;
            var top = 0;
            ctx.save();

            if (this.strokeDashArray) {
                // Spec requires the concatenation of two copies the dash list when the number of elements is odd
                if (1 & this.strokeDashArray.length) {
                    this.strokeDashArray.push.apply(this.strokeDashArray, this.strokeDashArray);
                }
                supportsLineDash && ctx.setLineDash(this.strokeDashArray);
            }

            ctx.beginPath();
            for (var i = 0, len = textLines.length; i < len; i++) {
                var heightOfLine = this._getHeightOfLine(ctx, i, textLines);
                lineHeights += heightOfLine;
                //var totalLineHeight = textLines.length * heightOfLine;
                //As Line Height is not applicable on first line so change the total line height calculation
                var totalLineHeight = (this.fontSize * (textLines.length - 1) * this.lineHeight) + this.fontSize;
                top = this.getTopPositionOfText(ctx, textLines, totalLineHeight, lineHeights, top);
                //top -= 3;               

                this._drawTextLine(
                  'strokeText',
                  ctx,
                  textLines[i],
                  this._getLeftOffset(),
                  top,
                  i
                );
            }
            ctx.closePath();
            ctx.restore();
        },
        /**
         * @private
         * @param {String} method Method name ("fillText" or "strokeText")
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {String} line Text to render
         * @param {Number} left Left position of text
         * @param {Number} top Top position of text
         * @param {Number} lineIndex Index of a line in a text
         */
        _drawTextLine: function (method, ctx, line, left, top, lineIndex) {
            // short-circuit
            if (this.textAlign !== 'justify') {
                this._drawChars(method, ctx, line, left, top, lineIndex);
                return;
            }

            var lineWidth = ctx.measureText(line).width;
            var totalWidth = this.width;

            if (totalWidth > lineWidth) {
                // stretch the line
                var words = line.split(/\s+/);
                var wordsWidth = ctx.measureText(line.replace(/\s+/g, '')).width;
                var widthDiff = totalWidth - wordsWidth;
                var numSpaces = words.length - 1;
                var spaceWidth = widthDiff / numSpaces;

                var leftOffset = 0;
                for (var i = 0, len = words.length; i < len; i++) {
                    this._drawChars(method, ctx, words[i], left + leftOffset, top, lineIndex);
                    leftOffset += ctx.measureText(words[i]).width + spaceWidth;
                }
            }
            else {
                this._drawChars(method, ctx, line, left, top, lineIndex);
            }
        },

        _drawChars: function (method, ctx, chars, left, top) {
            ctx[method](chars, left, top);
        },
    });
    /*
     * Synchronous loaded object
     */
    fabric.Textbox.fromObject = function (object) {
        var instance = new fabric.Textbox(object.originalText, clone(object), function () {
            return instance && instance.canvas && instance.canvas.renderAll();
        });
        return instance;
    };
})(typeof exports != 'undefined' ? exports : this);// JavaScript Document

/* ====  Textbox Class End  =====*/


/*======================================================================================== Circle Text Code Start =============================================================================*/

(function (global) {
    'use strict';
    /**
	 * it is extension of path object
	 */
    var fabric = global.fabric || (global.fabric = {}),
        extend = fabric.util.object.extend,
        clone = fabric.util.object.clone,
        toFixed = fabric.util.toFixed;

    if (fabric.CustomPath) {
        fabric.warn('fabric.CustomPath is already defined');
        return;
    }
    if (!fabric.Path) {
        fabric.warn('fabric.CustomPath requires fabric.Path');
        return;

    }


    fabric.CustomPath = fabric.util.createClass(fabric.Path, {


        type: 'CustomPath',
        /**
		 * Link Id for linking with other objects
		 * @type String
		 */
        linkId: 'customPath_1',

        /*Setting Default Properties */
        originX: 'center',
        originY: 'center',
        left: 1, // because bug was producing
        top: 1,
        fill: null,
        stroke: "#000",
        lockUniScaling: true,
        opacity: 1,
        id: 'customPath_1',
        wantSVGPathCaching: true,
        wantApproximationDetail: false,
        _cachedSVGPointData: {},
        _cachedSVGPathElement: '',

        initialize: function (path, options) {
            this.callSuper('initialize', path, options);
        },
        /**
        * Gets a fabric.Point at a parametric distance along the current fabric.Path
        * @public
        * @param {Number} distance Parametric distance along the path created by the fabric.Path.
        * @param {Boolean} adjustForCanvas Adjust the position so that it means something to the canvas. Default: true.
        * @param {SVGPathElement} svgPath SVGPathElement that represents the current fabric.Path.
        * @return {fabric.Point} Represents point on line. Includes an extra property, "distance", which is the distance along the line the point exists at.
        */
        getPointAtLength: function (distance, adjustForCanvas, svgPath) {
            var point = new fabric.Point(0, 0);
            if (!isNaN(distance)) {
                /*Here we are rounding off distance to 3 precision so that array size should be get minimized*/
                distance = parseFloat(distance).toFixed(3);
                adjustForCanvas = !(adjustForCanvas == null) ? adjustForCanvas : true;
                var svgPoint = null;
                var offset = new fabric.Point(0, 0);
                if (!svgPath) {
                    svgPath = this.getSVGPathElement();
                }
                if (this._cachedSVGPathElement && !this._cachedSVGPointData[0]) {
                    this._cachedSVGPointData[0] = svgPath.getPointAtLength(0);
                }
                if (this._cachedSVGPathElement && this._cachedSVGPointData[distance]) {
                    svgPoint = this._cachedSVGPointData[distance];
                }
                else {
                    svgPoint = svgPath.getPointAtLength(distance);
                    this._cachedSVGPointData[distance] = svgPoint;
                }
                if (adjustForCanvas) {
                    var zeroPoint = (distance == 0) ? svgPoint : this._cachedSVGPointData[0] || svgPath.getPointAtLength(0);
                    offset.setXY(this.left - zeroPoint.x, this.top - zeroPoint.y);
                }
                // Abstract the point with the distance it represents along the line.
                point.setXY(svgPoint.x + offset.x, svgPoint.y + offset.y);
                point.distance = distance;
            }
            return point;
        },

        /**
         * Gets an SVGPathElement DOM element that represents the current fabric.Path, may include caching
         * @public
         * @return {SVGPathElement}
         */
        getSVGPathElement: function () {
            if (this.wantSVGPathCaching) {
                if (!this._cachedSVGPathElement) {
                    this._cachedSVGPathElement = this._getSVGPathElement();
                    this._cachedSVGPointData = {};
                } else {
                    var currentSVGData = this.getSVGData();
                    if (this._cachedSVGPathElement.getAttribute("d") != currentSVGData) {
                        this._cachedSVGPathElement.setAttribute("d", currentSVGData);
                        this._cachedSVGPointData = {};
                    }
                }
                return this._cachedSVGPathElement;
            } else {
                return this._getSVGPathElement();
            }

        },

        /**
         * Gets an SVGPathElement DOM element that represents the current fabric.Path
         * @private
         * @return {SVGPathElement}
         */
        _getSVGPathElement: function () {
            // Obtain the data of the path element (ex: "M 0 0 L 100 100").
            var svgCommands = this._getSVGData();
            // Create an SVGPathElement.
            var svgPath = fabric.document.createElementNS('http://www.w3.org/2000/svg', 'path');
            // Add the data.
            svgPath.setAttribute("d", svgCommands);
            // Add the presentation styles.
            svgPath.setAttribute("style", this.getSvgStyles());
            svgPath.setAttribute("transform", this.getSvgTransform() + this.getSvgTransformMatrix());
            // Add the line cap.
            svgPath.setAttribute("stroke-linecap", "round");
            // Send it back.
            return svgPath;
        },

        /**
         * Get a string of data approximately representative of the commands of the "data" attribute of an SVG:PATH
         * @private
         * @param {Array} path Points representative of an SVG:PATH, like [["M", 0, 0], ["L", 100, 100],].
         * @return {String} Points in format like: "M 0 0 L 100 100".
         */
        _getSVGData: function (path) {
            path = !(path == null) ? path : this.path;
            var chunks = [];
            for (var i = 0, len = path.length; i < len; i++) {
                chunks.push(path[i].join(' '));
            }
            // Yield something like: M 0 0 L 100 100
            return chunks.join(' ');
        },

        /**
         * Get a string of data representative of the commands of the "data" attribute of an SVG:PATH, which may include caching and approximation
         * @private
         * @return {String} Points in format like: "M 0 0 L 100 100".
         */
        getSVGData: function () {
            // If caching is enabled, get the cached data. Otherwise, get recalculate and return the SVG data (ex. "M 0 0 L 100 100").
            if (this.wantSVGPathCaching) {
                // If there is no cached path array or if there is no cached SVG data string or if the cache and the current path array are not equivalent, refresh the cache.
                if (!this._cachedPathArray || !this._cachedSVGData || !this.__arrayEqualsCurrentPathArray(this._cachedPathArray)) {
                    this._cachedPathArray = this.path;
                    this._cachedSVGData = (this.wantApproximationDetail) ? this._getApproximatedSVGData() : this._getSVGData();
                }
                // Return the cached SVG data (ex. "M 0 0 L 100 100").
                return this._cachedSVGData;
            } else {
                return this._getSVGData();
            }
        },

        /**
         * Get an array of commands representative of the commands of an SVG:PATH
         * @private
         * @return {Array} points in format like: [["M", 0, 0], ["L", 100, 100],].
         */
        _getApproximatedPath: function () {
            var detail = this.wantApproximationDetail || 2;
            var adjustForCanvas = false;
            // Ensure that the underlying path is used (as opposed to a cached version of the simpler version).
            var svgPath = this._getSVGPathElement();
            // Get the path approximation of distance 0 to path length, ignoring the cache of SVG:PATH.
            var approximatedPoints = this.getSampledPoints(detail, adjustForCanvas, 0, undefined, svgPath);
            var approximatedPath = [];
            for (var i = 0, len = approximatedPoints.length; i < len; i++) {
                var command = (i == 0) ? "M" : "L";
                var point = approximatedPoints[i];
                approximatedPath.push([command, point.x, point.y]);
            }
            // Yield something like: [M, 0, 0], [L, 100, 100]
            return approximatedPath;
        },

        /**
         * Get a string of data approximately representative of the commands of the "data" attribute of an SVG:PATH
         * @private
         * @return {String} Points in format like: "M 0 0 L 100 100".
         */
        _getApproximatedSVGData: function () {
            return this._getSVGData(this._getApproximatedPath());
        },

        /**
         * Convenience method to compare equivalence of fabric.Path#path array to another one
         * @private
         * @return {Boolean} If same length and same items, true. Otherwise, false.
         */
        __arrayEqualsCurrentPathArray: function (that) {
            var sameLength = (that.length == this.path.length) ? true : false;
            var sameItems = (that.every(this.__itemEqualsItemInArray, this)) ? true : false;
            return (sameLength && sameItems) ? true : false;
        },

        /**
         * Convenience method to compare per-item equivalence of fabric.Path#path array to another one, for special use with Array.every
         * @private
         * @param {Object} arrayItem The array item from the other array.
         * @param {Object} index The index of arrayItem in the other array.
         * @param {Array} thatArray The other array.
         * @return {Boolean} If both items are equivalent, true. Otherwise, false.
         */
        __itemEqualsItemInArray: function (arrayItem, index, thatArray) {
            return arrayItem === this.path[index];
        },

        /**
        * Returns object representation of an instance
        * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
        * @return {Object} Object representation of an instance
        */
        toObject: function (propertiesToInclude) {
            var fn = fabric.Path.prototype["toObject"];
            fn = fn.bind(this);
            // Create the object with just the wanted data.
            var object = fabric.util.object.extend(fn(propertiesToInclude), {
                linkId: this.linkId,
            });
            // Remove default values if requested.
            if (!this.includeDefaultValues) {
                this._removeDefaultValues(object);
            }
            return object;
        }

    });

    fabric.CustomPath.fromObject = function (object) {
        var clonedObject = fabric.util.object.clone(object);
        var instance = new fabric.CustomPath(object.path, clonedObject, function () {
            return instance && instance.canvas && instance.canvas.renderAll();
        });
        return instance;
    };

})(typeof exports != 'undefined' ? exports : this);


/*===== Point Class Extension Start ======*/
// Add necessary methods to the fabric.Point class. Required to determine tangent given two points.
fabric.util.object.extend(fabric.Point.prototype, {
    /**
     * Returns the angle in degrees between this point and another one
     * @param {fabric.Point} that
     * @return {Number}
     */
    degreesBetween: function (that) {
        return fabric.util.radiansToDegrees(this.radiansBetween(that));
    },

    /**
     * Returns the angle in radians between this point and another one
     * @param {fabric.Point} that
     * @return {Number}
     */
    radiansBetween: function (that) {
        var p1 = this,
            p2 = that;
        // Angle in radians.
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }
});
/*===== Point Class Extension End ======*/

/*========= PathText Class Start ========*/
(function (global) {
    'use strict';
    /**
     * Getting methods needed for from Util class.
     */
    var fabric = global.fabric || (global.fabric = {}),
        extend = fabric.util.object.extend,
        clone = fabric.util.object.clone,
        toFixed = fabric.util.toFixed;
    var degreesToRadians = fabric.util.degreesToRadians;
    if (fabric.PathText) {
        fabric.warn('fabric.PathText is already defined');
        return;
    }
    if (!fabric.Object) {
        fabric.warn('fabric.PathText requires fabric.Object');
        return;

    }


    // Extend fabric.Text to include the necessary methods to render the text along a line (as opposed to, say, physically positioning some group of letters).
    fabric.PathText = fabric.util.createClass(fabric.Text, {
        /*
        * fabric.Path define type of object
        */
        type: 'PathText',

        /**
         * fabric.Path that the text observes
         * @type fabric.Path
         */
        textPath: null,

        /**
         * Distance along the fabric.Path in fabric.Text#textPath that the text should start at
         * @type fabric.Path
         */
        textPathDistanceOffset: null,

        /**
         * If fabric.Text#textPath exists, should letters rotate along the path or not
         * @type Boolean
         */
        wantObservePathRotation: true,

        /**
         * If fabric.Text#textPath exists, should letters be subject to collision detection to help ensure legibility or not
         * Edited :: This feature will remove extra characters when path get filled up.
         * @type Boolean
         */
        wantTextPathWithLessOverlap: false,

        /**
         * If fabric.Text#textPath exists, should a faded, untransformed version of fabric.Text#text be rendered or not
         * @type Boolean
         */
        wantTextPathResidue: true,

        /**
         * If fabric.Text#textPath exists and non-zero, the fabric.Path in fabric.Text#textPath will be approximated to this number of points; otherwise, path will be drawn as-is
         * @type Number
         */
        wantApproximationDetail: 0,

        /**
         * If true, do not destroy the fabric.Text#_boundaries object; otherwise, perform all boundary calculations every time
         * @type Boolean
         */
        isFrozen: false,

        /**
         * Edited ::
         * If true, remove extra characters  when path get filled up depends upon the angle
         * @type Boolean
         */
        removeExtraChar: true,

        /**
         * Edited ::
         * This is to maintain font size that added when widget object created first time because we are changing font size to maintain proportion.
         * @type Number
         */
        originalFontSize: 30,

        /**
         * Edited ::
         * This flag is used in debugging mode this flag will add border on all characters
         * @type Number
         */
        debug: true,

        /**
         * fabric.Path String on which text will be drawn
         * @type fabric.Path
         */
        pathString: 'M100,250 C198,110 400,100 261,376',
        /**
           * Edited ::
           * If true, then representing text (characters) are going out of path otherwise it will be false.
           * @type Boolean
           */
        isOutOfPath: false,

        /**
           * Edited ::
           * representing text (characters) that are visible on the path.
           * @type String
           */
        visibleText: '',

        /**
        * Edited ::
        * This is to maintain font size that added when widget object created first time because we are changing font size to maintain proportion.
        * @type Number
        */
        nonScaledFontSize: 30,

        showPath: true, // TODO:: have to remove dependency of it.

        /*Setting Default Properties */
        lineHeight: 1,
        originX: 'center',
        originY: 'center',
        left: 1,
        top: 1,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        stroke: null,
        id: 'pathText_1',
        _boundaries: [],
        canGrow: false,
        allowedFontSizes: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],

        allowPathProp: {
            top: 1,
            left: 1,
            originX: 'center',
            originY: 'center',
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            hasControls: true,
            hasRotatingPoint: false,
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
            lockUniScaling: true,
            borderColor: 'rgba(255, 255, 255, 0.9)', // e.g. white / rgba(255, 255, 255, 0.9) / #FFF
            cornerColor: 'rgba(186, 186, 186, 0.9)', // e.g. white / rgba(255, 255, 255, 0.9) / #FFF
            cornerSize: 10,
            transparentCorners: false,
            hasBorders: true,
            borderOpacityWhenMoving: 0.4,
            selectable: true,
            perPixelTargetFind: true,
            //targetFindTolerance: 4
            opacity: 1,
        },

        initialize: function (objects, options) {
            options || (options = {});
            options = this._createPathObject(options);
            this.callSuper('initialize', objects, options);
            this.on('added', this._addPathObject);

        },

        /*
        * Edited :: Added this method to create path object on client end.
        */
        _createPathObject: function (options) {
            options.pathString = (options.pathString && options.pathString != '' && options.pathString != null) ? options.pathString : this.pathString;
            var pathOptions = this.mapPathProperties(options);
            /*Added custom properties for path object to link tow objects*/
            pathOptions['id'] = (typeof options['id'] !== "undefined") ? options['id'] + '_customPath' : this.allowPathProp['id'] + '_customPath';
            pathOptions['linkId'] = (typeof options['id'] !== "undefined") ? options['id'] : this.allowPathProp['id'];
            options.textPath = new fabric.CustomPath(options.pathString, pathOptions);
            /*Making Text Objected non selected so that custom path should have control*/
            options.hasControls = false;
            options.hasBorders = false;
            options.evented = false;
            return options;

        },

        /*
         * Edited :: Removed both path and text object at a time.
         */
        /**
         * Removes object from canvas to which it was added last
         * @return {fabric.Object} thisArg
         * @chainable
         */
        remove: function () {
            if (this.textPath) {
                this.canvas.remove(this.textPath);
            }
            this.canvas.remove(this);
            return this;
        },

        mapPathProperties: function (options) {
            var filterOptions = {};
            for (var propName in this.allowPathProp) {
                /*Escaping when this property is not present not copying this two property of linked objects*/
                if (propName != 'hasControls' && propName != 'hasBorders' && propName != 'evented') {
                    filterOptions[propName] = (typeof options[propName] !== "undefined") ? options[propName] : this.allowPathProp[propName];
                }
            }
            return filterOptions;
        },

        _addPathObject: function (e) {
            var _this = this;
            /*Here we are delecting path text object if exists and then adding it again*/
            this.canvas.remove(this.textPath).add(this.textPath);
            this._observePathObject(this);
            this.textPath.on('after:render', function (e) { _this._observePathObject(_this); });
            this.textPath.on('moving', function (e) { _this._observePathObject(_this); });
            this.textPath.on('modified', function (e) { _this._observePathObject(_this); });
        },

        _observePathObject: function (_this) {
            var widget = _this.textPath;
            var obj = _this;
            var fontSize = obj.fontSize;
            fontSize = _this.getCalculatedFontSize();
            if (!obj.showPath) {
                widget.opacity = 0.01;
            }
            var updatedProperty = {
                top: widget.top,
                left: widget.left,
                scaleX: widget.scaleX,
                scaleY: widget.scaleY,
                fontSize: fontSize,
                angle: widget.angle,
                opacity: widget.opacity //TODO:: have to remove this 
            };
            this._updatePropertyOfWidget(obj, updatedProperty);
        },


        _updatePropertyOfWidget: function (widget, property) {
            widget.set(property);
        },


        _set: function (prop, value) {
            if (prop == 'pathString' && typeof value != 'object' && this.canvas) {
                var options = {};
                var pathOptions = this.mapPathProperties(this.textPath);
                this.pathString = value;
                /*Added custom properties for path object to link tow objects*/
                pathOptions['id'] = (typeof this.textPath['id'] !== "undefined") ? this.textPath['id'] : this.id + '_customPath';
                pathOptions['linkId'] = (typeof this.textPath['linkId'] !== "undefined") ? this.textPath['linkId'] : this.id;
                options.textPath = new fabric.CustomPath(value, pathOptions);
                options.textPath.padding = this.currentHeight;
                this.canvas.targetFindTolerance = this.currentHeight / 2;
                this.canvas.remove(this.textPath).add(options.textPath);
                this.textPath = options.textPath;
                this.textPath.setCoords();
                // For selecting of path update.
                if (this.textPath.selectable) {
                    this.canvas.setActiveObject(this.textPath);
                }
                this.canvas.renderAll();
                this.canvas.calcOffset();
                var _this = this;
                this.textPath.on('after:render', function (e) {
                    _this._observePathObject(_this);
                });
                this.textPath.on('modified', function (e) {
                    _this._observePathObject(_this);
                });
                this.textPath.on('moving', function (e) {
                    _this._observePathObject(_this);
                });
                //Hack because does not found best solution for get key
                prop = 'textPath';
                value = this.textPath;

            }
            else if (this.textPath && typeof this.allowPathProp[prop] !== "undefined" && this.canvas) {
                this.textPath.set('padding', this.currentHeight);
                this.canvas.targetFindTolerance = this.currentHeight / 2;
                this.textPath.set(prop, value);
                this.textPath.setCoords();
                if (prop != 'hasControls' && prop != 'hasBorders' && prop != 'opacity') {
                    this.callSuper('_set', prop, value);
                }
            }
                /*Following condition is defining that
                * If show path property value is false then setting path opacity to 0 (Hidding path) otherwise setting it to 1 (Showing Path)  
                */
            else if (this.textPath && prop == 'showPath') {
                if (value) {
                    this.textPath.set('opacity', 1);
                }
                else {
                    this.textPath.set('opacity', 0.1);
                }
                this.callSuper('_set', prop, value);
            }
            else if (prop == 'nonScaledFontSize' && this.canvas) {
                prop = 'nonScaledFontSize';
                this.callSuper('_set', prop, value);
                var fontSizeValue = this.getCalculatedFontSize(value);
                this.callSuper('_set', 'fontSize', fontSizeValue);
            }
            else if (prop == 'fontSize' && this.canvas) {
                var fontSize = this.getCalculatedFontSize(value);
                prop = 'fontSize';
                value = fontSize;
                this.callSuper('_set', prop, value);
            }
            else {
                this.callSuper('_set', prop, value);
            }
            return this;
        },

        /**
        * @private
        * @param {CanvasRenderingContext2D} ctx Context to render on
        * @param {Array} textLines Array of all text lines
        */
        _renderTextBackground: function (ctx, textLines) {
            // If no text path, draw normally. Otherwise, depend on fill or stroke pass.
            //this._addPathObject();
            if (this.textPath == null) {
                this._renderTextBoxBackground(ctx);
                this._renderTextLinesBackground(ctx, textLines);
            }
        },


        /**
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Array} textLines Array of all text lines
         */
        _renderTextFill: function (ctx, textLines) {
            var _this = this;
            if (!this.fill && !this._skipFillStrokeCheck) {
                return;
            }
            _this._renderTextLines("fillText", ctx, textLines);
        },

        /**
        * @private
        * @param {CanvasRenderingContext2D} ctx Context to render on
        * @param {String} line Text line
        * @return {Number} Line width
        */
        _getLineWidth: function (ctx, line) {
            if (this.lastLine != line) {
                var lineWidth = this.textAlign === 'justify'
             ? this.width
             : ctx.measureText(line).width;
                this.lastLine = line;
                return lineWidth;
            }
            else {
                return this.width;
            }

        },

        /**
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Array} textLines Array of all text lines
         * @return {Number} Maximum width of fabric.Text object
         * Note:Support only single line text.
         */
        _getTextWidth: function (ctx, textLines) {
            var maxWidth = this.width;
            if (this.lastLine != textLines[0]) {
                maxWidth = ctx.measureText(textLines[0] || '|').width;
                this.lastLine = textLines[0];
            }
            return maxWidth;
        },

        /**
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Array} textLines Array of all text lines
         */
        _setBoundaries: function (ctx, textLines) {
            if (this.isFrozen == null || this.isFrozen === false) {
                // Reset boundaries.
                this._boundaries = [];
                for (var lineIndex = 0, len = textLines.length; lineIndex < len; lineIndex++) {
                    var lineWidth = this._getLineWidth(ctx, textLines[lineIndex]);
                    var lineLeftOffset = this._getLineLeftOffset(lineWidth);
                    this._boundaries.push({
                        height: this._getHeightOfLine(ctx, lineIndex, textLines),
                        width: lineWidth,
                        left: lineLeftOffset
                    });
                }
            } else if (this.wantTextPathResidue && this._boundaries) {
                for (var lineIndex = 0, len = this._boundaries.length; lineIndex < len; lineIndex++) {
                    this._boundaries[lineIndex].residueHasBeenDrawn = null;
                }
            }
        },

        /**
         * Render an unjustified line of the text in fabric.Text#text by the requested context method
         * @private
         * @param {String} method Method name ("fillText" or "strokeText")
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {String} line Text to calculate.
         * @param {Number} left Left position of text.
         * @param {Number} top Top position of text.
         * @param {Number} lineIndex Index of the line in the text.
         */
        _renderUnjustifiedTextLine: function (method, ctx, line, left, top, lineIndex) {
            // If observing a path, go letter by letter through the line, render the character, and advance by the previous distance. Otherwise, render the characters normally.
            if (this.textPath) {
                this._renderTextLineOnTextPath(method, ctx, line, left, top, lineIndex);
            } else {
                this._renderChars(method, ctx, line, left, top, lineIndex);
            }
        },

        /**
         * Render a justified line of the text in fabric.Text#text by the requested context method
         * @private
         * @param {String} method Method name ("fillText" or "strokeText")
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {String} line Text to calculate.
         * @param {Number} left Left position of text.
         * @param {Number} top Top position of text.
         * @param {Number} lineIndex Index of the line in the text.
         * @param {Number} totalWidth Width to fill; depends on existence of spaces to act as expandable targets.
         */
        _renderJustifiedTextLine: function (method, ctx, line, left, top, lineIndex, totalWidth) {
            // Stretch the line.
            var words = line.split(/\s+/), wordsWidth = ctx.measureText(line.replace(/\s+/g, '')).width, widthDiff = totalWidth - wordsWidth, numSpaces = words.length - 1, spaceWidth = widthDiff / numSpaces, leftOffset = 0;
            // If observing a path, go letter by letter through the line, render the character, and advance by the previous distance, optionally overriding the distance to be spaceWidth for spaces. Otherwise, render the line word by word, skipping over spaces by spaceWidth.
            if (this.textPath) {
                this._renderTextLineOnTextPath(method, ctx, line, left, top, lineIndex, spaceWidth);
            } else {
                for (var i = 0, len = words.length; i < len; i++) {
                    this._renderChars(method, ctx, words[i], left + leftOffset, top, lineIndex);
                    leftOffset += ctx.measureText(words[i]).width + spaceWidth;
                }
            }
        },

        /**
         * Generically render a line of the text in fabric.Text#text by the requested context method
         * @private
         * @param {String} method Method name ("fillText" or "strokeText")
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {String} line Text to calculate.
         * @param {Number} left Left position of text.
         * @param {Number} top Top position of text.
         * @param {Number} lineIndex Index of the line in the text.
         */
        _renderTextLine: function (method, ctx, line, left, top, lineIndex) {
            // Lift the line by a quarter of the fontSize.
            top -= this.fontSize / 4;
            // If the text isn't justified, render it without any additional tests.
            if (this.textAlign !== 'justify') {
                this._renderUnjustifiedTextLine(method, ctx, line, left, top, lineIndex);
            } else {
                // Otherwise, perform an initial justification test. If true, figure out how large spaces should actually be. Otherwise, render normally.
                var lineWidth = ctx.measureText(line).width, totalWidth = this.width;
                if (totalWidth > lineWidth) {
                    this._renderJustifiedTextLine(method, ctx, line, left, top, lineIndex, totalWidth);
                } else {
                    this._renderUnjustifiedTextLine(method, ctx, line, left, top, lineIndex);
                }
            }
        },

        /**
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Array} textLines Array of all text lines
         */
        _renderTextStroke: function (ctx, textLines) {
            //console.log('_renderTextStroke',6);
            if ((this.stroke == null || this.strokeWidth === 0) && !this._skipFillStrokeCheck) {
                return;
            }
            ctx.save();
            if (this.strokeDashArray) {
                // Spec requires the concatenation of two copies the dash list when the number of elements is odd
                if (1 & this.strokeDashArray.length) {
                    this.strokeDashArray.push.apply(this.strokeDashArray, this.strokeDashArray);
                }
                supportsLineDash && ctx.setLineDash(this.strokeDashArray);
            }
            ctx.beginPath();
            if (this._boundaries == null) {
                this._boundaries = [];

            }
            this._renderTextLines("strokeText", ctx, textLines);
            ctx.closePath();
            ctx.restore();
        },


        /**
         * Gets the text lines this fabric.Text object represents (in array format)
         * @private
         * @return {Array} Array of text lines, split at new lines.
         */
        _getTextLines: function () {
            //console.log('_getTextLines',8);
            return this.text.split(this._reNewline);
        },

        /**
         * Get the lines in order of widest to least wide
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Array} textLines Array of all text lines
         */
        _getOrderOfWidestLines: function (ctx, textLines) {
            //console.log('_getOrderOfWidestLines',9);
            // Ordering by line width is required by the text on path feature, which requires knowing the individual line boundaries.
            if (this._boundaries.length == 0) {
                textLines = (textLines == null) ? textLines : this._getTextLines();
                this._setBoundaries(ctx, textLines);
            }
            // Prepare a place to store the ordered indices.
            var order = [];
            // Get a copy of the boundaries.
            var objectsToOrderByWidth = this._boundaries.slice(0);
            // Do the sort by longest width.
            while (objectsToOrderByWidth.length > 0) {
                var current = objectsToOrderByWidth.shift();
                // Compare current to everything that's left.
                var foundWiderLine = false;
                for (var i = 0, len = objectsToOrderByWidth.length; i < len && !foundWiderLine; i++) {
                    var comparison = objectsToOrderByWidth[i];
                    // If the comparison object is wider than the current object, no further testing is needed for this pass.
                    if (comparison.width > current.width) {
                        // Put the current object back on the stack.
                        objectsToOrderByWidth.push(current);
                        // Break out.
                        foundWiderLine = true;
                    }
                }
                if (!foundWiderLine)
                    order.push(this._boundaries.indexOf(current));
            }
            return order;
        },

        /**
         * Gets the maximum line width for the text this fabric.Text object represents
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Array} textLines Array of all text lines
         * @return {Number} Width of the longest text line.
         */
        _getMaximumLineWidth: function (ctx, textLines) {
            //console.log('_getMaximumLineWidth',10);
            var width = 0;
            // Maximum line width is required by the text on path feature, which requires knowing the individual line boundaries.
            if (this._boundaries.length == 0) {
                textLines = (textLines == null) ? textLines : this._getTextLines();
                this._setBoundaries(ctx, textLines);
            }
            for (var i = 0, len = this._boundaries.length; i < len; i++) {
                width = (this._boundaries[i].width > width) ? this._boundaries[i].width : width;
            }
            return width;
        },

        /**
         * Gets the line height without explicitly specifying the text lines this fabric.Text object represents
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @return {Number} Height of the text.
         */
        _getObservedTotalLineHeight: function (ctx) {
            //console.log('_getObservedTotalLineHeight',11);
            var textLines = this._getTextLines();
            return this._getTextHeight(ctx, textLines);
        },

        /**
         * Renders decorations ("underline", "line-through", "overline") found in fabric.Text#textDecoration
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Array} textLines Array of all text lines
         */
        _renderTextDecoration: function (ctx, textLines) {
            //console.log('_renderTextDecoration',12);
            if (!this.textDecoration) {
                return;
            }
            var doUnderline = (this.textDecoration.indexOf("underline") > -1) ? true : false;
            var doLineThrough = (this.textDecoration.indexOf("line-through") > -1) ? true : false;
            var doOverline = (this.textDecoration.indexOf("overline") > -1) ? true : false;
            // If there is no text path, draw the lines normally. Otherwise, plot the line and draw it.
            if (this.textPath == null) {
                var halfOfVerticalBox = this._getTextHeight(ctx, textLines) / 2,
                  _this = this;
                /** @ignore */

                if (doUnderline) {
                    this._renderLinesAtOffset(ctx, textLines, this.fontSize * this.lineHeight);
                }
                if (doLineThrough) {
                    this._renderLinesAtOffset(ctx, textLines, this.fontSize * this.lineHeight - this.fontSize / 2);
                }
                if (doOverline) {
                    this._renderLinesAtOffset(ctx, textLines, this.fontSize * this.lineHeight - this.fontSize);
                }
            } else {
                var supportsSpecificStyles = (this.getCurrentCharStyle == null) ? false : true;
                if (doUnderline || supportsSpecificStyles) {
                    this._renderTextDecorationOnTextPath(ctx, "underline");
                }
                if (doLineThrough || supportsSpecificStyles) {
                    this._renderTextDecorationOnTextPath(ctx, "line-through");
                }
                if (doOverline || supportsSpecificStyles) {
                    this._renderTextDecorationOnTextPath(ctx, "overline");
                }
            }
        },


        /**
         * Renders line at offset  found in fabric.Text#textDecoration
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Array} textLines Array of all text lines
         * @param {int} offset of text line widget
         */
        _renderLinesAtOffset: function (ctx, textLines, offset) {
            //console.log('_renderLinesAtOffset',13);
            for (var i = 0, len = textLines.length; i < len; i++) {
                var lineWidth = _this._getLineWidth(ctx, textLines[i]),
                  lineLeftOffset = _this._getLineLeftOffset(lineWidth);
                ctx.fillRect(
                  _this._getLeftOffset() + lineLeftOffset,
                  ~~((offset + (i * _this._getHeightOfLine(ctx, i, textLines))) - halfOfVerticalBox),
                  lineWidth,
                  1);
            }
        },

        /**
         * Renders decorations ("underline", "line-through", "overline") found in fabric.Text#textDecoration specifically for text on the fabric.Path located in fabric.Text#textPath
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {String} decoration Specific decoration; valid values: "underline", "line-through", and "overline".
         */
        _renderTextDecorationOnTextPath: function (ctx, decoration) {
            //console.log('_renderTextDecorationOnTextPath',14);
            // Create top offset.
            var runningLineHeight = 0;
            var supportsSpecificStyles = (this.getCurrentCharStyle == null) ? false : true;
            // Deal with horizontal translation from text alignment.
            var crutchX = (this.textAlign === "left" || this.textAlign === "justify") ? 0 : (this.textAlign === "center") ? (this.width / 2) : this.width;
            for (var lineIndex = 0, len = this._boundaries.length; lineIndex < len; lineIndex++) {
                var lineBoundary = this._boundaries[lineIndex];
                var verticalAdjustment = this._getTopOffset() + runningLineHeight + lineBoundary.height / 2;
                runningLineHeight += lineBoundary.height;
                // Push settings.
                ctx.save();
                ctx.lineWidth = 1;
                ctx.strokeStyle = this.fill || this.stroke || "black";
                ctx.beginPath();
                var hadLine = false;
                for (var charIndex = 0, lineLength = lineBoundary.letters.length; charIndex < lineLength; charIndex++) {
                    // Get character style. Character indices in line styles are one-index rather than zero-index.
                    var style = (!supportsSpecificStyles) ? this : this.getCurrentCharStyle(lineIndex, charIndex + 1);
                    var command = (style.textDecoration && style.textDecoration.indexOf(decoration) > -1) ? "lineTo" : "moveTo";
                    // Get letter entry.
                    var letterEntry = lineBoundary.letters[charIndex];
                    // Get center point of drawing.
                    var point = letterEntry.point;
                    // Get delta to point (slides up or down).
                    var deltaToPoint;
                    // Get perpendicular angle. Default (at a 0 degree tangent) is 90 degrees. TODO: Interpolation for less harsh visual result.
                    var perpendicularAngle = point.angleOfTangentInRadians + Math.PI / 2;
                    var thisVerticalAdjustment = (this.type === "i-text") ? verticalAdjustment + this.fontSize / 4 : verticalAdjustment;
                    var distanceToMove;
                    if (decoration === "underline") {
                        // Try to shift the line down.
                        distanceToMove = thisVerticalAdjustment + point.halfHeightOfLetter;
                    } else if (decoration === "overline") {
                        // Try to shift the line up.
                        distanceToMove = -1 * (-thisVerticalAdjustment + point.halfHeightOfLetter);
                    } else {
                        distanceToMove = thisVerticalAdjustment;
                    }
                    deltaToPoint = new fabric.Point(crutchX + distanceToMove * Math.cos(perpendicularAngle), distanceToMove * Math.sin(perpendicularAngle));
                    // 
                    if (!hadLine && command === "lineTo") {
                        // If this point happens after no line (like at the start of the process), it's necessary to draw a segment from the left edge to the center.
                        var deltaToStartPoint = new fabric.Point(-point.halfWidth * Math.cos(point.angleOfTangentInRadians), -point.halfWidth * Math.sin(point.angleOfTangentInRadians));
                        ctx.moveTo(deltaToPoint.x + point.x + deltaToStartPoint.x, deltaToPoint.y + point.y + deltaToStartPoint.y);
                        ctx[command](deltaToPoint.x + point.x, deltaToPoint.y + point.y);
                    } else if (charIndex == (lineLength - 1)) {
                        // If this point is the very last point, it's necessary to draw a segment from the center to the right edge.
                        var deltaToEndPoint = new fabric.Point(point.halfWidth * Math.cos(point.angleOfTangentInRadians), point.halfWidth * Math.sin(point.angleOfTangentInRadians));
                        ctx[command](deltaToPoint.x + point.x + deltaToEndPoint.x, deltaToPoint.y + point.y + deltaToEndPoint.y);
                    } else if (command === "moveTo") {
                        // In case of skipped text decoration at the character level, slide to the right edge.
                        var deltaToEdgePoint = new fabric.Point(point.halfWidth * Math.cos(point.angleOfTangentInRadians), point.halfWidth * Math.sin(point.angleOfTangentInRadians));
                        ctx[command](deltaToPoint.x + point.x + deltaToEdgePoint.x, deltaToPoint.y + point.y + deltaToEdgePoint.y);
                    } else {
                        // Point is along an existing line.
                        ctx[command](deltaToPoint.x + point.x, deltaToPoint.y + point.y);
                        // To help deal with skips, make a segment to the edge as well.
                        var deltaToEdgePoint = new fabric.Point(point.halfWidth * Math.cos(point.angleOfTangentInRadians), point.halfWidth * Math.sin(point.angleOfTangentInRadians));
                        ctx[command](deltaToPoint.x + point.x + deltaToEdgePoint.x, deltaToPoint.y + point.y + deltaToEdgePoint.y);
                    }
                    // Track if had line or not.
                    hadLine = (command === "lineTo") ? true : false;
                }
                ctx.strokeStyle = (lineIndex % 2) ? "red" : ctx.strokeStyle;
                ctx.stroke();
                ctx.closePath();
                ctx.restore();
            }
        },

        /**
         * Render an array of text lines in the requested way, ordered by widest line first
         * @private
         * @param {String} method Context method to call ("fillText", "strokeText", etc)
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Array} textLines Array of all text lines
         */
        _renderTextLines: function (method, ctx, textLines) {
            var currentIndex = 0;
            if (this._boundaries.length == 0) {
                textLines = (textLines == null) ? textLines : this._getTextLines();
                this._setBoundaries(ctx, textLines);
            }
            var lineHeight = this._getHeightOfLine(ctx, currentIndex, textLines);
            this._renderTextLine(
                method,
                ctx,
                textLines[currentIndex],
                this._getLeftOffset(),
                this._getTopOffset() + lineHeight,
                currentIndex
            );
        },

        /**
         * Gets the angle of the tangent near the specified distance
         * @private
         * @param {Number} distance Distance along the fabric.Path object stored in fabric.Text#textPath
         */
        _getAngleOfTangentAtDistanceInDegrees: function (distance) {
            var angle = 0;
            if (this.textPath && !isNaN(distance)) {
                var leftDistance = distance - 0.00075, rightDistance = distance + 0.00075;
                var leftPoint = this.textPath.getPointAtLength(leftDistance, true);
                var rightPoint = this.textPath.getPointAtLength(rightDistance, true);
                angle = leftPoint.degreesBetween(rightPoint);
            }
            return angle;
        },

        /**
         * Gets the distance along the path traced by fabric.Text#textPath required to show an object of size: (widthOfCharacter, halfNonTransformedHeight) @ angleInDegrees
         * @private
         * @param {Number} angleInDegrees Angle in degrees; clamped to first quadrant of unit-circle.
         * @param {Number} halfNonTransformedHeight Height of the object.
         * @param {Number} widthOfCharacter Width of the object.
         * @return {Number} Suggested parametric distance along the fabric.Text#textPath to consume for the object.
         */
        _getDistanceConsumptionGivenAngleInDegrees: function (angleInDegrees, halfNonTransformedHeight, widthOfCharacter) {
            //console.log('_getDistanceConsumptionGivenAngleInDegrees',17);
            // Circularly clamp the angle to be from 0 to 90 degrees.
            var rotationInFirstQuadrantOfUnitCircle = Math.abs(angleInDegrees) % 90;
            // Calculate the percentage of height and width this suggests (100% height at 90, 100% width at 0, 50% of both at 45).
            var percentOfHeight = rotationInFirstQuadrantOfUnitCircle / 90;
            var percentOfWidth = 1 - percentOfHeight;
            // Calculate the distance to be consumed in total.
            var requiredDistance = percentOfHeight * halfNonTransformedHeight + percentOfWidth * widthOfCharacter;
            // Send it back.
            return requiredDistance;
        },

        /**
         * Gets the maximum distance consumption along the path in fabric.Text#textPath for the text this fabric.Text object represents
         * @private
         * @return {Number} Distance consumption required by the text in fabric.Text#text.
         */
        _getMaximumConsumedDistance: function () {
            //console.log('_getMaximumConsumedDistance',18);
            if (this._boundaries.length > 0) {
                var distance;
                for (var i = 0, len = this._boundaries.length; i < len; i++) {
                    var current = this._boundaries[i];
                    if (!(current.consumedDistance == null)) {
                        if (distance == null || current.consumedDistance > distance) {
                            distance = current.consumedDistance;
                        }
                    }
                }
                return distance;
            }
            return undefined;
        },

        /**
         * Render a version of the text in fabric.Text#text untransformed by the fabric.Path in fabric.Text#textPath; style of text is intentionally faded out
         * @private
         * @param {String} method Method name ("fillText" or "strokeText")
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {String} line Text to render
         * @param {Number} left Left position of text
         * @param {Number} top Top position of text
         * @param {Number} lineIndex Index of a line in a text
         */
        _drawTextResidueIfNecessary: function (method, ctx, line, left, top, lineIndex) {
            //console.log('_drawTextResidueIfNecessary',19);
            if (this.wantTextPathResidue && this.textPath) {
                // Has the residue already been drawn?
                var residueTracker = this._boundaries[lineIndex].residueHasBeenDrawn,
                    residueTrackerIsUndefined = (residueTracker == null) ? true : false,
                    residueBoxNeedsToBeDrawn = (lineIndex == 0 && (residueTrackerIsUndefined || !residueTracker["bounding-box"])) ? true : false,
                    isFirstPass = (residueTrackerIsUndefined || residueTracker[method] == null || !residueTracker[method]) ? true : false;
                if (isFirstPass) {
                    var textPath = this.textPath;
                    var globalAlpha = ctx.globalAlpha;
                    this.textPath = null;
                    ctx.fillStyle = "#000000";
                    ctx.strokeStyle = "#000000";
                    ctx.globalAlpha = 0.05;
                    var crutchY = (this.type == "i-text") ? 0 : this.fontSize / 4;
                    this._renderTextLine(method, ctx, line, left, top + crutchY, lineIndex);
                    this.textPath = textPath;
                    ctx.fillStyle = this.fill;
                    ctx.strokeStyle = this.stroke;
                    ctx.globalAlpha = globalAlpha;
                    // Draw dashed box.
                    if (residueBoxNeedsToBeDrawn) {
                        // Copy data out.
                        var previousBorderColor = this.borderColor;
                        var hasBorders = this.hasBorders;
                        var hasRotatingPoint = this.hasRotatingPoint;
                        var isMoving = this.isMoving;
                        var borderOpacityWhenMoving = this.borderOpacityWhenMoving;
                        // Replace it.
                        this.borderColor = "#000000";
                        this.hasBorders = true;
                        this.hasRotatingPoint = false;
                        this.borderOpacityWhenMoving = 0.1;
                        this.isMoving = true;
                        // If the canvas matrix has been translated (center or right alignments), get the amount to slide the drawing back into place.
                        var crutchX = (this.textAlign === "left" || this.textAlign === "justify") ? 0 : (this.textAlign === "center") ? (-this.width / 2) : -this.width;
                        ctx.save();
                        ctx.setLineDash([2, 3]);
                        ctx.translate(crutchX, 0);
                        this.drawBorders(ctx);
                        ctx.restore();
                        this.borderColor = previousBorderColor;
                        this.hasBorders = hasBorders;
                        this.hasRotatingPoint = hasRotatingPoint;
                        this.borderOpacityWhenMoving = borderOpacityWhenMoving;
                        this.isMoving = isMoving;
                    }
                    // Track this result.
                    if (residueTrackerIsUndefined) {
                        this._boundaries[lineIndex].residueHasBeenDrawn = {};
                    }
                    this._boundaries[lineIndex].residueHasBeenDrawn[method] = true;
                    this._boundaries[lineIndex].residueHasBeenDrawn["bounding-box"] = true;
                }
            }
        },

        /**
         * Get a 4-point bounding box polygon that represents a box of size (2 * halfWidthOfLetter, 2 * halfHeightOfLetter) @ angleInDegrees
         * @private
         * @param {fabric.Point} point Represents center point of drawing.
         * @param {Number} top Offset used to provide additional vertical placement for the center point.
         * @param {Number} halfWidthOfLetter Half the width of the object.
         * @param {Number} halfHeightOfLetter Half the height of the object.
         * @param {Number} angleInDegrees Angle in degrees to transform the original bounding box points by.
         * @param {Boolean} reverseMode If the mode is reversed (in the case of fabric.Text#textAlign "right"), make it so that the edges logically match up with the indices of all the other cases (i.e. not "right").
         * @return {Array} An array of fabric.Point objects that represent the polygon.
         */
        _getMinorBoundingBoxAroundPoint: function (point, top, halfWidthOfLetter, halfHeightOfLetter, angleInDegrees, reverseMode) {
            //console.log('_getMinorBoundingBoxAroundPoint',20);
            if (reverseMode == null) {
                reverseMode = false;
            }
            // Get lines. X represents the leading edge, which is the right edge in non-right-aligned cases, and the left edge otherwise.
            var x = (!reverseMode) ? point.x - halfWidthOfLetter : point.x + halfWidthOfLetter,
                x2 = (!reverseMode) ? point.x + halfWidthOfLetter : point.x - halfWidthOfLetter;
            // Get the points that represent an unrotated box around just the letter.
            var thisUntransformedUpperLeadingPoint = new fabric.Point(x, point.y + top - halfHeightOfLetter),
                thisUntransformedLowerLeadingPoint = new fabric.Point(x, point.y + top + halfHeightOfLetter),
                thisUntransformedLowerTrailingPoint = new fabric.Point(x2, point.y + top + halfHeightOfLetter),
                thisUntransformedUpperTrailingPoint = new fabric.Point(x2, point.y + top - halfHeightOfLetter);
            // Rotate point around center.
            var radians = fabric.util.degreesToRadians(angleInDegrees);
            var thisMinorBoundingBox = [
              fabric.util.rotatePoint(thisUntransformedUpperLeadingPoint, point, radians),
              fabric.util.rotatePoint(thisUntransformedLowerLeadingPoint, point, radians),
              fabric.util.rotatePoint(thisUntransformedLowerTrailingPoint, point, radians),
              fabric.util.rotatePoint(thisUntransformedUpperTrailingPoint, point, radians)
            ];
            return thisMinorBoundingBox;
        },

        /**
         * Determine if two (4-point) bounding boxes share one and only one edge
         * @private
         * @param {Array} boundingBox Represents a reference bounding box.
         * @param {Array} otherBoundingBox Represents a comparison bounding box.
         * @return {Boolean} If the two bounding boxes only share one edge, then true. Otherwise, false.
         */
        _pointsShareOnlyOneEdge: function (boundingBox, otherBoundingBox) {
            //console.log('_pointsShareOnlyOneEdge',21);
            var sharedCount = 0;
            for (var c = 0, len = boundingBox.length; c < len; c++) {
                var firstIndex = c % len,
                  secondIndex = (c + 1) % len,
                  firstNotIndex = (c + 3) % len,
                  secondNotIndex = (c + 2) % len;
                var p1 = boundingBox[firstIndex];
                var p2 = boundingBox[secondIndex];
                var pNot1 = otherBoundingBox[firstNotIndex];
                var pNot2 = otherBoundingBox[secondNotIndex];
                if (p1.eq(pNot1) && p2.eq(pNot2)) {
                    sharedCount += 1;
                }
            }
            return (sharedCount == 1) ? true : false;
        },

        /**
         * Gets an acceptable center point for an object along the fabric.Path in fabric.Text#textPath
         * @private
         * @param {Number} runningDistance Distance along the path to start calculations.
         * @param {Number} widthOfCharacter Width of the object.
         * @param {Number} halfWidth Half of the width of the object (calculated elsewhere).
         * @param {Number} halfHeightOfLetter Half the height of the object.
         * @param {Number} halfNonTransformedHeight Half the height the object is contained in (ex. total line height).
         * @param {Number} top Vertical offset of line.
         * @param {fabric.Point} previousPoint Previous center point.
         * @param {Boolean} reverseMode If false, calculations move from left to right. Otherwise, calculations move from right to left.
         * @param {Boolean} wantLessTextPathOverlapFeature If false, consume the very least distance required by the object. Otherwise, perform collision detection on the generated bounding boxes (looks one bounding box backwards) to place discontinuities along the path function in order to more intuitively place objects along the path.
         * @return {fabric.Point} Acceptable center point on path of fabric.Text#textPath to draw object.
         */
        _getAcceptablePoint: function (runningDistance, widthOfCharacter, halfWidth, halfHeightOfLetter, halfNonTransformedHeight, top, previousPoint, reverseMode, wantLessTextPathOverlapFeature, letter) {
            //(edited)
            //console.log('_getAcceptablePoint',22);
            // If the less overlap feature is requested, provide the necessary information.

            var lastDistanceToConsume, lastMinorBoundingBox;
            // Edited :: added extra check of previous point should be available before testing next point overlay or not.
            if (previousPoint && wantLessTextPathOverlapFeature) {
                lastMinorBoundingBox = previousPoint.boundingBox;
                lastDistanceToConsume = previousPoint.distanceToConsume;
            }
            // Represents where the object would be placed if the line were completely horizontal. Use to find a tangent.
            var initialDistancePlusHalfWidth = (!reverseMode) ? runningDistance + halfWidth : runningDistance - halfWidth;
            // Prepare a place to store the angle of the tangent (may be reset to avoid rotation at request).
            var angleOfTangentInDegrees;
            // Prepare a place to store the consumable distance.
            var distanceToConsume, halfDistanceToConsume;
            // Prepare a place to store the point.
            var point, pass = 0,
              extraPassLimit = 10,
              pointIsNotAcceptable = false,
              thisDistancePlusHalfWidth = initialDistancePlusHalfWidth;
            // Placement passes. An intersection test is done between the current minor bounding box and the previous letter's minor bounding box. The iteration has the ability to run until either the two boxes no longer intersect or the pass limit has been exceeded. Currently, this is a guess and check feature.
            while (!pointIsNotAcceptable) {
                // Get the angle of the tangent in degrees.
                var angleOfTangentInDegrees = this._getAngleOfTangentAtDistanceInDegrees(thisDistancePlusHalfWidth);
                //Edited :: 
                // If this object does not observe rotation, the width of the glyph will not accurately represent the consumed distance, so obtain something indicative of what will actually be used. Otherwise, just use the width.
                if (!this.wantObservePathRotation) {
                    // Get distance on line that will be consumed by this glyph.
                    distanceToConsume = this._getDistanceConsumptionGivenAngleInDegrees(angleOfTangentInDegrees, halfNonTransformedHeight, widthOfCharacter);
                    // Reset angle.
                    angleOfTangentInDegrees = 0;
                } else {
                    distanceToConsume = widthOfCharacter;
                }
                halfDistanceToConsume = distanceToConsume / 2;
                var thisPoint = this.textPath.getPointAtLength(thisDistancePlusHalfWidth, true);
                // If there isn't a new point or if the new point is the same as the last one (in the case of hitting the end of a path), the point is acceptable.
                if (point == null || !point.eq(thisPoint)) {
                    point = thisPoint;
                    point.outOfPath = false; // Edited :: By default added every point as valid / on path point.
                } else {
                    pointIsNotAcceptable = true;
                }
                /*Checking weather the distance between character and path should not be negative
                * Otherwise treating such characters as out of path
                */
                if (!pointIsNotAcceptable && point.distance < 0) {
                    point.outOfPath = true;
                    pointIsNotAcceptable = true;
                }
                    // Overlapping at convex spots along a line is by design, but this can be mathematically altered if requested.
                else if (wantLessTextPathOverlapFeature && !pointIsNotAcceptable && pass < extraPassLimit) {
                    // Get bounding box of the letter (as opposed to of the letter in the total observed line height).
                    var thisMinorBoundingBox = this._getMinorBoundingBoxAroundPoint(point, top, halfWidth, halfHeightOfLetter, angleOfTangentInDegrees, reverseMode);
                    // Update the bounding box.
                    point.boundingBox = thisMinorBoundingBox;
                    // Do an initial check to see if the bounding boxes are arranged end to end (in which case, objects are adjacent to each other already).
                    var pointsShareOnlyOneEdge = this._pointsShareOnlyOneEdge(thisMinorBoundingBox, lastMinorBoundingBox);
                    // If the two bounding boxes don't share only one edge, see if they intersect.
                    if (!pointsShareOnlyOneEdge) {
                        var intersectionTest = fabric.Intersection.intersectPolygonPolygon(thisMinorBoundingBox, lastMinorBoundingBox);
                        // If intersects, get minimum distance to prevent intersection.
                        if (intersectionTest.status == "Intersection" && intersectionTest.points.length >= 2) {

                            var averageDistanceConsumedByTwoBoundingBoxes = (lastDistanceToConsume + distanceToConsume) / 2;
                            // Rather than attempt to figure out where on the line actually will provide an appropriate, non-overlapping placement, just shove the character over more and more (up to five-seconds of the largest distance to consume at a time).
                            var clearDistance = averageDistanceConsumedByTwoBoundingBoxes / Math.max(2.5, (10 - pass));
                            // If the distance is greater than zero, go find the point at a .
                            if (!(clearDistance == null) && clearDistance > 0) {
                                thisDistancePlusHalfWidth += (!reverseMode) ? clearDistance : -clearDistance;
                                point.outOfPath = false;  // Edited :: Added Flag as charector is on path.
                            } else {
                                point.outOfPath = false;
                                pointIsNotAcceptable = true; // Edited :: Added Flag as charector is on path.
                            }
                        } else {
                            point.outOfPath = false;
                            pointIsNotAcceptable = true; // Edited :: Added Flag as charector is on path.
                        }
                    } else {
                        point.outOfPath = false;
                        pointIsNotAcceptable = true; // Edited :: Added Flag as charector is on path.
                    }
                    pass += 1;
                } else {
                    //Edited :: Here we are checking whether the point / character that we want to draw is on the path or not.
                    // Here logic is to check current point and new point should not be equal, If it is equal then it is out of path.  
                    if (previousPoint) {
                        var lastDistanceToConsume = previousPoint.distanceToConsume;
                        // Taking average of last consume distance and current distance 
                        var averageDistanceConsumedByTwoBoundingBoxes = (lastDistanceToConsume + distanceToConsume) / 2;
                        // Taking clear distance from current characters.  
                        var clearDistance = averageDistanceConsumedByTwoBoundingBoxes / Math.max(2.5, (10 - pass));
                        if (!(clearDistance == null) && clearDistance > 0) {
                            thisDistancePlusHalfWidth += (!reverseMode) ? clearDistance : -clearDistance; // adding more distance.
                            var thisPoint = this.textPath.getPointAtLength(thisDistancePlusHalfWidth, true);
                            // If there isn't a new point or if the new point is the same as the last one (in the case of hitting the end of a path), the point is not acceptable or out of path.
                            if (point.eq(thisPoint)) {
                                point.outOfPath = true;
                            }
                            thisDistancePlusHalfWidth -= (!reverseMode) ? clearDistance : -clearDistance; // making this as it was previously to eliminate bug in SVG and Canvas.
                        }
                    }
                    else {
                        point.outOfPath = false;
                    }
                    pointIsNotAcceptable = true;
                }

            }


            // Stick information important to the rendering method (and, by proxy, the freezing process).
            if (!(point == null)) {
                point.distanceToConsume = distanceToConsume;
                point.runningDistanceAfter = (!reverseMode) ? thisDistancePlusHalfWidth + halfDistanceToConsume : thisDistancePlusHalfWidth - halfDistanceToConsume;
                point.angleOfTangentInRadians = fabric.util.degreesToRadians(angleOfTangentInDegrees);
                point.halfWidth = halfWidth;
                point.halfHeightOfLetter = halfHeightOfLetter;
                point.widthOfCharacter = widthOfCharacter;
                if (point.boundingBox == null) {
                    point.boundingBox = this._getMinorBoundingBoxAroundPoint(point, top, halfWidth, halfHeightOfLetter, angleOfTangentInDegrees, reverseMode);
                }
            }
            //console.log(point.angleOfTangentInRadians, letter, angleOfTangentInDegrees);
            // Return the point (along with its metadata).
            return point;
        },

        /**
         * Generate and render a bounding box of size (2 * halfWidth, 2 * halfBoundingBoxHeight), adjusted by verticalOffset
         * @private
         * @param {String} method Method name ("fillText" or "strokeText")
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Number} halfWidth Half width of the object.
         * @param {Number} halfBoundingBoxHeight Half height of the object.
         * @param {Number} verticalOffset Top position of text.
         */
        _renderBoundingBox: function (method, ctx, halfWidth, halfBoundingBoxHeight, verticalOffset) {
            //console.log('_renderBoundingBox',23);
            // Shift the drawing up as necessary. Default draws horizontally along the vertical center of the text object.
            ctx.translate(0, verticalOffset);
            // Draw expected boundary.
            ctx.beginPath();
            ctx.moveTo(-halfWidth, -halfBoundingBoxHeight);
            ctx.lineTo(halfWidth, -halfBoundingBoxHeight);
            ctx.lineTo(halfWidth, halfBoundingBoxHeight);
            ctx.lineTo(-halfWidth, halfBoundingBoxHeight);
            ctx.lineTo(-halfWidth, -halfBoundingBoxHeight);
            ctx[method](); //stroke();
            ctx.closePath();
            // Reverse the vertical shift.
            ctx.translate(0, -verticalOffset);
        },

        /**
         * Render a letter of the text in fabric.Text#text by the requested context method
         * @private
         * @param {String} method Method name ("fillText" or "strokeText")
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {String} letter Text to render.
         * @param {fabric.Point} point Center point to render text at.
         * @param {Number} top Top position of text.
         * @param {Number} lineIndex Index of the line the text is in.
         * @param {Number} halfNonTransformedHeight Half of the height the letter exists in.
         * @param {Number} summedLineHeight The inclusive sum of previous line heights.
         * @param {object} style A dictionary of style choices relevant to the context.
         * @param {Boolean} approximating If true, turn off computationally-intensive features. Otherwise, render to the best of the algorithm's ability.
         */
        _renderLetterAtPoint: function (method, ctx, letter, point, top, lineIndex, halfNonTransformedHeight, summedLineHeight, style, approximating) {
            //console.log('_renderLetterAtPoint',24);
            // If the center point of the letter's bounding box exists, render the letter and the bounding box (if requested) around it.
            //Edited :: Added check of is point is out of path or not or its angle is not equal to zero this are two separate condition.
            //if (point){ //Original
            //if (point && !point.outOfPath){ //Created
            if ((point && this.wantTextPathWithLessOverlap && !point.outOfPath) || (point && this.removeExtraChar && !point.outOfPath)) {
                //console.log(point, letter, 'wantTextPathWithLessOverlap :' + this.wantTextPathWithLessOverlap, 'removeExtraChar :' + this.removeExtraChar);
                // Push the current drawing matrix.
                ctx.save();
                // Set all the style settings.
                this._pushStyleToContext(ctx, style);
                // Reposition origin such that the drawing will occur around a horizontally sliding center point.
                ctx.translate(point.x, point.y);
                // Centrally rotate the future drawing by the angle of the tangent.
                ctx.rotate(point.angleOfTangentInRadians);
                var halfWidth = point.halfWidth,
                  halfHeightOfLetter = point.halfHeightOfLetter;
                // Do background passes beneath letters. Depends on render order being: fillText -> strokeText.
                var isFirstPass = (method === "fillText" || (method === "strokeText" && style.fill == null)) ? true : false;
                if (isFirstPass && (style.textBackgroundColor || style.backgroundColor)) {
                    ctx.save();
                    // Determine whether a full bounding box or a minor bounding box will be drawn.
                    var isFullBoundingBox = false;
                    // Stroke grey for full bounding box. Stroke blue for minor bounding box.
                    ctx.strokeStyle = (isFullBoundingBox) ? "#888" : "#0020c2";
                    var halfBoundingBoxHeight = (isFullBoundingBox) ? halfNonTransformedHeight : halfHeightOfLetter;
                    if (!isFullBoundingBox && this.type == "i-text") {
                        halfBoundingBoxHeight += halfHeightOfLetter / 4;
                    }
                    var verticalOffset = (isFullBoundingBox) ? 0 : summedLineHeight - halfNonTransformedHeight - halfBoundingBoxHeight;
                    if (style.backgroundColor) {
                        ctx.fillStyle = style.backgroundColor;
                        this._renderBoundingBox("fill", ctx, halfWidth, halfBoundingBoxHeight, verticalOffset);
                    }
                    if (style.textBackgroundColor) {
                        ctx.fillStyle = style.textBackgroundColor;
                        this._renderBoundingBox("fill", ctx, halfWidth, halfBoundingBoxHeight, verticalOffset);
                    }
                    ctx.restore();
                }
                // Refuse to render individual characters if necessary.
                var fillTextButNoFillDefinition = (method === "fillText" && style.fill == null) ? true : false;
                var strokeTextButNoStrokeDefinition = (method === "strokeText" && (style.stroke == null || style.strokeWidth === 0)) ? true : false;
                if (!fillTextButNoFillDefinition && !strokeTextButNoStrokeDefinition) {
                    // Horizontally reposition result of context drawing in case of center and right.
                    var adjustmentToContextDrawing = (this.textAlign === "center") ? -halfWidth : 0;
                    // Determine where the local left offset is. TODO: Figure out why textPathDistanceOffset requires different left values.
                    var left;
                    if (this.textPathDistanceOffset == null || this.type !== "i-text") {
                        left = (this.textAlign !== "center" && this.textAlign !== "right") ? -halfWidth : halfWidth;
                    } else {
                        left = (this.textAlign === "center") ? 0 : -halfWidth;
                    }
                    ctx.translate(adjustmentToContextDrawing, 0);
                    // Render the character, sliding the height by the top value. WARN: Do not call this._renderChars in place of ctx[method], since an override can exist that does non-essential transforms.

                    // placing charector at top of every textbox changes done to match SVG. (Editor)
                    ctx[method](letter, left, 0);
                    //ctx[method](letter, left, top);
                    ctx.translate(-adjustmentToContextDrawing, 0);
                }
                // TODO: Remove debugging code for pull request.
                if (this.debug) {
                    // Draw a point at the center (where everything is drawn around).
                    ctx.beginPath();
                    ctx.fillStyle = "red";
                    ctx.fillRect(-1.5, 0, 2, 2);
                    ctx.closePath();
                    // Determine whether a full bounding box or a minor bounding box will be drawn.
                    var isFullBoundingBox = (approximating || !this.wantTextPathWithLessOverlap) ? true : false;
                    // Stroke grey for full bounding box. Stroke blue for minor bounding box.
                    ctx.strokeStyle = (isFullBoundingBox) ? "#888" : "#0020c2";
                    var halfBoundingBoxHeight = (isFullBoundingBox) ? halfNonTransformedHeight : halfHeightOfLetter;
                    if (!isFullBoundingBox && this.type == "i-text") {
                        halfBoundingBoxHeight += halfHeightOfLetter / 4;
                    }
                    var verticalOffset = (isFullBoundingBox) ? 0 : summedLineHeight - halfNonTransformedHeight - halfBoundingBoxHeight;
                    ctx.lineWidth = 1;
                    this._renderBoundingBox("stroke", ctx, halfWidth, halfBoundingBoxHeight, verticalOffset);
                }
                // Pop the drawing matrix used to get the letter drawn off the stack.
                ctx.restore();
            }
            else {
                // console.log('Characters Limit Exceed!');
                return false;
            }
        },

        /**
         * Render a letter of the text in fabric.Text#text by the requested context method
         * @private
         * @param {String} method Method name ("fillText" or "strokeText")
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {String} line Text to calculate.
         * @param {Number} left Left position of text.
         * @param {Number} top Top position of text.
         * @param {Number} lineIndex Index of the line in the text.
         * @param {Boolean} approximating If true, turn off computationally-intensive features. Otherwise, render to the best of the algorithm's ability.
         * @param {Boolean} spaceWidth If defined, width of space to use in place of measured width (specifically, for purposes of justification).
         */
        _calculateTextLineOnTextPath: function (method, ctx, line, left, top, lineIndex, approximating, spaceWidth) {
            //console.log('_calculateTextLineOnTextPath',25);
            // w/h: function(ctx, lineIndex, charIndex, lines)
            var hasSpecificWidth = (this._getWidthOfCharAt == null) ? false : true;
            var hasSpecificHeight = (this._getHeightOfCharAt == null) ? false : true;

            // If the canvas matrix has been translated (center or right alignments), get the amount to slide the drawing back into place.
            var crutchX = (this.textAlign === "left" || this.textAlign === "justify") ? 0 : (this.textAlign === "center") ? (-this.width / 2) : -this.width;
            // Determine the starting distance along the observed path.
            var startingDistance, reverseMode = false;
            if (this.textAlign === "center") {
                var maximumConsumedDistance = this.textPath.getSVGPathElement().getTotalLength(); /* Here assigning length of path as total length instead of width of text line */
                startingDistance = (((maximumConsumedDistance - ctx.measureText(line).width) / 2) < 0) ? 0 : (maximumConsumedDistance - ctx.measureText(line).width) / 2;
            } else if (this.textAlign === "right") {
                var maximumConsumedDistance = this.textPath.getSVGPathElement().getTotalLength(); /* Here assigning length of path as total length instead of width of text line */
                if (maximumConsumedDistance == null) {
                    startingDistance = 0;
                } else {
                    startingDistance = maximumConsumedDistance;
                    reverseMode = true;
                    // Reverse the text order.
                    line = line.split("").reverse().join("");
                }
            } else {
                startingDistance = 0;
            }
            // Obtain single line height.
            var heightOfLetter = this._getHeightOfLine(ctx, lineIndex, this._getTextLines());
            var halfHeightOfLetter = heightOfLetter / 2;
            // Obtain the height of the untransformed bounding box that the unpathed text would have created.
            var nonTransformedHeightOfAllLines = this._getObservedTotalLineHeight(ctx);
            var halfNonTransformedHeight = nonTransformedHeightOfAllLines / 2;
            // Obtain the width of the untransformed bounding box that the unpathed text would have created.
            var nonTransformedMaximumLineWidth = this._getMaximumLineWidth(ctx);
            var halfNonTransformedMaximumLineWidth = nonTransformedMaximumLineWidth / 2;
            // Get the center of the object.
            var centerOfTextObject = this.getCenterPoint();
            // Get the center of what's being observed.
            var centerOfPathObject = this.textPath.getCenterPoint();
            // Find out how far away the two objects are from each other (to relatively offset the text object as a whole). 
            var distanceFromPathCenterX = centerOfPathObject.x - centerOfTextObject.x, distanceFromPathCenterY = centerOfPathObject.y - centerOfTextObject.y;
            var drawingOffsetX = crutchX + -(centerOfTextObject.x - (halfNonTransformedMaximumLineWidth) + distanceFromPathCenterX) + this.textPath.path[0][1] - (this.textPath.minX + this.textPath.width / 2);
            var drawingOffsetY = -(centerOfTextObject.y - halfNonTransformedHeight + distanceFromPathCenterY) + this.textPath.path[0][2] - (this.textPath.minY + this.textPath.height / 2);
            // Track the distance along the line. For a horizontal line (unpathed text), this would increment by the width of the character.
            var runningDistance = !(this.textPathDistanceOffset == null) ? this.textPathDistanceOffset + startingDistance : startingDistance;
            var linePoints = {
                line: line,
                lineIndex: lineIndex,
                reverseMode: reverseMode,
                spaceWidth: spaceWidth,
                ctx: ctx,
                runningDistance: runningDistance,
                halfHeightOfLetter: halfHeightOfLetter,
                left: left,
                top: top,
                drawingOffsetX: drawingOffsetX,
                drawingOffsetY: drawingOffsetY,
                halfNonTransformedHeight: halfNonTransformedHeight
            };
            var isAnyPointOutOfPath = this.getAllLettersPoint(linePoints, true);
            if (this.canGrow && isAnyPointOutOfPath) {
                this.autoDecreaseFontSize(linePoints);
            }
            else if (this.canGrow && !isAnyPointOutOfPath) {
                this.autoIncreaseFontSize(linePoints);
            }
            else {
                this.getAllLettersPoint(linePoints);
            }
            this.resetTransformTool();
        },

        getCalculatedFontSize: function (currentFontSize) {
            var fontSize = currentFontSize || this.fontSize;
            if ((this.scaleX == this.scaleY) && (this.scaleX != 1 || this.scaleY != 1)) {
                fontSize = this.nonScaledFontSize / (this.scaleX); 
            }   
            else if (fontSize != this.nonScaledFontSize) {
                fontSize = this.nonScaledFontSize;
            }
            return fontSize;
        },

        resetTransformTool: function () {          
            this.textPath.padding = this.currentHeight;
            this.textPath.setCoords();
        },


        autoDecreaseFontSize: function (linePoints) {
            var ctx = linePoints.ctx;
            var currentFontSize = this.nonScaledFontSize;
            var allowedFontSizeArr = this.getAllowedSmallFontSizes(currentFontSize);
            for (var index = 0; index < allowedFontSizeArr.length; index++) {
                this.setFontSizeInContext(ctx, allowedFontSizeArr[index]);
                var isAnyPointOutOfPath = this.getAllLettersPoint(linePoints, true);
                //Check if characters are out of path. If Yes then assigning previous font size
                if (!isAnyPointOutOfPath) {
                    var newIndex = (index == 0) ? 0 : index - 1;
                    var newFontSize = (allowedFontSizeArr[newIndex] || currentFontSize);
                    this.setFontSizeInContext(ctx, newFontSize);
                    break;
                }
            }
        },

        autoIncreaseFontSize: function (linePoints) {
            var ctx = linePoints.ctx;
            var currentFontSize = this.nonScaledFontSize;
            var allowedFontSizeArr = this.getAllowedBiggerFontSize(currentFontSize);
            for (var index = 0; index < allowedFontSizeArr.length; index++) {
                this.setFontSizeInContext(ctx, allowedFontSizeArr[index]);
                var isAnyPointOutOfPath = this.getAllLettersPoint(linePoints, true);
                //Check if characters are out of path. If Yes then assigning previous font size
                if (isAnyPointOutOfPath) {
                    var newFontSize = this.getAllowedSmallFontSizes(this.nonScaledFontSize)[0];
                    this.setFontSizeInContext(ctx, newFontSize);
                    this.getAllLettersPoint(linePoints);
                    break;
                }
            }
        },

        setFontSizeInContext: function(ctx, fontSize){
            this.nonScaledFontSize = fontSize;
            this.fontSize = fontSize / this.scaleX;
            this._pushStyleToContext(ctx, this);
        },

        getAllLettersPoint: function (linePoints, breakWhenOutOfPath) {
            var line = linePoints.line;
            var lineIndex = linePoints.lineIndex;
            var reverseMode = linePoints.reverseMode;
            var spaceWidth = linePoints.spaceWidth;
            var ctx = linePoints.ctx;
            var runningDistance = linePoints.runningDistance;
            var halfHeightOfLetter = linePoints.halfHeightOfLetter;
            var left = linePoints.left;
            var top = linePoints.top;
            var drawingOffsetX = linePoints.drawingOffsetX;
            var drawingOffsetY = linePoints.drawingOffsetY;
            var halfNonTransformedHeight = linePoints.halfNonTransformedHeight;

            var lastPoint;
            var isOutOfpath = false;
            this._boundaries[lineIndex].letters = [];
            // Iterate the line character by character.
            for (var charIndex = 0, len = line.length; charIndex < len; charIndex++) {
                // Letter, space, etc.
                var letter = line[charIndex];
                // If in reverse mode, complement the character index by length.
                var actualCharIndex = (!reverseMode) ? charIndex : (len - charIndex) - 1;
                // Track to see if the letter is whitespace.
                // For justification purposes, define the width of a space.
                var overrideSpaceWidth = (spaceWidth == null) ? false : true;
                var letterIsWhitespaceDuringSpaceOverride = (overrideSpaceWidth && /\s/.test(letter)) ? true : false;
                // Prepare to get the width of the character.  Used for distance consumption if not observing rotation.
                var widthOfCharacter = (letterIsWhitespaceDuringSpaceOverride) ? spaceWidth : ctx.measureText(letter).width;
                // Halve the width. Used for centering.
                var halfWidth = widthOfCharacter / 2;
                var point = this._calculateBestFontSizeByPoint(runningDistance, widthOfCharacter, halfWidth, halfHeightOfLetter, top, lastPoint, reverseMode, letter);
                // If the center point of the letter's bounding box exists, render the letter and the bounding box (if requested) around it.
                if (point) {
                    // Track the forward motion along the line.
                    runningDistance = point.runningDistanceAfter;
                    // Adjust the point so that it represents the center of the horizontally sliding bounding box.
                    point.setXY(drawingOffsetX + point.x + left, drawingOffsetY + point.y - halfNonTransformedHeight);
                    // Cache the calculation. If frozen, this will be available on the next render request, and it should be much faster to just draw letters at points.
                    this._boundaries[lineIndex].letters[actualCharIndex] = {
                        letter: letter,
                        point: point
                    };
                }
                // Track last point.
                lastPoint = point;
                if (breakWhenOutOfPath && point.outOfPath) {
                    isOutOfpath = true;
                    break;
                }
            }
            // For purposes of alignment, store the consumed distance.
            this._boundaries[lineIndex].consumedDistance = runningDistance;
            this._lastBoundaries = this._boundaries;
            return isOutOfpath;
        },


        _calculateBestFontSizeByPoint: function (runningDistance, widthOfCharacter, halfWidth, halfHeightOfLetter, top, lastPoint, reverseMode, letter) {
            // Represents where the object would be placed if the line were completely horizontal. Use to find a tangent.
            var pass = 0;
            var thisDistancePlusHalfWidth = (!reverseMode) ? runningDistance + halfWidth : runningDistance - halfWidth;
            var point = this.textPath.getPointAtLength(thisDistancePlusHalfWidth, true);
            var lastDistanceToConsume = (lastPoint) ? lastPoint.distanceToConsume : 0;
            var distanceToConsume = widthOfCharacter;
            var halfDistanceToConsume = distanceToConsume / 2;
            var angleOfTangentInDegrees = this._getAngleOfTangentAtDistanceInDegrees(thisDistancePlusHalfWidth);
            // Taking average of last consume distance and current distance 
            var averageDistanceConsumedByTwoBoundingBoxes = (lastDistanceToConsume + distanceToConsume) / 2;
            // Taking clear distance from current characters.  
            var clearDistance = averageDistanceConsumedByTwoBoundingBoxes / Math.max(2.5, (10 - pass));
            if (!(clearDistance == null) && clearDistance > 0) {
                thisDistancePlusHalfWidth += (!reverseMode) ? clearDistance : -clearDistance; // adding more distance.
                var thisPoint = this.textPath.getPointAtLength(thisDistancePlusHalfWidth, true);
                // If there isn't a new point or if the new point is the same as the last one (in the case of hitting the end of a path), the point is not acceptable or out of path.
                if (point.eq(thisPoint)) {
                    point.outOfPath = true;
                }
                thisDistancePlusHalfWidth -= (!reverseMode) ? clearDistance : -clearDistance; // making this as it was previously to eliminate bug in SVG and Canvas.
            }
            if (!(point == null)) {
                point.distanceToConsume = distanceToConsume;
                point.runningDistanceAfter = (!reverseMode) ? thisDistancePlusHalfWidth + halfDistanceToConsume : thisDistancePlusHalfWidth - halfDistanceToConsume;
                point.angleOfTangentInRadians = fabric.util.degreesToRadians(angleOfTangentInDegrees);
                point.halfWidth = halfWidth;
                point.halfHeightOfLetter = halfHeightOfLetter;
                point.widthOfCharacter = widthOfCharacter;
                if (point.boundingBox == null) {
                    point.boundingBox = this._getMinorBoundingBoxAroundPoint(point, top, halfWidth, halfHeightOfLetter, angleOfTangentInDegrees, reverseMode);
                }
            }
            return point;
        },

        getAllowedSmallFontSizes: function (currentFontSize) {
            var allowedSmallFontSizes = [];
            for (var index = 0; index <= this.allowedFontSizes.length; index++) {
                if (this.allowedFontSizes[index] < currentFontSize) {
                    allowedSmallFontSizes.push(this.allowedFontSizes[index]);
                }
            }
            allowedSmallFontSizes.reverse();
            allowedSmallFontSizes = (allowedSmallFontSizes.length == 0) ? this.allowedFontSizes[0] : allowedSmallFontSizes;
            return allowedSmallFontSizes;
        },

        getAllowedBiggerFontSize: function (currentFontSize) {
            var allowedBiggerFontSizes = [];
            for (var index = 0; index <= this.allowedFontSizes.length; index++) {
                if (this.allowedFontSizes[index] > currentFontSize) {
                    allowedBiggerFontSizes.push(this.allowedFontSizes[index]);
                }
            }
            allowedBiggerFontSizes = (allowedBiggerFontSizes.length == 0) ? this.allowedFontSizes[this.allowedFontSizes.length - 1] : allowedBiggerFontSizes;
            return allowedBiggerFontSizes;
        },

        /**
         * Pushes style declaration's attributes into the context
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {object} styleDeclaration Dictionary containing style directives relevant to the context.
         */
        _pushStyleToContext: function (ctx, styleDeclaration) {
            //console.log('_pushStyleToContext',26);
            if (typeof styleDeclaration.shadow === 'string') {
                styleDeclaration.shadow = new fabric.Shadow(styleDeclaration.shadow);
            }
            var fill = styleDeclaration.fill || this.fill;
            ctx.fillStyle = (fill == null) ? fill : fill.toLive
              ? fill.toLive(ctx)
              : fill;
            var validStrokeWidthExists = (!(styleDeclaration.strokeWidth == null) && styleDeclaration.strokeWidth > 0) ? true : false;
            if (styleDeclaration.stroke && (validStrokeWidthExists || styleDeclaration.strokeWidth == null)) {
                ctx.strokeStyle = (styleDeclaration.stroke && styleDeclaration.stroke.toLive)
                  ? styleDeclaration.stroke.toLive(ctx)
                  : styleDeclaration.stroke;
            }
            ctx.lineWidth = styleDeclaration.strokeWidth || this.strokeWidth;
            ctx.font = this._getFontDeclaration(styleDeclaration);
            this._setShadow(styleDeclaration, ctx);
        },

        /**
         * Render a line of the text in fabric.Text#text by the requested context method
         * @private
         * @param {String} method Method name ("fillText" or "strokeText")
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {String} line Text to calculate.
         * @param {Number} left Left position of text.
         * @param {Number} top Top position of text.
         * @param {Number} lineIndex Index of the line in the text.
         * @param {Boolean} spaceWidth If defined, width of space to use in place of measured width (specifically, for purposes of justification).
         */
        _renderTextLineOnTextPath: function (method, ctx, line, left, top, lineIndex, spaceWidth) {
            //console.log('_renderTextLineOnTextPath',27);
            // In the middle of approximating, turn off non-essential features.
            var approximating = (!this.textPath.wantApproximationDetail || this.textPath.wantApproximationDetail == 0) ? false : true;
            // Figure out if the letter locations need to be calculated.
            var isNotCalculated = (this._boundaries[lineIndex].letters == null) ? true : false;
            // If the letter locations need to be calculated, calculate where the letters should be drawn.
            if (isNotCalculated) {
                this._calculateTextLineOnTextPath(method, ctx, line, left, top, lineIndex, approximating, spaceWidth);
            }
            // If requested, draw the text how it would have been.
            this._drawTextResidueIfNecessary(method, ctx, line, left, top, lineIndex);
            // Get calculated line metadata.
            var thisLineMetaData = this._boundaries[lineIndex];
            // Obtain the height of the untransformed bounding box that the unpathed text would have created.
            var nonTransformedHeightOfAllLines = this._getObservedTotalLineHeight(ctx);
            var halfNonTransformedHeight = nonTransformedHeightOfAllLines / 2;
            // Get the center of the object.
            var centerOfTextObject = this.getCenterPoint();
            // Get the center of what's being observed.
            var centerOfPathObject = this.textPath.getCenterPoint();
            // Get vertical delta.
            var distanceFromPathCenterY = centerOfPathObject.y - centerOfTextObject.y;
            // Subtract out the top offset (and other offsets) to get just the summed line height. fabric.IText already does away with the 4th fontSize lift that occurs in fabric.Text.
            var summedLineHeight = (this.type == "i-text") ? top - this._getTopOffset() : top - this._getTopOffset() + this.fontSize / 4;
            // Object supports character styles.
            var supportsSpecificStyles = (this.getCurrentCharStyle == null) ? false : true;
            var charExceed = false;
            var visibleText = '';
            for (var charIndex = 0, len = thisLineMetaData.letters.length; charIndex < len; charIndex++) {
                var letterEntry = thisLineMetaData.letters[charIndex];
                // Get character style. Character indices in line styles are one-index rather than zero-index.
                var style = (!supportsSpecificStyles) ? this : this.getCurrentCharStyle(lineIndex, charIndex + 1);
                // For fabric.IText, push the background color onto the style.
                if (!style.backgroundColor) {
                    style.backgroundColor = this.backgroundColor;
                }
                /*Checking characters are going out of path if single characters is going of it*/
                if (!charExceed && letterEntry.point.outOfPath) {
                    charExceed = true;
                }
                else if (!letterEntry.point.outOfPath) {
                    visibleText += letterEntry.letter;
                }
                // Draw it.
                this._renderLetterAtPoint(method, ctx, letterEntry.letter, letterEntry.point, top, lineIndex, halfNonTransformedHeight, summedLineHeight, style, approximating);
            }
            this.visibleText = visibleText;
            if (charExceed) {
                this.isOutOfPath = true;
            }
            else {
                this.isOutOfPath = false;
            }

        },

        /**
         * Returns object representation of an instance
         * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
         * @return {Object} Object representation of an instance
         */
        toObject: function (propertiesToInclude) {
            //console.log('toObject',28);
            // Point to the correct superclass method for cases where this.constructor.superclass does not point to fabric.Object (i.e. fabric.IText).
            var fn = fabric.Object.prototype["toObject"];
            fn = fn.bind(this);
            // Create the object with just the wanted data.
            var object = fabric.util.object.extend(fn(propertiesToInclude), {
                text: this.text,
                fontSize: this.fontSize,
                fontWeight: this.fontWeight,
                fontFamily: this.fontFamily,
                fontStyle: this.fontStyle,
                lineHeight: this.lineHeight,
                textDecoration: this.textDecoration,
                textAlign: this.textAlign,
                path: this.path,
                textBackgroundColor: this.textBackgroundColor,
                useNative: this.useNative,
                // textPath:                    this.textPath, // Commented because dont want path object in JSON
                textPathDistanceOffset: this.textPathDistanceOffset,
                wantObservePathRotation: this.wantObservePathRotation,
                wantTextPathWithLessOverlap: this.wantTextPathWithLessOverlap,
                wantTextPathResidue: this.wantTextPathResidue,
                wantApproximationDetail: this.wantApproximationDetail,
                //Edited:: Added original font size property in JSON import.
                nonScaledFontSize: this.nonScaledFontSize,
                originalFontSize: this.originalFontSize,
                removeExtraChar: this.removeExtraChar,
                pathString: this.pathString,
                showPath: this.showPath,
                isOutOfPath: this.isOutOfPath,
                visibleText: this.visibleText,
                centerAlignmentRequired: this.centerAlignmentRequired
            });
            // Remove default values if requested.
            if (!this.includeDefaultValues) {
                this._removeDefaultValues(object);
            }
            return object;
        },

        /**
         * Returns SVG representation of an instance
         * @param {Function} [reviver] Method for further parsing of svg representation.
         * @return {String} svg representation of an instance
         */
        toSVG: function (reviver) {
            //console.log('toSVG',29);
            var markup = [],
                textLines = this._getTextLines(),
                offsets = this._getSVGLeftTopOffsets(textLines),
                textAndBg = this._getSVGTextAndBg(offsets.lineTop, offsets.textLeft, textLines),
                shadowSpans = this._getSVGShadows(offsets.lineTop, textLines);
            // Move top offset by font ascent in case of Cufon.
            offsets.textTop += (this._fontAscent ? ((this._fontAscent / 5) * this.lineHeight) : 0);
            // Adds a group element with a single child text object.
            this._wrapSVGTextAndBg(markup, textAndBg, shadowSpans, offsets);
            return reviver ? reviver(markup.join('')) : markup.join('');
        },

        /**
         * Returns styles-string for svg-export
         * @return {String}
         */
        getSvgStyles: function () {
            //console.log('getSvgStyles',30);
            var fill = this.fill
                  ? (this.fill.toLive ? 'url(#SVGID_' + this.fill.id + ')' : this.fill)
                  : 'none',
                fillRule = (this.fillRule === 'destination-over' ? 'evenodd' : this.fillRule),
                stroke = this.stroke
                  ? (this.stroke.toLive ? 'url(#SVGID_' + this.stroke.id + ')' : this.stroke)
                  : 'none',
                strokeWidth = this.strokeWidth ? this.strokeWidth : '0',
                strokeDashArray = this.strokeDashArray ? this.strokeDashArray.join(' ') : '',
                strokeLineCap = this.strokeLineCap ? this.strokeLineCap : 'butt',
                strokeLineJoin = this.strokeLineJoin ? this.strokeLineJoin : 'miter',
                strokeMiterLimit = this.strokeMiterLimit ? this.strokeMiterLimit : '4',
                 /*Edited:: Artifi Project*/
                 /*TODO:: Have to remove dependency of this (Hack done to fix issue of show path )*/
                 opacity = '1',
                //opacity = typeof this.opacity !== 'undefined' ? this.opacity : '1',
                visibility = this.visible ? '' : ' visibility: hidden;',
                filter = this.shadow && this.type !== 'text' && this.type !== 'i-text' ? 'filter: url(#SVGID_' + this.shadow.id + ');' : '';
            return [
              'stroke: ', stroke, '; ',
              'stroke-width: ', strokeWidth, '; ',
              'stroke-dasharray: ', strokeDashArray, '; ',
              'stroke-linecap: ', strokeLineCap, '; ',
              'stroke-linejoin: ', strokeLineJoin, '; ',
              'stroke-miterlimit: ', strokeMiterLimit, '; ',
              'fill: ', fill, '; ',
              'fill-rule: ', fillRule, '; ',
              'opacity: ', opacity, ';',
              filter,
              visibility
            ].join('');
        },

        /**
         * Returns transform-string for svg-export.
         * @return {String}
         */
        getSvgTransform: function () {
            if (this.group && this.group.type === 'path-group') {
                return '';
            }
            var toFixed = fabric.util.toFixed,
                angle = this.getAngle(),
                vpt = !this.canvas || this.canvas.svgViewportTransformation ? this.getViewportTransform() : [1, 0, 0, 1, 0, 0],
                center = fabric.util.transformPoint(this.getCenterPoint(), vpt),

                NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS,

                translatePart = this.type === 'path-group' ? '' : 'translate(' +
                                  toFixed(center.x, NUM_FRACTION_DIGITS) +
                                  ' ' +
                                  toFixed(center.y, NUM_FRACTION_DIGITS) +
                                ')',

                anglePart = angle !== 0
                  ? (' rotate(' + toFixed(angle, NUM_FRACTION_DIGITS) + ')')
                  : '',

                scalePart = (this.scaleX === 1 && this.scaleY === 1 && vpt[0] === 1 && vpt[3] === 1)
                  ? '' :
                  (' scale(' +
                    toFixed(this.scaleX * vpt[0], NUM_FRACTION_DIGITS) +
                    ' ' +
                    toFixed(this.scaleY * vpt[3], NUM_FRACTION_DIGITS) +
                  ')'),

                addTranslateX = this.type === 'path-group' ? this.width * vpt[0] : 0,

                flipXPart = this.flipX ? ' matrix(-1 0 0 1 ' + addTranslateX + ' 0) ' : '',

                addTranslateY = this.type === 'path-group' ? this.height * vpt[3] : 0,

                flipYPart = this.flipY ? ' matrix(1 0 0 -1 0 ' + addTranslateY + ')' : '';

            return [
              translatePart, anglePart, scalePart, flipXPart, flipYPart
            ].join('');
        },

        /**
         * Create a group element with a single child text element to represent the fabric.Text-like object.
         * @private
         */
        _wrapSVGTextAndBg: function (markup, textAndBg, shadowSpans, offsets) {
            //console.log('_wrapSVGTextAndBg',32);
            // If this object has a text path to which it should adhere, define the path.
            var textPathId, addTransform = '';
            if (!(this.textPath == null)) {
                textPathId = (this.textPath.id) ? this.textPath.id : "text-path";
                //        markup.push(
                //          '<defs>\n',
                //            '<path id="' + textPathId + '" d="' + this.textPath.getSVGData() + '"  />\n',
                //          '</defs>\n'
                //        );

                //Edited :: Added extra parameter in SVG path of text path so that SVG should match
                if (!(this.textPath.group && this.textPath.group.type === 'path-group')) {
                    addTransform = 'translate(' + (-this.textPath.pathOffset.x) + ', ' + (-this.textPath.pathOffset.y) + ')';
                }
                markup.push(
                    '<defs>\n',
                    '<path id="' + textPathId,
                    '" d="' + this.textPath.getSVGData(),
                    '" style="', this.textPath.getSvgStyles(),
                    '" transform="', this.textPath.getSvgTransform(), addTransform,
                    this.textPath.getSvgTransformMatrix(), '" stroke-linecap="round" ',
                    '/>\n',
                    '</defs>\n'
                );

            }
            var hasTextPathId = (!(textPathId == null)) ? true : false,
                svgTransformValue = [this.getSvgTransform(), this.getSvgTransformMatrix()].join(''),
                svgTransformAttribute = (svgTransformValue !== '') ? ' transform="' + svgTransformValue + '"' : '',
                textLeft = (!hasTextPathId) ? offsets.textLeft : 0,
                textPathStartOffsetPercent = (!hasTextPathId || this.textPathDistanceOffset == null) ? 0 : (100 * this.textPathDistanceOffset / this.textPath.pathLength()) || 0;
            var fontSize = (this.canGrow) ? this.nonScaledFontSize : this.nonScaledFontSize;
            // Push the group element with a single child text element.
            markup.push(
              // Rewrite svg transform to ignore y when path is available.
                //Edited :: Removed rotate attribute because added this on the path on which it has been linked.
              //'<g', svgTransformAttribute, '>\n',
                '<g>\n',
                textAndBg.textBgRects.join(''),
                '<text ',
                  (this.fontFamily ? 'font-family="' + this.fontFamily.replace(/"/g, '\'') + '" ' : ''),
                //Edited :: Used originalFontSize property instead of fontSize because font size will be scaled and SVG import will contain scaled font.
                 // (this.fontSize ? 'font-size="' + this.fontSize + '" ': ''),
                  (this.nonScaledFontSize ? 'font-size="' +  + fontSize + '" ' : ''),
                  (this.fontStyle ? 'font-style="' + this.fontStyle + '" ' : ''),
                  (this.fontWeight ? 'font-weight="' + this.fontWeight + '" ' : ''),
                  (this.textDecoration ? 'text-decoration="' + this.textDecoration + '" ' : ''),
                  'style="', this.getSvgStyles(), '" ',
                  /* svg starts from left/bottom corner so we normalize height */
                  // Rewrite text x transform to negate the group x transform when path available.
                  //Edited :: Commented because don't have need of transform on linked object like path text object
                  //'transform="translate(', fabric.util.toFixed(textLeft, 2), ' ', fabric.util.toFixed(offsets.textTop, 2), ')">\n',
                  'transform="translate()">\n',
                  (hasTextPathId) ? '<textPath xlink:href="#' + textPathId + '" startOffset="' + textPathStartOffsetPercent + '%">\n' : '',
                    // Add shadow tspans.
                    shadowSpans.join(''),
                    // Add text and background tspans.
                    textAndBg.textSpans.join(''),
                  (hasTextPathId) ? '</textPath>\n' : '',
                '</text>\n',
              '</g>\n'
            );
        },

        /**
         * Get an copy of the text with an offset and a reduced fill-opacity to act as a shadow.
         * @private
         * @param {Number} lineHeight
         * @param {Array} textLines Array of all text lines
         * @return {Array}
         */
        _getSVGShadows: function (lineHeight, textLines) {
            //console.log('_getSVGShadows',33);
            // In IE 7 & 8, empty tspans are completely ignored. Using a lineTopOffsetMultiplier prevents empty tspans.
            var shadowSpans = [],
                i, len,
                lineTopOffsetMultiplier = 1;
            // Skip this step if there isn't a shadow specified or the object hasn't been rendered.
            if (!this.shadow || !this._boundaries) {
                return shadowSpans;
            }
            // Iterate the text lines, pushing a tspan with a reduced fill-opacity to act as a makeshift shadow.
            for (i = 0, len = textLines.length; i < len; i++) {
                if (textLines[i] !== '') {
                    this._setSVGTextLineShadow(textLines[i], i, shadowSpans, lineHeight, lineTopOffsetMultiplier);
                    lineTopOffsetMultiplier = 1;
                }
                else {
                    lineTopOffsetMultiplier++;
                }
            }
            return shadowSpans;
        },

        /**
         * Push the tspan element(s) that will represent the shadow for the text line.
         * @private
         * @param {String} textLine Line of text to render.
         * @param {Number} lineIndex Line number being rendered.
         * @param {Array} shadowSpans Array to push the tspan elements into.
         * @param {Number} lineHeight Height of line being rendered.
         * @param {Number} lineTopOffsetMultiplier Misnamed adjustment to keep tspan considered non-trivial.
         */
        _setSVGTextLineShadow: function (textLine, lineIndex, shadowSpans, lineHeight, lineTopOffsetMultiplier) {
            //console.log('_setSVGTextLineShadow',34);
            var lineLeftOffset = (this._boundaries && this._boundaries[lineIndex]) ? (this._boundaries[lineIndex].left - lineTopOffsetMultiplier) : 0,
                xValue = (lineLeftOffset + lineTopOffsetMultiplier) + this.shadow.offsetX,
                yOrDeltaYAttributeName = ((lineIndex === 0 || this.useNative) ? 'y' : 'dy'),
                yOrDeltaYValue = this.useNative
                ? ((lineHeight * lineIndex) - this.height / 2 + this.shadow.offsetY)
                : (lineHeight + (lineIndex === 0 ? this.shadow.offsetY : 0)),
                shadowFillColor = (this.shadow.color && typeof this.shadow.color === 'string') ? new fabric.Color(this.shadow.color) : '';
            // Push the tspan element.
            shadowSpans.push(
              '<tspan',
                // x="x-value"
                ' ', 'x="', fabric.util.toFixed(xValue, 2), '"',
                // y="y-value" (or) dy="dy-value"
                ' ', yOrDeltaYAttributeName, '="', fabric.util.toFixed(yOrDeltaYValue, 2), '"',
                // Attributes, may include: stroke-opacity, fill-opacity, opacity, and fill.
                ' ', 'stroke-opacity="' + shadowFillColor.getAlpha() + '"', ' ', this._getFillAttributes(this.shadow.color), '>',
                // Escaped text for given line.
                fabric.util.string.escapeXml(textLine),
              '</tspan>'
            );
        },

        /**
        * @private
        * @param {String} textLine 
        * @param {Number} i index of first character on text line
        * @param {Number} lineHeight line height of text line
        * @param {Number} lineTopOffsetMultiplier text line top offset from which is start drawing 
        * @return {String} Text span svg string
        */
        _setSVGTextLineText: function (textLine, i, textSpans, lineHeight, lineTopOffsetMultiplier) {
            var lineLeftOffset = null;
            /*Taking distance on path for first letter of string*/
            if (this.textAlign == "left" || this.textAlign == "justify") {
                lineLeftOffset = (this._boundaries && this._boundaries[i])
                ? toFixed(this._boundaries[i].left, 2)
                : 0;
            }
            else if (this.textAlign == "right") {
                lineLeftOffset = (this._lastBoundaries && this._lastBoundaries[i])
                ? toFixed((this._lastBoundaries[i].letters[i].point.runningDistanceAfter * this.scaleX), 2)
                : 0;
            }
            else if (this.textAlign == "center") {
                lineLeftOffset = (this._lastBoundaries && this._lastBoundaries[i])
                ? toFixed(((this._lastBoundaries[i].letters[i].point.runningDistanceAfter - this._lastBoundaries[i].letters[i].point.distanceToConsume) * this.scaleX), 2)
                : 0;
            }

            textSpans.push(
                /*Used dx instead of x because in inkscape text not align with x property*/
              '<tspan dx="',
                lineLeftOffset, '" ',
                (i === 0 || this.useNative ? 'y' : 'dy'), '="',
                toFixed(this.useNative
                  ? ((lineHeight * i) - this.height / 2)
                  : (lineHeight * lineTopOffsetMultiplier), 2), '" ',
                this._getFillAttributes(this.fill), '>',
                fabric.util.string.escapeXml(textLine),
              '</tspan>'
            );
        },

        /**
         * Adobe Illustrator (at least CS5) is unable to render rgba()-based fill values. Work around this by "moving" alpha channel into an "opacity" attribute and setting the "fill" attribute to a solid "rgb" (as opposed to "rgba") color. Firefox expects this value to be in the "fill-opacity" attribute
         * @private
         * @param {Any} value
         * @return {String}
         */
        _getFillAttributes: function (value) {
            //console.log('_getFillAttributes',35);
            var fillColor = (value && typeof value === 'string') ? new fabric.Color(value) : '';
            if (!fillColor || !fillColor.getSource() || fillColor.getAlpha() === 1) {
                return 'fill="' + value + '"';
            }
            return 'fill-opacity="' + fillColor.getAlpha() + '" opacity="' + fillColor.getAlpha() + '" fill="' + fillColor.setAlpha(1).toRgb() + '"';
        }
    });

    /**
     * Returns fabric.Text instance from an object representation
     * @static
     * @memberOf fabric.Text
     * @param {Object} object Object to create an instance from
     * @return {fabric.Text} Instance of fabric.Text
     */
    fabric.PathText.fromObject = function (object) {
        //console.log('fabric.PathText.fromObject',36);
        var clonedObject = fabric.util.object.clone(object);
        var instance = new fabric.PathText(object.text, clonedObject, function () {
            return instance && instance.canvas && instance.canvas.renderAll();
        });
        return instance;
    };


})(typeof exports != 'undefined' ? exports : this);
/*========= PathText Class End ========*/


/*======== Circle Text Class Start ========*/
(function (global) {
    'use strict';
    /**
     * Getting methods needed for from Util class.
     */
    var fabric = global.fabric || (global.fabric = {}),
        extend = fabric.util.object.extend,
        clone = fabric.util.object.clone,
        toFixed = fabric.util.toFixed;

    if (fabric.CircleText) {
        fabric.warn('fabric.CircleText is already defined.');
        return;
    }
    if (!fabric.PathText) {
        fabric.warn('fabric.CircleText requires fabric.PathText');
        return;

    }


    // Extend fabric.PathText to include the necessary methods to render the text along a Arc.
    fabric.CircleText = fabric.util.createClass(fabric.PathText, {

        type: 'circle-text',

        /**
         * Radius of which Arc have to draw
         * @type Integer
         */
        radius: 150,

        /**
         * Angle from which Arc have to start drawing.
         * @type Integer
         */
        startAngle: 0,

        /**
         * Angle on which Arc have to stop drawing.
         * @type Integer
         */
        endAngle: 360,

        /**
         * Constant value used for calculating Angle for the Arc.
         * @type Integer
         */
        // Roughly 1/1000th of a degree, see below
        EPSILON: 0.00001,
        /**
         * Direction of drawing.
         * @type Integer
         */
        clockwise: true,

        textAlign: "left",

        centerAlignmentRequired: false,

        /*Setting Default Properties */
        originX: 'center',
        originY: 'center',
        id: 'circleText_1',

        /*Initializing options and updating options if its value does not exists
        * @param: {Object} [objects] Object that needs to add
        * @param: {Object} [options] options that need to set
        * */
        initialize: function (objects, options) {
            options || (options = {});
            options = this._getUpdatedOptions(options);
            this.callSuper('initialize', objects, options);

        },

        /*Updating options if its value does not exists that are needed for the path string and generating it
        * @param: {Object} [options] options that need to set.
        * @return: {Object} Return the updated option set.
        */
        _getUpdatedOptions: function (options) {

            options.endAngle = (options.endAngle) ? parseFloat(options.endAngle) : this.endAngle;
            options.startAngle = (options.startAngle) ? parseFloat(options.startAngle) : this.startAngle;
            options.radius = (options.radius) ? parseFloat(options.radius) : this.radius;
            options.clockwise = (typeof options.clockwise == "boolean") ? options.clockwise : this.clockwise;
            options.textAlign = (options.textAlign) ? options.textAlign : this.textAlign;
            options.centerAlignmentRequired = (options.centerAlignmentRequired) ? options.centerAlignmentRequired : this.centerAlignmentRequired
            options.pathString = this._getPathObject(options);
            return options;

        },

        /*Generating path string from radius, start angle, end angle
         * @param: {Object} [options] options that need to set for getting path string.
         * @return: {String} [pathString] Return path string.
         */
        _getPathObject: function (options) {
            var xCenter = (options.radius / 2);
            var yCenter = (options.radius / 2);
            var pathString = this._getPathString(xCenter, yCenter, options.radius, options.startAngle, options.endAngle, options.clockwise, options.textAlign, options.centerAlignmentRequired);
            return pathString;
        },

        /*Added check of endAngle, startAngle and radius if those properties get updated then generating path string again
         * @param: {Object} [prop] options that need to set for getting path string.
         * @param: {Object} [value] value of those properties.
         * @return {Object} [this] return the instance of same class.
         */
        _set: function (prop, value) {
            this.callSuper('_set', prop, value);
            if (prop == 'endAngle' || prop == 'startAngle' || prop == 'radius' || prop == 'clockwise' || prop == 'textAlign' || prop == 'centerAlignmentRequired') {
                var options = {};
                options[prop] = value;
                options = this._getUpdatedOptions(options);
                prop = 'pathString'; //Hack because does not found best solution for get key
                value = options.pathString;
                this.callSuper('_set', prop, value);
            }
            return this;

        },

        /*
        * Filtering data that are needed for the drawing perfect circle. making start position to 0 degrees.
        * */

        _filterData: function (radius, startAngle, endAngle, clockwise, textAlign, centerAlignmentRequired) {
            var startAngle = startAngle;
            var endAngle = endAngle;
            var lastCharToConcat = '';
            var clockwise = clockwise;
            if (typeof radius == "undefined" || isNaN(radius)) {
                radius = 0;
            }
            if (startAngle == endAngle) {
                endAngle--;
            }
            else if (startAngle == 0 && endAngle == 360) {
                endAngle--;
                lastCharToConcat = " Z";
            }
            else if (startAngle == 360 && endAngle == 0) {
                startAngle--;
                lastCharToConcat = " Z";
            }
            else if (startAngle == 360) {
                startAngle--;
            }
            else if (endAngle == 360) {
                endAngle--;
            }

            /*For making start position to bottom in case of Full circle and center Aligned*/
            if (startAngle == 0 && endAngle == 359 && textAlign == "center" && centerAlignmentRequired) {   // 359 because the endAngle is being modified above.
                startAngle += -270;
                endAngle += -270;
            }
            else {
                /*For making start position to 0 degree in left hand side*/
                startAngle += -180;
                endAngle += -180;
            }

            /*Swaping start and end angles when clockwise is false i.e anti-clockwise rendering required*/
            if (!clockwise) {
                endAngle = [startAngle, startAngle = endAngle][0];
            }
            return { radius: radius, startAngle: startAngle, endAngle: endAngle, lastCharToConcat: lastCharToConcat };
        },

        _getPathString: function (xCenter, yCenter, radius, startAngle, endAngle, clockwise, textAlign, centerAlignmentRequired) {
            var pathInput = this._filterData(radius, startAngle, endAngle, clockwise, textAlign, centerAlignmentRequired);
            var radius = pathInput.radius,
                startAngle = pathInput.startAngle,
                endAngle = pathInput.endAngle,
                lastCharToConcat = pathInput.lastCharToConcat;

            /*Start Angle*/
            var a1 = startAngle * (Math.PI / 180);
            /*End Angle*/
            var a2 = endAngle * (Math.PI / 180);
            /*Radius*/
            var curves = this._createArc(radius, a1, a2);
            var pathData = '';
            for (var curve in curves) {
                var curve = curves[curve];
                if (!pathData)
                    pathData = "M " + (curve.x1 + xCenter) + " " + (curve.y1 + yCenter);

                pathData +=
					" C " + (curve.x2 + xCenter) + " " + (curve.y2 + yCenter) +
					" " + (curve.x3 + xCenter) + " " + (curve.y3 + yCenter) +
					" " + (curve.x4 + xCenter) + " " + (curve.y4 + yCenter);
            }

            pathData += lastCharToConcat;
            return pathData;
        },


        /**
		 *  Return a array of objects that represent bezier curves which approximate the 
		 *  circular arc centered at the origin, from startAngle to endAngle (radians) with 
		 *  the specified radius.
		 *  
		 *  Each bezier curve is an object with four points, where x1,y1 and 
		 *  x4,y4 are the arc's end points and x2,y2 and x3,y3 are the cubic bezier's 
		 *  control points.
		 */
        /*Added check of endAngle, startAngle and radius if those properties get updated then generating path string again
        * @return {Number} [radius] radius of Circle.
        * @return {Number} [startAngle] start angle of Circle.
        * @return {Number} [endAngle] end angle of circle.
        */
        _createArc: function (radius, startAngle, endAngle) {
            // normalize startAngle, endAngle to [-2PI, 2PI]

            var twoPI = Math.PI * 2;
            startAngle = startAngle % twoPI,
			endAngle = endAngle % twoPI;

            // Compute the sequence of arc curves, up to PI/2 at a time.  Total arc angle
            // is less than 2PI.

            var curves = [];
            var piOverTwo = Math.PI / 2.0;
            var sgn = (startAngle < endAngle) ? 1 : -1;

            var a1 = startAngle;
            for (var totalAngle = Math.min(twoPI, Math.abs(endAngle - startAngle)) ; totalAngle > this.EPSILON;) {
                var a2 = a1 + sgn * Math.min(totalAngle, piOverTwo);
                curves.push(this._createSmallArc(radius, a1, a2));
                totalAngle -= Math.abs(a2 - a1);
                a1 = a2;
            }

            return curves;
        },

        /**
		 *  Cubic bezier approximation of a circular arc centered at the origin, 
		 *  from (radians) a1 to a2, where a2-a1 < pi/2.  The arc's radius is r.
		 * 
		 *  Returns an object with four points, where x1,y1 and x4,y4 are the arc's end points
		 *  and x2,y2 and x3,y3 are the cubic bezier's control points.
		 * 
		 *  This algorithm is based on the approach described in:
		 *  A. Ri۫us, "Approximation of a Cubic Bezier Curve by Circular Arcs and Vice Versa," 
		 *  Information Technology and Control, 35(4), 2006 pp. 371-378.
		 */
        /*Added check of endAngle, startAngle and radius if those properties get updated then generating path string again
        * @return {Number} [r] radius of Circle.
        * @return {Number} [a1] start angle of Circle.
        * @return {Number} [a2] end angle of circle.
        */
        _createSmallArc: function (r, a1, a2) {
            // Compute all four points for an arc that subtends the same total angle
            // but is centered on the X-axis

            var a = (a2 - a1) / 2.0;

            var x4 = r * Math.cos(a);
            var y4 = r * Math.sin(a);
            var x1 = x4;
            var y1 = -y4;

            var k = 0.5522847498;
            var f = k * Math.tan(a);

            var x2 = x1 + f * y4;
            var y2 = y1 + f * x4;
            var x3 = x2;
            var y3 = -y2;

            // Find the arc points actual locations by computing x1,y1 and x4,y4 
            // and rotating the control points by a + a1

            var ar = a + a1;
            var cos_ar = Math.cos(ar);
            var sin_ar = Math.sin(ar);

            return {
                x1: r * Math.cos(a1),
                y1: r * Math.sin(a1),
                x2: x2 * cos_ar - y2 * sin_ar,
                y2: x2 * sin_ar + y2 * cos_ar,
                x3: x3 * cos_ar - y3 * sin_ar,
                y3: x3 * sin_ar + y3 * cos_ar,
                x4: r * Math.cos(a2),
                y4: r * Math.sin(a2)
            };
        },

        /**
        * Returns object representation of an instance
        * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
        * @return {Object} Object representation of an instance
        */
        toObject: function (propertiesToInclude) {
            var fn = fabric.PathText.prototype["toObject"];
            fn = fn.bind(this);
            // Create the object with just the wanted data.
            var object = fabric.util.object.extend(fn(propertiesToInclude), {
                radius: this.radius,
                startAngle: this.startAngle,
                endAngle: this.endAngle,
                clockwise: this.clockwise,
                textAlign: this.textAlign,
                centerAlignmentRequired: this.centerAlignmentRequired
            });
            // Remove default values if requested.
            if (!this.includeDefaultValues) {
                this._removeDefaultValues(object);
            }
            return object;
        }
    });

    /**
     * Returns fabric.CircleText instance from an object representation
     * @static
     * @memberOf fabric.CircleText
     * @param {Object} object Object to create an instance from
     * @return {fabric.CircleText} Instance of fabric.CircleText
     */
    fabric.CircleText.fromObject = function (object) {
        var clonedObject = fabric.util.object.clone(object);
        var instance = new fabric.CircleText(object.text, clonedObject, function () {
            return instance && instance.canvas && instance.canvas.renderAll();
        });
        return instance;
    };


})(typeof exports != 'undefined' ? exports : this);
/*======== Circle Text Class End ========*/

/*======================================================================================== Circle Text Code End =============================================================================*/

/*Below code will use multiple filter like grayscale/shadow applied to a single object. Commenting this code as shadow color other than black is not getting grayscale.  */
//fabric.util.object.extend(fabric.Shadow.prototype, {
//    /*============== Custom Changes For Artifi ===================*/
//    toSVG: function (object) {
//        var color = this.color;
//        var grayScaleFilter;
//        var svgGrayScaleMergeFilter;
//        var isGrayScaleApplied = false;
//        var output;
//        var fBoxX = 40, fBoxY = 40;
//        if (object.width && object.height) {
//            //http://www.w3.org/TR/SVG/filters.html#FilterEffectsRegion
//            // we add some extra space to filter box to contain the blur ( 20 )
//            fBoxX = toFixed((Math.abs(this.offsetX) + this.blur) / object.width, 2) * 100 + 20;
//            fBoxY = toFixed((Math.abs(this.offsetY) + this.blur) / object.height, 2) * 100 + 20;
//        }

//        if (object.filters && object.filters[0] && object.filters[0].type) {
//            if (object.filters[0].type.toLowerCase() === "grayscale") {
//                //color = "rgba(102, 102, 102, 0)";
//                grayScaleFilter = '\t<feColorMatrix type="matrix" values="0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0" result="grayscale" />\n';
//                svgGrayScaleMergeFilter = '\t\t<feMergeNode in="grayscale"></feMergeNode>\n';
//                isGrayScaleApplied = true;
//            }
//        }

//        if (isGrayScaleApplied)
//        {
//            output = '<filter id="SVGID_' + this.id + '" y="-' + fBoxY + '%" height="' + (100 + 2 * fBoxY) + '%" ' +
//                     'x="-' + fBoxX + '%" width="' + (100 + 2 * fBoxX) + '%" ' + '>\n' +
//                      '\t<feColorMatrix type="matrix" values="0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0" result="grayscale" />\n' +
//                    '\t<feGaussianBlur in="SourceAlpha" stdDeviation="' +
//                      toFixed(this.blur ? this.blur / 2 : 0, 3) + '"></feGaussianBlur>\n' +
//                    '\t<feOffset dx="' + this.offsetX + '" dy="' + this.offsetY + '" result="oBlur" ></feOffset>\n' +
//                    '\t<feFlood flood-color="' + color + '"/>\n' +
//                    '\t<feComposite in2="oBlur" operator="in" />\n' +
//                    '\t<feMerge>\n' +
//                      '\t\t<feMergeNode></feMergeNode>\n' +
//                      '\t\t<feMergeNode in="SourceGraphic"></feMergeNode>\n' +
//                       '\t\t<feMergeNode in="grayscale"></feMergeNode>\n' +
//                    '\t</feMerge>\n' +
//                  '</filter>\n';
//        }
//        else {
//            output = '<filter id="SVGID_' + this.id + '" y="-' + fBoxY + '%" height="' + (100 + 2 * fBoxY) + '%" ' +
//                    'x="-' + fBoxX + '%" width="' + (100 + 2 * fBoxX) + '%" ' + '>\n' +                     
//                    '\t<feGaussianBlur in="SourceAlpha" stdDeviation="' +
//                      toFixed(this.blur ? this.blur / 2 : 0, 3) + '"></feGaussianBlur>\n' +
//                    '\t<feOffset dx="' + this.offsetX + '" dy="' + this.offsetY + '" result="oBlur" ></feOffset>\n' +
//                    '\t<feFlood flood-color="' + color + '"/>\n' +
//                    '\t<feComposite in2="oBlur" operator="in" />\n' +
//                    '\t<feMerge>\n' +
//                      '\t\t<feMergeNode></feMergeNode>\n' +
//                      '\t\t<feMergeNode in="SourceGraphic"></feMergeNode>\n' +                       
//                    '\t</feMerge>\n' +
//                    '</filter>\n';
//        }

//        return (output);
//    }
//});

/* code to apply BlackAndWhite Filter to image*/
(function (global) {

    'use strict';

    var fabric = global.fabric || (global.fabric = {});

    /**
     * BlackAndWhite filter class
     * @class fabric.Image.filters.BlackAndWhite
     * @memberOf fabric.Image.filters
     * @extends fabric.Image.filters.BaseFilter
     * @example
     * var filter = new fabric.Image.filters.BlackAndWhite();
     * object.filters.push(filter);
     * object.applyFilters(canvas.renderAll.bind(canvas));
     */
    fabric.Image.filters.BlackAndWhite = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.BlackAndWhite.prototype */ {

        /**
         * Filter type
         * @param {String} type
         * @default
         */
        type: 'BlackAndWhite',

        /**
         * Applies filter to canvas element
         * @memberOf fabric.Image.filters.BlackAndWhite.prototype
         * @param {Object} canvasEl Canvas element to apply filter to
         */
        applyTo: function (canvasEl) {
            var context = canvasEl.getContext('2d'),
                imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
                data = imageData.data,
                len = imageData.width * imageData.height * 4,
                index = 0,
                average, pixel;

            while (index < len) {
                average = (data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722).toFixed(0);
                if (average >= 123) {
                    pixel = 255;
                }
                else {
                    pixel = 0;
                }
                data[index] = pixel;
                data[index + 1] = pixel;
                data[index + 2] = pixel;
                index += 4;
            }

            context.putImageData(imageData, 0, 0);
        }
    });

    /**
     * Returns filter instance from an object representation
     * @static
     * @return {fabric.Image.filters.BlackAndWhite} 
     */
    fabric.Image.filters.BlackAndWhite.fromObject = function () {
        return new fabric.Image.filters.BlackAndWhite();
    };

})(typeof exports !== 'undefined' ? exports : this);


///*we are setting rotation icon size */
//fabric.Object.prototype.rotationIconSize = 15;

///*
// * This class change is for controlling visibility of middle top point in transform tool.
// */
//fabric.Object.prototype._controlsVisibility = {
//    bl: true,
//    br: true,
//    mb: true,
//    ml: true,
//    mr: true,
//    mt: false,
//    mtr: true,
//    tl: true,
//    tr: true
//};
///*
// * This class change is for adding rotate icon in transform tool.
// */
//var rotateIcon = null;
//fabric.Object.prototype.drawControls = function (ctx) {
//    if (!this.hasControls) {
//        return this;
//    }
//    var isMobileDevice = Artifi.Utils.isMobileDevice();
//    var size = this.cornerSize,
//        size2 = size / 2,
//        vpt = this.getViewportTransform(),
//        strokeWidth = this.strokeWidth > 1 ? this.strokeWidth : 0,
//        w = this.width,
//        h = this.height,
//        capped = this.strokeLineCap === 'round' || this.strokeLineCap === 'square',
//        vLine = this.type === 'line' && this.width === 1,
//        hLine = this.type === 'line' && this.height === 1,
//        strokeW = (capped && hLine) || this.type !== 'line',
//        strokeH = (capped && vLine) || this.type !== 'line',
//        customSize = (isMobileDevice) ? 20 : 0,
//        customPadding = (isMobileDevice) ? 40 : 0,
//        customCornerSize = (isMobileDevice) ? 100 : this.cornerSize;

//    if (vLine) {
//        w = strokeWidth;
//    }
//    else if (hLine) {
//        h = strokeWidth;
//    }
//    if (strokeW) {
//        w += strokeWidth;
//    }
//    if (strokeH) {
//        h += strokeWidth;
//    }
//    w *= this.scaleX;
//    h *= this.scaleY;

//    var wh = fabric.util.transformPoint(new fabric.Point(w, h), vpt, true),
//        width = wh.x,
//        height = wh.y,
//        left = -(width / 2),
//        top = -(height / 2),
//        padding = this.padding,
//        scaleOffset = size2,
//        scaleOffsetSize = size2 - size,
//        methodName = this.transparentCorners ? 'strokeRect' : 'fillRect';

//    ctx.save();

//    ctx.lineWidth = 1;

//    ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
//    ctx.strokeStyle = ctx.fillStyle = this.cornerColor;
//    this.cornerSize = customCornerSize;
//    // top-left
//    this._drawControl('tl', ctx, methodName,
//      left - scaleOffset - padding + customPadding,
//      top - scaleOffset - padding + customPadding, customSize);

//    // top-right
//    this._drawControl('tr', ctx, methodName,
//      left + width - scaleOffset + padding + customPadding,
//      top - scaleOffset - padding + customPadding, customSize);

//    // bottom-left
//    this._drawControl('bl', ctx, methodName,
//      left - scaleOffset - padding + customPadding,
//      top + height + scaleOffsetSize + padding + customPadding, customSize);

//    // bottom-right
//    this._drawControl('br', ctx, methodName,
//      left + width + scaleOffsetSize + padding + customPadding,
//      top + height + scaleOffsetSize + padding + customPadding, customSize);


//    if (!this.get('lockUniScaling')) {

//        // middle-top
//        this._drawControl('mt', ctx, methodName,
//          left + width / 2 - scaleOffset + customPadding,
//          top - scaleOffset - padding + customPadding, customSize);

//        // middle-bottom
//        this._drawControl('mb', ctx, methodName,
//          left + width / 2 - scaleOffset + customPadding,
//          top + height + scaleOffsetSize + padding + customPadding, customSize);

//        // middle-right
//        this._drawControl('mr', ctx, methodName,
//          left + width + scaleOffsetSize + padding + customPadding,
//          top + height / 2 - scaleOffset + customPadding, customSize);

//        // middle-left
//        this._drawControl('ml', ctx, methodName,
//          left - scaleOffset - padding + customPadding,
//          top + height / 2 - scaleOffset + customPadding, customSize);
//    }

//    if (this.hasRotatingPoint) {
//        var editorModel = main.getModel(Artifi.ModelConstant.EDITOR_MODEL);
//        var activeViewId = editorModel.getActiveViewId();
//        var scaleFactor = editorModel.getCssScaleFactorByViewId(activeViewId);

//        if (!rotateIcon) {
//            getRotateIconDom();
//        }
//        rotateLeft = (left + (width / 2)) - (scaleOffset + ((this.rotationIconSize / (scaleFactor)) / 4)),
//        rotateTop = top - this.rotatingPointOffset - ((this.rotationIconSize / (scaleFactor))) - padding;
//        var iconHeight = this.rotationIconSize / (scaleFactor);
//        var iconWidth = this.rotationIconSize / (scaleFactor);

//        if (rotateIcon.complete) {
//            ctx.drawImage(rotateIcon, rotateLeft + customPadding, (rotateTop + (iconHeight / 2)), iconWidth, iconHeight);
//        } else {
//            rotateIcon.onload = drawRotateImage();
//        }
//        function drawRotateImage() {
//            rotateIcon.onload = null;
//            ctx.drawImage(rotateIcon, rotateLeft + customPadding, (rotateTop + (iconHeight / 2)), iconWidth, iconHeight);
//        }
//    }
//    ctx.restore();
//    return this;

//};
//var isVML = function () {
//    return typeof G_vmlCanvasManager !== 'undefined';
//};
///*
// * This class change is for adding corner icon in transform tool.
// */
//fabric.Object.prototype._drawControl = function (control, ctx, methodName, left, top, customizeSize) {
//    var size = (customizeSize) ? customizeSize : this.cornerSize;
//    if (this.isControlVisible(control)) {
//        isVML() || this.transparentCorners || ctx.clearRect(left, top, size, size);
//        ctx[methodName](left, top, size, size);
//    }
//};
///**
//* Loads image element from given url and passes it to a callback
//* @memberOf fabric.util
//* @param {String} url URL representing an image
//* @param {Function} callback Callback; invoked with loaded image
//* @param {Any} [context] Context to invoke callback in
//* @param {Object} [crossOrigin] crossOrigin value to set image element to
//*/
//fabric.util.loadImage = function (url, callback, context, crossOrigin) {
//    if (!url) {
//        callback && callback.call(context, url);
//        return;
//    }

//    var img = fabric.util.createImage();

//    /** @ignore */
//    img.onload = function () {
//        callback && callback.call(context, img);
//        img = img.onload = img.onerror = null;
//    };

//    /** @ignore */
//    img.onerror = function () {
//        fabric.log('Error loading ' + img.src);
//        callback && callback.call(context, null, true);
//        img = img.onload = img.onerror = null;
//    };

//    // data-urls appear to be buggy with crossOrigin
//    // https://github.com/kangax/fabric.js/commit/d0abb90f1cd5c5ef9d2a94d3fb21a22330da3e0a#commitcomment-4513767
//    // see https://code.google.com/p/chromium/issues/detail?id=315152
//    //     https://bugzilla.mozilla.org/show_bug.cgi?id=935069
//    if (url.indexOf('data') !== 0 && typeof crossOrigin !== 'undefined') {
//        img.crossOrigin = crossOrigin;
//    } else {
//        img.crossOrigin = 'anonymous';
//    }
//    url = _Editor.model.replaceImageSrcCROSDomain(url);
//    img.src = url;
//}
///*
//* function is used to get 
//*/
//getRotateIconDom = function () {
//    rotateIcon = $("#rotationImage").clone()[0];
//    var rotateImageUrl = Artifi.Config ? Artifi.Config.rotateImageUrl : "";
//    if (!rotateIcon) {
//        var rotateImageDom = $("<img />", {
//            "src": rotateImageUrl, "id": "rotationImage"
//        });
//        $(rotateImageDom).hide();
//        $("body").append(rotateImageDom);
//        rotateIcon = $("#rotationImage").clone()[0];
//    }
//    rotateIcon.crossOrigin = "Anonymous";
//    $(rotateIcon).attr("src") || $(rotateIcon).attr("src", rotateImageUrl);
//    rotateIcon.id = "newRotateImage";
//    $(rotateIcon).show();
//}