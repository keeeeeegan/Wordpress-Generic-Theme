    /**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/LICENSE.txt                       |
    * o------------------------------------------------------------------------------o
    */

    /**
    * Initialise the various objects
    */
    if (typeof(RGraph) == 'undefined') RGraph = {isRGraph:true,type:'common'};


    RGraph.Registry       = {};
    RGraph.Registry.store = [];
    RGraph.Registry.store['chart.event.handlers']       = [];
    RGraph.Registry.store['__rgraph_event_listeners__'] = []; // Used in the new system for tooltips
    RGraph.background     = {};
    RGraph.objects        = [];
    RGraph.Resizing       = {};
    RGraph.events         = [];
    RGraph.cursor         = [];
    
    RGraph.ObjectRegistry                    = {};
    RGraph.ObjectRegistry.objects            = {};
    RGraph.ObjectRegistry.objects.byUID      = [];
    RGraph.ObjectRegistry.objects.byCanvasID = [];


    /**
    * Returns five values which are used as a nice scale
    * 
    * @param  max int    The maximum value of the graph
    * @param  obj object The graph object
    * @return     array   An appropriate scale
    */
    RGraph.getScale = function (max, obj)
    {
        /**
        * Special case for 0
        */
        if (max == 0) {
            return ['0.2', '0.4', '0.6', '0.8', '1.0'];
        }

        var original_max = max;

        /**
        * Manually do decimals
        */
        if (max <= 1) {
            if (max > 0.5) {
                return [0.2,0.4,0.6,0.8, Number(1).toFixed(1)];

            } else if (max >= 0.1) {
                return obj.Get('chart.scale.round') ? [0.2,0.4,0.6,0.8,1] : [0.1,0.2,0.3,0.4,0.5];

            } else {

                var tmp = max;
                var exp = 0;

                while (tmp < 1.01) {
                    exp += 1;
                    tmp *= 10;
                }

                var ret = ['2e-' + exp, '4e-' + exp, '6e-' + exp, '8e-' + exp, '10e-' + exp];


                if (max <= ('5e-' + exp)) {
                    ret = ['1e-' + exp, '2e-' + exp, '3e-' + exp, '4e-' + exp, '5e-' + exp];
                }

                return ret;
            }
        }

        // Take off any decimals
        if (String(max).indexOf('.') > 0) {
            max = String(max).replace(/\.\d+$/, '');
        }

        var interval = Math.pow(10, Number(String(Number(max)).length - 1));
        var topValue = interval;

        while (topValue < max) {
            topValue += (interval / 2);
        }

        // Handles cases where the max is (for example) 50.5
        if (Number(original_max) > Number(topValue)) {
            topValue += (interval / 2);
        }

        // Custom if the max is greater than 5 and less than 10
        if (max < 10) {
            topValue = (Number(original_max) <= 5 ? 5 : 10);
        }
        
        /**
        * Added 02/11/2010 to create "nicer" scales
        */
        if (obj && typeof(obj.Get('chart.scale.round')) == 'boolean' && obj.Get('chart.scale.round')) {
            topValue = 10 * interval;
        }

        return [topValue * 0.2, topValue * 0.4, topValue * 0.6, topValue * 0.8, topValue];
    }


    /**
    * Returns the maximum numeric value which is in an array
    * 
    * @param  array arr The array (can also be a number, in which case it's returned as-is)
    * @param  int       Whether to ignore signs (ie negative/positive)
    * @return int       The maximum value in the array
    */
    RGraph.array_max = function (arr)
    {
        var max = null;
        
        if (typeof(arr) == 'number') {
            return arr;
        }
        
        for (var i=0; i<arr.length; ++i) {
            if (typeof(arr[i]) == 'number') {

                var val = arguments[1] ? Math.abs(arr[i]) : arr[i];
                
                if (typeof(max) == 'number') {
                    max = Math.max(max, val);
                } else {
                    max = val;
                }
            }
        }
        
        return max;
    }


    /**
    * Returns the maximum value which is in an array
    * 
    * @param  array arr The array
    * @param  int   len The length to pad the array to
    * @param  mixed     The value to use to pad the array (optional)
    */
    RGraph.array_pad = function (arr, len)
    {
        if (arr.length < len) {
            var val = arguments[2] ? arguments[2] : null;
            
            for (var i=arr.length; i<len; ++i) {
                arr[i] = val;
            }
        }
        
        return arr;
    }


    /**
    * An array sum function
    * 
    * @param  array arr The  array to calculate the total of
    * @return int       The summed total of the arrays elements
    */
    RGraph.array_sum = function (arr)
    {
        // Allow integers
        if (typeof(arr) == 'number') {
            return arr;
        }

        var i, sum;
        var len = arr.length;

        for(i=0,sum=0;i<len;sum+=arr[i++]);
        return sum;
    }



    /**
    * A simple is_array() function
    * 
    * @param  mixed obj The object you want to check
    * @return bool      Whether the object is an array or not
    */
    RGraph.is_array = function (obj)
    {
        return obj != null && obj.constructor.toString().indexOf('Array') != -1;
    }
    
    
    
    /**
    * Takes any number of arguments and adds them to one big linear array
    * which is then returned
    * 
    * @param ... mixed The data to linearise. You can strings, booleans, numbers or arrays
    */
    RGraph.array_linearize = function ()
    {
        var arr = [];

        for (var i=0; i<arguments.length; ++i) {

            if (typeof(arguments[i]) == 'object' && arguments[i]) {
                for (var j=0; j<arguments[i].length; ++j) {
                    var sub = RGraph.array_linearize(arguments[i][j]);
                    
                    for (var k=0; k<sub.length; ++k) {
                        arr.push(sub[k]);
                    }
                }
            } else {
                arr.push(arguments[i]);
            }
        }

        return arr;
    }


    /**
    * Converts degrees to radians
    * 
    * @param  int degrees The number of degrees
    * @return float       The number of radians
    */
    RGraph.degrees2Radians = function (degrees)
    {
        return degrees * (Math.PI / 180);
    }


    /**
    * This is a useful function which is basically a shortcut for drawing left, right, top and bottom alligned text.
    * 
    * @param object context The context
    * @param string font    The font
    * @param int    size    The size of the text
    * @param int    x       The X coordinate
    * @param int    y       The Y coordinate
    * @param string text    The text to draw
    * @parm  string         The vertical alignment. Can be null. "center" gives center aligned  text, "top" gives top aligned text.
    *                       Anything else produces bottom aligned text. Default is bottom.
    * @param  string        The horizontal alignment. Can be null. "center" gives center aligned  text, "right" gives right aligned text.
    *                       Anything else produces left aligned text. Default is left.
    * @param  bool          Whether to show a bounding box around the text. Defaults not to
    * @param int            The angle that the text should be rotate at (IN DEGREES)
    * @param string         Background color for the text
    * @param bool           Whether the text is bold or not
    * @param bool           Whether the bounding box has a placement indicator
    */
    RGraph.Text = function (context, font, size, x, y, text)
    {
        /**
        * Adjust the vertical Y coord if it should be vertically centered
        */
        if (typeof(text) == 'string') {
            if (text.indexOf('\r\n') > 0 && arguments[6] == 'center') {
                var line_count = text.split('\r\n').length;
                y = y - ((line_count - 1.5) * size);
            
            } else if (text.indexOf('\r\n') > 0 && arguments[6] == 'bottom') {
                var line_count = text.split('\r\n').length;
                y = y - ((line_count - 0.5) * size);
            }
        }



        /**
        * This calls the text function recursively to accommodate multi-line text
        */
        if (typeof(text) == 'string' && text.match(/\r\n/)) {
            
            var arr = text.split('\r\n');

            text = arr[0];
            arr = RGraph.array_shift(arr);

            var nextline = arr.join('\r\n')

            RGraph.Text(context,
                        font,
                        size,
                        arguments[9] == -90 ? (x + (size * 1.5)) : x,
                        y + (size * 1.5),
                        nextline,
                        arguments[6] ? arguments[6] : null,
                        arguments[7],
                        arguments[8],
                        arguments[9],
                        arguments[10],
                        arguments[11],
                        arguments[12]);
        }


        // Accommodate MSIE
        if (RGraph.isOld()) {
            y += 2;
        }


        context.font = (arguments[11] ? 'Bold ': '') + size + 'pt ' + font;

        var i;
        var origX = x;
        var origY = y;
        var originalFillStyle = context.fillStyle;
        var originalLineWidth = context.lineWidth;

        // Need these now the angle can be specified, ie defaults for the former two args
        if (typeof(arguments[6]) == null) arguments[6]  = 'bottom'; // Vertical alignment. Default to bottom/baseline
        if (typeof(arguments[7]) == null) arguments[7]  = 'left';   // Horizontal alignment. Default to left
        if (typeof(arguments[8]) == null) arguments[8]  = null;     // Show a bounding box. Useful for positioning during development. Defaults to false
        if (typeof(arguments[9]) == null) arguments[9]  = 0;        // Angle (IN DEGREES) that the text should be drawn at. 0 is middle right, and it goes clockwise
        if (typeof(arguments[12]) == null) arguments[12] = true;    // Whether the bounding box has the placement indicator

        // The alignment is recorded here for purposes of Opera compatibility
        if (navigator.userAgent.indexOf('Opera') != -1) {
            context.canvas.__rgraph_valign__ = arguments[6];
            context.canvas.__rgraph_halign__ = arguments[7];
        }

        // First, translate to x/y coords
        context.save();

            context.canvas.__rgraph_originalx__ = x;
            context.canvas.__rgraph_originaly__ = y;

            context.translate(x, y);
            x = 0;
            y = 0;
            
            // Rotate the canvas if need be
            if (arguments[9]) {
                context.rotate(arguments[9] / 57.3);
            }

            // Vertical alignment - defaults to bottom
            if (arguments[6]) {
                var vAlign = arguments[6];

                if (vAlign == 'center') {
                    context.translate(0, size / 2);
                } else if (vAlign == 'top') {
                    context.translate(0, size);
                }
            }


            // Hoeizontal alignment - defaults to left
            if (arguments[7]) {
                var hAlign = arguments[7];
                var width  = context.measureText(text).width;
    
                if (hAlign) {
                    if (hAlign == 'center') {
                        context.translate(-1 * (width / 2), 0)
                    } else if (hAlign == 'right') {
                        context.translate(-1 * width, 0)
                    }
                }
            }
            
            
            context.fillStyle = originalFillStyle;

            /**
            * Draw a bounding box if requested
            */
            context.save();
                 context.fillText(text,0,0);
                 context.lineWidth = 1;
                
                if (arguments[8]) {

                    var width = context.measureText(text).width;
                    var ieOffset = RGraph.isIE8() ? 2 : 0;

                    context.translate(x, y);
                    context.strokeRect(AA(context.canvas.__object__, - 3), AA(context.canvas.__object__, 0 - 3 - size - ieOffset), width + 6, 0 + size + 6);


                    /**
                    * If requested, draw a background for the text
                    */
                    if (arguments[10]) {
        
                        var offset = 3;
                        var ieOffset = RGraph.isIE8() ? 2 : 0;
                        var width = context.measureText(text).width

                        //context.strokeStyle = 'gray';
                        context.fillStyle = arguments[10];
                        context.fillRect(AA(context.canvas.__object__, x - offset),
                                         AA(context.canvas.__object__, y - size - offset - ieOffset),
                                         width + (2 * offset),
                                         size + (2 * offset));
                        //context.strokeRect(x - offset, y - size - offset - ieOffset, width + (2 * offset), size + (2 * offset));
                    }
                    
                    /**
                    * Do the actual drawing of the text
                    */
                    context.fillStyle = originalFillStyle;
                    if (arguments[6] = 'center') {
                        context.ttextBaseline = 'middle';
                    }
                    context.fillText(text,0,0);

                    if (arguments[12]) {
                        context.fillRect(
                            arguments[7] == 'left' ? 0 : (arguments[7] == 'center' ? width / 2 : width ) - 2,
                            arguments[6] == 'bottom' ? 0 : (arguments[6] == 'center' ? (0 - size) / 2 : 0 - size) - 2,
                            4,
                            4
                        );
                    }
                }
            context.restore();
            
            // Reset the lineWidth
            context.lineWidth = originalLineWidth;

        context.restore();
    }


    /**
    * Clears the canvas by setting the width. You can specify a colour if you wish.
    * 
    * @param object canvas The canvas to clear
    */
    RGraph.Clear = function (canvas)
    {
        if (!canvas) {
            return;
        }
        
        RGraph.FireCustomEvent(canvas.__object__, 'onbeforeclear');

        var context = canvas.getContext('2d');
        var color   = arguments[1];

        if (RGraph.isIE8() && !color) {
            color = 'white';
        }

        /**
        * Can now clear the canvas back to fully transparent
        */
        if (!color || (color && color == 'transparent')) {

            context.clearRect(0,0,canvas.width, canvas.height);
            
            // Reset the globalCompositeOperation
            context.globalCompositeOperation = 'source-over';

        } else {

            context.fillStyle = color;
            context = canvas.getContext('2d');
            context.beginPath();

            if (RGraph.isIE8()) {
                context.fillRect(0,0,canvas.width,canvas.height);
            } else {
                context.fillRect(-10,-10,canvas.width + 20,canvas.height + 20);
            }

            context.fill();
        }
        
        if (RGraph.ClearAnnotations) {
            //RGraph.ClearAnnotations(canvas.id);
        }
        
        /**
        * This removes any background image that may be present
        */
        if (RGraph.Registry.Get('chart.background.image.' + canvas.id)) {
            var img = RGraph.Registry.Get('chart.background.image.' + canvas.id);
            img.style.position = 'absolute';
            img.style.left     = '-10000px';
            img.style.top      = '-10000px';
        }
        
        /**
        * This hides the tooltip that is showing IF it has the same canvas ID as
        * that which is being cleared
        */
        if (RGraph.Registry.Get('chart.tooltip')) {
            RGraph.HideTooltip();
            //RGraph.Redraw();
        }




        //
        //canvas.onmousemove = null;
        //canvas.onmouseup   = null;
        //canvas.onmousedown = null;
        //var objects = RGraph.ObjectRegistry.objects.byCanvasID;
        //for (var i=0; i<objects.length; ++i) {
        //    if (objects && objects[i]) {
        //        objects[i]['active'] = false;
        //    }
        //}



        /**
        * Set the cursor to default
        */
        canvas.style.cursor = 'default';
        



        RGraph.FireCustomEvent(canvas.__object__, 'onclear');
    }


    /**
    * Draws the title of the graph
    * 
    * @param object  canvas The canvas object
    * @param string  text   The title to write
    * @param integer gutter The size of the gutter
    * @param integer        The center X point (optional - if not given it will be generated from the canvas width)
    * @param integer        Size of the text. If not given it will be 14
    */
    RGraph.DrawTitle = function (obj, text, gutterTop)
    {
        var canvas       = obj.canvas;
        var context      = obj.context;
        var gutterLeft   = obj.Get('chart.gutter.left');
        var gutterRight  = obj.Get('chart.gutter.right');
        var gutterBottom = obj.Get('chart.gutter.bottom');
        var size         = arguments[4] ? arguments[4] : 12;
        var bold         = obj.Get('chart.title.bold');
        var centerx      = (arguments[3] ? arguments[3] : ((obj.canvas.width - gutterLeft - gutterRight) / 2) + gutterLeft);
        var keypos       = obj.Get('chart.key.position');
        var vpos         = obj.Get('chart.title.vpos');
        var hpos         = obj.Get('chart.title.hpos');
        var bgcolor      = obj.Get('chart.title.background');

        // Account for 3D effect by faking the key position
        if (obj.type == 'bar' && obj.Get('chart.variant') == '3d') {
            keypos = 'gutter';
        }

        context.beginPath();
        context.fillStyle = obj.Get('chart.text.color') ? obj.Get('chart.text.color') : 'black';

        /**
        * Vertically center the text if the key is not present
        */
        if (keypos && keypos != 'gutter') {
            var vCenter = 'center';

        } else if (!keypos) {
            var vCenter = 'center';

        } else {
            var vCenter = 'bottom';
        }

        // if chart.title.vpos does not equal 0.5, use that
        if (typeof(obj.Get('chart.title.vpos')) == 'number') {
            vpos = obj.Get('chart.title.vpos') * gutterTop;

            if (obj.Get('chart.xaxispos') == 'top') {
                vpos = obj.Get('chart.title.vpos') * gutterBottom + gutterTop + (obj.canvas.height - gutterTop - gutterBottom);
            }
        } else {
            vpos = gutterTop - size - 5;

            if (obj.Get('chart.xaxispos') == 'top') {
                vpos = obj.canvas.height  - gutterBottom + size + 5;
            }
        }

        // if chart.title.hpos is a number, use that. It's multiplied with the (entire) canvas width
        if (typeof(hpos) == 'number') {
            centerx = hpos * canvas.width;
        }
        
        // Set the colour
        if (typeof(obj.Get('chart.title.color') != null)) {
            var oldColor = context.fillStyle
            var newColor = obj.Get('chart.title.color')
            context.fillStyle = newColor ? newColor : 'black';
        }
        
        /**
        * Default font is Verdana
        */
        var font = obj.Get('chart.text.font');
        
        /**
        * Override the default font with chart.title.font
        */
        if (typeof(obj.Get('chart.title.font')) == 'string') {
            font = obj.Get('chart.title.font');
        }

        /**
        * Draw the title itself
        */
        RGraph.Text(context, font, size, centerx, vpos, text, vCenter, 'center', bgcolor != null, null, bgcolor, bold);
        
        // Reset the fill colour
        context.fillStyle = oldColor;
    }



    /**
    * This function returns the mouse position in relation to the canvas
    * 
    * @param object e The event object.
    */
    RGraph.getMouseXY = function (e)
    {
        var el = ((RGraph.isIE8() || RGraph.isIE7()) ? event.srcElement : e.target);
        var x;
        var y;

        // ???
        var paddingLeft = el.style.paddingLeft ? parseInt(el.style.paddingLeft) : 0;
        var paddingTop  = el.style.paddingTop ? parseInt(el.style.paddingTop) : 0;
        var borderLeft  = el.style.borderLeftWidth ? parseInt(el.style.borderLeftWidth) : 0;
        var borderTop   = el.style.borderTopWidth  ? parseInt(el.style.borderTopWidth) : 0;
        
        if (RGraph.isIE8()) e = event;

        // Browser with offsetX and offsetY
        if (typeof(e.offsetX) == 'number' && typeof(e.offsetY) == 'number') {
            x = e.offsetX;
            y = e.offsetY;

        // FF and other
        } else {
            x = 0;
            y = 0;

            while (el != document.body && el) {
                x += el.offsetLeft;
                y += el.offsetTop;

                el = el.offsetParent;
            }

            x = e.pageX - x;
            y = e.pageY - y;
        }

        return [x, y];
    }



    /**
    * This function returns a two element array of the canvas x/y position in
    * relation to the page
    * 
    * @param object canvas
    */
    RGraph.getCanvasXY = function (canvas)
    {
        var x   = 0;
        var y   = 0;
        var obj = canvas;

        do {

            x += obj.offsetLeft;
            y += obj.offsetTop;

            obj = obj.offsetParent;

        } while (obj && obj.tagName.toLowerCase() != 'body');


        var paddingLeft = canvas.style.paddingLeft ? parseInt(canvas.style.paddingLeft) : 0;
        var paddingTop  = canvas.style.paddingTop ? parseInt(canvas.style.paddingTop) : 0;
        var borderLeft  = canvas.style.borderLeftWidth ? parseInt(canvas.style.borderLeftWidth) : 0;
        var borderTop   = canvas.style.borderTopWidth  ? parseInt(canvas.style.borderTopWidth) : 0;

        return [x + paddingLeft + borderLeft, y + paddingTop + borderTop];
    }


    /**
    * Registers a graph object (used when the canvas is redrawn)
    * 
    * @param object obj The object to be registered
    */
    RGraph.Register = function (obj)
    {
        // Checking this property ensures the object is only registered once
        if (!obj.Get('chart.noregister')) {
            /**
            * As of 21st/1/2012 the object registry is now used
            */
            RGraph.ObjectRegistry.Add(obj);
            obj.Set('chart.noregister', true);
        }
    }


    /**
    * Causes all registered objects to be redrawn
    * 
    * @param string An optional color to use to clear the canvas
    */
    RGraph.Redraw = function ()
    {
        var objectRegistry = RGraph.ObjectRegistry.objects.byCanvasID;

        // Get all of the canvas tags on the page
        var tags = document.getElementsByTagName('canvas');
        for (var i=0; i<tags.length; ++i) {
            if (tags[i].__object__ && tags[i].__object__.isRGraph) {
                RGraph.Clear(tags[i], arguments[0] ? arguments[0] : null);
            }
        }

        // Go through the object registry and redraw *all* of the canvas'es that have been registered
        for (var i=0; i<objectRegistry.length; ++i) {
            if (objectRegistry[i]) {
                var id = objectRegistry[i][0];
                objectRegistry[i][1].Draw();
            }
        }
    }



    /**
    * Causes all registered objects ON THE GIVEN CANVAS to be redrawn
    * 
    * @param canvas object The canvas object to redraw
    * @param        bool   Optional boolean which defaults to true and determines whether to clear the canvas
    */
    RGraph.RedrawCanvas = function (canvas)
    {
        var objects = RGraph.ObjectRegistry.getObjectsByCanvasID(canvas.id);

        /**
        * First clear the canvas
        */
        if (!arguments[1] || (typeof(arguments[1]) == 'boolean' && !arguments[1] == false) ) {
            RGraph.Clear(canvas);
        }

        /**
        * Now redraw all the charts associated with that canvas
        */
        for (var i=0; i<objects.length; ++i) {
            if (objects[i]) {
                if (objects[i] && objects[i].isRGraph) { // Is it an RGraph object ??
                    objects[i].Draw();
                }
            }
        }
    }


    /**
    * The RGraph registry Set() function
    * 
    * @param  string name  The name of the key
    * @param  mixed  value The value to set
    * @return mixed        Returns the same value as you pass it
    */
    RGraph.Registry.Set = function (name, value)
    {
        // Store the setting
        RGraph.Registry.store[name] = value;
        
        // Don't really need to do this, but ho-hum
        return value;
    }


    /**
    * The RGraph registry Get() function
    * 
    * @param  string name The name of the particular setting to fetch
    * @return mixed       The value if exists, null otherwise
    */
    RGraph.Registry.Get = function (name)
    {
        //return RGraph.Registry.store[name] == null ? null : RGraph.Registry.store[name];
        return RGraph.Registry.store[name];
    }


    /**
    * This function draws the background for the bar chart, line chart and scatter chart.
    * 
    * @param  object obj The graph object
    */
    RGraph.background.Draw = function (obj)
    {
        var canvas       = obj.canvas;
        var context      = obj.context;
        var height       = 0;
        var gutterLeft   = obj.Get('chart.gutter.left');
        var gutterRight  = obj.Get('chart.gutter.right');
        var gutterTop    = obj.Get('chart.gutter.top');
        var gutterBottom = obj.Get('chart.gutter.bottom');
        var variant      = obj.Get('chart.variant');
        
        context.fillStyle = obj.Get('chart.text.color');
        
        // If it's a bar and 3D variant, translate
        if (variant == '3d') {
            context.save();
            context.translate(10, -5);
        }

        // X axis title
        if (typeof(obj.Get('chart.title.xaxis')) == 'string' && obj.Get('chart.title.xaxis').length) {
        
            var size = obj.Get('chart.text.size') + 2;
            var font = obj.Get('chart.text.font');
            var bold = obj.Get('chart.title.xaxis.bold');

            if (typeof(obj.Get('chart.title.xaxis.size')) == 'number') {
                size = obj.Get('chart.title.xaxis.size');
            }

            if (typeof(obj.Get('chart.title.xaxis.font')) == 'string') {
                font = obj.Get('chart.title.xaxis.font');
            }
            
            var hpos = ((obj.canvas.width - obj.gutterLeft - obj.gutterRight) / 2) + obj.gutterLeft;
            var vpos = obj.canvas.height - obj.Get('chart.gutter.bottom') + 25;
            
            if (typeof(obj.Get('chart.title.xaxis.pos')) == 'number') {
                vpos = obj.canvas.height - (gutterBottom * obj.Get('chart.title.xaxis.pos'));
            }
        
            context.beginPath();
            RGraph.Text(context,
                        font,
                        size,
                        hpos,
                        vpos,
                        obj.Get('chart.title.xaxis'),
                        'center',
                        'center',
                        false,
                        false,
                        false,
                        bold);
            context.fill();
        }

        // Y axis title
        if (typeof(obj.Get('chart.title.yaxis')) == 'string' && obj.Get('chart.title.yaxis').length) {

            var size            = obj.Get('chart.text.size') + 2;
            var font            = obj.Get('chart.text.font');
            var angle           = 270;
            var bold = obj.Get('chart.title.yaxis.bold');

            if (typeof(obj.Get('chart.title.yaxis.pos')) == 'number') {
                var yaxis_title_pos = obj.Get('chart.title.yaxis.pos') * obj.Get('chart.gutter.left');
            } else {
                var yaxis_title_pos = ((obj.Get('chart.gutter.left') - 25) / obj.Get('chart.gutter.left')) * obj.Get('chart.gutter.left');
            }

            if (typeof(obj.Get('chart.title.yaxis.size')) == 'number') {
                size = obj.Get('chart.title.yaxis.size');
            }

            if (typeof(obj.Get('chart.title.yaxis.font')) == 'string') {
                font = obj.Get('chart.title.yaxis.font');
            }

            if (obj.Get('chart.title.yaxis.align') == 'right' || obj.Get('chart.title.yaxis.position') == 'right') {
                angle = 90;
                yaxis_title_pos = obj.Get('chart.title.yaxis.pos') ? obj.Get('chart.title.yaxis.pos') * obj.Get('chart.gutter.right') :
                                                                     obj.canvas.width - obj.Get('chart.gutter.right') + obj.Get('chart.text.size') + 5;
            } else {
                yaxis_title_pos = yaxis_title_pos;
            }
            

            context.beginPath();
            RGraph.Text(context,
                        font,
                        size,
                        yaxis_title_pos,
                        ((obj.canvas.height - obj.gutterTop - obj.gutterBottom) / 2) + obj.gutterTop,
                        obj.Get('chart.title.yaxis'),
                        'center',
                        'center',
                        false,
                        angle,
                        false,
                        bold);
            context.fill();
        }

        obj.context.beginPath();

        // Draw the horizontal bars
        context.fillStyle = obj.Get('chart.background.barcolor1');
        height = (RGraph.GetHeight(obj) - gutterBottom);

        for (var i=gutterTop; i < height ; i+=80) {
            obj.context.fillRect(gutterLeft, i, RGraph.GetWidth(obj) - gutterLeft - gutterRight, Math.min(40, RGraph.GetHeight(obj) - gutterBottom - i) );
        }

            context.fillStyle = obj.Get('chart.background.barcolor2');
            height = (RGraph.GetHeight(obj) - gutterBottom);
    
            for (var i= (40 + gutterTop); i < height; i+=80) {
                obj.context.fillRect(gutterLeft, i, RGraph.GetWidth(obj) - gutterLeft - gutterRight, i + 40 > (RGraph.GetHeight(obj) - gutterBottom) ? RGraph.GetHeight(obj) - (gutterBottom + i) : 40);
            }
            
            context.stroke();
    

        // Draw the background grid
        if (obj.Get('chart.background.grid')) {

            // If autofit is specified, use the .numhlines and .numvlines along with the width to work
            // out the hsize and vsize
            if (obj.Get('chart.background.grid.autofit')) {

                /**
                * Align the grid to the tickmarks
                */
                if (obj.Get('chart.background.grid.autofit.align')) {
                    // Align the horizontal lines
                    obj.Set('chart.background.grid.autofit.numhlines', obj.Get('chart.ylabels.count'));

                    // Align the vertical lines for the line
                    if (obj.type == 'line') {
                        if (obj.Get('chart.labels') && obj.Get('chart.labels').length) {
                            obj.Set('chart.background.grid.autofit.numvlines', obj.Get('chart.labels').length - 1);
                        } else {
                            obj.Set('chart.background.grid.autofit.numvlines', obj.data[0].length - 1);
                        }

                    // Align the vertical lines for the bar
                    } else if (obj.type == 'bar' && obj.Get('chart.labels') && obj.Get('chart.labels').length) {
                        obj.Set('chart.background.grid.autofit.numvlines', obj.Get('chart.labels').length);
                    }
                }

                var vsize = ((obj.canvas.width - gutterLeft - gutterRight)) / obj.Get('chart.background.grid.autofit.numvlines');
                var hsize = (obj.canvas.height - gutterTop - gutterBottom) / obj.Get('chart.background.grid.autofit.numhlines');

                obj.Set('chart.background.grid.vsize', vsize);
                obj.Set('chart.background.grid.hsize', hsize);
            }

            context.beginPath();
            context.lineWidth   = obj.Get('chart.background.grid.width') ? obj.Get('chart.background.grid.width') : 1;
            context.strokeStyle = obj.Get('chart.background.grid.color');

            // Draw the horizontal lines
            if (obj.Get('chart.background.grid.hlines')) {
                height = (RGraph.GetHeight(obj) - gutterBottom)
                for (y=gutterTop; y<height; y+=obj.Get('chart.background.grid.hsize')) {
                    context.moveTo(gutterLeft, AA(this, y));
                    context.lineTo(RGraph.GetWidth(obj) - gutterRight, AA(this, y));
                }
            }

            if (obj.Get('chart.background.grid.vlines')) {
                // Draw the vertical lines
                var width = (obj.canvas.width - gutterRight)
                for (x=gutterLeft; x<=width; x+=obj.Get('chart.background.grid.vsize')) {
                    context.moveTo(AA(this, x), gutterTop);
                    context.lineTo(AA(this, x), obj.canvas.height - gutterBottom);
                }
            }

            if (obj.Get('chart.background.grid.border')) {
                // Make sure a rectangle, the same colour as the grid goes around the graph
                context.strokeStyle = obj.Get('chart.background.grid.color');
                context.strokeRect(AA(this, gutterLeft), AA(this, gutterTop), RGraph.GetWidth(obj) - gutterLeft - gutterRight, RGraph.GetHeight(obj) - gutterTop - gutterBottom);
            }
        }

        context.stroke();

        // If it's a bar and 3D variant, translate
        if (variant == '3d') {
            context.restore();
        }

        // Draw the title if one is set
        if ( typeof(obj.Get('chart.title')) == 'string') {

            if (obj.type == 'gantt') {
                gutterTop -= 10;
            }

            RGraph.DrawTitle(obj,
                             obj.Get('chart.title'),
                             gutterTop,
                             null,
                             obj.Get('chart.title.size') ? obj.Get('chart.title.size') : obj.Get('chart.text.size') + 2);
        }

        context.stroke();
    }


    /**
    * Returns the day number for a particular date. Eg 1st February would be 32
    * 
    * @param   object obj A date object
    * @return  int        The day number of the given date
    */
    RGraph.GetDays = function (obj)
    {
        var year  = obj.getFullYear();
        var days  = obj.getDate();
        var month = obj.getMonth();

        if (month == 0) return days;
        if (month >= 1) days += 31; 
        if (month >= 2) days += 28;

        // Leap years. Crude, but it functions
        if (year >= 2008 && year % 4 == 0) days += 1;

        if (month >= 3) days += 31;
        if (month >= 4) days += 30;
        if (month >= 5) days += 31;
        if (month >= 6) days += 30;
        if (month >= 7) days += 31;
        if (month >= 8) days += 31;
        if (month >= 9) days += 30;
        if (month >= 10) days += 31;
        if (month >= 11) days += 30;
        
        return days;
    }


    /**
    * Makes a clone of an object
    * 
    * @param obj val The object to clone
    */
    RGraph.array_clone = function (obj)
    {
        if(obj == null || typeof(obj) != 'object') {
            return obj;
        }

        var temp = [];

        for (var i=0;i<obj.length; ++i) {

            if (typeof(obj[i]) == 'number') {
                temp[i] = (function (arg) {return Number(arg);})(obj[i]);
            } else if (typeof(obj[i]) == 'string') {
                temp[i] = (function (arg) {return String(arg);})(obj[i]);
            } else if (typeof(obj[i]) == 'function') {
                temp[i] = obj[i];
            
            } else {
                temp[i] = RGraph.array_clone(obj[i]);
            }
        }

        return temp;
    }


    /**
    * This function reverses an array
    */
    RGraph.array_reverse = function (arr)
    {
        var newarr = [];

        for (var i=arr.length - 1; i>=0; i--) {
            newarr.push(arr[i]);
        }

        return newarr;
    }


    /**
    * Formats a number with thousand seperators so it's easier to read
    * 
    * @param  integer num The number to format
    * @param  string      The (optional) string to prepend to the string
    * @param  string      The (optional) string to ap
    * pend to the string
    * @return string      The formatted number
    */
    RGraph.number_format = function (obj, num)
    {
        var i;
        var prepend = arguments[2] ? String(arguments[2]) : '';
        var append  = arguments[3] ? String(arguments[3]) : '';
        var output  = '';
        var decimal = '';
        var decimal_seperator  = obj.Get('chart.scale.point') ? obj.Get('chart.scale.point') : '.';
        var thousand_seperator = obj.Get('chart.scale.thousand') ? obj.Get('chart.scale.thousand') : ',';
        RegExp.$1   = '';
        var i,j;

        if (typeof(obj.Get('chart.scale.formatter')) == 'function') {
            return obj.Get('chart.scale.formatter')(obj, num);
        }

        // Ignore the preformatted version of "1e-2"
        if (String(num).indexOf('e') > 0) {
            return String(prepend + String(num) + append);
        }

        // We need then number as a string
        num = String(num);
        
        // Take off the decimal part - we re-append it later
        if (num.indexOf('.') > 0) {
            var tmp = num;
            num     = num.replace(/\.(.*)/, ''); // The front part of the number
            decimal = tmp.replace(/(.*)\.(.*)/, '$2'); // The decimal part of the number
        }

        // Thousand seperator
        //var seperator = arguments[1] ? String(arguments[1]) : ',';
        var seperator = thousand_seperator;
        
        /**
        * Work backwards adding the thousand seperators
        */
        var foundPoint;
        for (i=(num.length - 1),j=0; i>=0; j++,i--) {
            var character = num.charAt(i);
            
            if ( j % 3 == 0 && j != 0) {
                output += seperator;
            }
            
            /**
            * Build the output
            */
            output += character;
        }
        
        /**
        * Now need to reverse the string
        */
        var rev = output;
        output = '';
        for (i=(rev.length - 1); i>=0; i--) {
            output += rev.charAt(i);
        }

        // Tidy up
        //output = output.replace(/^-,/, '-');
        if (output.indexOf('-' + obj.Get('chart.scale.thousand')) == 0) {
            output = '-' + output.substr(('-' + obj.Get('chart.scale.thousand')).length);
        }

        // Reappend the decimal
        if (decimal.length) {
            output =  output + decimal_seperator + decimal;
            decimal = '';
            RegExp.$1 = '';
        }

        // Minor bugette
        if (output.charAt(0) == '-') {
            output = output.replace(/-/, '');
            prepend = '-' + prepend;
        }

        return prepend + output + append;
    }


    /**
    * Draws horizontal coloured bars on something like the bar, line or scatter
    */
    RGraph.DrawBars = function (obj)
    {
        var hbars = obj.Get('chart.background.hbars');

        /**
        * Draws a horizontal bar
        */
        obj.context.beginPath();
        
        for (i=0; i<hbars.length; ++i) {
            
            // If null is specified as the "height", set it to the upper max value
            if (hbars[i][1] == null) {
                hbars[i][1] = obj.max;
            
            // If the first index plus the second index is greater than the max value, adjust accordingly
            } else if (hbars[i][0] + hbars[i][1] > obj.max) {
                hbars[i][1] = obj.max - hbars[i][0];
            }


            // If height is negative, and the abs() value is greater than .max, use a negative max instead
            if (Math.abs(hbars[i][1]) > obj.max) {
                hbars[i][1] = -1 * obj.max;
            }


            // If start point is greater than max, change it to max
            if (Math.abs(hbars[i][0]) > obj.max) {
                hbars[i][0] = obj.max;
            }
            
            // If start point plus height is less than negative max, use the negative max plus the start point
            if (hbars[i][0] + hbars[i][1] < (-1 * obj.max) ) {
                hbars[i][1] = -1 * (obj.max + hbars[i][0]);
            }

            // If the X axis is at the bottom, and a negative max is given, warn the user
            if (obj.Get('chart.xaxispos') == 'bottom' && (hbars[i][0] < 0 || (hbars[i][1] + hbars[i][1] < 0)) ) {
                alert('[' + obj.type.toUpperCase() + ' (ID: ' + obj.id + ') BACKGROUND HBARS] You have a negative value in one of your background hbars values, whilst the X axis is in the center');
            }

            var ystart = (obj.grapharea - ((hbars[i][0] / obj.max) * obj.grapharea));
            var height = (Math.min(hbars[i][1], obj.max - hbars[i][0]) / obj.max) * obj.grapharea;

            // Account for the X axis being in the center
            if (obj.Get('chart.xaxispos') == 'center') {
                ystart /= 2;
                height /= 2;
            }
            
            ystart += obj.Get('chart.gutter.top')

            var x = obj.Get('chart.gutter.left');
            var y = ystart - height;
            var w = obj.canvas.width - obj.Get('chart.gutter.left') - obj.Get('chart.gutter.right');
            var h = height;
            
            // Accommodate Opera :-/
            if (navigator.userAgent.indexOf('Opera') != -1 && obj.Get('chart.xaxispos') == 'center' && h < 0) {
                h *= -1;
                y = y - h;
            }
            
            /**
            * Account for X axis at the top
            */
            if (obj.Get('chart.xaxispos') == 'top') {
                y  = obj.canvas.height - y;
                h *= -1;
            }

            obj.context.fillStyle = hbars[i][2];
            obj.context.fillRect(x, y, w, h);
        }

        obj.context.fill();
    }


    /**
    * Draws in-graph labels.
    * 
    * @param object obj The graph object
    */
    RGraph.DrawInGraphLabels = function (obj)
    {
        var canvas  = obj.canvas;
        var context = obj.context;
        var labels  = obj.Get('chart.labels.ingraph');
        var labels_processed = [];

        // Defaults
        var fgcolor   = 'black';
        var bgcolor   = 'white';
        var direction = 1;

        if (!labels) {
            return;
        }

        /**
        * Preprocess the labels array. Numbers are expanded
        */
        for (var i=0; i<labels.length; ++i) {
            if (typeof(labels[i]) == 'number') {
                for (var j=0; j<labels[i]; ++j) {
                    labels_processed.push(null);
                }
            } else if (typeof(labels[i]) == 'string' || typeof(labels[i]) == 'object') {
                labels_processed.push(labels[i]);
            
            } else {
                labels_processed.push('');
            }
        }

        /**
        * Turn off any shadow
        */
        RGraph.NoShadow(obj);

        if (labels_processed && labels_processed.length > 0) {

            for (var i=0; i<labels_processed.length; ++i) {
                if (labels_processed[i]) {
                    var coords = obj.coords[i];
                    
                    if (coords && coords.length > 0) {
                        var x      = (obj.type == 'bar' ? coords[0] + (coords[2] / 2) : coords[0]);
                        var y      = (obj.type == 'bar' ? coords[1] + (coords[3] / 2) : coords[1]);
                        var length = typeof(labels_processed[i][4]) == 'number' ? labels_processed[i][4] : 25;

    
                        context.beginPath();
                        context.fillStyle   = 'black';
                        context.strokeStyle = 'black';
                        
    
                        if (obj.type == 'bar') {
                        
                            /**
                            * X axis at the top
                            */
                            if (obj.Get('chart.xaxispos') == 'top') {
                                length *= -1;
                            }
    
                            if (obj.Get('chart.variant') == 'dot') {
                                context.moveTo(x, obj.coords[i][1] - 5);
                                context.lineTo(x, obj.coords[i][1] - 5 - length);
                                
                                var text_x = x;
                                var text_y = obj.coords[i][1] - 5 - length;
                            
                            } else if (obj.Get('chart.variant') == 'arrow') {
                                context.moveTo(x, obj.coords[i][1] - 5);
                                context.lineTo(x, obj.coords[i][1] - 5 - length);
                                
                                var text_x = x;
                                var text_y = obj.coords[i][1] - 5 - length;
                            
                            } else {
    
                                context.arc(x, y, 2.5, 0, 6.28, 0);
                                context.moveTo(x, y);
                                context.lineTo(x, y - length);

                                var text_x = x;
                                var text_y = y - length;
                            }

                            context.stroke();
                            context.fill();
                            
    
                        } else if (obj.type == 'line') {
                        
                            if (
                                typeof(labels_processed[i]) == 'object' &&
                                typeof(labels_processed[i][3]) == 'number' &&
                                labels_processed[i][3] == -1
                               ) {

                                context.moveTo(x, y + 5);
                                context.lineTo(x, y + 5 + length);
                                
                                context.stroke();
                                context.beginPath();                                
                                
                                // This draws the arrow
                                context.moveTo(x, y + 5);
                                context.lineTo(x - 3, y + 10);
                                context.lineTo(x + 3, y + 10);
                                context.closePath();
                                
                                var text_x = x;
                                var text_y = y + 5 + length;
                            
                            } else {
                                
                                var text_x = x;
                                var text_y = y - 5 - length;

                                context.moveTo(x, y - 5);
                                context.lineTo(x, y - 5 - length);
                                
                                context.stroke();
                                context.beginPath();
                                
                                // This draws the arrow
                                context.moveTo(x, y - 5);
                                context.lineTo(x - 3, y - 10);
                                context.lineTo(x + 3, y - 10);
                                context.closePath();
                            }
                        
                            context.fill();
                        }

                        // Taken out on the 10th Nov 2010 - unnecessary
                        //var width = context.measureText(labels[i]).width;
                        
                        context.beginPath();
                            
                            // Fore ground color
                            context.fillStyle = (typeof(labels_processed[i]) == 'object' && typeof(labels_processed[i][1]) == 'string') ? labels_processed[i][1] : 'black';

                            RGraph.Text(context,
                                        obj.Get('chart.text.font'),
                                        obj.Get('chart.text.size'),
                                        text_x,
                                        text_y,
                                        (typeof(labels_processed[i]) == 'object' && typeof(labels_processed[i][0]) == 'string') ? labels_processed[i][0] : labels_processed[i],
                                        'bottom',
                                        'center',
                                        true,
                                        null,
                                        (typeof(labels_processed[i]) == 'object' && typeof(labels_processed[i][2]) == 'string') ? labels_processed[i][2] : 'white');
                        context.fill();
                    }
                }
            }
        }
    }


    /**
    * This function "fills in" key missing properties that various implementations lack
    * 
    * @param object e The event object
    */
    RGraph.FixEventObject = function (e)
    {
        if (RGraph.isIE8() || RGraph.isIE7()) {
            var e = event;

            e.pageX  = (event.clientX + document.body.scrollLeft);
            e.pageY  = (event.clientY + document.body.scrollTop);
            e.target = event.srcElement;
            
            if (!document.body.scrollTop && document.documentElement.scrollTop) {
                e.pageX += parseInt(document.documentElement.scrollLeft);
                e.pageY += parseInt(document.documentElement.scrollTop);
            }
        }

        // This is mainly for FF which doesn't provide offsetX
        if (typeof(e.offsetX) == 'undefined' && typeof(e.offsetY) == 'undefined') {
            var coords = RGraph.getMouseXY(e);
            e.offsetX = coords[0];
            e.offsetY = coords[1];
        }
        
        // Any browser that doesn't implement stopPropagation() (MSIE)
        if (!e.stopPropagation) {
            e.stopPropagation = function () {window.event.cancelBubble = true;}
        }
        
        return e;
    }

    /**
    * Thisz function hides the crosshairs coordinates
    */
    RGraph.HideCrosshairCoords = function ()
    {
        var div = RGraph.Registry.Get('chart.coordinates.coords.div');

        if (   div
            && div.style.opacity == 1
            && div.__object__.Get('chart.crosshairs.coords.fadeout')
           ) {
            setTimeout(function() {RGraph.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.9;}, 50);
            setTimeout(function() {RGraph.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.8;}, 100);
            setTimeout(function() {RGraph.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.7;}, 150);
            setTimeout(function() {RGraph.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.6;}, 200);
            setTimeout(function() {RGraph.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.5;}, 250);
            setTimeout(function() {RGraph.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.4;}, 300);
            setTimeout(function() {RGraph.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.3;}, 350);
            setTimeout(function() {RGraph.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.2;}, 400);
            setTimeout(function() {RGraph.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.1;}, 450);
            setTimeout(function() {RGraph.Registry.Get('chart.coordinates.coords.div').style.opacity = 0;}, 500);
            setTimeout(function() {RGraph.Registry.Get('chart.coordinates.coords.div').style.display = 'none';}, 550);
        }
    }


    /**
    * Trims the right hand side of a string. Removes SPACE, TAB
    * CR and LF.
    * 
    * @param string str The string to trim
    */
    RGraph.rtrim=function(str){return str.replace(/( |\n|\r|\t)+$/, '');}


    /**
    * Draws the3D axes/background
    */
    RGraph.Draw3DAxes = function (obj)
    {
        var gutterLeft    = obj.Get('chart.gutter.left');
        var gutterRight   = obj.Get('chart.gutter.right');
        var gutterTop     = obj.Get('chart.gutter.top');
        var gutterBottom  = obj.Get('chart.gutter.bottom');

        var context = obj.context;
        var canvas  = obj.canvas;

        context.strokeStyle = '#aaa';
        context.fillStyle = '#ddd';

        // Draw the vertical left side
        context.beginPath();
            context.moveTo(gutterLeft, gutterTop);
            context.lineTo(gutterLeft + 10, gutterTop - 5);
            context.lineTo(gutterLeft + 10, canvas.height - gutterBottom - 5);
            context.lineTo(gutterLeft, canvas.height - gutterBottom);
        context.closePath();
        
        context.stroke();
        context.fill();

        // Draw the bottom floor
        context.beginPath();
            context.moveTo(gutterLeft, canvas.height - gutterBottom);
            context.lineTo(gutterLeft + 10, canvas.height - gutterBottom - 5);
            context.lineTo(canvas.width - gutterRight + 10,  canvas.height - gutterBottom - 5);
            context.lineTo(canvas.width - gutterRight, canvas.height - gutterBottom);
        context.closePath();
        
        context.stroke();
        context.fill();
    }

    /**
    * Turns off any shadow
    * 
    * @param object obj The graph object
    */
    RGraph.NoShadow = function (obj)
    {
        obj.context.shadowColor   = 'rgba(0,0,0,0)';
        obj.context.shadowBlur    = 0;
        obj.context.shadowOffsetX = 0;
        obj.context.shadowOffsetY = 0;
    }
    
    
    /**
    * Sets the four shadow properties - a shortcut function
    * 
    * @param object obj     Your graph object
    * @param string color   The shadow color
    * @param number offsetx The shadows X offset
    * @param number offsety The shadows Y offset
    * @param number blur    The blurring effect applied to the shadow
    */
    RGraph.SetShadow = function (obj, color, offsetx, offsety, blur)
    {
        obj.context.shadowColor   = color;
        obj.context.shadowOffsetX = offsetx;
        obj.context.shadowOffsetY = offsety;
        obj.context.shadowBlur    = blur;
    }


    /**
    * This function attempts to "fill in" missing functions from the canvas
    * context object. Only two at the moment - measureText() nd fillText().
    * 
    * @param object context The canvas 2D context
    */
    RGraph.OldBrowserCompat = function (context)
    {
        if (!context) {
            return;
        }

        if (!context.measureText) {
        
            // This emulates the measureText() function
            context.measureText = function (text)
            {
                var textObj = document.createElement('DIV');
                textObj.innerHTML = text;
                textObj.style.backgroundColor = 'white';
                textObj.style.position = 'absolute';
                textObj.style.top = -100
                textObj.style.left = 0;
                document.body.appendChild(textObj);

                var width = {width: textObj.offsetWidth};
                
                textObj.style.display = 'none';
                
                return width;
            }
        }

        if (!context.fillText) {
            // This emulates the fillText() method
            context.fillText    = function (text, targetX, targetY)
            {
                return false;
            }
        }
        
        // If IE8, add addEventListener()
        if (!context.canvas.addEventListener) {
            window.addEventListener = function (ev, func, bubble)
            {
                return this.attachEvent('on' + ev, func);
            }

            context.canvas.addEventListener = function (ev, func, bubble)
            {
                return this.attachEvent('on' + ev, func);
            }
        }
    }


    /**
    * A custom random number function
    * 
    * @param number min The minimum that the number should be
    * @param number max The maximum that the number should be
    * @param number    How many decimal places there should be. Default for this is 0
    */
    RGraph.random = function (min, max)
    {
        var dp = arguments[2] ? arguments[2] : 0;
        var r = Math.random();
        
        return Number((((max - min) * r) + min).toFixed(dp));
    }


    /**
    * Draws a rectangle with curvy corners
    * 
    * @param context object The context
    * @param x       number The X coordinate (top left of the square)
    * @param y       number The Y coordinate (top left of the square)
    * @param w       number The width of the rectangle
    * @param h       number The height of the rectangle
    * @param         number The radius of the curved corners
    * @param         boolean Whether the top left corner is curvy
    * @param         boolean Whether the top right corner is curvy
    * @param         boolean Whether the bottom right corner is curvy
    * @param         boolean Whether the bottom left corner is curvy
    */
    RGraph.strokedCurvyRect = function (context, x, y, w, h)
    {
        // The corner radius
        var r = arguments[5] ? arguments[5] : 3;

        // The corners
        var corner_tl = (arguments[6] || arguments[6] == null) ? true : false;
        var corner_tr = (arguments[7] || arguments[7] == null) ? true : false;
        var corner_br = (arguments[8] || arguments[8] == null) ? true : false;
        var corner_bl = (arguments[9] || arguments[9] == null) ? true : false;

        context.beginPath();

            // Top left side
            context.moveTo(x + (corner_tl ? r : 0), y);
            context.lineTo(x + w - (corner_tr ? r : 0), y);
            
            // Top right corner
            if (corner_tr) {
                context.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2, false);
            }

            // Top right side
            context.lineTo(x + w, y + h - (corner_br ? r : 0) );

            // Bottom right corner
            if (corner_br) {
                context.arc(x + w - r, y - r + h, r, Math.PI * 2, Math.PI * 0.5, false);
            }

            // Bottom right side
            context.lineTo(x + (corner_bl ? r : 0), y + h);

            // Bottom left corner
            if (corner_bl) {
                context.arc(x + r, y - r + h, r, Math.PI * 0.5, Math.PI, false);
            }

            // Bottom left side
            context.lineTo(x, y + (corner_tl ? r : 0) );

            // Top left corner
            if (corner_tl) {
                context.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
            }

        context.stroke();
    }


    /**
    * Draws a filled rectangle with curvy corners
    * 
    * @param context object The context
    * @param x       number The X coordinate (top left of the square)
    * @param y       number The Y coordinate (top left of the square)
    * @param w       number The width of the rectangle
    * @param h       number The height of the rectangle
    * @param         number The radius of the curved corners
    * @param         boolean Whether the top left corner is curvy
    * @param         boolean Whether the top right corner is curvy
    * @param         boolean Whether the bottom right corner is curvy
    * @param         boolean Whether the bottom left corner is curvy
    */
    RGraph.filledCurvyRect = function (context, x, y, w, h)
    {
        // The corner radius
        var r = arguments[5] ? arguments[5] : 3;

        // The corners
        var corner_tl = (arguments[6] || arguments[6] == null) ? true : false;
        var corner_tr = (arguments[7] || arguments[7] == null) ? true : false;
        var corner_br = (arguments[8] || arguments[8] == null) ? true : false;
        var corner_bl = (arguments[9] || arguments[9] == null) ? true : false;

        context.beginPath();

            // First draw the corners

            // Top left corner
            if (corner_tl) {
                context.moveTo(x + r, y + r);
                context.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
            } else {
                context.fillRect(x, y, r, r);
            }

            // Top right corner
            if (corner_tr) {
                context.moveTo(x + w - r, y + r);
                context.arc(x + w - r, y + r, r, 1.5 * Math.PI, 0, false);
            } else {
                context.moveTo(x + w - r, y);
                context.fillRect(x + w - r, y, r, r);
            }


            // Bottom right corner
            if (corner_br) {
                context.moveTo(x + w - r, y + h - r);
                context.arc(x + w - r, y - r + h, r, 0, Math.PI / 2, false);
            } else {
                context.moveTo(x + w - r, y + h - r);
                context.fillRect(x + w - r, y + h - r, r, r);
            }

            // Bottom left corner
            if (corner_bl) {
                context.moveTo(x + r, y + h - r);
                context.arc(x + r, y - r + h, r, Math.PI / 2, Math.PI, false);
            } else {
                context.moveTo(x, y + h - r);
                context.fillRect(x, y + h - r, r, r);
            }

            // Now fill it in
            context.fillRect(x + r, y, w - r - r, h);
            context.fillRect(x, y + r, r + 1, h - r - r);
            context.fillRect(x + w - r - 1, y + r, r + 1, h - r - r);

        context.fill();
    }


    /**
    * Hides the palette if it's visible
    */
    RGraph.HidePalette = function ()
    {
        var div = RGraph.Registry.Get('palette');

        if (typeof(div) == 'object' && div) {
            div.style.visibility = 'hidden';
            div.style.display    = 'none';
            RGraph.Registry.Set('palette', null);
        }
    }


    /**
    * Hides the zoomed canvas
    */
    RGraph.HideZoomedCanvas = function ()
    {
        var interval = 15;
        var frames   = 10;

        if (typeof(__zoomedimage__) == 'object') {
            obj = __zoomedimage__.obj;
        } else {
            return;
        }

        if (obj.Get('chart.zoom.fade.out')) {
            for (var i=frames,j=1; i>=0; --i, ++j) {
                if (typeof(__zoomedimage__) == 'object') {
                    setTimeout("__zoomedimage__.style.opacity = " + String(i / 10), j * interval);
                }
            }

            if (typeof(__zoomedbackground__) == 'object') {
                setTimeout("__zoomedbackground__.style.opacity = " + String(i / frames), j * interval);
            }
        }

        if (typeof(__zoomedimage__) == 'object') {
            setTimeout("__zoomedimage__.style.display = 'none'", obj.Get('chart.zoom.fade.out') ? (frames * interval) + 10 : 0);
        }

        if (typeof(__zoomedbackground__) == 'object') {
            setTimeout("__zoomedbackground__.style.display = 'none'", obj.Get('chart.zoom.fade.out') ? (frames * interval) + 10 : 0);
        }
    }


    /**
    * Adds an event handler
    * 
    * @param object obj   The graph object
    * @param string event The name of the event, eg ontooltip
    * @param object func  The callback function
    */
    RGraph.AddCustomEventListener = function (obj, name, func)
    {
        if (typeof(RGraph.events[obj.uid]) == 'undefined') {
            RGraph.events[obj.uid] = [];
        }

        RGraph.events[obj.uid].push([obj, name, func]);
        
        return RGraph.events[obj.uid].length - 1;
    }


    /**
    * Used to fire one of the RGraph custom events
    * 
    * @param object obj   The graph object that fires the event
    * @param string event The name of the event to fire
    */
    RGraph.FireCustomEvent = function (obj, name)
    {
        if (obj && obj.isRGraph) {
            var uid = obj.uid;
    
            if (   typeof(uid) == 'string'
                && typeof(RGraph.events) == 'object'
                && typeof(RGraph.events[uid]) == 'object'
                && RGraph.events[uid].length > 0) {
    
                for(var j=0; j<RGraph.events[uid].length; ++j) {
                    if (RGraph.events[uid][j] && RGraph.events[uid][j][1] == name) {
                        RGraph.events[uid][j][2](obj);
                    }
                }
            }
        }
    }


    /**
    * This clears a canvases event handlers. Used at the start of each graphs .Draw() method.
    * 
    * @param string id The ID of the canvas whose event handlers will be cleared
    */
    RGraph.ClearEventListeners = function (id)
    {
    
    // NOT USED

    /*{
        for (var i=0; i<RGraph.Registry.Get('chart.event.handlers').length; ++i) {

            var el = RGraph.Registry.Get('chart.event.handlers')[i];
            if (el && (el[0] == id || el[0] == ('window_' + id))) {
                if (el[0].substring(0, 7) == 'window_') {
                    window.removeEventListener(el[1], el[2], false);
                } else {
                    if (document.getElementById(id)) {
                        document.getElementById(id).removeEventListener(el[1], el[2], false);
                    }
                }
                
                RGraph.Registry.Get('chart.event.handlers')[i] = null;
            }
        }*/
    }


    /**
    * 
    */
    RGraph.AddEventListener = function (id, e, func)
    {
        var type = arguments[3] ? arguments[3] : 'unknown';

        RGraph.Registry.Get('chart.event.handlers').push([id, e, func, type]);
    }


    /**
    * This function suggests a gutter size based on the widest left label. Given that the bottom
    * labels may be longer, this may be a little out.
    * 
    * @param object obj  The graph object
    * @param array  data An array of graph data
    * @return int        A suggested gutter setting
    */
    RGraph.getGutterSuggest = function (obj, data)
    {
        /**
        * Calculate the minimum value
        */
        var min = 0;
        for (var i=0; i<data.length; ++i) {
            min = Math.min(min, data[i]);
        }
        var min = Math.abs(min);

        var str = RGraph.number_format(obj, RGraph.array_max(RGraph.getScale(Math.max(min, RGraph.array_max(data)), obj)), obj.Get('chart.units.pre'), obj.Get('chart.units.post'));

        // Take into account the HBar
        if (obj.type == 'hbar') {

            var str = '';
            var len = 0;

            for (var i=0; i<obj.Get('chart.labels').length; ++i) {
                str = (obj.Get('chart.labels').length > str.length ? obj.Get('chart.labels')[i] : str);
            }
        }

        obj.context.font = obj.Get('chart.text.size') + 'pt ' + obj.Get('chart.text.font');

        len = obj.context.measureText(str).width + 5;

        return (obj.type == 'hbar' ? len / 3 : len);
    }


    /**
    * A basic Array shift gunction
    * 
    * @param  object The numerical array to work on
    * @return        The new array
    */
    RGraph.array_shift = function (arr)
    {
        var ret = [];
        
        for (var i=1; i<arr.length; ++i) {
            ret.push(arr[i]);
        }
        
        return ret;
    }


    /**
    * If you prefer, you can use the SetConfig() method to set the configuration information
    * for your chart. You may find that setting the configuration this way eases reuse.
    * 
    * @param object obj    The graph object
    * @param object config The graph configuration information
    */
    RGraph.SetConfig = function (obj, c)
    {
        for (i in c) {
            if (typeof(i) == 'string') {
                obj.Set(i, c[i]);
            }
        }
        
        return obj;
    }


    /**
    * These are older functions that were used before the move to seperate gutter settings
    */
    RGraph.GetHeight=function(obj){return obj.canvas.height;}
    RGraph.GetWidth=function(obj){return obj.canvas.width;}


    /**
    * Clears all the custom event listeners that have been registered
    * 
    * @param    string Limits the clearing to this object ID
    */
    RGraph.RemoveAllCustomEventListeners = function ()
    {
        var id = arguments[0];

        if (id && RGraph.events[id]) {
            RGraph.events[id] = [];
        } else {
            RGraph.events = [];
        }
    }


    /**
    * Clears a particular custom event listener
    * 
    * @param object obj The graph object
    * @param number i   This is the index that is return by .AddCustomEventListener()
    */
    RGraph.RemoveCustomEventListener = function (obj, i)
    {
        if (   typeof(RGraph.events) == 'object'
            && typeof(RGraph.events[obj.id]) == 'object'
            && typeof(RGraph.events[obj.id][i]) == 'object') {
            
            RGraph.events[obj.id][i] = null;
        }
    }



    /**
    * This draws the background
    * 
    * @param object obj The graph object
    */
    RGraph.DrawBackgroundImage = function (obj)
    {
        if (typeof(obj.Get('chart.background.image')) == 'string') {
            if (typeof(obj.canvas.__rgraph_background_image__) == 'undefined') {
                var img = new Image();
                img.__object__  = obj;
                img.__canvas__  = obj.canvas;
                img.__context__ = obj.context;
                img.src         = obj.Get('chart.background.image');
                
                obj.canvas.__rgraph_background_image__ = img;
            } else {
                img = obj.canvas.__rgraph_background_image__;
            }
            
            // When the image has loaded - redraw the canvas
            img.onload = function ()
            {
                RGraph.Clear(obj.canvas);
                RGraph.RedrawCanvas(obj.canvas);
            }
                
            var gutterLeft   = obj.Get('chart.gutter.left');
            var gutterRight  = obj.Get('chart.gutter.right');
            var gutterTop    = obj.Get('chart.gutter.top');
            var gutterBottom = obj.Get('chart.gutter.bottom');
            var stretch      = obj.Get('chart.background.image.stretch');
            var align        = obj.Get('chart.background.image.align');
    
            // Handle chart.background.image.align
            if (typeof(align) == 'string') {
                if (align.indexOf('right') != -1) {
                    var x = obj.canvas.width - img.width - gutterRight;
                } else {
                    var x = gutterLeft;
                }
    
                if (align.indexOf('bottom') != -1) {
                    var y = obj.canvas.height - img.height - gutterBottom;
                } else {
                    var y = gutterTop;
                }
            } else {
                var x = gutterLeft;
                var y = gutterTop;
            }
            
            // X/Y coords take precedence over the align
            var x = typeof(obj.Get('chart.background.image.x')) == 'number' ? obj.Get('chart.background.image.x') : x;
            var y = typeof(obj.Get('chart.background.image.y')) == 'number' ? obj.Get('chart.background.image.y') : y;
            var w = stretch ? obj.canvas.width - gutterLeft - gutterRight : img.width;
            var h = stretch ? obj.canvas.height - gutterTop - gutterBottom : img.height;
            
            /**
            * You can now specify the width and height of the image
            */
            if (typeof(obj.Get('chart.background.image.w')) == 'number') w  = obj.Get('chart.background.image.w');
            if (typeof(obj.Get('chart.background.image.h')) == 'number') h = obj.Get('chart.background.image.h');
    
            obj.context.drawImage(img,x,y,w, h);
        }
    }



    /**
    * This function skirts the annoying canvas anti-aliasing
    * 
    * @param object obj The object
    * @param number value The number to round
    */
    function AA (obj, value)
    {            
        var value = String(value).replace(/^(\d+)\.\d+/, '$1');
        var newvalue = Number(value) + 0.5;
        
        return (newvalue - value) >= 0 ? newvalue : Math.floor(value);
    }



    /**
    * This function determines wshether an object has tooltips or not
    * 
    * @param object obj The chart object
    */
    RGraph.hasTooltips = function (obj)
    {
        return    (typeof(obj.Get('chart.tooltips')) == 'object' && obj.Get('chart.tooltips') && obj.Get('chart.tooltips').length)
               || typeof(obj.Get('chart.tooltips')) == 'function';
    }



    /**
    * This function creates a (G)UID which can be used to identify objects.
    * 
    * @return string (g)uid The (G)UID
    */
    RGraph.CreateUID = function ()
    {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
        {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }


    /**
    * This is the new object registry, used to facilitate multiple objects per canvas.
    * 
    * @param object obj The object to register
    */
    RGraph.ObjectRegistry.Add = function (obj)
    {
        var uid      = obj.uid;
        var canvasID = obj.canvas.id;

        /**
        * Index the objects by UID
        */
        RGraph.ObjectRegistry.objects.byUID.push([uid, obj]);
        
        /**
        * Index the objects by the canvas that they're drawn on
        */
        RGraph.ObjectRegistry.objects.byCanvasID.push([canvasID, obj]);
    }



    /**
    * Remove an object from the object registry
    * 
    * @param object obj The object to remove
    */
    RGraph.ObjectRegistry.Remove = function (obj)
    {
        var id  = obj.id;
        var uid = obj.uid;

        for (var i=0; i<RGraph.ObjectRegistry.objects.byUID.length; ++i) {
            if (RGraph.ObjectRegistry.objects.byUID[i] && RGraph.ObjectRegistry.objects.byUID[i][1].uid == uid) {
                RGraph.ObjectRegistry.objects.byUID[i] = null;
            }
        }
        
        // RGraph.ObjectRegistry.objects.byCanvasID.push([canvasID, obj]);

        for (var i=0; i<RGraph.ObjectRegistry.objects.byCanvasID.length; ++i) {
            if (RGraph.ObjectRegistry.objects.byCanvasID[i] && RGraph.ObjectRegistry.objects.byCanvasID[i][0] == id) {
                RGraph.ObjectRegistry.objects.byCanvasID[i] = null;
            }
        }

    }



    /**
    * Remove an object from the object registry
    */
    RGraph.ObjectRegistry.Clear = function ()
    {
        RGraph.ObjectRegistry.objects            = {};
        RGraph.ObjectRegistry.objects.byUID      = [];
        RGraph.ObjectRegistry.objects.byCanvasID = [];
    }



    /**
    * Retrieves all objects for a given canvas id
    * 
    * @patarm id string The canvas ID to get objects for.
    */
    RGraph.ObjectRegistry.getObjectsByCanvasID = function (id)
    {
        var store = RGraph.ObjectRegistry.objects.byCanvasID;
        var ret = [];

        // Loop through all of the objects and return the appropriate ones
        for (var i=0; i<store.length; ++i) {
            if (store[i] && store[i][0] == id ) {
                ret.push(store[i][1]);
            }
        }
        
        return ret;
    }



    /**
    * Retrieves the relevant object based on the X/Y position.
    * 
    * @param  object e The event object
    * @return object   The applicable (if any) object
    */
    RGraph.ObjectRegistry.getObjectByXY = function (e)
    {
        var canvas  = e.target;
        var ret     = null;
        var objects = RGraph.ObjectRegistry.getObjectsByCanvasID(canvas.id);

        for (var i=(objects.length - 1); i>=0; --i) {

            var obj = objects[i].getObjectByXY(e);

            if (obj) {
                return obj;
            }
        }
    }



    /**
    * Retrieves the relevant objects based on the X/Y position.
    * NOTE This function returns an array of objects
    * 
    * @param  object e The event object
    * @return          An array of pertinent objects. Note the there may be only one object
    */
    RGraph.ObjectRegistry.getObjectsByXY = function (e)
    {
        var canvas  = e.target;
        var ret     = [];
        var objects = RGraph.ObjectRegistry.getObjectsByCanvasID(canvas.id);

        for (var i=(objects.length - 1); i>=0; --i) {

            var obj = objects[i].getObjectByXY(e);

            if (obj) {
                ret.push(obj);
            }
        }
        
        return ret;
    }


    /**
    * Retrieves the object with the corresponding UID
    * 
    * @param string uid The UID to get the relevant object for
    */
    RGraph.ObjectRegistry.getObjectByUID = function (uid)
    {
        var objects = RGraph.ObjectRegistry.objects.byUID;

        for (var i=0; i<objects.length; ++i) {
            if (objects[i] && objects[i][1].uid == uid) {
                return objects[i][1];
            }
        }
    }


    /**
    * Retrieves the objects that are the given type
    * 
    * @param  mixed canvas  The canvas to check. It can either be the canvas object itself or just the ID
    * @param  string type   The type to look for
    * @return array         An array of one or more objects
    */
    RGraph.ObjectRegistry.getObjectsByType = function (canvas, type)
    {
        if (typeof(canvas) == 'string') {
            canvas = document.getElementById(canvas);
        }

        var objects = RGraph.ObjectRegistry.getObjectsByCanvasID(canvas.id);
        var ret     = [];

        for (var i=0; i<objects.length; ++i) {
            if (objects[i] && objects[i].type && objects[i].type == type) {
                ret.push(objects[i]);
            }
        }
        
        return ret;
    }


    /**
    * Retrieves the FIRST object that matches the given type
    * 
    * @param  mixed  canvas The type to look for
    * @param  string type   The type of object to look for
    * @return object        The FIRST object that matches the given type
    */
    RGraph.ObjectRegistry.getFirstObjectByType = function (canvas, type)
    {
        var objects = RGraph.ObjectRegistry.getObjectsByType(canvas, type);

        return objects.length > 0 ? objects[0] : null;
    }



    /**
    * This takes centerx, centery, x and y coordinates and returns the
    * appropriate angle relative to the canvas angle system. Remember
    * that the canvas angle system starts at the EAST axis
    * 
    * @param  number cx  The centerx coordinate
    * @param  number cy  The centery coordinate
    * @param  number x   The X coordinate (eg the mouseX if coming from a click)
    * @param  number y   The Y coordinate (eg the mouseY if coming from a click)
    * @return number     The relevant angle (measured in in RADIANS)
    */
    RGraph.getAngleByXY = function (cx, cy, x, y)
    {
        var angle = Math.atan((y - cy) / (x - cx));
            angle = Math.abs(angle)
            
        if (x >= cx && y >= cy) {
            angle += (Math.PI * 2);

        } else if (x >= cx && y < cy) {
            angle = ((Math.PI / 2) - angle) + (Math.PI * 1.5);
        
        } else if (x < cx && y < cy) {
            angle += Math.PI;
        
        } else {
            angle = Math.PI - angle;
        }

        /**
        * Upper and lower limit checking
        */
        if (angle > (Math.PI * 2)) {
            angle -= (Math.PI * 2)
        }

        return angle;
    }



    /**
    * This function returns the distance between two points. In effect the
    * radius of an imaginary circle that is centered on x1 and y1. The name
    * of this function is derived from the word "Hypoteneuse", which in
    * trigonmetry is the longest side of a triangle
    * 
    * @param number x1 The original X coordinate
    * @param number y1 The original Y coordinate
    * @param number x2 The target X coordinate
    * @param number y2 The target Y  coordinate
    */
    RGraph.getHypLength = function (x1, y1, x2, y2)
    {
        var ret = Math.sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));
        
        return ret;
    }



    /**
    * This installs all of the event listeners
    * 
    * @param object obj The chart object
    */
    RGraph.InstallEventListeners = function (obj)
    {
        /**
        * If this function exists, then the dynamic file has been included.
        */
        if (RGraph.InstallCanvasClickListener) {
            RGraph.InstallWindowMousedownListener(obj);
            RGraph.InstallWindowMouseupListener(obj);
            RGraph.InstallCanvasMousemoveListener(obj);
            RGraph.InstallCanvasMouseupListener(obj);
            RGraph.InstallCanvasMousedownListener(obj);
            RGraph.InstallCanvasClickListener(obj);
        
        } else if (   RGraph.hasTooltips(obj)
                   || obj.Get('chart.adjustable')
                   || obj.Get('chart.annotatable')
                   || obj.Get('chart.contextmenu')
                   || obj.Get('chart.resizable')
                   || obj.Get('chart.key.interactive')
                   || obj.Get('chart.events.click')
                   || obj.Get('chart.events.mousemove')
                  ) {
            alert('[RGRAPH] You appear to have used dynamic features but not included the file: RGraph.common.dynamic.js');
        }
    }



    /**
    * Checks whther the given argument is null or not
    * 
    * @param mixed arg The variable/value to check
    */
    RGraph.is_null = function (arg)
    {
        if (arg == null || (typeof(arg)) == 'object' && !arg) {
            return true;
        }
        
        return false;
    }



    /**
    * Loosly mimicks the PHP function print_r();
    */
    RGraph.pr = function (obj)
    {
        var str = '';
        var indent = (arguments[2] ? arguments[2] : '');

        switch (typeof(obj)) {
            case 'number':
                if (indent == '') {
                    str+= 'Number: '
                }
                str += String(obj);
                break;
            
            case 'string':
                if (indent == '') {
                    str+= 'String (' + obj.length + '):'
                }
                str += '"' + String(obj) + '"';
                break;

            case 'object':
                // In case of null
                if (obj == null) {
                    str += 'null';
                    break;
                }

                str += 'Object\n' + indent + '(\n';
                for (var i in obj) {
                    if (typeof(i) == 'string' || typeof(i) == 'number') {
                        str += indent + ' ' + i + ' => ' + RGraph.pr(obj[i], true, indent + '    ') + '\n';
                    }
                }
                
                var str = str + indent + ')';
                break;
            
            case 'function':
                str += obj;
                break;
            
            case 'boolean':
                str += 'Boolean: ' + (obj ? 'true' : 'false');
                break;
        }

        /**
        * Finished, now either return if we're in a recursed call, or alert()
        * if we're not.
        */
        if (arguments[1]) {
            return str;
        } else {
            alert(str);
        }
    }


    /**
    * Produces a dashed line
    * 
    * @param
    */
    RGraph.DashedLine = function(context, x1, y1, x2, y2)
    {
        /**
        * This is the size of the dashes
        */
        var size = 5;
        
        /**
        * The optional fifth argument can be the size of the dashes
        */
        if (typeof(arguments[5]) == 'number') {
            size = arguments[5];
        }
    
        var dx  = x2 - x1;
        var dy  = y2 - y1;
        var num = Math.floor(Math.sqrt((dx * dx) + (dy * dy)) / size);

        var xLen = dx / num;
        var yLen = dy / num;

        var count = 0;
        while (count++ < num) {

            x1 += xLen;
            y1 += yLen;
            
            count % 2 == 0 ? context.moveTo(x1, y1) : context.lineTo(x1, y1);
        }
        
        // And finally...
        count % 2 == 0 ? context.moveTo(x1, y1) : context.lineTo(x1, y1);
    }


    /**
    * Some debug functions. Because they're rarely changed - they're hand minified
    */
    RGraph.Timer=function(label){var d=new Date();console.log(label+': '+d.getSeconds()+'.'+d.getMilliseconds());}
    RGraph.Async=function(func){return setTimeout(func,arguments[1]?arguments[1]:1);}
    RGraph.isIE7=function(){return navigator.userAgent.indexOf('MSIE 7')>0;}
    RGraph.isIE8=function(){return navigator.userAgent.indexOf('MSIE 8') > 0;}
    RGraph.isIE9=function(){return navigator.userAgent.indexOf('MSIE 9') > 0;}
    RGraph.isIE9up=function(){navigator.userAgent.match(/MSIE (\d+)/);return Number(RegExp.$1)>=9;}
    RGraph.isOld=function(){return RGraph.isIE7()||RGraph.isIE8();}
    function pd(variable){RGraph.pr(variable);}
    function p(variable){RGraph.pr(variable);}
    function a(variable){alert(variable);}
    function cl(variable){return console.log(variable);}
    RGraph.Reset=function(canvas){canvas.width=canvas.width;}
	
    /**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/LICENSE.txt                       |
    * o------------------------------------------------------------------------------o
    */

    /**
    * Initialise the various objects
    */
    if (typeof(RGraph) == 'undefined') RGraph = {isRGraph:true,type:'common'};



    /**
    * This is the window click event listener. It redraws all canvas tags on the page.
    */
    RGraph.InstallWindowMousedownListener = function (obj)
    {
        window.onmousedown = function (e)
        {
            /**
            * First fire the user specified window.onmousedown_rgraph listener if there is any.
            */

            if (typeof(window.onmousedown_rgraph) == 'function') {
                window.onmousedown_rgraph(e);
            }

            // =======================================================
            // User specified click event
            // =======================================================

/*
            var obj = RGraph.ObjectRegistry.getObjectByXY(e);
            
            if (!RGraph.is_null(obj)) {

                var id  = obj.id;
    
                if (obj.Get('chart.events.click') && e.target.id == id) {
    
                    var shape = obj.getShape(e);
    
                    if (shape) {
                        var func = obj.Get('chart.events.click');
                        func(e, shape);
                    }
                }
            }
*/
            if (RGraph.HideTooltip && RGraph.Registry.Get('chart.tooltip')) {
                RGraph.Clear(RGraph.Registry.Get('chart.tooltip').__canvas__);
                RGraph.Redraw();
                RGraph.HideTooltip();
            }
        }
    }



    /**
    * This is the window click event listener. It redraws all canvas tags on the page.
    */
    RGraph.InstallWindowMouseupListener = function (obj)
    {
        window.onmouseup = function (e)
        {
            /**
            * Stop any annotating that may be going on
            */
            if (RGraph.Annotating_window_onmouseup) {
                RGraph.Annotating_window_onmouseup(e);
                return;
            }

            /**
            * First fire the user specified window.onmouseup_rgraph listener if there is any
            */
            if (typeof(window.onmouseup_rgraph) == 'function') {
                window.onmouseup_rgraph(e);
            }

            /**
            * End adjusting
            */
            if (RGraph.Registry.Get('chart.adjusting')
                || RGraph.Registry.Get('chart.adjusting.gantt'))
                {
                RGraph.FireCustomEvent(RGraph.Registry.Get('chart.adjusting'), 'onadjustend');

                RGraph.Registry.Set('chart.adjusting', null);
                RGraph.Registry.Set('chart.adjusting.shape', null);
                RGraph.Registry.Set('chart.adjusting.gantt', null);
            }


            // ==============================================
            // Finally, redraw the chart
            // ==============================================



            var tags = document.getElementsByTagName('canvas');
            for (var i=0; i<tags.length; ++i) {
                if (tags[i].__object__ && tags[i].__object__.isRGraph) {
                    if (!tags[i].__object__.Get('chart.annotatable')) {
                        if (!tags[i].__rgraph_trace_cover__ && !noredraw) {
                            RGraph.Clear(tags[i]);
                        } else {
                            var noredraw = true;
                        }
                    }
                }
            }

            if (!noredraw) {
                RGraph.Redraw();
            }
        }
    }







    /**
    * This is the canvas click event listener. It installs the click event for the
    * canvas. The click event then checks the relevant object.
    * 
    * @param object obj The chart object
    */
    RGraph.InstallCanvasMouseupListener = function (obj)
    {
        obj.canvas.onmouseup = function (e)
        {
            /**
            * First fire the user specified onmouseup listener if there is any
            */
            if (typeof(e.target.onmouseup_rgraph) == 'function') {
                e.target.onmouseup_rgraph(e);
            }


            // *************************************************************************
            // Tooltips
            // *************************************************************************


            var objects = RGraph.ObjectRegistry.getObjectsByXY(e);

            if (objects) {
                for (var i=0; i<objects.length; ++i) {
                    
                    var obj = objects[i];
                    var id  = objects[i].id;

                    if (!RGraph.is_null(obj) && RGraph.Tooltip) {

                        var shape = obj.getShape(e);

                        if (shape && shape['tooltip']) {

                            var text = shape['tooltip'];

                            if (text) {

                                var type = shape['object'].type;

                                if (type == 'line' || type == 'rscatter' || (type == 'scatter' && !obj.Get('chart.boxplot')) || type == 'radar') {
                                    var canvasXY = RGraph.getCanvasXY(obj.canvas);
                                    var x = canvasXY[0] + shape['x'];
                                    var y = canvasXY[1] + shape['y'];
                                } else {
                                    var x = e.pageX;
                                    var y = e.pageY;
                                }
                                
                                if (obj.Get('chart.tooltips.coords.page')) {
                                    var x = e.pageX;
                                    var y = e.pageY;
                                }

                                RGraph.Clear(obj.canvas);
                                RGraph.Redraw();
                                obj.Highlight(shape);
                                RGraph.Tooltip(obj, text, x, y, shape['index']);
                                
                                // Add the shape that triggered the tooltip
                                RGraph.Registry.Get('chart.tooltip').__shape__ = shape;
    
                                e.cancelBubble = true;
                                e.stopPropagation();
                                return false;
                            }
                        }
                    }
                }
    
    
                // =========================================================================
                // Interactive key
                // ========================================================================
    

                if (typeof(InteractiveKey_line_mouseup) == 'function') InteractiveKey_line_mouseup(e);
                if (typeof(InteractiveKey_pie_mouseup) == 'function')  InteractiveKey_pie_mouseup(e);
            }
        }
    }



    /**
    * This is the canvas mousemove event listener.
    * 
    * @param object obj The chart object
    */
    RGraph.InstallCanvasMousemoveListener = function (obj)
    {
        obj.canvas.onmousemove = function (e)
        {
            if (!e) {
                e = RGraph.FixEventObject(window.event);
            }

            /**
            * First fire the user specified onmousemove listener if there is any
            */
            if (typeof(e.target.onmousemove_rgraph) == 'function') {
                e.target.onmousemove_rgraph(e);
            }



            /**
            * Go through all the objects and check them to see if anything needs doing
            */
            var objects = RGraph.ObjectRegistry.getObjectsByXY(e);

            if (objects) {
                for (var i=0; i<objects.length; ++i) {

                    var obj = objects[i];
                    var id  = obj.id;

                    // ================================================================================================ //
                    // This facilitates the chart.events.mousemove option
                    // ================================================================================================ //
                    
                    if (!obj.getShape) {
                        continue;
                    }
                    
                    var func  = obj.Get('chart.events.mousemove');
                    var shape = obj.getShape(e);

                    /**
                    * This bit saves the current pointer style if there isn't one already saved
                    */
                    if (shape && typeof(func) == 'function') {
                        if (obj.Get('chart.events.mousemove.revertto') == null) {
                            obj.Set('chart.events.mousemove.revertto', e.target.style.cursor);
                        }
        
                        func(e, shape);
        
                    } else if (typeof(obj.Get('chart.events.mousemove.revertto')) == 'string') {
        
                        RGraph.cursor.push('default');
                        obj.Set('chart.events.mousemove.revertto', null);
                    }
                    
        
        
                    // ================================================================================================ //
                    // Tooltips
                    // ================================================================================================ //


                    if (   shape
                        && (obj.Get('chart.tooltips') && obj.Get('chart.tooltips')[shape['index']] || shape['tooltip'])
                        && obj.Get('chart.tooltips.event') == 'onmousemove'
                        && (RGraph.is_null(RGraph.Registry.Get('chart.tooltip')) || RGraph.Registry.Get('chart.tooltip').__index__ != shape['index'] || (typeof(shape['dataset']) == 'number' && shape['dataset'] != RGraph.Registry.Get('chart.tooltip').__shape__['dataset']) || obj.uid != RGraph.Registry.Get('chart.tooltip').__object__.uid)
                       ) {

                        RGraph.Clear(obj.canvas);
                        RGraph.Redraw();
                        obj.canvas.onmouseup(e);
                        
                        return;
                    }
        
        
                    // ================================================================================================ //
                    // Adjusting
                    // ================================================================================================ //
        

                    if (obj && obj.Get('chart.adjustable')) {
                        switch (obj.type) {
                            case 'bar':         obj.Adjusting_mousemove(e); break;
                            case 'gauge':       obj.Adjusting_mousemove(e); break;
                            case 'gantt':       obj.Adjusting_mousemove(e); break;
                            case 'hprogress':   obj.Adjusting_mousemove(e); break;
                            case 'line':        obj.Adjusting_mousemove(e); break;
                            case 'thermometer': obj.Adjusting_mousemove(e); break;
                            case 'vprogress':   obj.Adjusting_mousemove(e); break;
                            default:            obj.Adjusting_mousemove(e); break;
                        }
                    }
                }
            }


            // ================================================================================================ //
            // Crosshairs
            // ================================================================================================ //


            if (e.target && e.target.__object__.Get('chart.crosshairs')) {
                RGraph.DrawCrosshairs(e, e.target.__object__);
            }
        
        
            // ================================================================================================ //
            // Interactive key
            // ================================================================================================ //


            if (typeof(InteractiveKey_line_mousemove) == 'function') InteractiveKey_line_mousemove(e);
            if (typeof(InteractiveKey_pie_mousemove) == 'function') InteractiveKey_pie_mousemove(e);


            // ================================================================================================ //
            // Annotating
            // ================================================================================================ //


            if (e.target.__object__.Get('chart.annotatable') && RGraph.Annotating_canvas_onmousemove) {
                RGraph.Annotating_canvas_onmousemove(e);
            }



            /**
            * Determine the pointer
            */
            RGraph.EvaluateCursor(e);
        }
    }



    /**
    * This is the canvas mousedown event listener.
    * 
    * @param object obj The chart object
    */
    RGraph.InstallCanvasMousedownListener = function (obj)
    {
        obj.canvas.onmousedown = function (e)
        {
            /**
            * First fire the user specified onmousedown listener if there is any
            */
            if (typeof(e.target.onmousedown_rgraph) == 'function') {
                e.target.onmousedown_rgraph(e);
            }

            /**
            * Annotating
            */
            if (e.target.__object__.Get('chart.annotatable') && RGraph.Annotating_canvas_onmousedown) {
                RGraph.Annotating_canvas_onmousedown(e);
                return;
            }

            var obj = RGraph.ObjectRegistry.getObjectByXY(e);

            if (obj) {

                var id    = obj.id;

                /*************************************************************
                * Handle adjusting for all object types
                *************************************************************/
                if (obj && obj.isRGraph && obj.Get('chart.adjustable')) {
                    
                    /**
                    * Check the cursor is in the correct area
                    */
                    var obj = RGraph.ObjectRegistry.getObjectByXY(e);

                    if (obj && obj.isRGraph) {
                    
                        // If applicable, get the appropriate shape and store it in the registry
                        switch (obj.type) {
                            case 'bar':   var shape = obj.getShapeByX(e); break;
                            case 'gantt':
                                var shape = obj.getShape(e);
                                if (shape) {
                                    var mouseXY = RGraph.getMouseXY(e);
                                    RGraph.Registry.Set('chart.adjusting.gantt', {
                                                                                  'index': shape['index'],
                                                                                  'object': obj,
                                                                                  'mousex': mouseXY[0],
                                                                                  'mousey': mouseXY[1],
                                                                                  'event_start': obj.Get('chart.events')[shape['index']][0],
                                                                                  'event_duration': obj.Get('chart.events')[shape['index']][1],
                                                                                  'mode': (mouseXY[0] > (shape['x'] + shape['width'] - 5) ? 'resize' : 'move'),
                                                                                  'shape': shape
                                                                                 });
                                }
                                break;
                            case 'line':  var shape = obj.getShape(e); break;
                            default:      var shape = null;
                        }

                        RGraph.Registry.Set('chart.adjusting.shape', shape);


                        // Fire the onadjustbegin event
                        RGraph.FireCustomEvent(obj, 'onadjustbegin');

                        RGraph.Registry.Set('chart.adjusting', obj);
    

                        // Liberally redraw the canvas
                        RGraph.Clear(obj.canvas);
                        RGraph.Redraw();
    
                        // Call the mousemove event listener so that the canvas is adjusted even though the mouse isn't moved
                        obj.canvas.onmousemove(e);
                    }
                }


                RGraph.Clear(obj.canvas);
                RGraph.Redraw();
            }
        }
    }





    /**
    * This is the canvas click event listener. Used by the pseudo event listener
    * 
    * @param object obj The chart object
    */
    RGraph.InstallCanvasClickListener = function (obj)
    {
        obj.canvas.onclick = function (e)
        {
            /**
            * First fire the user specified onmousedown listener if there is any
            */
            if (typeof(e.target.onclick_rgraph) == 'function') {
                e.target.onclick_rgraph(e);
            }

            var objects = RGraph.ObjectRegistry.getObjectsByXY(e);

            for (var i=0; i<objects.length; ++i) {

                var obj   = objects[i];
                var id    = obj.id;
                var shape = obj.getShape(e);

                /**
                * This bit saves the current pointer style if there isn't one already saved
                */
                var func = obj.Get('chart.events.click');

                if (shape && typeof(func) == 'function') {
                    func(e, shape);
                    
                    /**
                    * If objects are layered on top of each other this return
                    * stops objects underneath from firing once the "top"
                    * objects user event has fired
                    */
                    return;
                }
            }
        }
    }



    /**
    * This function evaluates the various cursor settings and if there's one for pointer, changes it to that
    */
    RGraph.EvaluateCursor = function (e)
    {
        var mouseXY = RGraph.getMouseXY(e);
        var mouseX  = mouseXY[0];
        var mouseY  = mouseXY[1];

        /**
        * Tooltips cause the mouse pointer to change
        */
        var objects = RGraph.ObjectRegistry.getObjectsByXY(e);
        
        for (var i=0; i<objects.length; ++i) {

            var obj = objects[i]
            var id = obj.id;

            if (!RGraph.is_null(obj)) {
                if (obj.getShape && obj.getShape(e)) {
                    
                    var shape = obj.getShape(e);
    
                    if (obj.Get('chart.tooltips')) {
    
                        var text = RGraph.parseTooltipText(obj.Get('chart.tooltips'), shape['index']);
                        
                        if (text) {
                            var pointer = true;
                        }
                    }
                }

                /**
                * Now go through the key coords and see if it's over that.
                */
                if (!RGraph.is_null(obj) && obj.Get('chart.key.interactive')) {
                    for (var j=0; j<obj.coords.key.length; ++j) {
                        if (mouseX > obj.coords.key[j][0] && mouseX < (obj.coords.key[j][0] + obj.coords.key[j][2]) && mouseY > obj.coords.key[j][1] && mouseY < (obj.coords.key[j][1] + obj.coords.key[j][3])) {
                            var pointer = true;
                        }
                    }
                }
            }

            /**
            * It can be specified in the user mousemove event
            */
            if (!RGraph.is_null(shape) && !RGraph.is_null(obj) && !RGraph.is_null(obj.Get('chart.events.mousemove')) && typeof(obj.Get('chart.events.mousemove')) == 'function') {
    
                var str = (obj.Get('chart.events.mousemove')).toString();
    
                if (str.match(/pointer/) && str.match(/cursor/) && str.match(/style/)) {
                    var pointer = true;
                }
            }
        }
        
        /**
        * Is the chart resizable? Go through all the objects again
        */
        var objects = RGraph.ObjectRegistry.objects.byCanvasID;

        for (var i=0; i<objects.length; ++i) {
            if (objects[i] && objects[i][1].Get('chart.resizable')) {
                var resizable = true;
            }
        }

        if (resizable && mouseX > (e.target.width - 32) && mouseY > (e.target.height - 16)) {
            pointer = true;
        }
        
        
        if (pointer) {
            e.target.style.cursor = 'pointer';
        } else if (e.target.style.cursor == 'pointer') {
            e.target.style.cursor = 'default';
        } else {
            e.target.style.cursor = null;
        }


        // =========================================================================
        // Resize cursor
        // =========================================================================


        if (resizable && mouseX >= (e.target.width - 15) && mouseY >= (e.target.height - 15)) {
            e.target.style.cursor = 'move';
        }

        
        // =========================================================================
        // Interactive key
        // =========================================================================



        if (typeof(mouse_over_key) == 'boolean' && mouse_over_key) {
            e.target.style.cursor = 'pointer';
        }

        
        // =========================================================================
        // Gantt chart adjusting
        // =========================================================================


        if (obj && obj.type == 'gantt' && obj.Get('chart.adjustable')) {
            if (obj.getShape && obj.getShape(e)) {
                e.target.style.cursor = 'ew-resize';
            } else {
                e.target.style.cursor = 'default';
            }
        }

        
        // =========================================================================
        // Line chart adjusting
        // =========================================================================


        if (obj && obj.type == 'line' && obj.Get('chart.adjustable')) {
            if (obj.getShape && obj.getShape(e)) {
                e.target.style.cursor = 'ns-resize';
            } else {
                e.target.style.cursor = 'default';
            }
        }

        
        // =========================================================================
        // Annotatable
        // =========================================================================


        if (e.target.__object__.Get('chart.annotatable')) {
            e.target.style.cursor = 'crosshair';
        }
    }



    /**
    * This function handles the tooltip text being a string, function
    * 
    * @param mixed tooltip This could be a string or a function. If it's a function it's called and
    *                       the return value is used as the tooltip text
    * @param numbr idx The index of the tooltip.
    */
    RGraph.parseTooltipText = function (tooltips, idx)
    {
        // No tooltips
        if (!tooltips) {
            return null;
        }

        // Get the tooltip text
        if (typeof(tooltips) == 'function') {
            var text = tooltips(idx);

        // A single tooltip. Only supported by the Scatter chart
        } else if (typeof(tooltips) == 'string') {
            var text = tooltips;

        } else if (typeof(tooltips) == 'object' && typeof(tooltips)[idx] == 'function') {
            var text = tooltips[idx](idx);

        } else if (typeof(tooltips)[idx] == 'string' && tooltips[idx]) {
            var text = tooltips[idx];

        } else {
            var text = '';
        }

        if (text == 'undefined') {
            text = '';
        } else if (text == 'null') {
            text = '';
        }

        // Conditional in case the tooltip file isn't included
        return RGraph.getTooltipTextFromDIV ? RGraph.getTooltipTextFromDIV(text) : text;
    }



    /**
    * Draw crosshairs if enabled
    * 
    * @param object obj The graph object (from which we can get the context and canvas as required)
    */
    RGraph.DrawCrosshairs = function (e, obj)
    {
        var e       = RGraph.FixEventObject(e);
        var width   = obj.canvas.width;
        var height  = obj.canvas.height;
        var mouseXY = RGraph.getMouseXY(e);
        var x = mouseXY[0];
        var y = mouseXY[1];

        RGraph.RedrawCanvas(obj.canvas);

        if (   x >= obj.gutterLeft
            && y >= obj.gutterTop
            && x <= (width - obj.gutterRight)
            && y <= (height - obj.gutterBottom)
           ) {

            var linewidth = obj.Get('chart.crosshairs.linewidth') ? obj.Get('chart.crosshairs.linewidth') : 1;
            obj.context.lineWidth = linewidth ? linewidth : 1;

            obj.context.beginPath();
            obj.context.strokeStyle = obj.Get('chart.crosshairs.color');

            // Draw a top vertical line
            if (obj.Get('chart.crosshairs.vline')) {
                obj.context.moveTo(AA(this, x), AA(this, obj.gutterTop));
                obj.context.lineTo(AA(this, x), AA(this, height - obj.gutterBottom));
            }

            // Draw a horizontal line
            if (obj.Get('chart.crosshairs.hline')) {
                obj.context.moveTo(AA(this, obj.gutterLeft), AA(this, y));
                obj.context.lineTo(AA(this, width - obj.gutterRight), AA(this, y));
            }

            obj.context.stroke();
            
            
            /**
            * Need to show the coords?
            */
            if (obj.Get('chart.crosshairs.coords')) {
                if (obj.type == 'scatter') {

                    var xCoord = (((x - obj.Get('chart.gutter.left')) / (obj.canvas.width - obj.gutterLeft - obj.gutterRight)) * (obj.Get('chart.xmax') - obj.Get('chart.xmin'))) + obj.Get('chart.xmin');
                        xCoord = xCoord.toFixed(obj.Get('chart.scale.decimals'));
                    var yCoord = obj.max - (((y - obj.Get('chart.gutter.top')) / (obj.canvas.height - obj.gutterTop - obj.gutterBottom)) * obj.max);

                    if (obj.type == 'scatter' && obj.Get('chart.xaxispos') == 'center') {
                        yCoord = (yCoord - (obj.max / 2)) * 2;
                    }

                    yCoord = yCoord.toFixed(obj.Get('chart.scale.decimals'));

                    var div      = RGraph.Registry.Get('chart.coordinates.coords.div');
                    var mouseXY  = RGraph.getMouseXY(e);
                    var canvasXY = RGraph.getCanvasXY(obj.canvas);
                    
                    if (!div) {
                        var div = document.createElement('DIV');
                        div.__object__     = obj;
                        div.style.position = 'absolute';
                        div.style.backgroundColor = 'white';
                        div.style.border = '1px solid black';
                        div.style.fontFamily = 'Arial, Verdana, sans-serif';
                        div.style.fontSize = '10pt'
                        div.style.padding = '2px';
                        div.style.opacity = 1;
                        div.style.WebkitBorderRadius = '3px';
                        div.style.borderRadius = '3px';
                        div.style.MozBorderRadius = '3px';
                        document.body.appendChild(div);
                        
                        RGraph.Registry.Set('chart.coordinates.coords.div', div);
                    }
                    
                    // Convert the X/Y pixel coords to correspond to the scale
                    div.style.opacity = 1;
                    div.style.display = 'inline';

                    if (!obj.Get('chart.crosshairs.coords.fixed')) {
                        div.style.left = Math.max(2, (e.pageX - div.offsetWidth - 3)) + 'px';
                        div.style.top = Math.max(2, (e.pageY - div.offsetHeight - 3))  + 'px';
                    } else {
                        div.style.left = canvasXY[0] + obj.gutterLeft + 3 + 'px';
                        div.style.top  = canvasXY[1] + obj.gutterTop + 3 + 'px';
                    }

                    div.innerHTML = '<span style="color: #666">' + obj.Get('chart.crosshairs.coords.labels.x') + ':</span> ' + xCoord + '<br><span style="color: #666">' + obj.Get('chart.crosshairs.coords.labels.y') + ':</span> ' + yCoord;
                    
                    obj.canvas.addEventListener('mouseout', RGraph.HideCrosshairCoords, false);

                    obj.canvas.__crosshairs_labels__ = div;
                    obj.canvas.__crosshairs_x__ = xCoord;
                    obj.canvas.__crosshairs_y__ = yCoord;

                } else {
                    alert('[RGRAPH] Showing crosshair coordinates is only supported on the Scatter chart');
                }
            }

            /**
            * Fire the oncrosshairs custom event
            */
            RGraph.FireCustomEvent(obj, 'oncrosshairs');

        } else {
            RGraph.HideCrosshairCoords();
        }
    }
	
        /**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/LICENSE.txt                       |
    * o------------------------------------------------------------------------------o
    */
    
    /**
    * This is a library of a few functions that make it easier to do
    * effects like fade-ins or eaxpansion.
    */

    /**
    * Initialise the various objects
    */
    if (typeof(RGraph) == 'undefined') RGraph = {isRGraph:true,type:'common'};
    
    RGraph.Effects = {}
    RGraph.Effects.Fade           = {}; RGraph.Effects.jQuery         = {}
    RGraph.Effects.jQuery.HBlinds = {}; RGraph.Effects.jQuery.VBlinds = {}
    RGraph.Effects.jQuery.Slide   = {}; RGraph.Effects.Pie            = {}
    RGraph.Effects.Bar            = {}; RGraph.Effects.Line           = {}
    RGraph.Effects.Line.jQuery    = {}; RGraph.Effects.Fuel           = {}
    RGraph.Effects.Rose           = {}; RGraph.Effects.Odo            = {}
    RGraph.Effects.Gauge          = {}; RGraph.Effects.Meter          = {}
    RGraph.Effects.HBar           = {}; RGraph.Effects.HProgress      = {}
    RGraph.Effects.VProgress      = {}; RGraph.Effects.Radar          = {}
    RGraph.Effects.Waterfall      = {}; RGraph.Effects.Gantt          = {}
    RGraph.Effects.Thermometer    = {};

    /**
    * Fadein
    * 
    * This function simply uses the CSS opacity property - initially set to zero and
    * increasing to 1 over the period of 0.5 second
    * 
    * @param object obj The graph object
    */
    RGraph.Effects.Fade.In = function (obj)
    {
        var canvas = obj.canvas;

        // Initially the opacity should be zero
        canvas.style.opacity = 0;
        
        // Draw the chart
        RGraph.Clear(obj.canvas);
        RGraph.RedrawCanvas(obj.canvas);
        
        // Now fade the chart in
        for (var i=1; i<=10; ++i) {
            setTimeout('document.getElementById("' + canvas.id + '").style.opacity = ' + (i * 0.1), i * 50);
        }
        
        /**
        * Callback
        */
        if (typeof(arguments[2]) == 'function') {
            setTimeout(arguments[2], 500);
        }
    }


    /**
    * Fadeout
    * 
    * This function is a reversal of the above function - fading out instead of in
    * 
    * @param object obj The graph object
    */
    RGraph.Effects.Fade.Out = function (obj)
    {
        var canvas = obj.canvas;
        
        // Draw the chart
        RGraph.Clear(obj.canvas);
        RGraph.RedrawCanvas(obj.canvas);
        
        // Now fade the chart in
        for (var i=10; i>=0; --i) {
            setTimeout('document.getElementById("' + canvas.id + '").style.opacity = ' + (i * 0.1), (10 - i) * 50);
        }
        
        /**
        * Callback
        */
        if (typeof(arguments[2]) == 'function') {
            setTimeout(arguments[2], 500);
        }
    }


    /**
    * Expand
    * 
    * This effect is like the tooltip effect of the same name. I starts in the middle
    * and expands out to full size.
    * 
    * @param object obj The graph object
    */
    RGraph.Effects.jQuery.Expand = function (obj)
    {
        // Check for jQuery
        if (typeof(jQuery) == 'undefined') {
            alert('[ERROR] Could not find jQuery object - have you included the jQuery file?');
        }
        
        var canvas = obj.canvas;
        
        if (!canvas.__rgraph_div_placeholder__) {
            var div    = RGraph.Effects.ReplaceCanvasWithDIV(canvas);
            canvas.__rgraph_div_placeholder__ = div;
        } else {
            div = canvas.__rgraph_div_placeholder__;
        }

        canvas.style.position = 'relative';
        canvas.style.top = (canvas.height / 2) + 'px';
        canvas.style.left = (canvas.width / 2) + 'px';


        canvas.style.width = 0;
        canvas.style.height = 0;


        canvas.style.opacity = 0;

        RGraph.Clear(obj.canvas);
        RGraph.RedrawCanvas(obj.canvas);

        $('#' + obj.id).animate({
            opacity: 1,
            width: parseInt(div.style.width) + 'px',
            height: parseInt(div.style.height) + 'px',
            left: '-=' + (obj.canvas.width / 2) + 'px',
            top: '-=' + (obj.canvas.height / 2) + 'px'
        }, 1000);
        
        /**
        * Callback
        */
        if (typeof(arguments[2]) == 'function') {
            setTimeout(arguments[2], 1000);
        }
    }


    /**
    * A function used to replace the canvas witha Div, which inturn holds the canvas. This way the page
    * layout doesn't shift in the canvas is resized.
    * 
    * @param object canvas The canvas to replace.
    */
    RGraph.Effects.ReplaceCanvasWithDIV  = function (canvas)
    {
        if (!canvas.replacementDIV) {
            // Create the place holder DIV
            var div    = document.createElement('DIV');
                div.style.width = canvas.width + 'px';
                div.style.height = canvas.height + 'px';
                div.style.cssFloat = canvas.style.cssFloat;
                div.style.left = canvas.style.left;
                div.style.top = canvas.style.top;
                //div.style.position = canvas.style.position;
                div.style.display = 'inline-block';
            canvas.parentNode.insertBefore(div, canvas);
            
    
            // Remove the canvas from the document
            canvas.parentNode.removeChild(canvas);
            
            // Add it back in as a child of the place holder
            div.appendChild(canvas);
            
            // Reset the positioning information on the canvas
            canvas.style.position = 'relative';
            canvas.style.left = (div.offsetWidth / 2) + 'px';
            canvas.style.top = (div.offsetHeight / 2) + 'px';
            canvas.style.cssFloat = '';
        
            // Add a reference to the canvas to the DIV so that repeated plays of the anumation
            // don't keep replacing the canvas with a new DIV
            canvas.replacementDIV = div;

        } else {
            var div = canvas.replacementDIV;
        }
        
        return div;
    }


    /**
    * Snap
    * 
    * Similar to the tooltip effect of the same name, this moves the canvas in from the top left corner
    * 
    * @param object obj The graph object
    */
    RGraph.Effects.jQuery.Snap = function (obj)
    {
        var delay = 500;

        var div = RGraph.Effects.ReplaceCanvasWithDIV(obj.canvas);
        
        obj.canvas.style.position = 'absolute';
        obj.canvas.style.top = 0;
        obj.canvas.style.left = 0;
        obj.canvas.style.width = 0;
        obj.canvas.style.height = 0;
        obj.canvas.style.opacity = 0;
        
        var targetLeft   = div.offsetLeft;
        var targetTop    = div.offsetTop;
        var targetWidth  = div.offsetWidth;
        var targetHeight = div.offsetHeight;

        RGraph.Clear(obj.canvas);
        RGraph.RedrawCanvas(obj.canvas);

        $('#' + obj.id).animate({
            opacity: 1,
            width: targetWidth + 'px',
            height: targetHeight + 'px',
            left: targetLeft + 'px',
            top: targetTop + 'px'
        }, delay);
        
        /**
        * Callback
        */
        if (typeof(arguments[2]) == 'function') {
            setTimeout(arguments[2], delay + 50);
        }
    }


    /**
    * Reveal
    * 
    * This effect issmilat to the Expand effect - the canvas is slowly revealed from
    * the centre outwards
    * 
    * @param object obj The chart object
    */
    RGraph.Effects.jQuery.Reveal = function (obj)
    {
        var opts   = arguments[1] ? arguments[1] : null;
        var delay  = 1000;
        var canvas = obj.canvas;
        var xy     = RGraph.getCanvasXY(obj.canvas);


        /**
        * Hide the canvas and draw it
        */
        obj.canvas.style.visibility = 'hidden';
        RGraph.Clear(obj.canvas);
        RGraph.RedrawCanvas(obj.canvas);


        var divs = [
                    ['reveal_left', xy[0], xy[1], obj.canvas.width  / 2, obj.canvas.height],
                    ['reveal_right',(xy[0] + (obj.canvas.width  / 2)),xy[1],(obj.canvas.width  / 2),obj.canvas.height],
                    ['reveal_top',xy[0],xy[1],obj.canvas.width,(obj.canvas.height / 2)],
                    ['reveal_bottom',xy[0],(xy[1] + (obj.canvas.height  / 2)),obj.canvas.width,(obj.canvas.height / 2)]
                   ];
        
        for (var i=0; i<divs.length; ++i) {
            var div = document.createElement('DIV');
                div.id = divs[i][0];
                div.style.width =  divs[i][3]+ 'px';
                div.style.height = divs[i][4] + 'px';
                div.style.left   = divs[i][1] + 'px';
                div.style.top   = divs[i][2] + 'px';
                div.style.position = 'absolute';
                div.style.backgroundColor = opts && typeof(opts['color']) == 'string' ? opts['color'] : 'white';
            document.body.appendChild(div);
        }
        
        /**
        * Now the covering DIVs are in place show the canvas again
        */
        obj.canvas.style.visibility = 'visible';


        $('#reveal_left').animate({width: 0}, delay);
        $('#reveal_right').animate({left: '+=' + (obj.canvas.width / 2),width: 0}, delay);
        $('#reveal_top').animate({height: 0}, delay);
        $('#reveal_bottom').animate({top: '+=' + (obj.canvas.height / 2),height: 0}, delay);
        
        // Remove the DIVs from the DOM 100ms after the animation ends
        setTimeout(
            function ()
            {
                document.body.removeChild(document.getElementById("reveal_top"))
                document.body.removeChild(document.getElementById("reveal_bottom"))
                document.body.removeChild(document.getElementById("reveal_left"))
                document.body.removeChild(document.getElementById("reveal_right"))
            }
            , delay);
        
        /**
        * Callback
        */
        if (typeof(arguments[2]) == 'function') {
            setTimeout(arguments[2], delay);
        }
    }


    /**
    * Conceal
    * 
    * This effect is the reverse of the Reveal effect - instead of revealing the canvas it
    * conceals it. Combined with the reveal effect would make for a nice wipe effect.
    * 
    * @param object obj The chart object
    */
    RGraph.Effects.jQuery.Conceal = function (obj)
    {
        var opts   = arguments[1] ? arguments[1] : null;
        var delay  = 1000;
        var canvas = obj.canvas;
        var xy     = RGraph.getCanvasXY(obj.canvas);


        var divs = [
                    ['conceal_left', xy[0], xy[1], 0, obj.canvas.height],
                    ['conceal_right',(xy[0] + obj.canvas.width),xy[1],0,obj.canvas.height],
                    ['conceal_top',xy[0],xy[1],obj.canvas.width,0],
                    ['conceal_bottom',xy[0],(xy[1] + obj.canvas.height),obj.canvas.width,0]
                   ];
        
        for (var i=0; i<divs.length; ++i) {
            var div = document.createElement('DIV');
                div.id = divs[i][0];
                div.style.width =  divs[i][3]+ 'px';
                div.style.height = divs[i][4] + 'px';
                div.style.left   = divs[i][1] + 'px';
                div.style.top   = divs[i][2] + 'px';
                div.style.position = 'absolute';
                div.style.backgroundColor = opts && typeof(opts['color']) == 'string' ? opts['color'] : 'white';
            document.body.appendChild(div);
        }


        $('#conceal_left').animate({width: '+=' + (obj.canvas.width / 2)}, delay);
        $('#conceal_right').animate({left: '-=' + (obj.canvas.width / 2),width: (obj.canvas.width / 2)}, delay);
        $('#conceal_top').animate({height: '+=' + (obj.canvas.height / 2)}, delay);
        $('#conceal_bottom').animate({top: '-=' + (obj.canvas.height / 2),height: (obj.canvas.height / 2)}, delay);
        
        // Remove the DIVs from the DOM 100ms after the animation ends
        setTimeout(
            function ()
            {
                document.body.removeChild(document.getElementById("conceal_top"))
                document.body.removeChild(document.getElementById("conceal_bottom"))
                document.body.removeChild(document.getElementById("conceal_left"))
                document.body.removeChild(document.getElementById("conceal_right"))
            }
            , delay);
            
        setTimeout(function () {RGraph.Clear(obj.canvas);}, delay);
        
        /**
        * Callback
        */
        if (typeof(arguments[2]) == 'function') {
            setTimeout(arguments[2], delay);
        }
    }


    /**
    * Horizontal Blinds (open)
    * 
    * @params object obj The graph object
    */
    RGraph.Effects.jQuery.HBlinds.Open = function (obj)
    {
        var canvas  = obj.canvas;
        var opts   = arguments[1] ? arguments[1] : [];
        var delay  = 1000;
        var color  = opts['color'] ? opts['color'] : 'white';
        var xy     = RGraph.getCanvasXY(canvas);
        var height = canvas.height / 5;
        
        /**
        * First draw the chart
        */
        RGraph.Clear(obj.canvas);
        RGraph.RedrawCanvas(obj.canvas);

        for (var i=0; i<5; ++i) {
            var div = document.createElement('DIV');
                div.id = 'blinds_' + i;
                div.style.width =  canvas.width + 'px';
                div.style.height = height + 'px';
                div.style.left   = xy[0] + 'px';
                div.style.top   = (xy[1] + (canvas.height * (i / 5))) + 'px';
                div.style.position = 'absolute';
                div.style.backgroundColor = color;
            document.body.appendChild(div);

            $('#blinds_' + i).animate({height: 0}, delay);
        }

        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_0'));}, delay);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_1'));}, delay);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_2'));}, delay);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_3'));}, delay);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_4'));}, delay);
        
        /**
        * Callback
        */
        if (typeof(arguments[2]) == 'function') {
            setTimeout(arguments[2], delay);
        }
    }


    /**
    * Horizontal Blinds (close)
    * 
    * @params object obj The graph object
    */
    RGraph.Effects.jQuery.HBlinds.Close = function (obj)
    {
        var canvas  = obj.canvas;
        var opts   = arguments[1] ? arguments[1] : [];
        var delay  = 1000;
        var color  = opts['color'] ? opts['color'] : 'white';
        var xy     = RGraph.getCanvasXY(canvas);
        var height = canvas.height / 5;

        for (var i=0; i<5; ++i) {
            var div = document.createElement('DIV');
                div.id = 'blinds_' + i;
                div.style.width =  canvas.width + 'px';
                div.style.height = 0;
                div.style.left   = xy[0] + 'px';
                div.style.top   = (xy[1] + (canvas.height * (i / 5))) + 'px';
                div.style.position = 'absolute';
                div.style.backgroundColor = color;
            document.body.appendChild(div);

            $('#blinds_' + i).animate({height: height + 'px'}, delay);
        }
        
        setTimeout(function () {RGraph.Clear(obj.canvas);}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_0'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_1'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_2'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_3'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_4'));}, delay + 100);
        
        /**
        * Callback
        */
        if (typeof(arguments[2]) == 'function') {
            setTimeout(arguments[2], delay);
        }
    }


    /**
    * Vertical Blinds (open)
    * 
    * @params object obj The graph object
    */
    RGraph.Effects.jQuery.VBlinds.Open = function (obj)
    {
        var canvas  = obj.canvas;
        var opts   = arguments[1] ? arguments[1] : [];
        var delay  = 1000;
        var color  = opts['color'] ? opts['color'] : 'white';
        var xy     = RGraph.getCanvasXY(canvas);
        var width  = canvas.width / 10;
        
        /**
        * First draw the chart
        */
        RGraph.Clear(obj.canvas);
        RGraph.RedrawCanvas(obj.canvas);

        for (var i=0; i<10; ++i) {
            var div = document.createElement('DIV');
                div.id = 'blinds_' + i;
                div.style.width =  width + 'px';
                div.style.height = canvas.height + 'px';
                div.style.left   = (xy[0] + (canvas.width * (i / 10))) + 'px';
                div.style.top   = (xy[1]) + 'px';
                div.style.position = 'absolute';
                div.style.backgroundColor = color;
            document.body.appendChild(div);

            $('#blinds_' + i).animate({width: 0}, delay);
        }

        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_0'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_1'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_2'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_3'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_4'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_5'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_6'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_7'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_8'));}, delay + 100);
        setTimeout(function () {document.body.removeChild(document.getElementById('blinds_9'));}, delay + 100);
        
        /**
        * Callback
        */
        if (typeof(arguments[2]) == 'function') {
            setTimeout(arguments[2], delay);
        }
    }


    /**
    * Vertical Blinds (close)
    * 
    * @params object obj The graph object
    */
    RGraph.Effects.jQuery.VBlinds.Close = function (obj)
    {
        var canvas  = obj.canvas;
        var opts   = arguments[1] ? arguments[1] : [];
        var delay  = 1000;
        var color  = opts['color'] ? opts['color'] : 'white';
        var xy     = RGraph.getCanvasXY(canvas);
        var width  = canvas.width / 10;
        
        // Don't draw the chart

        for (var i=0; i<10; ++i) {
            var div = document.createElement('DIV');
                div.id = 'blinds_' + i;
                div.style.width =  0;
                div.style.height = canvas.height + 'px';
                div.style.left   = (xy[0] + (canvas.width * (i / 10))) + 'px';
                div.style.top   = (xy[1]) + 'px';
                div.style.position = 'absolute';
                div.style.backgroundColor = color;
            document.body.appendChild(div);

            $('#blinds_' + i).animate({width: width}, delay);
        }

        setTimeout(function () {RGraph.Clear(obj.canvas, color);}, delay + 100);

        if (opts['remove']) {
            setTimeout(function () {document.body.removeChild(document.getElementById('blinds_0'));}, delay + 100);
            setTimeout(function () {document.body.removeChild(document.getElementById('blinds_1'));}, delay + 100);
            setTimeout(function () {document.body.removeChild(document.getElementById('blinds_2'));}, delay + 100);
            setTimeout(function () {document.body.removeChild(document.getElementById('blinds_3'));}, delay + 100);
            setTimeout(function () {document.body.removeChild(document.getElementById('blinds_4'));}, delay + 100);
            setTimeout(function () {document.body.removeChild(document.getElementById('blinds_5'));}, delay + 100);
            setTimeout(function () {document.body.removeChild(document.getElementById('blinds_6'));}, delay + 100);
            setTimeout(function () {document.body.removeChild(document.getElementById('blinds_7'));}, delay + 100);
            setTimeout(function () {document.body.removeChild(document.getElementById('blinds_8'));}, delay + 100);
            setTimeout(function () {document.body.removeChild(document.getElementById('blinds_9'));}, delay + 100);
        }
        
        /**
        * Callback
        */
        if (typeof(arguments[2]) == 'function') {
            setTimeout(arguments[2], delay);
        }
    }


    /**
    * Pie chart grow
    * 
    * Gradually increases the pie chart radius
    * 
    * @params object obj The graph object
    */
    RGraph.Effects.Pie.Grow = function (obj)
    {
        var canvas  = obj.canvas;
        var opts   = arguments[1] ? arguments[1] : [];
        var color  = opts['color'] ? opts['color'] : 'white';
        var xy     = RGraph.getCanvasXY(canvas);
        
        canvas.style.visibility = 'hidden';
        RGraph.RedrawCanvas(canvas);

        var radius = obj.getRadius();
        
        if (typeof(obj.Get('chart.radius')) == 'number') {
            radius = obj.Get('chart.radius');
        }
        
        //RGraph.Clear(obj.canvas);
        canvas.style.visibility = 'visible';

        obj.Set('chart.radius', 0);

        RGraph.Effects.Animate(obj, {'chart.radius': radius}, arguments[2]);
    }


    /**
    * Grow
    * 
    * The Bar chart Grow effect gradually increases the values of the bars
    * 
    * @param object obj The graph object
    */
    RGraph.Effects.Bar.Grow = function (obj)
    {
        // Save the data
        obj.original_data = RGraph.array_clone(obj.data);
        
        // Zero the data
        obj.__animation_frame__ = 0;

        // Stop the scale from changing by setting chart.ymax (if it's not already set)
        if (obj.Get('chart.ymax') == null) {

            var ymax = 0;

            for (var i=0; i<obj.data.length; ++i) {
                if (RGraph.is_array(obj.data[i]) && obj.Get('chart.grouping') == 'stacked') {
                    ymax = Math.max(ymax, Math.abs(RGraph.array_sum(obj.data[i])));

                } else if (RGraph.is_array(obj.data[i]) && obj.Get('chart.grouping') == 'grouped') {
                    ymax = Math.max(ymax, Math.abs(RGraph.array_max(obj.data[i])));
                } else {
                    ymax = Math.max(ymax, Math.abs(obj.data[i]));
                }
            }

            ymax = RGraph.getScale(ymax, obj)[4];
            
            obj.Set('chart.ymax', ymax);
        }

        function Grow ()
        {
            var numFrames = 30;

            if (!obj.__animation_frame__) {
                obj.__animation_frame__  = 0;
                obj.__original_hmargin__ = obj.Get('chart.hmargin');
                obj.__hmargin__          = ((obj.canvas.width - obj.Get('chart.gutter.left') - obj.Get('chart.gutter.right')) / obj.data.length) / 2;
                obj.Set('chart.hmargin', obj.__hmargin__);
            }

            // Alter the Bar chart data depending on the frame
            for (var j=0; j<obj.original_data.length; ++j) {
                if (typeof(obj.data[j]) == 'object') {
                    for (var k=0; k<obj.data[j].length; ++k) {
                        obj.data[j][k] = (obj.__animation_frame__ / numFrames) * obj.original_data[j][k];
                    }
                } else {
                    obj.data[j] = (obj.__animation_frame__ / numFrames) * obj.original_data[j];
                }
            }

            /**
            * Increment the hmargin to the target
            */
            obj.Set('chart.hmargin', ((1 - (obj.__animation_frame__ / numFrames)) * (obj.__hmargin__ - obj.__original_hmargin__)) + obj.__original_hmargin__);


            RGraph.Clear(obj.canvas);
            RGraph.RedrawCanvas(obj.canvas);

            if (obj.__animation_frame__ < numFrames) {
                obj.__animation_frame__ += 1;
                
                if (location.href.indexOf('?settimeout') > 0) {
                    setTimeout(Grow, 40);
                } else {
                    RGraph.Effects.UpdateCanvas(Grow);
                }
            }
        }
        
        RGraph.Effects.UpdateCanvas(Grow);
    }


    /**
    * A wrapper function that encapsulate requestAnimationFrame
    * 
    * @param function func The animation function
    */
    RGraph.Effects.UpdateCanvas = function (func)
    {
        // Standard
        if (typeof(window.requestAnimationFrame) == 'function') {
            window.requestAnimationFrame(func);

        // IE 10+
        } else if (typeof(window.msRequestAnimationFrame) == 'function') {
            window.msRequestAnimationFrame(func);

        // Chrome
        } else if (typeof(window.webkitRequestAnimationFrame) == 'function') {
            window.webkitRequestAnimationFrame(func);

        // Firefox
        } else if (window.mozRequestAnimationFrame) { // Seems rather slow in FF6 - so disabled
            window.mozRequestAnimationFrame(func);

        // Default fallback to setTimeout
        } else {
            setTimeout(func, 16.6666666);
        }
    }


    /**
    * Grow
    * 
    * The Fuel chart Grow effect gradually increases the values of the Fuel chart
    * 
    * @param object obj The graph object
    */
    RGraph.Effects.Fuel.Grow = function (obj)
    {
        var totalFrames  = 30;
        var currentFrame = 0;
        var diff         = obj.value - obj.currentValue;
        var increment    = diff / totalFrames;
        var callback     = arguments[2] ? arguments[2] : null;
        
        // Don't redraw the canvas when the image loads
        obj.Set('chart.icon.reload', false);

        function Grow ()
        {
            if (currentFrame < totalFrames) {
                obj.value = obj.currentValue + increment;
                RGraph.Clear(obj.canvas);
                RGraph.RedrawCanvas(obj.canvas);

                currentFrame++;
                RGraph.Effects.UpdateCanvas(Grow);
            } else if (callback) {
                callback(obj);
            }
        }
        
        RGraph.Effects.UpdateCanvas(Grow);
    }


    /**
    * The Animate function. Similar to the jQuery Animate() function - simply pass it a
    * map of the properties and their target values, and this function will animate
    * them to get to those values.
    * 
    * @param object obj The chart object
    * @param object map A map (an associative array) of the properties and their target values.
    * @param            An optional function which will be called when the animation is complete
    */
    RGraph.Effects.Animate = function (obj, map)
    {
        RGraph.RedrawCanvas(obj.canvas);

        RGraph.Effects.__total_frames__  = (map && map['frames']) ? map['frames'] : 30;

        function Animate_Iterator (func)
        {
            var id = [obj.id +  '_' + obj.type];

            // Very first time in - initialise the arrays
            if (typeof(RGraph.Effects.__current_frame__ ) == 'undefined') {
                RGraph.Effects.__current_frame__   = new Array();
                RGraph.Effects.__original_values__ = new Array();
                RGraph.Effects.__diffs__           = new Array();
                RGraph.Effects.__steps__           = new Array();
                RGraph.Effects.__callback__        = new Array();
            }

            // Initialise the arrays for THIS animation (not necessrily the first in the page)
            if (!RGraph.Effects.__current_frame__[id]) {
                RGraph.Effects.__current_frame__[id] = RGraph.Effects.__total_frames__;
                RGraph.Effects.__original_values__[id] = {};
                RGraph.Effects.__diffs__[id]           = {};
                RGraph.Effects.__steps__[id]           = {};
                RGraph.Effects.__callback__[id]        = func;
            }

            for (var i in map) {
                if (typeof(map[i]) == 'string' || typeof(map[i]) == 'number') {

                    // If this the first frame, record the proginal value
                    if (RGraph.Effects.__current_frame__[id] == RGraph.Effects.__total_frames__) {
                        RGraph.Effects.__original_values__[id][i] = obj.Get(i);
                        RGraph.Effects.__diffs__[id][i]           = map[i] - RGraph.Effects.__original_values__[id][i];
                        RGraph.Effects.__steps__[id][i]           = RGraph.Effects.__diffs__[id][i] / RGraph.Effects.__total_frames__;
                    }

                    obj.Set(i, obj.Get(i) + RGraph.Effects.__steps__[id][i]);

                    RGraph.RedrawCanvas(obj.canvas);
                }
            }

            // If the current frame number is above zero, run the animation iterator again
            if (--RGraph.Effects.__current_frame__[id] > 0) {
                //setTimeout(Animate_Iterator, 100)
                RGraph.Effects.UpdateCanvas(Animate_Iterator);
            
            // Optional callback
            } else {

                if (typeof(RGraph.Effects.__callback__[id]) == 'function') {
                    (RGraph.Effects.__callback__[id])(obj);
                }
                
                // Get rid of the arrays
                RGraph.Effects.__current_frame__[id]   = null;
                RGraph.Effects.__original_values__[id] = null;
                RGraph.Effects.__diffs__[id]           = null;
                RGraph.Effects.__steps__[id]           = null;
                RGraph.Effects.__callback__[id]        = null;

            }
        }

        Animate_Iterator(arguments[2]);
    }


    /**
    * Slide in
    * 
    * This function is a wipe that can be used when switching the canvas to a new graph
    * 
    * @param object obj The graph object
    */
    RGraph.Effects.jQuery.Slide.In = function (obj)
    {
        RGraph.Clear(obj.canvas);
        RGraph.RedrawCanvas(obj.canvas);

        var canvas = obj.canvas;
        var div    = RGraph.Effects.ReplaceCanvasWithDIV(obj.canvas);
        var delay = 1000;
        div.style.overflow= 'hidden';
        var from = typeof(arguments[1]) == 'object' && typeof(arguments[1]['from']) == 'string' ? arguments[1]['from'] : 'left';
        
        canvas.style.position = 'relative';
        
        if (from == 'left') {
            canvas.style.left = (0 - div.offsetWidth) + 'px';
            canvas.style.top  = 0;
        } else if (from == 'top') {
            canvas.style.left = 0;
            canvas.style.top  = (0 - div.offsetHeight) + 'px';
        } else if (from == 'bottom') {
            canvas.style.left = 0;
            canvas.style.top  = div.offsetHeight + 'px';
        } else {
            canvas.style.left = div.offsetWidth + 'px';
            canvas.style.top  = 0;
        }
        
        $('#' + obj.id).animate({left:0,top:0}, delay);
        
        /**
        * Callback
        */
        if (typeof(arguments[2]) == 'function') {
            setTimeout(arguments[2], delay);
        }
    }


    /**
    * Slide out
    * 
    * This function is a wipe that can be used when switching the canvas to a new graph
    * 
    * @param object obj The graph object
    */
    RGraph.Effects.jQuery.Slide.Out = function (obj)
    {
        var canvas = obj.canvas;
        var div    = RGraph.Effects.ReplaceCanvasWithDIV(obj.canvas);
        var delay = 1000;
        div.style.overflow= 'hidden';
        var to = typeof(arguments[1]) == 'object' && typeof(arguments[1]['to']) == 'string' ? arguments[1]['to'] : 'left';
        
        canvas.style.position = 'relative';
        canvas.style.left = 0;
        canvas.style.top  = 0;
        
        if (to == 'left') {
            $('#' + obj.id).animate({left: (0 - canvas.width) + 'px'}, delay);
        } else if (to == 'top') {
            $('#' + obj.id).animate({left: 0, top: (0 - div.offsetHeight) + 'px'}, delay);
        } else if (to == 'bottom') {
            $('#' + obj.id).animate({top: (0 + div.offsetHeight) + 'px'}, delay);
        } else {
            $('#' + obj.id).animate({left: (0 + canvas.width) + 'px'}, delay);
        }
        
        /**
        * Callback
        */
        if (typeof(arguments[2]) == 'function') {
            setTimeout(arguments[2], delay);
        }
    }


    /**
    * Unfold
    * 
    * This effect gradually increases the X/Y coordinatesfrom 0
    * 
    * @param object obj The chart object
    */
    RGraph.Effects.Line.Unfold = function (obj)
    {
        obj.Set('chart.animation.factor', obj.Get('chart.animation.unfold.initial'));
        RGraph.Effects.Animate(obj, {'chart.animation.factor': 1}, arguments[2]);
    }


    /**
    * Unfold
    * 
    * This effect gradually increases the radiuss and decrease the margin of the Rose chart
    * 
    * @param object   obj The chart object
    * @param              Not used - pass null
    * @param function     An optional callback function
    */
    RGraph.Effects.Rose.Grow = function (obj)
    {
        var numFrames       = 60;
        var currentFrame    = 0;
        var original_margin = obj.Get('chart.margin');
        var margin          = (360 / obj.data.length) / 2;
        var callback        = arguments[2];

        obj.Set('chart.margin', margin);
        obj.Set('chart.animation.grow.factor', 0);

        //RGraph.Effects.Animate(obj, {'chart.margin': original_margin, 'chart.animation.grow.factor': 1, 'frames': 45}, arguments[2]);
        function Grow_inner ()
        {
            if (currentFrame++ < numFrames) {
                obj.Set('chart.animation.grow.factor', currentFrame / numFrames);
                obj.Set('chart.margin', (currentFrame / numFrames) * original_margin);
                RGraph.Clear(obj.canvas);
                RGraph.RedrawCanvas(obj.canvas);
                
                RGraph.Effects.UpdateCanvas(Grow_inner);

            } else {
                obj.Set('chart.animation.grow.factor', 1);
                obj.Set('chart.margin', original_margin);
                RGraph.Clear(obj.canvas);
                RGraph.RedrawCanvas(obj.canvas);
                
                if (typeof(callback) == 'function') {
                    callback(obj);
                }
            }
        }
        
        RGraph.Effects.UpdateCanvas(Grow_inner);
    }


    /**
    * UnfoldFromCenter
    * 
    * Line chart  unfold from center
    */
    RGraph.Effects.Line.UnfoldFromCenter = function (obj)
    {
        var numFrames = 30;

        var original_opacity = obj.canvas.style.opacity;
        obj.canvas.style.opacity = 0;
        
        obj.Draw();
        RGraph.RedrawCanvas(obj.canvas);

        var center_value = obj.scale[4] / 2;
        obj.Set('chart.ymax', Number(obj.scale[4]));

        RGraph.Clear(obj.canvas);

        obj.canvas.style.opacity = original_opacity;
        var original_data = RGraph.array_clone(obj.original_data);
        var original_blur = obj.Get('chart.shadow.blur');
        obj.Set('chart.shadow.blur', 0);
        var callback = arguments[2];

        if (!obj.__increments__) {
        
            obj.__increments__ = new Array();
        
            for (var dataset=0; dataset<original_data.length; ++dataset) {

                obj.__increments__[dataset] = new Array();

                for (var i=0; i<original_data[dataset].length; ++i) {
                    obj.__increments__[dataset][i] = (original_data[dataset][i] - center_value) / numFrames;
                    
                    obj.original_data[dataset][i] = center_value;
                }
            }
        }

        function UnfoldFromCenter ()
        {
            RGraph.Clear(obj.canvas);
            RGraph.RedrawCanvas(obj.canvas);
        
            for (var dataset=0; dataset<original_data.length; ++dataset) {
                for (var i=0; i<original_data[dataset].length; ++i) {
                    obj.original_data[dataset][i] += obj.__increments__[dataset][i];
                }
            }

            if (--numFrames > 0) {
                RGraph.Effects.UpdateCanvas(UnfoldFromCenter);
            } else {
                obj.original_data = RGraph.array_clone(original_data);
                obj.__increments__ = null;
                obj.Set('chart.shadow.blur', original_blur);
                RGraph.Clear(obj.canvas);
                RGraph.RedrawCanvas(obj.canvas);
                
                if (typeof(callback) == 'function') {
                    callback(obj);
                }
            }
        }
        
        UnfoldFromCenter();
    }


    /**
    * FoldToCenter
    * 
    * Line chart  FoldTocenter
    */
    RGraph.Effects.Line.FoldToCenter = function (obj)
    {
        var totalFrames = 30;
        var numFrame    = totalFrames;
        RGraph.RedrawCanvas(obj.canvas);
        var center_value = obj.scale[4] / 2;
        obj.Set('chart.ymax', Number(obj.scale[4]));
        RGraph.Clear(obj.canvas);
        var original_data = RGraph.array_clone(obj.original_data);
        obj.Set('chart.shadow.blur', 0);
        var callback = arguments[2];
        
        function FoldToCenter ()
        {
            for (var i=0; i<obj.data.length; ++i) {
                if (obj.data[i].length) {
                    for (var j=0; j<obj.data[i].length; ++j) {
                        if (obj.original_data[i][j] > center_value) {
                            obj.original_data[i][j] = ((original_data[i][j] - center_value) * (numFrame/totalFrames)) + center_value;
                        } else {
                            obj.original_data[i][j] = center_value - ((center_value - original_data[i][j]) * (numFrame/totalFrames));
                        }
                    }
                }
            }
            
            RGraph.Clear(obj.canvas);
            RGraph.RedrawCanvas(obj.canvas)

            if (numFrame-- > 0) {
                RGraph.Effects.UpdateCanvas(FoldToCenter);
            } else if (typeof(callback) == 'function') {
                callback(obj);
            }
        }

        RGraph.Effects.UpdateCanvas(FoldToCenter);
    }


    /**
    * Odo Grow
    * 
    * This effect gradually increases the represented value
    * 
    * @param object   obj The chart object
    * @param              Not used - pass null
    * @param function     An optional callback function
    */
    RGraph.Effects.Odo.Grow = function (obj)
    {
        var numFrames = 30;
        var curFrame  = 0;
        var origValue = Number(obj.currentValue);
        var newValue  = obj.value;
        var diff      = newValue - origValue;
        var step      = (diff / numFrames);
        var callback  = arguments[2];

        function Grow_inner ()
        {
            obj.value = origValue + (curFrame * step);

            RGraph.Clear(obj.canvas);
            RGraph.RedrawCanvas(obj.canvas);

            if (++curFrame <= numFrames) {
                RGraph.Effects.UpdateCanvas(Grow_inner);
            } else if (callback) {
                callback(obj);
            }
        }
        
        //setTimeout(Grow, 100);
        RGraph.Effects.UpdateCanvas(Grow_inner);
    }


    /**
    * Meter Grow
    * 
    * This effect gradually increases the represented value
    * 
    * @param object   obj The chart object
    * @param              Not used - pass null
    * @param function     An optional callback function
    */
    RGraph.Effects.Meter.Grow = function (obj)
    {
        if (!obj.currentValue) {
            obj.currentValue = obj.min;
        }

        var totalFrames = 30;
        var numFrame    = 0;
        var diff        = obj.value - obj.currentValue;
        var step        = diff / totalFrames
        var callback    = arguments[2];
        var initial     = obj.currentValue;

        function Grow_meter_inner ()
        {
            obj.value = initial + (numFrame++ * step);

            RGraph.Clear(obj.canvas);
            RGraph.RedrawCanvas(obj.canvas);
        
            if (numFrame++ <= totalFrames) {
                RGraph.Effects.UpdateCanvas(Grow_meter_inner);
            } else if (typeof(callback) == 'function') {
                callback(obj);
            }
        }
        
        RGraph.Effects.UpdateCanvas(Grow_meter_inner);
    }


    /**
    * Grow
    * 
    * The HBar chart Grow effect gradually increases the values of the bars
    * 
    * @param object obj The graph object
    */
    RGraph.Effects.HBar.Grow = function (obj)
    {
        // Save the data
        obj.original_data = RGraph.array_clone(obj.data);
        
        // Zero the data
        obj.__animation_frame__ = 0;

        // Stop the scale from changing by setting chart.ymax (if it's not already set)
        if (obj.Get('chart.xmax') == 0) {

            var xmax = 0;

            for (var i=0; i<obj.data.length; ++i) {
                if (RGraph.is_array(obj.data[i]) && obj.Get('chart.grouping') == 'stacked') {
                    xmax = Math.max(xmax, RGraph.array_sum(obj.data[i]));
                } else if (RGraph.is_array(obj.data[i]) && obj.Get('chart.grouping') == 'grouped') {
                    xmax = Math.max(xmax, RGraph.array_max(obj.data[i]));
                } else {
                    xmax = Math.max(xmax, RGraph.array_max(obj.data[i]));
                }
            }

            xmax = RGraph.getScale(xmax)[4];
            
            obj.Set('chart.xmax', xmax);
        }
        
        /**
        * Turn off shadow blur for the duration of the animation
        */
        if (obj.Get('chart.shadow.blur') > 0) {
            var __original_shadow_blur__ = obj.Get('chart.shadow.blur');
            obj.Set('chart.shadow.blur', 0);
        }

        function Grow ()
        {
            var numFrames = 30;

            if (!obj.__animation_frame__) {
                obj.__animation_frame__  = 0;
                obj.__original_vmargin__ = obj.Get('chart.vmargin');
                obj.__vmargin__          = ((obj.canvas.height - obj.Get('chart.gutter.top') - obj.Get('chart.gutter.bottom')) / obj.data.length) / 2;
                obj.Set('chart.vmargin', obj.__vmargin__);
            }

            // Alter the Bar chart data depending on the frame
            for (var j=0; j<obj.original_data.length; ++j) {
                
                // This stops the animatioon from being completely linear
                var easing = Math.pow(Math.sin((obj.__animation_frame__ * (90 / numFrames)) / (180 / Math.PI)), 4);

                if (typeof(obj.data[j]) == 'object') {
                    for (var k=0; k<obj.data[j].length; ++k) {
                        obj.data[j][k] = (obj.__animation_frame__ / numFrames) * obj.original_data[j][k] * easing;
                    }
                } else {
                    obj.data[j] = (obj.__animation_frame__ / numFrames) * obj.original_data[j] * easing;
                }
            }

            /**
            * Increment the vmargin to the target
            */
            obj.Set('chart.vmargin', ((1 - (obj.__animation_frame__ / numFrames)) * (obj.__vmargin__ - obj.__original_vmargin__)) + obj.__original_vmargin__);


            RGraph.Clear(obj.canvas);
            RGraph.RedrawCanvas(obj.canvas);

            if (obj.__animation_frame__ < numFrames) {
                obj.__animation_frame__ += 1;
                
                RGraph.Effects.UpdateCanvas(Grow);
            
            // Turn any shadow blur back on
            } else {
                if (typeof(__original_shadow_blur__) == 'number' && __original_shadow_blur__ > 0) {
                    obj.Set('chart.shadow.blur', __original_shadow_blur__);
                    RGraph.Clear(obj.canvas);
                    RGraph.RedrawCanvas(obj.canvas);
                }
            }
        }
        
        RGraph.Effects.UpdateCanvas(Grow);
    }


    /**
    * Trace
    * 
    * This effect is for the Line chart, uses the jQuery library and slowly
    * uncovers the Line , but you can see the background of the chart. This effect
    * is quite new (1/10/2011) and as such should be used with caution.
    * 
    * @param object obj The graph object
    * @param object     Not used
    * @param int        A number denoting how long (in millseconds) the animation should last for. Defauld
    *                   is 1500
    */
    RGraph.Effects.Line.jQuery.Trace = function (obj)
    {
        RGraph.Clear(obj.canvas);
        //obj.Draw();
        RGraph.RedrawCanvas(obj.canvas);

        /**
        * Create the DIV that the second canvas will sit in
        */
        var div = document.createElement('DIV');
            var xy = RGraph.getCanvasXY(obj.canvas);
            div.id = '__rgraph_trace_animation_' + RGraph.random(0, 4351623) + '__';
            div.style.left = xy[0] + 'px';
            div.style.top = xy[1] + 'px';
            div.style.width = obj.Get('chart.gutter.left');
            div.style.height = obj.canvas.height + 'px';
            div.style.position = 'absolute';
            div.style.overflow = 'hidden';
        document.body.appendChild(div);
        
        /**
        * Make the second canvas
        */
        var id      = '__rgraph_line_reveal_animation_' + RGraph.random(0, 99999999) + '__';
        var canvas2 = document.createElement('CANVAS');
        canvas2.width = obj.canvas.width;
        canvas2.height = obj.canvas.height;
        canvas2.style.position = 'absolute';
        canvas2.style.left = 0;
        canvas2.style.top  = 0;

        canvas2.id         = id;
        div.appendChild(canvas2);
        
        var reposition_canvas2 = function (e)
        {
            var xy = RGraph.getCanvasXY(obj.canvas);
            
            div.style.left = xy[0] + 'px';
            div.style.top = xy[1] + 'px';
        }
        window.addEventListener('resize', reposition_canvas2, false)
        
        /**
        * Make a copy of the original Line object
        */
        var obj2 = new RGraph.Line(id, RGraph.array_clone(obj.original_data));
        
        // Remove the new line from the ObjectRegistry so that it isn't redawn
        RGraph.ObjectRegistry.Remove(obj2);

        for (i in obj.properties) {
            if (typeof(i) == 'string') {
                obj2.Set(i, obj.properties[i]);
            }
        }

        //obj2.Set('chart.tooltips', null);
        obj2.Set('chart.labels', []);
        obj2.Set('chart.background.grid', false);
        obj2.Set('chart.ylabels', false);
        obj2.Set('chart.noaxes', true);
        obj2.Set('chart.title', '');
        obj2.Set('chart.title.xaxis', '');
        obj2.Set('chart.title.yaxis', '');
        obj2.Set('chart.filled.accumulative', obj.Get('chart.filled.accumulative'));
        obj.Set('chart.key', []);
        obj2.Draw();


        /**
        * This effectively hides the line
        */
        obj.Set('chart.line.visible', false);
        obj.Set('chart.colors', ['rgba(0,0,0,0)']);
        if (obj.Get('chart.filled')) {
            var original_fillstyle = obj.Get('chart.fillstyle');
            obj.Set('chart.fillstyle', 'rgba(0,0,0,0)');
        }

        RGraph.Clear(obj.canvas);
        //obj.Draw();
        RGraph.RedrawCanvas(obj.canvas);
        
        /**
        * Place a DIV over the canvas to stop interaction with it
        */
        var div2 = document.createElement('DIV');
            div2.id = '__rgraph_trace_animation_' + RGraph.random(0, 4351623) + '__';
            div2.style.left = xy[0] + 'px';
            div2.style.top = xy[1] + 'px';
            div2.style.width = obj.canvas.width + 'px';
            div2.style.height = obj.canvas.height + 'px';
            div2.style.position = 'absolute';
            div2.style.overflow = 'hidden';
            div2.style.backgroundColor = 'rgba(0,0,0,0)';
            div.div2 = div2;
            obj.canvas.__rgraph_trace_cover__ = div2
        document.body.appendChild(div2);

        /**
        * Animate the DIV that contains the canvas
        */
        $('#' + div.id).animate({
            width: obj.canvas.width + 'px'
        }, arguments[2] ? arguments[2] : 1500, function () {RGraph.Effects.Line.Trace_callback()});


        /**
        * Get rid of the second canvas and turn the line back on
        * on the original.
        */
        RGraph.Effects.Line.Trace_callback = function ()
        {

            // Remove the window resize listener
            window.removeEventListener('resize', reposition_canvas2, false);

            div.parentNode.removeChild(div);
            document.body.removeChild(div2);

            div.removeChild(canvas2);
            obj.Set('chart.line.visible', true);
            
            // Revert the filled status back to as it was
            obj.Set('chart.filled', RGraph.array_clone(obj2.Get('chart.filled')));
            obj.Set('chart.fillstyle', original_fillstyle);
            obj.Set('chart.colors', RGraph.array_clone(obj2.Get('chart.colors')));
            obj.Set('chart.key', RGraph.array_clone(obj2.Get('chart.key')));

            RGraph.RedrawCanvas(obj.canvas);
            
            obj.canvas.__rgraph_trace_cover__ = null;
        }
    }



    /**
    * RoundRobin
    * 
    * This effect does two things:
    *  1. Gradually increases the size of each segment
    *  2. Gradually increases the size of the radius from 0
    * 
    * @param object obj The graph object
    */
    RGraph.Effects.Pie.RoundRobin = function (obj)
    {
        var callback     = arguments[2] ? arguments[2] : null;
        var opt          = arguments[1];
        var currentFrame = 0;
        var numFrames    = 60;
        var targetRadius =  obj.getRadius();

        function RoundRobin_inner ()
        {
            obj.Set('chart.effect.roundrobin.multiplier', Math.pow(Math.sin((currentFrame * (90 / numFrames)) / (180 / Math.PI)), 2) * (currentFrame / numFrames) );

            if (!opt || opt['radius']) {
                obj.Set('chart.radius', targetRadius * obj.Get('chart.effect.roundrobin.multiplier'));
            }
            
            RGraph.RedrawCanvas(obj.canvas);

            if (currentFrame++ < numFrames) {
                RGraph.Effects.UpdateCanvas(RoundRobin_inner);
            
            } else if (callback) {
                callback(obj);
            }
        }

        RGraph.Effects.UpdateCanvas(RoundRobin_inner);
    }


    /**
    * Implode (pie chart)
    * 
    * Here the segments are initially exploded - and gradually
    * contract inwards to create the Pie chart
    * 
    * @param object obj The Pie chart object
    */
    RGraph.Effects.Pie.Implode = function (obj)
    {
        var numFrames = 90;
        var distance = Math.min(obj.canvas.width, obj.canvas.height);
        
        function Implode_inner ()
        {
            obj.Set('chart.exploded', Math.sin(numFrames / 57.3) * distance);
            RGraph.Clear(obj.canvas)
            //obj.Draw();
            RGraph.RedrawCanvas(obj.canvas);

            if (numFrames > 0) {
                numFrames--;
                RGraph.Effects.UpdateCanvas(Implode_inner);
            } else {
                // Finish off the animation
                obj.Set('chart.exploded', 0);
                RGraph.Clear(obj.canvas);
                RGraph.RedrawCanvas(obj.canvas);
            }
        }
        
        RGraph.Effects.UpdateCanvas(Implode_inner);
    }



    /**
    * Pie chart explode
    * 
    * Explodes the Pie chart - gradually incrementing the size of the chart.explode property
    * 
    * @params object obj The graph object
    */
    RGraph.Effects.Pie.Explode = function (obj)
    {
        var canvas   = obj.canvas;
        var opts     = arguments[1] ? arguments[1] : [];
        var callback = arguments[2] ? arguments[2] : null;
        var frames   = opts['frames'] ? opts['frames'] : 60;

        obj.Set('chart.exploded', 0);

        RGraph.Effects.Animate(obj, {'frames': frames, 'chart.exploded': Math.max(canvas.width, canvas.height)}, callback);
    }



    /**
    * Gauge Grow
    * 
    * This effect gradually increases the represented value
    * 
    * @param object   obj The chart object
    * @param              Not used - pass null
    * @param function     An optional callback function
    */
    RGraph.Effects.Gauge.Grow = function (obj)
    {
        var callback  = arguments[2];
        var numFrames = 30;
        var origValue = Number(obj.currentValue);
        
        if (obj.currentValue == null) {
            obj.currentValue = obj.min;
            origValue = obj.min;
        }

        var newValue  = obj.value;
        var diff      = newValue - origValue;
        var step      = (diff / numFrames);
        var frame     = 0;


        function Grow ()
        {
            frame++;

            obj.value = ((frame / numFrames) * diff) + origValue
    
            if (obj.value > obj.max) {
                obj.value = obj.max;
            }
    
            if (obj.value < obj.min) {
                obj.value = obj.min;
            }

            RGraph.Clear(obj.canvas);
            RGraph.RedrawCanvas(obj.canvas);

            if (frame < 30) {
                RGraph.Effects.UpdateCanvas(Grow);
            } else if (typeof(callback) == 'function') {
                callback(obj);
            }
        }

        RGraph.Effects.UpdateCanvas(Grow);
    }


    /**
    * Radar chart grow
    * 
    * This effect gradually increases the magnitude of the points on the radar chart
    * 
    * @param object obj The chart object
    * @param null       Not used
    * @param function   An optional callback that is run when the effect is finished
    */
    RGraph.Effects.Radar.Grow = function (obj)
    {
        var totalframes   = 30;
        var framenum      = totalframes;
        var data          = RGraph.array_clone(obj.data);
        var callback      = arguments[2];
        obj.original_data = RGraph.array_clone(obj.original_data);

        function Grow_inner ()
        {
            for (var i=0; i<data.length; ++i) {
                
                if (obj.original_data[i] == null) {
                    obj.original_data[i] = [];
                }

                for (var j=0; j<data[i].length; ++j) {
                    obj.original_data[i][j] = ((totalframes - framenum)/totalframes)  * data[i][j];
                }
            }

            RGraph.Clear(obj.canvas);
            RGraph.RedrawCanvas(obj.canvas);

            if (framenum > 0) {
                framenum--;
                RGraph.Effects.UpdateCanvas(Grow_inner);
            } else if (typeof(callback) == 'function') {
                callback(obj);
            }
        }
        
        RGraph.Effects.UpdateCanvas(Grow_inner);
    }


    /**
    * Waterfall Grow
    * 
    * @param object obj The chart object
    * @param null Not used
    * @param function An optional function which is called when the animation is finished
    */
    RGraph.Effects.Waterfall.Grow = function (obj)
    {
        var totalFrames = 45;
        var numFrame    = 0;
        var data = RGraph.array_clone(obj.data);
        var callback = arguments[2];
        
        //Reset The data to zeros
        for (var i=0; i<obj.data.length; ++i) {
            obj.data[i] /= totalFrames;
            
        }
        
        /**
        * Fix the scale
        */
        if (obj.Get('chart.ymax') == null) {
            var max = RGraph.getScale(obj.getMax(data))[4]
            obj.Set('chart.ymax', max);
        }
        
        obj.Set('chart.multiplier.x', 0);
        obj.Set('chart.multiplier.w', 0);

        function Grow_inner ()
        {
            for (var i=0; i<obj.data.length; ++i) {
                obj.data[i] = data[i] * (numFrame/totalFrames);
            }
            
            var multiplier = Math.pow(Math.sin(((numFrame / totalFrames) * 90) / 57.3), 20);
            obj.Set('chart.multiplier.x', (numFrame / totalFrames) * multiplier);
            obj.Set('chart.multiplier.w', (numFrame / totalFrames) * multiplier);
            
            RGraph.Clear(obj.canvas);
            RGraph.RedrawCanvas(obj.canvas);

            if (numFrame++ < totalFrames) {
                RGraph.Effects.UpdateCanvas(Grow_inner);
            } else if (typeof(callback) == 'function') {
                callback(obj);
            }
        }
        
        RGraph.Effects.UpdateCanvas(Grow_inner)
    }



    /**
    * Bar chart Wave effect
    * 
    * @param object obj The chart object
    */
    RGraph.Effects.Bar.Wave = function (obj)
    {
        var callback = arguments[2] ? arguments[2] : null;

        var max = 0;
        for (var i=0; i<obj.data.length; ++i) {
            if (typeof(obj.data[i]) == 'number') {
                max = Math.max(max, Math.abs(obj.data[i]))
            } else {
                if (obj.Get('chart.grouping') == 'stacked') {
                    max = Math.max(max, Math.abs(RGraph.array_sum(obj.data[i])))
                } else {
                    max = Math.max(max, Math.abs(RGraph.array_max(obj.data[i])))
                }
            }
        }

        var scale = RGraph.getScale(max, obj);
        obj.Set('chart.ymax', scale[4]);

        original_bar_data = RGraph.array_clone(obj.data);
        __rgraph_bar_wave_object__ = obj;
    
        // Zero all the bars
        for (var i=0; i<obj.data.length; ++i) {
             if (typeof(obj.data[i]) == 'number') {
                obj.data[i] = 0;
             } else {
                obj.data[i] = new Array(obj.data[i].length);
             }
             
             var totalFrames = 25;
             var delay       = 25;
             
            setTimeout('RGraph.Effects.Bar.Wave_inner(' + i + ', ' + totalFrames + ', ' + delay + ')', i * 150);
        }
    
        RGraph.Effects.Bar.Wave_inner = function  (idx, totalFrames, delay)
        {
            // Touch this at your peril...!
            for (var k=0; k<=totalFrames; ++k) {
                setTimeout('RGraph.Effects.Bar.Wave_inner_iterator(__rgraph_bar_wave_object__, '+idx+', '+(k / totalFrames)+');', delay * k);
            }
        }
        
        setTimeout(callback, (i * 150) + (totalFrames * delay), totalFrames, delay);
    }
    
    
    RGraph.Effects.Bar.Wave_inner_iterator = function (obj, idx, factor)
    {
        if (typeof(obj.data[idx]) == 'number') {
            obj.data[idx] = original_bar_data[idx] * factor;
        } else {
            for (var i=0; i<obj.data[idx].length; ++i) {
                obj.data[idx][i] = factor * original_bar_data[idx][i];
            }
        }
        
        RGraph.Clear(obj.canvas);
        //obj.Draw();
        RGraph.RedrawCanvas(obj.canvas);
    }


    /**
    * HProgress Grow effect
    * 
    * @param object obj The chart object
    */
    RGraph.Effects.HProgress.Grow = function (obj)
    {
        var canvas        = obj.canvas;
        var context       = obj.context;
        var initial_value = obj.currentValue;
        var diff          = obj.value - Number(obj.currentValue);
        var numFrames     = 30;
        var currentFrame  = 0
        var increment     = diff  / numFrames;
        var callback      = arguments[2] ? arguments[2] : null;

        function Grow_hprogress_inner ()
        {
            currentFrame++;

            if (currentFrame <= numFrames) {
                
                obj.value = initial_value + (increment * currentFrame);
                
                RGraph.Clear(obj.canvas);
                RGraph.RedrawCanvas(obj.canvas);
                
                RGraph.Effects.UpdateCanvas(Grow_hprogress_inner);

            } else if (callback) {
                callback(obj);
            }
        }
        
        RGraph.Effects.UpdateCanvas(Grow_hprogress_inner);
    }


    /**
    * VProgress Grow effect
    * 
    * @param object obj The chart object
    */
    RGraph.Effects.VProgress.Grow = function (obj)
    {
        var initial_value = obj.currentValue;
        var diff         = obj.value - Number(obj.currentValue);
        var numFrames    = 30;
        var currentFrame = 0
        var increment    = diff  / numFrames;
        var callback     = arguments[2] ? arguments[2] : null;

        function Grow_vprogress_inner ()
        {
            currentFrame++;

            if (currentFrame <= 30) {
                obj.value = initial_value + (increment * currentFrame);
                RGraph.Clear(obj.canvas);
                RGraph.RedrawCanvas(obj.canvas);
                
                RGraph.Effects.UpdateCanvas(Grow_vprogress_inner);

            } else if (callback) {
                callback(obj);
            }
        }
        
        RGraph.Effects.UpdateCanvas(Grow_vprogress_inner);
    }


    /**
    * Pie chart Wave
    * 
    * This is the Pie chart version of the Wave effect.
    * 
    * @param object obj The chart object
    */        
    RGraph.Effects.Pie.Wave = function (obj)
    {
        obj.original_data = RGraph.array_clone(obj.data);

        // Zero all the bars
        for (var i=0; i<obj.data.length; ++i) {
            obj.data[i] = 0;
            setTimeout('RGraph.Effects.Pie.Wave_inner("' + obj.uid + '", ' + i + ')', i * 100);
        }

        RGraph.Effects.Pie.Wave_inner = function  (uid, idx)
        {
            var obj = RGraph.ObjectRegistry.getObjectByUID(uid);
            var totalFrames = 25;

            // Touch this at your peril...!
            for (var k=0; k<=totalFrames; ++k) {
                setTimeout('RGraph.Effects.Pie.Wave_inner_iterator("' + obj.uid + '", '+idx+', '+(k / totalFrames)+');', 20 * k);
            }
        }

        RGraph.Effects.Pie.Wave_inner_iterator = function (uid, idx, factor)
        {
            var obj = RGraph.ObjectRegistry.getObjectByUID(uid);
            obj.data[idx] = obj.original_data[idx] * factor;
            
            RGraph.Clear(obj.canvas);
            RGraph.RedrawCanvas(obj.canvas);
        }
    }


    /**
    * Bar chart Wave2 effect - using the requestAnimationFrame function
    * 
    * @param object obj The chart object
    */
    RGraph.Effects.Bar.Wave2 = function (obj)
    {
        var callback = arguments[2] ? arguments[2] : null;
    
        var max = 0;
        for (var i=0; i<obj.data.length; ++i) {
            if (typeof(obj.data[i]) == 'number') {
                max = Math.max(max, Math.abs(obj.data[i]))
            } else {
                if (obj.Get('chart.grouping') == 'stacked') {
                    max = Math.max(max, Math.abs(RGraph.array_sum(obj.data[i])))
                } else {
                    max = Math.max(max, Math.abs(RGraph.array_max(obj.data[i])))
                }
            }
        }
        var scale = RGraph.getScale(max, obj);
        obj.Set('chart.ymax', scale[4]);
        
        original_bar_data = RGraph.array_clone(obj.data);
        __rgraph_bar_wave_object__ = obj;
    
        /**
        * Zero all the bars
        */
        for (var i=0; i<obj.data.length; ++i) {
             if (typeof(obj.data[i]) == 'number') {
                obj.data[i] = 0;
             } else {
                obj.data[i] = new Array(obj.data[i].length);
             }
             
            setTimeout('a = new RGraph.Effects.Bar.Wave2.Iterator(__rgraph_bar_wave_object__, ' + i + ', 45); a.Animate();', i * 150);
        }
    }

    
    /**
    * The Iterator object that handles the individual animation frames
    */
    RGraph.Effects.Bar.Wave2.Iterator = function (obj, idx, frames)
    {
        this.obj    = obj;
        this.idx    = idx;
        this.frames = frames;
        this.curFrame = 0;
    }

    RGraph.Effects.Bar.Wave2.Iterator.prototype.Animate = function ()
    {
        if (typeof(this.obj.data[this.idx]) == 'number') {
            this.obj.data[this.idx] = (this.curFrame / this.frames) * original_bar_data[this.idx];
        } else if (typeof(this.obj.data[this.idx]) == 'object') {
            for (var j=0; j<this.obj.data[this.idx].length; ++j) {
                this.obj.data[this.idx][j] = (this.curFrame / this.frames) * original_bar_data[this.idx][j];
            }
        }
    
        RGraph.RedrawCanvas(this.obj.canvas);
        
        if (this.curFrame < this.frames) {
            
            this.curFrame += 1;
    
            RGraph.Effects.UpdateCanvas(this.Animate.bind(this));
        }
    }


    /**
    * Gantt chart Grow effect
    * 
    * @param object obj The chart object
    */
    RGraph.Effects.Gantt.Grow = function (obj)
    {
        var canvas       = obj.canvas;
        var context      = obj.context;
        var numFrames    = 30;
        var currentFrame = 0;
        var callback     = arguments[2] ? arguments[2] : null;
        var events       = obj.Get('chart.events');
        
        var original_events = RGraph.array_clone(events);

        function Grow_gantt_inner ()
        {
            if (currentFrame <= numFrames) {
                // Update the events
                for (var i=0; i<events.length; ++i) {
                    if (typeof(events[i][0]) == 'object') {
                        for (var j=0; j<events[i].length; ++j) {
                            events[i][j][1] = (currentFrame / numFrames) * original_events[i][j][1];
                        }
                    } else {

                        events[i][1] = (currentFrame / numFrames) * original_events[i][1];
                    }
                }

                obj.Set('chart.events', events);

                RGraph.Clear(obj.canvas);
                RGraph.RedrawCanvas(obj.canvas);
                
                currentFrame++;
                
                RGraph.Effects.UpdateCanvas(Grow_gantt_inner);

            } else if (callback) {            
                callback(obj);
            }
        }
        
        RGraph.Effects.UpdateCanvas(Grow_gantt_inner);
    }


    /**
    * This is a compatibility hack provided for Opera and Safari which
    * don't support ther Javascript 1.8.5 function.bind()
    */
    if (!Function.prototype.bind) {  
      Function.prototype.bind = function (oThis) {  
        if (typeof this !== "function") {  
          // closest thing possible to the ECMAScript 5 internal IsCallable function  
          throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");  
        }  
      
        var aArgs = Array.prototype.slice.call(arguments, 1),   
            fToBind = this,   
            fNOP = function () {},  
            fBound = function () {  
              return fToBind.apply(this instanceof fNOP  
                                     ? this  
                                     : oThis || window,  
                                   aArgs.concat(Array.prototype.slice.call(arguments)));  
            };  
      
        fNOP.prototype = this.prototype;  
        fBound.prototype = new fNOP();  
      
        return fBound;  
      };  
    }


    /**
    * Rose chart explode
    * 
    * Explodes the Rose chart - gradually incrementing the size of the chart.explode property
    * 
    * @params object obj The graph object
    */
    RGraph.Effects.Rose.Explode = function (obj)
    {
        var canvas   = obj.canvas;
        var opts     = arguments[1] ? arguments[1] : [];
        var callback = arguments[2] ? arguments[2] : null;
        var frames   = opts['frames'] ? opts['frames'] : 60;

        obj.Set('chart.exploded', 0);

        RGraph.Effects.Animate(obj, {'frames': frames, 'chart.exploded': Math.min(canvas.width, canvas.height)}, callback);
    }


    /**
    * Rose chart implode
    * 
    * Implodes the Rose chart - gradually decreasing the size of the chart.explode property. It starts at the largest of
    * the canvas width./height
    * 
    * @params object obj The graph object
    */
    RGraph.Effects.Rose.Implode = function (obj)
    {
        var canvas   = obj.canvas;
        var opts     = arguments[1] ? arguments[1] : [];
        var callback = arguments[2] ? arguments[2] : null;
        var frames   = opts['frames'] ? opts['frames'] : 60;

        obj.Set('chart.exploded', Math.min(canvas.width, canvas.height));

        RGraph.Effects.Animate(obj, {'frames': frames, 'chart.exploded': 0}, callback);
    }



    /**
    * Gauge Grow
    * 
    * This effect gradually increases the represented value
    * 
    * @param object   obj The chart object
    * @param              Not used - pass null
    * @param function     An optional callback function
    */
    RGraph.Effects.Thermometer.Grow = function (obj)
    {
        var callback  = arguments[2];
        var numFrames = 30;
        var origValue = Number(obj.currentValue);

        if (obj.currentValue == null) {
            obj.currentValue = 0
            origValue        = 0;
        }

        var newValue  = obj.value;
        var diff      = newValue - origValue;
        var step      = (diff / numFrames);
        var frame = 0;

        function Grow ()
        {
            frame++
            
            // Set the new value
            obj.value = v = ((frame / numFrames) * diff) + origValue

            RGraph.Clear(obj.canvas);
            RGraph.RedrawCanvas(obj.canvas);

            if (frame < 30) {
                RGraph.Effects.UpdateCanvas(Grow);
            } else if (typeof(callback) == 'function') {
                callback(obj);
            }
        }

        RGraph.Effects.UpdateCanvas(Grow);
    }

/**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/LICENSE.txt                       |
    * o------------------------------------------------------------------------------o
    */
    
    if (typeof(RGraph) == 'undefined') RGraph = {};

    /**
    * Draws the graph key (used by various graphs)
    * 
    * @param object obj The graph object
    * @param array  key An array of the texts to be listed in the key
    * @param colors An array of the colors to be used
    */
    RGraph.DrawKey = function (obj, key, colors)
    {
        var canvas  = obj.canvas;
        var context = obj.context;
        context.lineWidth = 1;

        context.beginPath();

        /**
        * Key positioned in the gutter
        */
        var keypos   = obj.Get('chart.key.position');
        var textsize = obj.Get('chart.text.size');
        
        /**
        * Change the older chart.key.vpos to chart.key.position.y
        */
        if (typeof(obj.Get('chart.key.vpos')) == 'number') {
            obj.Set('chart.key.position.y', obj.Get('chart.key.vpos') * this.Get('chart.gutter.top') );
        }

        /**
        * Account for null values in the key
        */
        var key_non_null    = [];
        var colors_non_null = [];
        for (var i=0; i<key.length; ++i) {
            if (key[i] != null) {
                colors_non_null.push(colors[i]);
                key_non_null.push(key[i]);
            }
        }
        
        key    = key_non_null;
        colors = colors_non_null;



        if (keypos && keypos == 'gutter') {
    
            RGraph.DrawKey_gutter(obj, key, colors);


        /**
        * In-graph style key
        */
        } else if (keypos && keypos == 'graph') {

            RGraph.DrawKey_graph(obj, key, colors);
        
        } else {
            alert('[COMMON] (' + obj.id + ') Unknown key position: ' + keypos);
        }
    }





    /**
    * This does the actual drawing of the key when it's in the graph
    * 
    * @param object obj The graph object
    * @param array  key The key items to draw
    * @param array colors An aray of colors that the key will use
    */
    RGraph.DrawKey_graph = function (obj, key, colors)
    {
        var canvas      = obj.canvas;
        var context     = obj.context;
        var text_size   = typeof(obj.Get('chart.key.text.size')) == 'number' ? obj.Get('chart.key.text.size') : obj.Get('chart.text.size');
        var text_font   = obj.Get('chart.text.font');
        
        var gutterLeft   = obj.Get('chart.gutter.left');
        var gutterRight  = obj.Get('chart.gutter.right');
        var gutterTop    = obj.Get('chart.gutter.top');
        var gutterBottom = obj.Get('chart.gutter.bottom');

        var hpos        = obj.Get('chart.yaxispos') == 'right' ? gutterLeft + 10 : RGraph.GetWidth(obj) - gutterRight - 10;
        var vpos        = gutterTop + 10;
        var title       = obj.Get('chart.title');
        var blob_size   = text_size; // The blob of color
        var hmargin      = 8; // This is the size of the gaps between the blob of color and the text
        var vmargin      = 4; // This is the vertical margin of the key
        var fillstyle    = obj.Get('chart.key.background');
        var strokestyle  = '#333';
        var height       = 0;
        var width        = 0;

        if (!obj.coords) obj.coords = {};
        obj.coords.key = [];


        // Need to set this so that measuring the text works out OK
        context.font = text_size + 'pt ' + obj.Get('chart.text.font');

        // Work out the longest bit of text
        for (i=0; i<key.length; ++i) {
            width = Math.max(width, context.measureText(key[i]).width);
        }

        width += 5;
        width += blob_size;
        width += 5;
        width += 5;
        width += 5;

        /**
        * Now we know the width, we can move the key left more accurately
        */
        if (   obj.Get('chart.yaxispos') == 'left'
            || (obj.type == 'pie' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'hbar' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'hbar' && obj.Get('chart.yaxispos') == 'center')
            || (obj.type == 'rscatter' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'radar' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'rose' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'funnel' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'vprogress' && !obj.Get('chart.yaxispos'))
            || (obj.type == 'hprogress' && !obj.Get('chart.yaxispos'))
           ) {

            hpos -= width;
        }

        /**
        * Horizontal alignment
        */
        if (typeof(obj.Get('chart.key.halign')) == 'string') {
            if (obj.Get('chart.key.halign') == 'left') {
                hpos = gutterLeft + 10;
            } else if (obj.Get('chart.key.halign') == 'right') {
                hpos = RGraph.GetWidth(obj) - gutterRight  - width;
            }
        }

        /**
        * Specific location coordinates
        */
        if (typeof(obj.Get('chart.key.position.x')) == 'number') {
            hpos = obj.Get('chart.key.position.x');
        }
        
        if (typeof(obj.Get('chart.key.position.y')) == 'number') {
            vpos = obj.Get('chart.key.position.y');
        }


        // Stipulate the shadow for the key box
        if (obj.Get('chart.key.shadow')) {
            context.shadowColor   = obj.Get('chart.key.shadow.color');
            context.shadowBlur    = obj.Get('chart.key.shadow.blur');
            context.shadowOffsetX = obj.Get('chart.key.shadow.offsetx');
            context.shadowOffsetY = obj.Get('chart.key.shadow.offsety');
        }




        // Draw the box that the key resides in
        context.beginPath();
            context.fillStyle   = obj.Get('chart.key.background');
            context.strokeStyle = 'black';


        if (arguments[3] != false) {

            context.lineWidth = typeof(obj.Get('chart.key.linewidth')) == 'number' ? obj.Get('chart.key.linewidth') : 1;

            // The older square rectangled key
            if (obj.Get('chart.key.rounded') == true) {
                context.beginPath();
                    context.strokeStyle = strokestyle;
                    RGraph.strokedCurvyRect(context, AA(this, hpos), AA(this, vpos), width - 5, 5 + ( (text_size + 5) * RGraph.getKeyLength(key)),4);
        
                context.stroke();
                context.fill();
        
                RGraph.NoShadow(obj);
        
            } else {
                context.strokeRect(AA(this, hpos), AA(this, vpos), width - 5, 5 + ( (text_size + 5) * RGraph.getKeyLength(key)));
                context.fillRect(AA(this, hpos), AA(this, vpos), width - 5, 5 + ( (text_size + 5) * RGraph.getKeyLength(key)));
            }
        }

        RGraph.NoShadow(obj);

        context.beginPath();

            /**
            * Custom colors for the key
            */
            if (obj.Get('chart.key.colors')) {
                colors = obj.Get('chart.key.colors');
            }

            // Draw the labels given
            for (var i=key.length - 1; i>=0; i--) {
            
                var j = Number(i) + 1;

                // Draw the blob of color
                if (obj.Get('chart.key.color.shape') == 'circle') {
                    context.beginPath();
                        context.strokeStyle = 'rgba(0,0,0,0)';
                        context.fillStyle = colors[i];
                        context.arc(hpos + 5 + (blob_size / 2), vpos + (5 * j) + (text_size * j) - text_size + (blob_size / 2), blob_size / 2, 0, 6.26, 0);
                    context.fill();
                
                } else if (obj.Get('chart.key.color.shape') == 'line') {
                    context.beginPath();
                        context.strokeStyle = colors[i];
                        context.moveTo(hpos + 5, vpos + (5 * j) + (text_size * j) - text_size + (blob_size / 2));
                        context.lineTo(hpos + blob_size + 5, vpos + (5 * j) + (text_size * j) - text_size + (blob_size / 2));
                    context.stroke();

                } else {
                    context.fillStyle =  colors[i];
                    context.fillRect(hpos + 5, vpos + (5 * j) + (text_size * j) - text_size, text_size, text_size + 1);
                }

                context.beginPath();
            
                context.fillStyle = 'black';
            
                RGraph.Text(context,
                            text_font,
                            text_size,
                            hpos + blob_size + 5 + 5,
                            vpos + (5 * j) + (text_size * j),
                            key[i]);

                if (obj.Get('chart.key.interactive')) {
                
                    var px = hpos + 5;
                    var py = vpos + (5 * j) + (text_size * j) - text_size;
                    var pw = width - 5 - 5 - 5;
                    var ph = text_size;
                    
                    
                    obj.coords.key.push([px, py, pw, ph]);
                }

            }
        context.fill();

        /**
        * Install the interactivity event handler
        */
        if (obj.Get('chart.key.interactive')) {
        
            InteractiveKey_line_mousemove = function (e)
            {
                var objects = RGraph.ObjectRegistry.getObjectsByCanvasID(e.target.id);

                for (var i=0; i<objects.length; ++i) {
                
                    var obj = objects[i];

                    var mouseXY = RGraph.getMouseXY(e);
                    var mouseX  = mouseXY[0];
                    var mouseY  = mouseXY[1];

                    if (obj.coords.key && obj.coords.key.length) {
                        for (var i=0; i<obj.coords.key.length; ++i) {
                        
                            var px = obj.coords.key[i][0];
                            var py = obj.coords.key[i][1];
                            var pw = obj.coords.key[i][2];
                            var ph = obj.coords.key[i][3];

                            if (mouseX > (px-2) && mouseX < (px + pw + 2) && mouseY > (py - 2) && mouseY < (py + ph + 2) ) {
                                mouse_over_key = true;
                                return;
                            }
                            
                            mouse_over_key = false;
    
                            if (typeof(obj.Get('chart.tooltips')) == 'object' && typeof(canvas_onmousemove_func) == 'function') {
                                canvas_onmousemove_func(e);
                            }
                        }
                    }
                }
            }
        
        
            InteractiveKey_line_mouseup = function (e)
            {
                var obj = RGraph.ObjectRegistry.getObjectByXY(e);

                if (!RGraph.is_null(obj) && obj.type == 'line') {

                    var mouseXY = RGraph.getMouseXY(e);
                    var mouseX  = mouseXY[0];
                    var mouseY  = mouseXY[1];

                    RGraph.DrawKey(obj, obj.Get('chart.key'), obj.Get('chart.colors'));
            
                    for (var i=0; i<obj.coords.key.length; ++i) {
                    
                        var px = obj.coords.key[i][0];
                        var py = obj.coords.key[i][1];
                        var pw = obj.coords.key[i][2];
                        var ph = obj.coords.key[i][3];
            
                        if ( mouseX > (px - 2) && mouseX < (px + pw + 2) && mouseY > (py - 2) && mouseY < (py + ph + 2) ) {
    
                            /**
                            * Redraw the chart
                            */
                            RGraph.RedrawCanvas(obj.canvas);

                            var index = obj.coords.key.length - i - 1;

                            // Cover the canvas...
                            obj.context.beginPath();
                                obj.context.fillStyle = 'rgba(255,255,255,0.9)';
                                obj.context.fillRect(obj.Get('chart.gutter.left') + 1,obj.Get('chart.gutter.top'),obj.canvas.width, canvas.height - obj.Get('chart.gutter.bottom') - obj.Get('chart.gutter.top'));
                            obj.context.fill();

                            // ...and highlight the line
                            obj.context.beginPath();
                                if (obj.Get('chart.shadow')) {
                                    if (typeof(obj.Get('chart.shadow.color')) == 'string') {
                                        RGraph.SetShadow(obj, obj.Get('chart.shadow.color'), obj.Get('chart.shadow.offsetx'), obj.Get('chart.shadow.offsety'), obj.Get('chart.shadow.blur'));
                                    } else {
                                        RGraph.SetShadow(obj, obj.Get('chart.shadow.color')[obj.Get('chart.shadow.color').length - 1 - i], obj.Get('chart.shadow.offsetx'), obj.Get('chart.shadow.offsety'), obj.Get('chart.shadow.blur'));
                                    }
                                }

                                obj.context.strokeStyle = obj.Get('chart.colors')[index];
                                obj.context.lineWidth  = obj.Get('chart.linewidth');
                                if (obj.coords2 &&obj.coords2[index] &&obj.coords2[index].length) {
                                    for (var j=0; j<obj.coords2[index].length; ++j) {
                                        
                                        var x = obj.coords2[index][j][0];
                                        var y = obj.coords2[index][j][1];
                                    
                                        if (j == 0) {
                                            obj.context.moveTo(x, y);
                                        } else {
                                            obj.context.lineTo(x, y);
                                        }
                                    }
                                }
                            obj.context.stroke();
    
                            // Add the key highlight
                            obj.context.lineWidth  = 1;
                            obj.context.beginPath();
                                obj.context.strokeStyle = 'black';
                                obj.context.fillStyle   = 'white';
                                
                                RGraph.SetShadow(obj, 'rgba(0,0,0,0.5)', 0,0,10);
    
                                obj.context.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
                                obj.context.fillRect(px - 2, py - 2, pw + 4, ph + 4);
    
                            obj.context.stroke();
                            obj.context.fill();
    
    
                            RGraph.NoShadow(obj);
    
    
                            obj.context.beginPath();
                                obj.context.fillStyle = obj.Get('chart.colors')[index];
                                obj.context.fillRect(px, py, blob_size, blob_size);
                            obj.context.fill();
    
                            obj.context.beginPath();
                                obj.context.fillStyle = obj.Get('chart.text.color');
                            
                                RGraph.Text(obj.context,
                                            obj.Get('chart.text.font'),
                                            obj.Get('chart.text.size'),
                                            px + 5 + blob_size,
                                            py + ph,
                                            obj.Get('chart.key')[obj.Get('chart.key').length - i - 1]
                                           );
                            context.fill();
    
            
                            obj.canvas.style.cursor = 'pointer';
                            
                            e.cancelBubble = true;
                            e.stopPropagation();
                        }
                        
                        canvas.style.cursor = 'default';
                    }
                }
            }



            /**
            * Interactive key mouseup for the pie
            */
            InteractiveKey_pie_mousemove = function (e)
            {
                // Simply call the line chart key mousemove function as it's the same
                InteractiveKey_line_mousemove(e);
            }



            /**
            * This function handles the Pie chart interactive key (the click event)
            * 
            * @param object e The event object
            */
            InteractiveKey_pie_mouseup = function (e)
            {
                // MUST go through all of the objects as the keys could be placed anywhere on the
                // canvas - not just withing the gutter region
                var objects = RGraph.ObjectRegistry.objects.byCanvasID;

                for (var i=0; i<objects.length; ++i) {

                    if (objects[i][0] == e.target.id && objects[i][1].type == 'pie') {
                        
                        var obj = objects[i][1];

                        var mouseXY = RGraph.getMouseXY(e);
                        var mouseX  = mouseXY[0];
                        var mouseY  = mouseXY[1];
                        
                        for (var i=0; i<obj.coords.key.length; ++i) {

                            var index = obj.coords.key.length - i - 1;

                            var px = obj.coords.key[i][0];
                            var py = obj.coords.key[i][1];
                            var pw = obj.coords.key[i][2];
                            var ph = obj.coords.key[i][3];
    
                            if (mouseX >= (px - 2) && mouseX <= (px + pw + 2) && mouseY >= (py - 2) && mouseY <= (py + ph + 2)) {
                            
                                RGraph.RedrawCanvas(obj.canvas);

                                // First cover the canvas in a semi-transparent layer
                                obj.context.beginPath();
                                    obj.context.fillStyle = 'rgba(255,255,255,0.9)';
                                    obj.context.fillRect(0,0,obj.canvas.width,obj.canvas.height);
                                obj.context.fill();
                                
                                // Highllight the segment
                                var segment = obj.angles[index];
                                
                                obj.context.beginPath();
                                    RGraph.SetShadow(obj,'gray',0,0,15);
                                    obj.context.fillStyle = obj.Get('chart.colors')[index];
                                    obj.context.moveTo(obj.angles[index][2], obj.angles[index][3]);
                                    obj.context.arc(obj.angles[index][2], obj.angles[index][3], obj.radius, segment[0], segment[1], false);
                                obj.context.closePath();
                                obj.context.fill();

                                // Highlight the key
                                obj.context.lineWidth  = 1;
                                obj.context.beginPath();
                                    obj.context.strokeStyle = 'black';
                                    obj.context.fillStyle   = 'white';
                                    
                                    RGraph.SetShadow(obj, 'rgba(0,0,0,0.5)', 0,0,10);
        
                                    obj.context.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
                                    obj.context.fillRect(px - 2, py - 2, pw + 4, ph + 4);
                                obj.context.stroke();
                                obj.context.fill();
                                
                                // Turn off the shadow again
                                RGraph.NoShadow(obj);

                                // Add the blob of color
                                obj.context.beginPath();
                                    obj.context.fillStyle = obj.Get('chart.colors')[index];
                                    obj.context.fillRect(px, py, blob_size, blob_size);
                                obj.context.fill();
    
                                // And add the text
                                obj.context.beginPath();
                                    obj.context.fillStyle = obj.Get('chart.text.color');
                                
                                    RGraph.Text(obj.context,
                                                obj.Get('chart.text.font'),
                                                obj.Get('chart.text.size'),
                                                px + 5 + blob_size,
                                                py + ph,
                                                obj.Get('chart.key')[obj.Get('chart.key').length - i - 1]
                                               );
                                context.fill();

                                e.stopPropagation();
                                return;
                            }
                        }
                    }
                }
            }
        }
    }






    /**
    * This does the actual drawing of the key when it's in the gutter
    * 
    * @param object obj The graph object
    * @param array  key The key items to draw
    * @param array colors An aray of colors that the key will use
    */
    RGraph.DrawKey_gutter = function (obj, key, colors)
    {
        var canvas      = obj.canvas;
        var context     = obj.context;
        var text_size   = typeof(obj.Get('chart.key.text.size')) == 'number' ? obj.Get('chart.key.text.size') : obj.Get('chart.text.size');
        var text_font   = obj.Get('chart.text.font');
        
        var gutterLeft   = obj.Get('chart.gutter.left');
        var gutterRight  = obj.Get('chart.gutter.right');
        var gutterTop    = obj.Get('chart.gutter.top');
        var gutterBottom = obj.Get('chart.gutter.bottom');

        var hpos        = RGraph.GetWidth(obj) / 2;
        var vpos        = (gutterTop / 2) - 5;
        var title       = obj.Get('chart.title');
        var blob_size   = text_size; // The blob of color
        var hmargin      = 8; // This is the size of the gaps between the blob of color and the text
        var vmargin      = 4; // This is the vertical margin of the key
        var fillstyle   = obj.Get('chart.key.background');
        var strokestyle = 'black';
        var length      = 0;



        // Need to work out the length of the key first
        context.font = text_size + 'pt ' + text_font;
        for (i=0; i<key.length; ++i) {
            length += hmargin;
            length += blob_size;
            length += hmargin;
            length += context.measureText(key[i]).width;
        }
        length += hmargin;




        /**
        * Work out hpos since in the Pie it isn't necessarily dead center
        */
        if (obj.type == 'pie') {
            if (obj.Get('chart.align') == 'left') {
                var hpos = obj.radius + gutterLeft;
                
            } else if (obj.Get('chart.align') == 'right') {
                var hpos = obj.canvas.width - obj.radius - gutterRight;

            } else {
                hpos = canvas.width / 2;
            }
        }





        /**
        * This makes the key centered
        */  
        hpos -= (length / 2);


        /**
        * Override the horizontal/vertical positioning
        */
        if (typeof(obj.Get('chart.key.position.x')) == 'number') {
            hpos = obj.Get('chart.key.position.x');
        }
        if (typeof(obj.Get('chart.key.position.y')) == 'number') {
            vpos = obj.Get('chart.key.position.y');
        }



        /**
        * Draw the box that the key sits in
        */
        if (obj.Get('chart.key.position.gutter.boxed')) {

            if (obj.Get('chart.key.shadow')) {
                context.shadowColor   = obj.Get('chart.key.shadow.color');
                context.shadowBlur    = obj.Get('chart.key.shadow.blur');
                context.shadowOffsetX = obj.Get('chart.key.shadow.offsetx');
                context.shadowOffsetY = obj.Get('chart.key.shadow.offsety');
            }

            
            context.beginPath();
                context.fillStyle = fillstyle;
                context.strokeStyle = strokestyle;

                if (obj.Get('chart.key.rounded')) {
                    RGraph.strokedCurvyRect(context, hpos, vpos - vmargin, length, text_size + vmargin + vmargin)
                    // Odd... RGraph.filledCurvyRect(context, hpos, vpos - vmargin, length, text_size + vmargin + vmargin);
                } else {
                    context.strokeRect(hpos, vpos - vmargin, length, text_size + vmargin + vmargin);
                    context.fillRect(hpos, vpos - vmargin, length, text_size + vmargin + vmargin);
                }
                
            context.stroke();
            context.fill();


            RGraph.NoShadow(obj);
        }


        /**
        * Draw the blobs of color and the text
        */

        // Custom colors for the key
        if (obj.Get('chart.key.colors')) {
            colors = obj.Get('chart.key.colors');
        }

        for (var i=0, pos=hpos; i<key.length; ++i) {
            pos += hmargin;
            
            // Draw the blob of color - line
            if (obj.Get('chart.key.color.shape') =='line') {
                
                context.beginPath();
                    context.strokeStyle = colors[i];
                    context.moveTo(pos, vpos + (blob_size / 2));
                    context.lineTo(pos + blob_size, vpos + (blob_size / 2));
                context.stroke();
                
            // Circle
            } else if (obj.Get('chart.key.color.shape') == 'circle') {
                
                context.beginPath();
                    context.fillStyle = colors[i];
                    context.moveTo(pos, vpos + (blob_size / 2));
                    context.arc(pos + (blob_size / 2), vpos + (blob_size / 2), (blob_size / 2), 0, 6.28, 0);
                context.fill();


            } else {

                context.beginPath();
                    context.fillStyle = colors[i];
                    context.fillRect(pos, vpos, blob_size, blob_size);
                context.fill();
            }

            pos += blob_size;
            
            pos += hmargin;

            context.beginPath();
                context.fillStyle = 'black';
                RGraph.Text(context, text_font, text_size, pos, vpos + text_size - 1, key[i]);
            context.fill();
            pos += context.measureText(key[i]).width;
        }
    }
    
    
    /**
    * Returns the key length, but accounts for null values
    * 
    * @param array key The key elements
    */
    RGraph.getKeyLength = function (key)
    {
        var len = 0;

        for (var i=0; i<key.length; ++i) {
            if (key[i] != null) {
                ++len;
            }
        }

        return len;
    }

    /**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/LICENSE.txt                       |
    * o------------------------------------------------------------------------------o
    */

    if (typeof(RGraph) == 'undefined') RGraph = {isRGraph:true,type:'common'};
    
    /**
    * This is used in two functions, hence it's here
    */
    RGraph.Highlight          = {};
    RGraph.tooltips           = {};
    RGraph.tooltips.padding   = '3px';
    RGraph.tooltips.font_face = 'Tahoma';
    RGraph.tooltips.font_size = '10pt';


    /**
    * Shows a tooltip next to the mouse pointer
    * 
    * @param canvas object The canvas element object
    * @param text   string The tooltip text
    * @param int     x      The X position that the tooltip should appear at. Combined with the canvases offsetLeft
    *                       gives the absolute X position
    * @param int     y      The Y position the tooltip should appear at. Combined with the canvases offsetTop
    *                       gives the absolute Y position
    * @param int     idx    The index of the tooltip in the graph objects tooltip array
    */
    RGraph.Tooltip = function (obj, text, x, y, idx)
    {
        /**
        * chart.tooltip.override allows you to totally take control of rendering the tooltip yourself
        */
        if (typeof(obj.Get('chart.tooltips.override')) == 'function') {
            return obj.Get('chart.tooltips.override')(obj, text, x, y, idx);
        }
        
        /**
        * Save the X/Y coords
        */
        var originalX = x;
        var originalY = y;

        /**
        * This facilitates the "id:xxx" format
        */
        text = RGraph.getTooltipTextFromDIV(text);

        /**
        * First clear any exising timers
        */
        var timers = RGraph.Registry.Get('chart.tooltip.timers');

        if (timers && timers.length) {
            for (i=0; i<timers.length; ++i) {
                clearTimeout(timers[i]);
            }
        }
        RGraph.Registry.Set('chart.tooltip.timers', []);

        /**
        * Hide the context menu if it's currently shown
        */
        if (obj.Get('chart.contextmenu')) {
            RGraph.HideContext();
        }

        // Redraw the canvas?
        //if (obj.Get('chart.tooltips.highlight')) {
        //    RGraph.Redraw();
        //}
        var effect = obj.Get('chart.tooltips.effect').toLowerCase();

        if (effect == 'snap' && RGraph.Registry.Get('chart.tooltip') && RGraph.Registry.Get('chart.tooltip').__canvas__.id == obj.canvas.id) {

            if (   obj.type == 'line'
                || obj.type == 'radar'
                || obj.type == 'scatter'
                || obj.type == 'rscatter'
                ) {

                var tooltipObj = RGraph.Registry.Get('chart.tooltip');
                
        
                tooltipObj.style.width  = null;
                tooltipObj.style.height = null;
        
                tooltipObj.innerHTML = text;
                tooltipObj.__text__  = text;
        
                /**
                * Now that the new content has been set, re-set the width & height
                */
                RGraph.Registry.Get('chart.tooltip').style.width  = RGraph.getTooltipWidth(text, obj) + 'px';
                RGraph.Registry.Get('chart.tooltip').style.height = RGraph.Registry.Get('chart.tooltip').offsetHeight + 'px';

                /**
                * Now (25th September 2011) use jQuery if it's available
                */
                if (typeof(jQuery) == 'function' && typeof($) == 'function') {
                    $('#' + tooltipObj.id).animate({
                        opacity: 1,
                        width: tooltipObj.offsetWidth + 'px',
                        height: tooltipObj.offsetHeight + 'px',
                        left: x + 'px',
                        top: (y - tooltipObj.offsetHeight) + 'px'
                    }, 300);
                } else {
                    var currentx = parseInt(RGraph.Registry.Get('chart.tooltip').style.left);
                    var currenty = parseInt(RGraph.Registry.Get('chart.tooltip').style.top);
                
                    var diffx = x - currentx - ((x + RGraph.Registry.Get('chart.tooltip').offsetWidth) > document.body.offsetWidth ? RGraph.Registry.Get('chart.tooltip').offsetWidth : 0);
                    var diffy = y - currenty - RGraph.Registry.Get('chart.tooltip').offsetHeight;
                
                    // Position the tooltip
                    setTimeout('RGraph.Registry.Get("chart.tooltip").style.left = "' + (currentx + (diffx * 0.2)) + 'px"', 25);
                    setTimeout('RGraph.Registry.Get("chart.tooltip").style.left = "' + (currentx + (diffx * 0.4)) + 'px"', 50);
                    setTimeout('RGraph.Registry.Get("chart.tooltip").style.left = "' + (currentx + (diffx * 0.6)) + 'px"', 75);
                    setTimeout('RGraph.Registry.Get("chart.tooltip").style.left = "' + (currentx + (diffx * 0.8)) + 'px"', 100);
                    setTimeout('RGraph.Registry.Get("chart.tooltip").style.left = "' + (currentx + (diffx * 1.0)) + 'px"', 125);
                
                    setTimeout('RGraph.Registry.Get("chart.tooltip").style.top = "' + (currenty + (diffy * 0.2)) + 'px"', 25);
                    setTimeout('RGraph.Registry.Get("chart.tooltip").style.top = "' + (currenty + (diffy * 0.4)) + 'px"', 50);
                    setTimeout('RGraph.Registry.Get("chart.tooltip").style.top = "' + (currenty + (diffy * 0.6)) + 'px"', 75);
                    setTimeout('RGraph.Registry.Get("chart.tooltip").style.top = "' + (currenty + (diffy * 0.8)) + 'px"', 100);
                    setTimeout('RGraph.Registry.Get("chart.tooltip").style.top = "' + (currenty + (diffy * 1.0)) + 'px"', 125);
                }
            
            } else {
        
                alert('[TOOLTIPS] The "snap" effect is only supported on the Line, Rscatter, Scatter and Radar charts (tried to use it with type: ' + obj.type);
            }

            /**
            * Fire the tooltip event
            */
            RGraph.FireCustomEvent(obj, 'ontooltip');

            return;
        }



        /**
        * Show a tool tip
        */
        var tooltipObj  = document.createElement('DIV');
        tooltipObj.className             = obj.Get('chart.tooltips.css.class');
        tooltipObj.style.display         = 'none';
        tooltipObj.style.position        = 'absolute';
        tooltipObj.style.left            = 0;
        tooltipObj.style.top             = 0;
        tooltipObj.style.backgroundColor = 'rgba(255,255,239,0.9)';
        tooltipObj.style.color           = 'black';
        if (!document.all) tooltipObj.style.border = '';
        tooltipObj.style.visibility      = 'visible';
        tooltipObj.style.paddingLeft     = RGraph.tooltips.padding;
        tooltipObj.style.paddingRight    = RGraph.tooltips.padding;
        tooltipObj.style.fontFamily      = RGraph.tooltips.font_face;
        tooltipObj.style.fontSize        = RGraph.tooltips.font_size;
        tooltipObj.style.zIndex          = 3;
        tooltipObj.style.borderRadius       = '5px';
        tooltipObj.style.MozBorderRadius    = '5px';
        tooltipObj.style.WebkitBorderRadius = '5px';
        tooltipObj.style.WebkitBoxShadow    = 'rgba(96,96,96,0.5) 0 0 15px';
        tooltipObj.style.MozBoxShadow       = 'rgba(96,96,96,0.5) 0 0 15px';
        tooltipObj.style.boxShadow          = 'rgba(96,96,96,0.5) 0 0 15px';
        tooltipObj.style.filter             = 'progid:DXImageTransform.Microsoft.Shadow(color=#666666,direction=135)';
        tooltipObj.style.opacity            = 0;
        tooltipObj.style.overflow           = 'hidden';
        tooltipObj.innerHTML                = text;
        tooltipObj.__text__                 = text; // This is set because the innerHTML can change when it's set
        tooltipObj.__canvas__               = obj.canvas;
        tooltipObj.style.display            = 'inline';
        tooltipObj.id                       = '__rgraph_tooltip_' + obj.canvas.id + '_' + obj.uid + '_'+ idx;
        tooltipObj.__event__                = obj.Get('chart.tooltips.event') || 'click';
        tooltipObj.__object__               = obj;
        
        if (typeof(idx) == 'number') {
            tooltipObj.__index__ = idx;
        }
        
        if (obj.type == 'line') {
            for (var ds=0; ds<obj.data.length; ++ds) {
                if (idx >= obj.data[ds].length) {
                    idx -= obj.data[ds].length;
                } else {
                    break;
                }
            }
            
            tooltipObj.__dataset__ = ds;
            tooltipObj.__index2__  = idx;
        }

        document.body.appendChild(tooltipObj);

        var width  = tooltipObj.offsetWidth;
        var height = tooltipObj.offsetHeight;

        if ((y - height - 2) > 0) {
            y = y - height - 2;
        } else {
            y = y + 2;
        }
        /**
        * Set the width on the tooltip so it doesn't resize if the window is resized
        */
        tooltipObj.style.width = width + 'px';
        //tooltipObj.style.height = 0; // Initially set the tooltip height to nothing

        /**
        * If the mouse is towards the right of the browser window and the tooltip would go outside of the window,
        * move it left
        */
        if ( (x + width) > document.body.offsetWidth ) {
            x = x - width - 7;
            var placementLeft = true;
            
            if (obj.Get('chart.tooltips.effect') == 'none') {
                x = x - 3;
            }

            tooltipObj.style.left = x + 'px';
            tooltipObj.style.top  = y + 'px';

        } else {
            x += 5;

            tooltipObj.style.left = x + 'px';
            tooltipObj.style.top = y + 'px';
        }


        if (effect == 'expand') {

            tooltipObj.style.left        = (x + (width / 2)) + 'px';
            tooltipObj.style.top         = (y + (height / 2)) + 'px';
            leftDelta                    = (width / 2) / 10;
            topDelta                     = (height / 2) / 10;

            tooltipObj.style.width              = 0;
            tooltipObj.style.height             = 0;
            //tooltipObj.style.boxShadow          = '';
            //tooltipObj.style.MozBoxShadow       = '';
            //tooltipObj.style.WebkitBoxShadow    = '';
            //tooltipObj.style.borderRadius       = 0;
            //tooltipObj.style.MozBorderRadius    = 0;
            //tooltipObj.style.WebkitBorderRadius = 0;
            tooltipObj.style.opacity = 1;

            // Progressively move the tooltip to where it should be (the x position)
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 25));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 50));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 75));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 100));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 125));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 150));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 175));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 200));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 225));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 250));
            
            // Progressively move the tooltip to where it should be (the Y position)
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 25));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 50));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 75));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 100));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 125));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 150));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 175));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 200));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 225));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 250));

            // Progressively grow the tooltip width
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.1) + "px'; }", 25));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.2) + "px'; }", 50));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.3) + "px'; }", 75));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.4) + "px'; }", 100));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.5) + "px'; }", 125));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.6) + "px'; }", 150));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.7) + "px'; }", 175));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.8) + "px'; }", 200));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.9) + "px'; }", 225));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + width + "px'; }", 250));

            // Progressively grow the tooltip height
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.1) + "px'; }", 25));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.2) + "px'; }", 50));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.3) + "px'; }", 75));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.4) + "px'; }", 100));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.5) + "px'; }", 125));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.6) + "px'; }", 150));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.7) + "px'; }", 175));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.8) + "px'; }", 200));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.9) + "px'; }", 225));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + height + "px'; }", 250));
            
            // When the animation is finished, set the tooltip HTML
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').innerHTML = RGraph.Registry.Get('chart.tooltip').__text__; }", 250));
        
        } else if (effect == 'contract') {

            tooltipObj.style.left = (x - width) + 'px';
            tooltipObj.style.top  = (y - (height * 2)) + 'px';
            tooltipObj.style.cursor = 'pointer';

            leftDelta = width / 10;
            topDelta  = height / 10;

            tooltipObj.style.width  = (width * 5) + 'px';
            tooltipObj.style.height = (height * 5) + 'px';

            tooltipObj.style.opacity = 0.2;

            // Progressively move the tooltip to where it should be (the x position)
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) + leftDelta) + 'px' }", 25));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) + leftDelta) + 'px' }", 50));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) + leftDelta) + 'px' }", 75));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) + leftDelta) + 'px' }", 100));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) + leftDelta) + 'px' }", 125));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) + leftDelta) + 'px' }", 150));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) + leftDelta) + 'px' }", 175));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) + leftDelta) + 'px' }", 200));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) + leftDelta) + 'px' }", 225));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) + leftDelta) + 'px' }", 250));

            // Progressively move the tooltip to where it should be (the Y position)
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) + (topDelta*2)) + 'px' }", 25));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) + (topDelta*2)) + 'px' }", 50));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) + (topDelta*2)) + 'px' }", 75));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) + (topDelta*2)) + 'px' }", 100));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) + (topDelta*2)) + 'px' }", 125));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) + (topDelta*2)) + 'px' }", 150));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) + (topDelta*2)) + 'px' }", 175));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) + (topDelta*2)) + 'px' }", 200));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) + (topDelta*2)) + 'px' }", 225));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) + (topDelta*2)) + 'px' }", 250));

            // Progressively shrink the tooltip width
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 5.5) + "px'; }", 25));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 5.0) + "px'; }", 50));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 4.5) + "px'; }", 75));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 4.0) + "px'; }", 100));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 3.5) + "px'; }", 125));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 3.0) + "px'; }", 150));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 2.5) + "px'; }", 175));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 2.0) + "px'; }", 200));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 1.5) + "px'; }", 225));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + width + "px'; }", 250));

            // Progressively shrink the tooltip height
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 5.5) + "px'; }", 25));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 5.0) + "px'; }", 50));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 4.5) + "px'; }", 75));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 4.0) + "px'; }", 100));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 3.5) + "px'; }", 125));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 3.0) + "px'; }", 150));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 2.5) + "px'; }", 175));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 2.0) + "px'; }", 200));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 1.5) + "px'; }", 225));
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + height + "px'; }", 250));

            // When the animation is finished, set the tooltip HTML
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').innerHTML = RGraph.Registry.Get('chart.tooltip').__text__; }", 250));

            /**
            * This resets the pointer
            */
            RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.cursor = 'default'; }", 275));

        } else if (effect == 'snap') {

            /*******************************************************
            * Move the tooltip
            *******************************************************/
            for (var i=1; i<=10; ++i) {
                RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = '" + (x * 0.1 * i) + "px'; }", 15 * i));
                RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = '" + (y * 0.1 * i) + "px'; }", 15 * i));
            }

            tooltipObj.style.left = 0 - tooltipObj.offsetWidth + 'px';
            tooltipObj.style.top  = 0 - tooltipObj.offsetHeight + 'px';

        } else if (effect != 'fade' && effect != 'expand' && effect != 'none' && effect != 'snap' && effect != 'contract') {
            alert('[COMMON] Unknown tooltip effect: ' + effect);
        }

        if (effect != 'none') {
            setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.1; }", 25);
            setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.2; }", 50);
            setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.3; }", 75);
            setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.4; }", 100);
            setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.5; }", 125);
            setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.6; }", 150);
            setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.7; }", 175);
            setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.8; }", 200);
            setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.9; }", 225);
        }

        setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 1;}", effect == 'none' ? 50 : 250);

        /**
        * If the tooltip it self is clicked, cancel it
        */
        tooltipObj.onmousedown = function (e){e.stopPropagation();}
        tooltipObj.onmouseup   = function (e){e.stopPropagation();}
        tooltipObj.onclick     = function (e){if (e.button == 0) {e.stopPropagation();}}







        /**
        * Keep a reference to the tooltip
        */
        RGraph.Registry.Set('chart.tooltip', tooltipObj);

        /**
        * Fire the tooltip event
        */
        RGraph.FireCustomEvent(obj, 'ontooltip');
    }
    
    
    /**
    * 
    */
    RGraph.getTooltipTextFromDIV = function (text)
    {
        // This regex is duplicated firher down on roughly line 888
        var result = /^id:(.*)/.exec(text);

        if (result && result[1] && document.getElementById(result[1])) {
            text = document.getElementById(result[1]).innerHTML;
        } else if (result && result[1]) {
            text = '';
        }
        
        return text;
    }


    /**
    * 
    */
    RGraph.getTooltipWidth = function (text, obj)
    {
        var div = document.createElement('DIV');
            div.className             = obj.Get('chart.tooltips.css.class');
            div.style.paddingLeft     = RGraph.tooltips.padding;
            div.style.paddingRight    = RGraph.tooltips.padding;
            div.style.fontFamily      = RGraph.tooltips.font_face;
            div.style.fontSize        = RGraph.tooltips.font_size;
            div.style.visibility      = 'hidden';
            div.style.position        = 'absolute';
            div.style.top            = '300px';
            div.style.left             = 0;
            div.style.display         = 'inline';
            div.innerHTML             = RGraph.getTooltipTextFromDIV(text);
        document.body.appendChild(div);

        return div.offsetWidth;
    }


    /**
    * Hides the currently shown tooltip
    */
    RGraph.HideTooltip = function ()
    {
        var tooltip = RGraph.Registry.Get('chart.tooltip');

        if (tooltip) {
            tooltip.parentNode.removeChild(tooltip);
            tooltip.style.display = 'none';                
            tooltip.style.visibility = 'hidden';
            RGraph.Registry.Set('chart.tooltip', null);
        }
    }

    
    
    /**
    * This installs the window mousedown event listener. It clears any highlight that may
    * be present.
    * 
    * @param object obj The chart object
    *
    RGraph.InstallWindowMousedownTooltipListener = function (obj)
    {
        if (RGraph.Registry.Get('__rgraph_event_listeners__')['window_mousedown']) {
            return;
        }
        
        // When the canvas is cleared, reset this flag so that the event listener is installed again
        RGraph.AddCustomEventListener(obj, 'onclear', function (obj) {RGraph.Registry.Get('__rgraph_event_listeners__')['window_mousedown'] = false;})

        // NOTE: Global on purpose
        rgraph_window_mousedown = function (e)
        {
            if (RGraph.Registry.Get('chart.tooltip')) {

                var obj    = RGraph.Registry.Get('chart.tooltip').__object__;
                var canvas = obj.canvas;

                /**
                * Get rid of the tooltip and redraw all canvases on the page
                *
                RGraph.HideTooltip();
                
                /**
                * No need to clear if highlighting is disabled
                * 
                * TODO Really, need to check ALL of the pertinent objects that
                * are drawing on the canvas using the ObjectRegistry -
                * ie RGraph.ObjectRegistry.getObjectsByCanvasID()
                *
                if (obj.Get('chart.tooltips.highlight')) {
                    RGraph.RedrawCanvas(canvas);
                }
            }
        }
        window.addEventListener('mousedown', rgraph_window_mousedown, false);
        RGraph.AddEventListener('window_' + obj.id, 'mousedown', rgraph_window_mousedown);
    }
    */


    /**
    * This installs the canvas mouseup event listener. This is the function that
    * actually shows the appropriate (if any) tooltip.
    * 
    * @param object obj The chart object
    *
    RGraph.InstallCanvasMouseupTooltipListener = function (obj)
    {
        if (RGraph.Registry.Get('__rgraph_event_listeners__')[obj.canvas.id + '_mouseup']) {
            return;
        }
        RGraph.Registry.Get('__rgraph_event_listeners__')[obj.canvas.id + '_mouseup'] = true;

        // When the canvas is cleared, reset this flag so that the event listener is installed again
        RGraph.AddCustomEventListener(obj, 'onclear', function (obj) {RGraph.Registry.Get('__rgraph_event_listeners__')[obj.canvas.id + '_mouseup'] = false});

        // Install the onclick event handler for the tooltips
        //
        // // NOTE: Global on purpose
        rgraph_canvas_mouseup_func = function (e)
        {
            var x = arguments[1] ? arguments[1] : e.pageX;
            var y = arguments[2] ? arguments[2] : e.pageY;

            var objects = RGraph.ObjectRegistry.getObjectsByCanvasID(e.target.id);

            // It's important to go backwards through the array so that the front charts
            // are checked first, then the charts at the back
            for (var i=(objects.length - 1); i>=0; --i) {
                
                var shape = objects[i].getShape(e);

                if (shape && shape['object'] && !RGraph.Registry.Get('chart.tooltip')) {

                    /**
                    * This allows the Scatter chart funky tooltips style
                    *
                    if (objects[i].type == 'scatter' && shape['dataset'] > 0) {
                        for (var j=0; j<(objects[i].data.length - 1); ++j) {
                            shape['index'] += objects[i].data[j].length;
                        }
                    }

                    var text = RGraph.parseTooltipText(objects[i].Get('chart.tooltips'), shape['index']);
    
                    if (text) {
                    
                        if (shape['object'].Get('chart.tooltips.hotspot.xonly')) {
                            var canvasXY = RGraph.getCanvasXY(objects[i].canvas);
                            x = canvasXY[0] + shape[1];
                            y = canvasXY[1] + shape[2];
                        }

                        RGraph.Tooltip(objects[i], text, x, y, shape['index']);
                        objects[i].Highlight(shape);
    
                        e.stopPropagation();
                        e.cancelBubble = true;
                        return false;
                    }
                }
            }
        }
        obj.canvas.addEventListener('mouseup', rgraph_canvas_mouseup_func, false);
        RGraph.AddEventListener(obj.id, 'mouseup', rgraph_canvas_mouseup_func);
    }
    */



    /**
    * This installs the canvas mousemove event listener. This is the function that
    * changes the mouse pointer if need be.
    * 
    * @param object obj The chart object
    *
    RGraph.InstallCanvasMousemoveTooltipListener = function (obj)
    {
        if (RGraph.Registry.Get('__rgraph_event_listeners__')[obj.canvas.id + '_mousemove']) {
            return;
        }
        RGraph.Registry.Get('__rgraph_event_listeners__')[obj.canvas.id + '_mousemove'] = true;
        
        // When the canvas is cleared, reset this flag so that the event listener is installed again
        RGraph.AddCustomEventListener(obj, 'onclear', function (obj) {RGraph.Registry.Get('__rgraph_event_listeners__')[obj.canvas.id + '_mousemove'] = false})

        // Install the mousemove event handler for the tooltips
        //
        // NOTE: Global on purpose
        rgraph_canvas_mousemove_func = function (e)
        {
            var objects = RGraph.ObjectRegistry.getObjectsByCanvasID(e.target.id);

            for (var i=0; i<objects.length; ++i) {

                var shape = objects[i].getShape(e);

                if (shape && shape['object']) {

                    /**
                    * This allows the Scatter chart funky tooltips style
                    *
                    if (objects[i].type == 'scatter' && shape['dataset'] > 0) {
                        for (var j=0; j<(objects[i].data.length - 1); ++j) {
                            shape['index'] += objects[i].data[j].length;
                        }
                    }

                    var text = RGraph.parseTooltipText(objects[i].Get('chart.tooltips'), shape['index']);


                    if (text) {

                        e.target.style.cursor = 'pointer';

                        /**
                        * This facilitates the event triggering the tooltips being mousemove
                        *

                        if (   typeof(objects[i].Get('chart.tooltips.event')) == 'string'
                            && objects[i].Get('chart.tooltips.event') == 'onmousemove'
                            && (!RGraph.Registry.Get('chart.tooltip') || shape['index'] != RGraph.Registry.Get('chart.tooltip').__index__ || shape['object'].uid != RGraph.Registry.Get('chart.tooltip').__object__.uid)
                           ) {
                           
                           // Hide any current tooltip
                           rgraph_window_mousedown(e);
                           
                           rgraph_canvas_mouseup_func(e);
                        }
                    }
                }
            }
        }
        obj.canvas.addEventListener('mousemove', rgraph_canvas_mousemove_func, false);
        RGraph.AddEventListener(obj.id, 'mousemove', rgraph_canvas_mousemove_func);
    }
    */



    /**
    * This function highlights a rectangle
    * 
    * @param object obj    The chart object
    * @param number shape  The coordinates of the rect to highlight
    */
    RGraph.Highlight.Rect = function (obj, shape)
    {
        if (obj.Get('chart.tooltips.highlight')) {
            var canvas  = obj.canvas;
            var context = obj.context;
    
            /**
            * Draw a rectangle on the canvas to highlight the appropriate area
            */
            context.beginPath();

                context.strokeStyle = obj.Get('chart.highlight.stroke');
                context.fillStyle   = obj.Get('chart.highlight.fill');
    
                context.strokeRect(shape['x'],shape['y'],shape['width'],shape['height']);
                context.fillRect(shape['x'],shape['y'],shape['width'],shape['height']);
            context.stroke;
            context.fill();
        }
    }



    /**
    * This function highlights a point
    * 
    * @param object obj    The chart object
    * @param number shape  The coordinates of the rect to highlight
    */
    RGraph.Highlight.Point = function (obj, shape)
    {
        if (obj.Get('chart.tooltips.highlight')) {
            var canvas  = obj.canvas;
            var context = obj.context;
    
            /**
            * Draw a rectangle on the canvas to highlight the appropriate area
            */
            context.beginPath();
                context.strokeStyle = obj.Get('chart.highlight.stroke');
                context.fillStyle   = obj.Get('chart.highlight.fill');
                var radius   = obj.Get('chart.highlight.point.radius') || 2;
                context.arc(shape['x'],shape['y'],radius, 0, 2 * Math.PI, 0);
            context.stroke();
            context.fill();
        }
    }



    /**
    * This (as the name suggests preloads any images it can find in the tooltip text
    * 
    * @param object obj The chart object
    */
    RGraph.PreLoadTooltipImages = function (obj)
    {
        var tooltips = obj.Get('chart.tooltips');
        
        if (RGraph.hasTooltips(obj)) {
        
            if (obj.type == 'rscatter') {
                tooltips = [];
                for (var i=0; i<obj.data.length; ++i) {
                    tooltips.push(obj.data[3]);
                }
            }
            
            for (var i=0; i<tooltips.length; ++i) {
                // Add the text to an offscreen DIV tag
                var div = document.createElement('DIV');
                    div.style.position = 'absolute';
                    div.style.opacity = 0;
                    div.style.top = '-100px';
                    div.style.left = '-100px';
                    div.innerHTML  = tooltips[i];
                document.body.appendChild(div);
                
                // Now get the IMG tags and create them
                var img_tags = div.getElementsByTagName('IMG');
    
                // Create the image in an off-screen image tag
                for (var j=0; j<img_tags.length; ++j) {
                        if (img_tags && img_tags[i]) {
                        var img = document.createElement('IMG');
                            img.style.position = 'absolute';
                            img.style.opacity = 0;
                            img.style.top = '-100px';
                            img.style.left = '-100px';
                            img.src = img_tags[i].src
                        document.body.appendChild(img);
                        
                        setTimeout(function () {document.body.removeChild(img);}, 250);
                    }
                }
    
                // Now remove the div
                document.body.removeChild(div);
            }
        }
    }



    /**
    * This is the tooltips canvas onmousemove listener
    */
    RGraph.Tooltips_mousemove  = function (obj, e)
    {
        var shape = obj.getShape(e);
        var changeCursor_tooltips = false

        if (   shape
            && typeof(shape['index']) == 'number'
            && obj.Get('chart.tooltips')[shape['index']]
           ) {

            var text = RGraph.parseTooltipText(obj.Get('chart.tooltips'), shape['index']);

            if (text) {

                /**
                * Change the cursor
                */
                changeCursor_tooltips = true;

                if (obj.Get('chart.tooltips.event') == 'onmousemove') {

                    // Show the tooltip if it's not the same as the one already visible
                    if (
                           !RGraph.Registry.Get('chart.tooltip')
                        || RGraph.Registry.Get('chart.tooltip').__object__.uid != obj.uid
                        || RGraph.Registry.Get('chart.tooltip').__index__ != shape['index']
                       ) {

                        RGraph.HideTooltip();
                        RGraph.Clear(obj.canvas);
                        RGraph.Redraw();
                        RGraph.Tooltip(obj, text, e.pageX, e.pageY, shape['index']);
                        obj.Highlight(shape);
                    }
                }
            }
        
        /**
        * More highlighting
        */
        } else if (shape && typeof(shape['index']) == 'number') {

            var text = RGraph.parseTooltipText(obj.Get('chart.tooltips'), shape['index']);

            if (text) {
                changeCursor_tooltips = true
            }
        }

        return changeCursor_tooltips;
    }

/**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/LICENSE.txt                       |
    * o------------------------------------------------------------------------------o
    */
    
    if (typeof(RGraph) == 'undefined') RGraph = {};

    /**
    * The bar chart constructor
    * 
    * @param object canvas The canvas object
    * @param array  data   The chart data
    */
    RGraph.Bar = function (id, data)
    {
        // Get the canvas and context objects
        this.id                = id;
        this.canvas            = document.getElementById(id);
        this.context           = this.canvas.getContext ? this.canvas.getContext("2d") : null;
        this.canvas.__object__ = this;
        this.type              = 'bar';
        this.max               = 0;
        this.stackedOrGrouped  = false;
        this.isRGraph          = true;
        this.uid               = RGraph.CreateUID();
        this.canvas.uid        = this.canvas.uid ? this.canvas.uid : RGraph.CreateUID();


        /**
        * Compatibility with older browsers
        */
        RGraph.OldBrowserCompat(this.context);


        // Various config type stuff
        this.properties = {
            'chart.background.barcolor1':   'rgba(0,0,0,0)',
            'chart.background.barcolor2':   'rgba(0,0,0,0)',
            'chart.background.grid':        true,
            'chart.background.grid.color':  '#ddd',
            'chart.background.grid.width':  1,
            'chart.background.grid.hsize':  20,
            'chart.background.grid.vsize':  20,
            'chart.background.grid.vlines': true,
            'chart.background.grid.hlines': true,
            'chart.background.grid.border': true,
            'chart.background.grid.autofit':true,
            'chart.background.grid.autofit.numhlines': 5,
            'chart.background.grid.autofit.numvlines': 20,
            'chart.background.image.stretch': true,
            'chart.background.image.x':     null,
            'chart.background.image.y':     null,
            'chart.background.image.w':     null,
            'chart.background.image.h':     null,
            'chart.background.image.align': null,
            'chart.ytickgap':               20,
            'chart.smallyticks':            3,
            'chart.largeyticks':            5,
            'chart.numyticks':              10,
            'chart.hmargin':                5,
            'chart.strokecolor':            '#666',
            'chart.axis.color':             'black',
            'chart.gutter.top':             25,
            'chart.gutter.bottom':          25,
            'chart.gutter.left':            25,
            'chart.gutter.right':           25,
            'chart.labels':                 null,
            'chart.labels.ingraph':         null,
            'chart.labels.above':           false,
            'chart.labels.above.decimals':  0,
            'chart.labels.above.size':      null,
            'chart.labels.above.angle':     null,
            'chart.ylabels':                true,
            'chart.ylabels.count':          5,
            'chart.ylabels.inside':         false,
            'chart.xlabels.offset':         0,
            'chart.xaxispos':               'bottom',
            'chart.yaxispos':               'left',
            'chart.text.color':             'black',
            'chart.text.size':              10,
            'chart.text.angle':             0,
            'chart.text.font':              'Arial',
            'chart.ymin':                   0,
            'chart.ymax':                   null,
            'chart.title':                  '',
            'chart.title.font':             null,
            'chart.title.background':       null,
            'chart.title.hpos':             null,
            'chart.title.vpos':             null,
            'chart.title.bold':             true,
            'chart.title.xaxis':            '',
            'chart.title.xaxis.bold':       true,
            'chart.title.xaxis.size':       null,
            'chart.title.xaxis.font':       null,
            'chart.title.yaxis':            '',
            'chart.title.yaxis.bold':       true,
            'chart.title.yaxis.size':       null,
            'chart.title.yaxis.font':       null,
            'chart.title.xaxis.pos':        null,
            'chart.title.yaxis.pos':        null,
            'chart.colors':                 ['rgb(0,0,255)', '#0f0', '#00f', '#ff0', '#0ff', '#0f0'],
            'chart.colors.sequential':      false,
            'chart.colors.reverse':         false,
            'chart.grouping':               'grouped',
            'chart.variant':                'bar',
            'chart.shadow':                 false,
            'chart.shadow.color':           '#666',
            'chart.shadow.offsetx':         3,
            'chart.shadow.offsety':         3,
            'chart.shadow.blur':            3,
            'chart.tooltips':               null,
            'chart.tooltips.effect':        'fade',
            'chart.tooltips.css.class':     'RGraph_tooltip',
            'chart.tooltips.event':         'onclick',
            'chart.tooltips.highlight':     true,
            'chart.highlight.stroke':       'rgba(0,0,0,0)',
            'chart.highlight.fill':         'rgba(255,255,255,0.7)',
            'chart.background.hbars':       null,
            'chart.key':                    [],
            'chart.key.background':         'white',
            'chart.key.position':           'graph',
            'chart.key.shadow':             false,
            'chart.key.shadow.color':       '#666',
            'chart.key.shadow.blur':        3,
            'chart.key.shadow.offsetx':     2,
            'chart.key.shadow.offsety':     2,
            'chart.key.position.gutter.boxed': true,
            'chart.key.position.x':         null,
            'chart.key.position.y':         null,
            'chart.key.halign':             'right',
            'chart.key.color.shape':        'square',
            'chart.key.rounded':            true,
            'chart.key.text.size':          10,
            'chart.key.linewidth':          1,
            'chart.key.colors':             null,
            'chart.contextmenu':            null,
            'chart.units.pre':              '',
            'chart.units.post':             '',
            'chart.scale.decimals':         0,
            'chart.scale.point':            '.',
            'chart.scale.thousand':         ',',
            'chart.crosshairs':             false,
            'chart.crosshairs.color':       '#333',
            'chart.crosshairs.hline':       true,
            'chart.crosshairs.vline':       true,
            'chart.linewidth':              1,
            'chart.annotatable':            false,
            'chart.annotate.color':         'black',
            'chart.zoom.factor':            1.5,
            'chart.zoom.fade.in':           true,
            'chart.zoom.fade.out':          true,
            'chart.zoom.hdir':              'right',
            'chart.zoom.vdir':              'down',
            'chart.zoom.frames':            25,
            'chart.zoom.delay':             16.666,
            'chart.zoom.shadow':            true,

            'chart.zoom.background':        true,
            'chart.resizable':              false,
            'chart.resize.handle.adjust':   [0,0],
            'chart.resize.handle.background': null,
            'chart.adjustable':             false,
            'chart.noaxes':                 false,
            'chart.noxaxis':                false,
            'chart.noyaxis':                false,
            'chart.events.click':           null,
            'chart.events.mousemove':       null,
            'chart.numxticks':              null
        }

        // Check for support
        if (!this.canvas) {
            alert('[BAR] No canvas support');
            return;
        }

        /**
        * Determine whether the chart will contain stacked or grouped bars
        */
        for (i=0; i<data.length; ++i) {
            if (typeof(data[i]) == 'object') {
                this.stackedOrGrouped = true;
            }
        }

        // Store the data
        this.data = data;
        
        // Used to store the coords of the bars
        this.coords = [];



        /**
        * This linearises the data. Doing so can make it easier to pull
        * out the appropriate data from tooltips
        */
        this.data_arr = RGraph.array_linearize(this.data);



        /**
        * Register the object
        */
        RGraph.Register(this);
    }


    /**
    * A setter
    * 
    * @param name  string The name of the property to set
    * @param value mixed  The value of the property
    */
    RGraph.Bar.prototype.Set = function (name, value)
    {
        name = name.toLowerCase();

        if (name == 'chart.labels.abovebar') {
            name = 'chart.labels.above';
        }
        
        if (name == 'chart.strokestyle') {
            name = 'chart.strokecolor';
        }
        
        /**
        * Check for xaxispos
        */
        if (name == 'chart.xaxispos' ) {
            if (value != 'bottom' && value != 'center' && value != 'top') {
                alert('[BAR] (' + this.id + ') chart.xaxispos should be top, center or bottom. Tried to set it to: ' + value + ' Changing it to center');
                value = 'center';
            }
            
            if (value == 'top') {
                for (var i=0; i<this.data.length; ++i) {
                    if (typeof(this.data[i]) == 'number' && this.data[i] > 0) {
                        alert('[BAR] The data element with index ' + i + ' should be negative');
                    }
                }
            }
        }
        
        /**
        * lineWidth doesn't appear to like a zero setting
        */
        if (name.toLowerCase() == 'chart.linewidth' && value == 0) {
            value = 0.0001;
        }

        this.properties[name] = value;
    }


    /**
    * A getter
    * 
    * @param name  string The name of the property to get
    */
    RGraph.Bar.prototype.Get = function (name)
    {
        if (name == 'chart.labels.abovebar') {
            name = 'chart.labels.above';
        }
        
        var value = this.properties[name];

        return value;
    }



    /**
    * The function you call to draw the bar chart
    */
    RGraph.Bar.prototype.Draw = function ()
    {

        // MUST be the first thing done!
        if (typeof(this.Get('chart.background.image')) == 'string') {
            RGraph.DrawBackgroundImage(this);
        }

        /**
        * Fire the onbeforedraw event
        */
        RGraph.FireCustomEvent(this, 'onbeforedraw');


        
        /**
        * This is new in May 2011 and facilitates indiviual gutter settings,
        * eg chart.gutter.left
        */
        this.gutterLeft   = this.Get('chart.gutter.left');
        this.gutterRight  = this.Get('chart.gutter.right');
        this.gutterTop    = this.Get('chart.gutter.top');
        this.gutterBottom = this.Get('chart.gutter.bottom');

        /**
        * Convert any null values to 0. Won't make any difference to the bar (as opposed to the line chart)
        */
        for (var i=0; i<this.data.length; ++i) {
            if (this.data[i] == null) {
                this.data[i] = 0;
            }
        }


        // Cache this in a class variable as it's used rather a lot

        /**
        * Check for tooltips and alert the user that they're not supported with pyramid charts
        */
        if (   (this.Get('chart.variant') == 'pyramid' || this.Get('chart.variant') == 'dot')
            && typeof(this.Get('chart.tooltips')) == 'object'
            && this.Get('chart.tooltips')
            && this.Get('chart.tooltips').length > 0) {

            alert('[BAR] (' + this.id + ') Sorry, tooltips are not supported with dot or pyramid charts');
        }

        /**
        * Stop the coords array from growing uncontrollably
        */
        this.coords = [];

        /**
        * Work out a few things. They need to be here because they depend on things you can change before you
        * call Draw() but after you instantiate the object
        */
        this.max            = 0;
        this.grapharea      = RGraph.GetHeight(this) - this.gutterTop - this.gutterBottom;
        this.halfgrapharea  = this.grapharea / 2;
        this.halfTextHeight = this.Get('chart.text.size') / 2;

        // Progressively Draw the chart
        RGraph.background.Draw(this);




        //If it's a sketch chart variant, draw the axes first
        if (this.Get('chart.variant') == 'sketch') {
            this.DrawAxes();
            this.Drawbars();
        } else {
            this.Drawbars();
            this.DrawAxes();
        }

        this.DrawLabels();


        // Draw the key if necessary
        if (this.Get('chart.key').length) {
            RGraph.DrawKey(this, this.Get('chart.key'), this.Get('chart.colors'));
        }
        
        
        /**
        * Setup the context menu if required
        */
        if (this.Get('chart.contextmenu')) {
            RGraph.ShowContext(this);
        }


        /**
        * Is a line is defined, draw it
        *
        var line = this.Get('chart.line');

        if (line) {
        
            line.__bar__ = this;
            
            // Check the X axis positions
            if (this.Get('chart.xaxispos') != line.Get('chart.xaxispos')) {
                alert("[BAR] Using different X axis positions when combining the Bar and Line is not advised");
            }

            line.Set('chart.gutter.left',   this.Get('chart.gutter.left'));
            line.Set('chart.gutter.right',  this.Get('chart.gutter.right'));
            line.Set('chart.gutter.top',    this.Get('chart.gutter.top'));
            line.Set('chart.gutter.bottom', this.Get('chart.gutter.bottom'));

            line.Set('chart.hmargin', (this.canvas.width - this.gutterLeft - this.gutterRight) / (line.original_data[0].length * 2));
            
            // If a BAR custom yMax is set, use that
            if (this.Get('chart.ymax') && !line.Get('chart.ymax')) {
                line.Set('chart.ymax', this.Get('chart.ymax'));
            
            } else if (line.Get('chart.ymax')) {
                line.Set('chart.ymax', line.Get('chart.ymax'));
            }

            // The boolean is used to specify that the Line chart .Draw() method is being called by the Bar chart
            line.Draw(true);
        }
*/


        /**
        * Draw "in graph" labels
        */
        if (this.Get('chart.labels.ingraph')) {
            RGraph.DrawInGraphLabels(this);
        }

        
        /**
        * This function enables resizing
        */
        if (this.Get('chart.resizable')) {
            RGraph.AllowResizing(this);
        }


        /**
        * This installs the event listeners
        */
        RGraph.InstallEventListeners(this);


        /**
        * Fire the RGraph ondraw event
        */
        RGraph.FireCustomEvent(this, 'ondraw');
    }

    
    /**
    * Draws the charts axes
    */
    RGraph.Bar.prototype.DrawAxes = function ()
    {
        if (this.Get('chart.noaxes')) {
            return;
        }

        var xaxispos = this.Get('chart.xaxispos');
        var yaxispos = this.Get('chart.yaxispos');

        this.context.beginPath();
        this.context.strokeStyle = this.Get('chart.axis.color');
        this.context.lineWidth   = 1;

        // Draw the Y axis
        if (this.Get('chart.noyaxis') == false) {
            if (yaxispos == 'right') {
                this.context.moveTo(AA(this, this.canvas.width - this.gutterRight), this.gutterTop);
                this.context.lineTo(AA(this, this.canvas.width - this.gutterRight), this.canvas.height - this.gutterBottom);
            } else {
                this.context.moveTo(AA(this, this.gutterLeft), this.gutterTop);
                this.context.lineTo(AA(this, this.gutterLeft), this.canvas.height - this.gutterBottom);
            }
        }
        
        // Draw the X axis
        if (this.Get('chart.noxaxis') == false) {
            if (xaxispos == 'center') {
                this.context.moveTo(this.gutterLeft, AA(this, ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2) + this.gutterTop));
                this.context.lineTo(this.canvas.width - this.gutterRight, AA(this, ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2) + this.gutterTop));
            } else if (xaxispos == 'top') {
                this.context.moveTo(this.gutterLeft, AA(this, this.gutterTop));
                this.context.lineTo(this.canvas.width - this.gutterRight, AA(this, this.gutterTop));
            } else {
                this.context.moveTo(this.gutterLeft, AA(this, this.canvas.height - this.gutterBottom));
                this.context.lineTo(this.canvas.width - this.gutterRight, AA(this, this.canvas.height - this.gutterBottom));
            }
        }

        var numYTicks = this.Get('chart.numyticks');

        // Draw the Y tickmarks
        if (this.Get('chart.noyaxis') == false) {
            var yTickGap = (RGraph.GetHeight(this) - this.gutterTop - this.gutterBottom) / numYTicks;
            var xpos     = yaxispos == 'left' ? this.gutterLeft : RGraph.GetWidth(this) - this.gutterRight;
    
            for (y=this.gutterTop;
                 xaxispos == 'center' ? y <= (RGraph.GetHeight(this) - this.gutterBottom) : y < (RGraph.GetHeight(this) - this.gutterBottom + (xaxispos == 'top' ? 1 : 0));
                 y += yTickGap) {
    
                if (xaxispos == 'center' && y == (RGraph.GetHeight(this) / 2)) continue;
                
                // X axis at the top
                if (xaxispos == 'top' && y == this.gutterTop) continue;
                
                this.context.moveTo(xpos, AA(this, y));
                this.context.lineTo(xpos + (yaxispos == 'left' ? -3 : 3), AA(this, y));
            }
            
            /**
            * If the X axis is not being shown, draw an extra tick
            */
            if (this.Get('chart.noxaxis')) {
                if (xaxispos == 'center') {
                    this.context.moveTo(xpos + (yaxispos == 'left' ? -3 : 3), AA(this, this.canvas.height / 2));
                    this.context.lineTo(xpos, AA(this, RGraph.GetHeight(this) / 2));
                } else if (xaxispos == 'top') {
                    this.context.moveTo(xpos + (yaxispos == 'left' ? -3 : 3), AA(this, this.gutterTop));
                    this.context.lineTo(xpos, AA(this, this.gutterTop));
                } else {
                    this.context.moveTo(xpos + (yaxispos == 'left' ? -3 : 3), AA(this, RGraph.GetHeight(this) - this.gutterBottom));
                    this.context.lineTo(xpos, AA(this, RGraph.GetHeight(this) - this.gutterBottom));
                }
            }
        }


        // Draw the X tickmarks
        if (this.Get('chart.noxaxis') == false) {
            
            xTickGap = (this.canvas.width - this.gutterLeft - this.gutterRight) / this.data.length;
            
            if (typeof(this.Get('chart.numxticks')) == 'number') {
                xTickGap = (this.canvas.width - this.gutterLeft - this.gutterRight) / this.Get('chart.numxticks');
            }

            if (xaxispos == 'bottom') {
                yStart   = this.canvas.height - this.gutterBottom;
                yEnd     = (this.canvas.height - this.gutterBottom) + 3;
            } else if (xaxispos == 'top') {
                yStart = this.gutterTop - 3;
                yEnd   = this.gutterTop;
            } else if (xaxispos == 'center') {
                yStart = ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2) + this.gutterTop + 3;
                yEnd   = ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2) + this.gutterTop - 3;
            }
            
            yStart = AA(this, yStart);
            yEnd = AA(this, yEnd);
            
            //////////////// X TICKS ////////////////
            var noEndXTick = this.Get('chart.noendxtick');

            for (x=this.gutterLeft + (yaxispos == 'left' ? xTickGap : 0); x<this.canvas.width - this.gutterRight + (yaxispos == 'left' ? 5 : 0); x+=xTickGap) {

                if (yaxispos == 'left' && !noEndXTick && x > this.gutterLeft) {
                    this.context.moveTo(AA(this, x), yStart);
                    this.context.lineTo(AA(this, x), yEnd);
                
                } else if (yaxispos == 'left' && noEndXTick && x > this.gutterLeft && x < (this.canvas.width - this.gutterRight) ) {
                    this.context.moveTo(AA(this, x), yStart);
                    this.context.lineTo(AA(this, x), yEnd);
                
                } else if (yaxispos == 'right' && x < (this.canvas.width - this.gutterRight) && !noEndXTick) {
                    this.context.moveTo(AA(this, x), yStart);
                    this.context.lineTo(AA(this, x), yEnd);
                
                } else if (yaxispos == 'right' && x < (this.canvas.width - this.gutterRight) && x > (this.gutterLeft) && noEndXTick) {
                    this.context.moveTo(AA(this, x), yStart);
                    this.context.lineTo(AA(this, x), yEnd);
                }
            }
            
            if (this.Get('chart.noyaxis') || this.Get('chart.numxticks') == null) {
                if (typeof(this.Get('chart.numxticks')) == 'number' && this.Get('chart.numxticks') > 0) {
                    this.context.moveTo(AA(this, this.gutterLeft), yStart);
                    this.context.lineTo(AA(this, this.gutterLeft), yEnd);
                }
            }
    
            //////////////// X TICKS ////////////////
        }

        /**
        * If the Y axis is not being shown, draw an extra tick
        */
        if (this.Get('chart.noyaxis') && this.Get('chart.noxaxis') == false && this.Get('chart.numxticks') == null) {
            if (xaxispos == 'center') {
                this.context.moveTo(AA(this, this.gutterLeft), (RGraph.GetHeight(this) / 2) - 3);
                this.context.lineTo(AA(this, this.gutterLeft), (RGraph.GetHeight(this) / 2) + 3);
            } else {
                this.context.moveTo(AA(this, this.gutterLeft), this.canvas.height - this.gutterBottom);
                this.context.lineTo(AA(this, this.gutterLeft), this.canvas.height - this.gutterBottom + 3);
            }
        }

        this.context.stroke();
    }


    /**
    * Draws the bars
    */
    RGraph.Bar.prototype.Drawbars = function ()
    {
        this.context.lineWidth   = this.Get('chart.linewidth');
        this.context.strokeStyle = this.Get('chart.strokecolor');
        this.context.fillStyle   = this.Get('chart.colors')[0];
        var prevX                = 0;
        var prevY                = 0;
        var decimals             = this.Get('chart.scale.decimals');

        /**
        * Work out the max value
        */
        if (this.Get('chart.ymax')) {

            this.max = this.Get('chart.ymax');
            this.min = this.Get('chart.ymin');

            this.scale = [
                          (((this.max - this.min) * (1/5)) + this.min).toFixed(decimals),
                          (((this.max - this.min) * (2/5)) + this.min).toFixed(decimals),
                          (((this.max - this.min) * (3/5)) + this.min).toFixed(decimals),
                          (((this.max - this.min) * (4/5)) + this.min).toFixed(decimals),
                          (((this.max - this.min) * (5/5) + this.min)).toFixed(decimals)
                         ];
        } else {
        
            this.min = this.Get('chart.ymin');
        
            for (i=0; i<this.data.length; ++i) {
                if (typeof(this.data[i]) == 'object') {
                    var value = this.Get('chart.grouping') == 'grouped' ? Number(RGraph.array_max(this.data[i], true)) : Number(RGraph.array_sum(this.data[i])) ;

                } else {
                    var value = Number(this.data[i]);
                }

                this.max = Math.max(Math.abs(this.max), Math.abs(value));
            }

            this.scale = RGraph.getScale(this.max, this);
            this.max   = this.scale[4];

            if (this.Get('chart.ymin')) {

                    var decimals = this.Get('chart.scale.decimals');
    
                    this.scale[0] = ((Number(this.scale[4] - this.min) * 0.2) + this.min).toFixed(decimals);
                    this.scale[1] = ((Number(this.scale[4] - this.min) * 0.4) + this.min).toFixed(decimals);
                    this.scale[2] = ((Number(this.scale[4] - this.min) * 0.6) + this.min).toFixed(decimals);
                    this.scale[3] = ((Number(this.scale[4] - this.min) * 0.8) + this.min).toFixed(decimals);
                    this.scale[4] = ((Number(this.scale[4] - this.min) * 1.0) + this.min).toFixed(decimals);

            } else {
                if (this.Get('chart.scale.decimals')) {
                    
                    var decimals = this.Get('chart.scale.decimals');
    
                    this.scale[0] = Number(this.scale[0]).toFixed(decimals);
                    this.scale[1] = Number(this.scale[1]).toFixed(decimals);
                    this.scale[2] = Number(this.scale[2]).toFixed(decimals);
                    this.scale[3] = Number(this.scale[3]).toFixed(decimals);
                    this.scale[4] = Number(this.scale[4]).toFixed(decimals);
                }
            }
        }
        
        /**
        * if the chart is adjustable fix the scale so that it doesn't change.
        */
        if (this.Get('chart.adjustable') && !this.Get('chart.ymax')) {
            this.Set('chart.ymax', this.scale[4]);
        }

        /**
        * Draw horizontal bars here
        */
        if (this.Get('chart.background.hbars') && this.Get('chart.background.hbars').length > 0) {
            RGraph.DrawBars(this);
        }

        var variant = this.Get('chart.variant');
        
        /**
        * Draw the 3D axes is necessary
        */
        if (variant == '3d') {
            RGraph.Draw3DAxes(this);
        }

        /**
        * Get the variant once, and draw the bars, be they regular, stacked or grouped
        */
        
        // Get these variables outside of the loop
        var xaxispos      = this.Get('chart.xaxispos');
        var width         = (this.canvas.width - this.gutterLeft - this.gutterRight ) / this.data.length;
        var orig_height   = height;
        var hmargin       = this.Get('chart.hmargin');
        var shadow        = this.Get('chart.shadow');
        var shadowColor   = this.Get('chart.shadow.color');
        var shadowBlur    = this.Get('chart.shadow.blur');
        var shadowOffsetX = this.Get('chart.shadow.offsetx');
        var shadowOffsetY = this.Get('chart.shadow.offsety');
        var strokeStyle   = this.Get('chart.strokecolor');
        var colors        = this.Get('chart.colors');
        var sequentialColorIndex = 0;

        for (i=0; i<this.data.length; ++i) {

            // Work out the height
            //The width is up outside the loop
            var height = ((RGraph.array_sum(this.data[i]) < 0 ? RGraph.array_sum(this.data[i]) + this.min : RGraph.array_sum(this.data[i]) - this.min) / (this.max - this.min) ) * (this.canvas.height - this.gutterTop - this.gutterBottom);

            // Half the height if the Y axis is at the center
            if (xaxispos == 'center') {
                height /= 2;
            }

            var x = (i * width) + this.gutterLeft;
            var y = xaxispos == 'center' ? ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2) + this.gutterTop - height
                                         : this.canvas.height - height - this.gutterBottom;

            // xaxispos is top
            if (xaxispos == 'top') {
                y = this.gutterTop + Math.abs(height);
            }


            // Account for negative lengths - Some browsers (eg Chrome) don't like a negative value
            if (height < 0) {
                y += height;
                height = Math.abs(height);
            }

            /**
            * Turn on the shadow if need be
            */
            if (shadow) {
                this.context.shadowColor   = shadowColor;
                this.context.shadowBlur    = shadowBlur;
                this.context.shadowOffsetX = shadowOffsetX;
                this.context.shadowOffsetY = shadowOffsetY;
            }

            /**
            * Draw the bar
            */
            this.context.beginPath();
                if (typeof(this.data[i]) == 'number') {
                    
                    var barWidth = width - (2 * hmargin);
                    
                    /**
                    * Check for a negative bar width
                    */
                    if (barWidth < 0) {
                        alert('[RGRAPH] Warning: you have a negative bar width. This may be caused by the chart.hmargin being too high or the width of the canvas not being sufficient.');
                    }

                    // Set the fill color
                    this.context.strokeStyle = strokeStyle;
                    this.context.fillStyle = colors[0];
                    
                    /**
                    * Sequential colors
                    */
                    if (this.Get('chart.colors.sequential')) {
                        this.context.fillStyle = colors[i];
                    }

                    if (variant == 'sketch') {

                        this.context.lineCap = 'round';
                        
                        var sketchOffset = 3;

                        this.context.beginPath();

                        this.context.strokeStyle = colors[0];

                        /**
                        * Sequential colors
                        */
                        if (this.Get('chart.colors.sequential')) {
                            this.context.strokeStyle = colors[i];
                        }

                        // Left side
                        this.context.moveTo(x + hmargin + 2, y + height - 2);
                        this.context.lineTo(x + hmargin , y - 2);

                        // The top
                        this.context.moveTo(x + hmargin - 3, y + -2 + (this.data[i] < 0 ? height : 0));
                        this.context.bezierCurveTo(x + ((hmargin + width) * 0.33),y + 5 + (this.data[i] < 0 ? height - 10: 0),x + ((hmargin + width) * 0.66),y + 5 + (this.data[i] < 0 ? height - 10 : 0),x + hmargin + width + -1, y + 0 + (this.data[i] < 0 ? height : 0));


                        // The right side
                        this.context.moveTo(x + hmargin + width - 2, y + -2);
                        this.context.lineTo(x + hmargin + width - 3, y + height - 3);

                        for (var r=0.2; r<=0.8; r+=0.2) {
                            this.context.moveTo(x + hmargin + width + (r > 0.4 ? -1 : 3) - (r * width),y - 1);
                            this.context.lineTo(x + hmargin + width - (r > 0.4 ? 1 : -1) - (r * width), y + height + (r == 0.2 ? 1 : -2));
                        }

                        this.context.stroke();

                    // Regular bar
                    } else if (variant == 'bar' || variant == '3d' || variant == 'glass' || variant == 'bevel') {
                    
                        if (RGraph.isOld() && shadow) {
                            this.DrawIEShadow([x + hmargin, y, barWidth, height]);
                        }
                        
                        if (variant == 'glass') {
                            RGraph.filledCurvyRect(this.context, x + hmargin, y, barWidth, height, 3, this.data[i] > 0, this.data[i] > 0, this.data[i] < 0, this.data[i] < 0);
                            RGraph.strokedCurvyRect(this.context, x + hmargin, y, barWidth, height, 3, this.data[i] > 0, this.data[i] > 0, this.data[i] < 0, this.data[i] < 0);
                        } else {
                            this.context.strokeRect(x + hmargin, y, barWidth, height);
                            this.context.fillRect(x + hmargin, y, barWidth, height);
                        }

                        // 3D effect
                        if (variant == '3d') {

                            var prevStrokeStyle = this.context.strokeStyle;
                            var prevFillStyle   = this.context.fillStyle;

                            // Draw the top
                            this.context.beginPath();
                                this.context.moveTo(x + hmargin, y);
                                this.context.lineTo(x + hmargin + 10, y - 5);
                                this.context.lineTo(x + hmargin + 10 + barWidth, y - 5);
                                this.context.lineTo(x + hmargin + barWidth, y);
                            this.context.closePath();

                            this.context.stroke();
                            this.context.fill();

                            // Draw the right hand side
                            this.context.beginPath();
                                this.context.moveTo(x + hmargin + barWidth, y);
                                this.context.lineTo(x + hmargin + barWidth + 10, y - 5);
                                this.context.lineTo(x + hmargin + barWidth + 10, y + height - 5);
                                this.context.lineTo(x + hmargin + barWidth, y + height);
                            this.context.closePath();
    
                            this.context.stroke();                        
                            this.context.fill();

                            // Draw the darker top section
                            this.context.beginPath();                            
                                this.context.fillStyle = 'rgba(255,255,255,0.3)';
                                this.context.moveTo(x + hmargin, y);
                                this.context.lineTo(x + hmargin + 10, y - 5);
                                this.context.lineTo(x + hmargin + 10 + barWidth, y - 5);
                                this.context.lineTo(x + hmargin + barWidth, y);
                                this.context.lineTo(x + hmargin, y);
                            this.context.closePath();
    
                            this.context.stroke();
                            this.context.fill();

                            // Draw the darker right side section
                            this.context.beginPath();
                                this.context.fillStyle = 'rgba(0,0,0,0.4)';
                                this.context.moveTo(x + hmargin + barWidth, y);
                                this.context.lineTo(x + hmargin + barWidth + 10, y - 5);
                                this.context.lineTo(x + hmargin + barWidth + 10, y - 5 + height);
                                this.context.lineTo(x + hmargin + barWidth, y + height);
                                this.context.lineTo(x + hmargin + barWidth, y);
                            this.context.closePath();

                            this.context.stroke();
                            this.context.fill();

                            this.context.strokeStyle = prevStrokeStyle;
                            this.context.fillStyle   = prevFillStyle;
                        
                        // Glass variant
                        } else if (variant == 'glass') {
 
                            var grad = this.context.createLinearGradient(
                                                                         x + hmargin,
                                                                         y,
                                                                         x + hmargin + (barWidth / 2),
                                                                         y
                                                                        );
                            grad.addColorStop(0, 'rgba(255,255,255,0.9)');
                            grad.addColorStop(1, 'rgba(255,255,255,0.5)');

                            this.context.beginPath();
                            this.context.fillStyle = grad;
                            this.context.fillRect(x + hmargin + 2,y + (this.data[i] > 0 ? 2 : 0),(barWidth / 2) - 2,height - 2);
                            this.context.fill();
                        }

                        // This bit draws the text labels that appear above the bars if requested
                        if (this.Get('chart.labels.above')) {

                            // Turn off any shadow
                            if (shadow) {
                                RGraph.NoShadow(this);
                            }

                            var yPos = y - 3;

                            // Account for negative bars
                            if (this.data[i] < 0) {
                                yPos += height + 6 + (this.Get('chart.text.size') - 4);
                            }

                            // Account for chart.xaxispos=top
                            if (this.Get('chart.xaxispos') == 'top') {
                                yPos = this.gutterTop + height + 6 + (typeof(this.Get('chart.labels.above.size')) == 'number' ? this.Get('chart.labels.above.size') : this.Get('chart.text.size') - 4);
                            }

                            // Account for chart.variant=3d
                            if (this.Get('chart.variant') == '3d') {
                                yPos -= 5;
                            }

                            this.context.fillStyle = this.Get('chart.text.color');

                            RGraph.Text(this.context,
                                        this.Get('chart.text.font'),
                                        typeof(this.Get('chart.labels.above.size')) == 'number' ? this.Get('chart.labels.above.size') : this.Get('chart.text.size') - 3,
                                        x + hmargin + (barWidth / 2),
                                        yPos,
                                        RGraph.number_format(this, Number(this.data[i]).toFixed(this.Get('chart.labels.above.decimals')),this.Get('chart.units.pre'),this.Get('chart.units.post')),
                                        this.Get('chart.labels.above.angle') ? 'bottom' : null,
                                        this.Get('chart.labels.above.angle') ? (this.Get('chart.labels.above.angle') > 0 && (this.Get('chart.xaxispos') != 'top') ? 'right' : 'left') : 'center',
                                        null,
                                        this.Get('chart.labels.above.angle')
                                       );
                        }

                    // Dot chart
                    } else if (variant == 'dot') {

                        this.context.beginPath();
                        this.context.moveTo(x + (width / 2), y);
                        this.context.lineTo(x + (width / 2), y + height);
                        this.context.stroke();
                        
                        this.context.beginPath();
                        this.context.fillStyle = this.Get('chart.colors')[i];
                        this.context.arc(x + (width / 2), y + (this.data[i] > 0 ? 0 : height), 2, 0, 6.28, 0);
                        
                        // Set the colour for the dots
                        this.context.fillStyle = this.Get('chart.colors')[0];

                        /**
                        * Sequential colors
                        */
                        if (this.Get('chart.colors.sequential')) {
                            this.context.fillStyle = colors[i];
                        }

                        this.context.stroke();
                        this.context.fill();
                    
                    // Pyramid chart
                    } else if (variant == 'pyramid') {

                        this.context.beginPath();
                            var startY = (this.Get('chart.xaxispos') == 'center' ? (RGraph.GetHeight(this) / 2) : (RGraph.GetHeight(this) - this.gutterBottom));
                        
                            this.context.moveTo(x + hmargin, startY);
                            this.context.lineTo(
                                                x + hmargin + (barWidth / 2),
                                                y + (this.Get('chart.xaxispos') == 'center' && (this.data[i] < 0) ? height : 0)
                                               );
                            this.context.lineTo(x + hmargin + barWidth, startY);
                        
                        this.context.closePath();
                        
                        this.context.stroke();
                        this.context.fill();
                    
                    // Arrow chart
                    } else if (variant == 'arrow') {
                        
                        var startY = (this.Get('chart.xaxispos') == 'center' ? (RGraph.GetHeight(this) / 2) : (RGraph.GetHeight(this) - this.gutterBottom));

                        this.context.lineWidth = this.Get('chart.linewidth') ? this.Get('chart.linewidth') : 1;
                        this.context.lineCap = 'round';

                        this.context.beginPath();

                            this.context.moveTo(x + hmargin + (barWidth / 2), startY);
                            this.context.lineTo(x + hmargin + (barWidth / 2), y + (this.Get('chart.xaxispos') == 'center' && (this.data[i] < 0) ? height : 0));
                            this.context.arc(x + hmargin + (barWidth / 2),
                                             y + (this.Get('chart.xaxispos') == 'center' && (this.data[i] < 0) ? height : 0),
                                             5,
                                             this.data[i] > 0 ? 0.78 : 5.6,
                                             this.data[i] > 0 ? 0.79 : 5.48,
                                             this.data[i] < 0);

                            this.context.moveTo(x + hmargin + (barWidth / 2), y + (this.Get('chart.xaxispos') == 'center' && (this.data[i] < 0) ? height : 0));
                            this.context.arc(x + hmargin + (barWidth / 2),
                                             y + (this.Get('chart.xaxispos') == 'center' && (this.data[i] < 0) ? height : 0),
                                             5,
                                             this.data[i] > 0 ? 2.355 : 4,
                                             this.data[i] > 0 ? 2.4 : 3.925,
                                             this.data[i] < 0);

                        this.context.stroke();
                        
                        this.context.lineWidth = 1;

                    // Unknown variant type
                    } else {
                        alert('[BAR] Warning! Unknown chart.variant: ' + variant);
                    }

                    this.coords.push([x + hmargin, y, width - (2 * hmargin), height]);


                /**
                * Stacked bar
                */
                } else if (typeof(this.data[i]) == 'object' && this.Get('chart.grouping') == 'stacked') {
                
                    if (this.min) {
                        alert("[ERROR] Stacked Bar charts with a Y min are not supported");
                    }
                    
                    var barWidth     = width - (2 * hmargin);
                    var redrawCoords = [];// Necessary to draw if the shadow is enabled
                    var startY       = 0;
                    var dataset      = this.data[i];
                    
                    /**
                    * Check for a negative bar width
                    */
                    if (barWidth < 0) {
                        alert('[RGRAPH] Warning: you have a negative bar width. This may be caused by the chart.hmargin being too high or the width of the canvas not being sufficient.');
                    }

                    for (j=0; j<dataset.length; ++j) {

                        // Stacked bar chart and X axis pos in the middle - poitless since negative values are not permitted
                        if (xaxispos == 'center') {
                            alert("[BAR] It's pointless having the X axis position at the center on a stacked bar chart.");
                            return;
                        }

                        // Negative values not permitted for the stacked chart
                        if (this.data[i][j] < 0) {
                            alert('[BAR] Negative values are not permitted with a stacked bar chart. Try a grouped one instead.');
                            return;
                        }

                        /**
                        * Set the fill and stroke colors
                        */
                        this.context.strokeStyle = strokeStyle
                        this.context.fillStyle = colors[j];
    
                        if (this.Get('chart.colors.reverse')) {
                            this.context.fillStyle = colors[this.data[i].length - j - 1];
                        }
                        
                        if (this.Get('chart.colors.sequential') && colors[sequentialColorIndex]) {
                            this.context.fillStyle = colors[sequentialColorIndex++];
                        } else if (this.Get('chart.colors.sequential')) {
                            this.context.fillStyle = colors[sequentialColorIndex - 1];
                        }

                        var height = (dataset[j] / this.max) * (this.canvas.height - this.gutterTop - this.gutterBottom );

                        // If the X axis pos is in the center, we need to half the  height
                        if (xaxispos == 'center') {
                            height /= 2;
                        }

                        var totalHeight = (RGraph.array_sum(dataset) / this.max) * (this.canvas.height - hmargin - this.gutterTop - this.gutterBottom);

                        /**
                        * Store the coords for tooltips
                        */
                        this.coords.push([x + hmargin, y, width - (2 * hmargin), height]);

                        // MSIE shadow
                        if (RGraph.isOld() && shadow) {
                            this.DrawIEShadow([x + hmargin, y, width - (2 * hmargin), height + 1]);
                        }

                        this.context.strokeRect(x + hmargin, y, width - (2 * hmargin), height);
                        this.context.fillRect(x + hmargin, y, width - (2 * hmargin), height);

                        
                        if (j == 0) {
                            var startY = y;
                            var startX = x;
                        }

                        /**
                        * Store the redraw coords if the shadow is enabled
                        */
                        if (shadow) {
                            redrawCoords.push([x + hmargin, y, width - (2 * hmargin), height, this.context.fillStyle]);
                        }

                        /**
                        * Stacked 3D effect
                        */
                        if (variant == '3d') {

                            var prevFillStyle = this.context.fillStyle;
                            var prevStrokeStyle = this.context.strokeStyle;

    
                            // Draw the top side
                            if (j == 0) {
                                this.context.beginPath();
                                    this.context.moveTo(startX + hmargin, y);
                                    this.context.lineTo(startX + 10 + hmargin, y - 5);
                                    this.context.lineTo(startX + 10 + barWidth + hmargin, y - 5);
                                    this.context.lineTo(startX + barWidth + hmargin, y);
                                this.context.closePath();
                                
                                this.context.fill();
                                this.context.stroke();
                            }

                            // Draw the side section
                            this.context.beginPath();
                                this.context.moveTo(startX + barWidth + hmargin, y);
                                this.context.lineTo(startX + barWidth + hmargin + 10, y - 5);
                                this.context.lineTo(startX + barWidth + hmargin + 10, y - 5 + height);
                                this.context.lineTo(startX + barWidth + hmargin , y + height);
                            this.context.closePath();
                            
                            this.context.fill();
                            this.context.stroke();

                            // Draw the darker top side
                            if (j == 0) {
                                this.context.fillStyle = 'rgba(255,255,255,0.3)';
                                this.context.beginPath();
                                    this.context.moveTo(startX + hmargin, y);
                                    this.context.lineTo(startX + 10 + hmargin, y - 5);
                                    this.context.lineTo(startX + 10 + barWidth + hmargin, y - 5);
                                    this.context.lineTo(startX + barWidth + hmargin, y);
                                this.context.closePath();
                                
                                this.context.fill();
                                this.context.stroke();
                            }

                            // Draw the darker side section
                            this.context.fillStyle = 'rgba(0,0,0,0.4)';
                            this.context.beginPath();
                                this.context.moveTo(startX + barWidth + hmargin, y);
                                this.context.lineTo(startX + barWidth + hmargin + 10, y - 5);
                                this.context.lineTo(startX + barWidth + hmargin + 10, y - 5 + height);
                                this.context.lineTo(startX + barWidth + hmargin , y + height);
                            this.context.closePath();
                            
                            this.context.fill();
                            this.context.stroke();

                            this.context.strokeStyle = prevStrokeStyle;
                            this.context.fillStyle = prevFillStyle;
                        }

                        y += height;
                    }

                    // This bit draws the text labels that appear above the bars if requested
                    if (this.Get('chart.labels.above')) {

                        // Turn off any shadow
                        RGraph.NoShadow(this);

                        this.context.fillStyle = this.Get('chart.text.color');
                        RGraph.Text(this.context,
                                    this.Get('chart.text.font'),
                                    typeof(this.Get('chart.labels.above.size')) == 'number' ? this.Get('chart.labels.above.size') : this.Get('chart.text.size') - 3,
                                    startX + (barWidth / 2) + this.Get('chart.hmargin'),
                                    startY - (this.Get('chart.shadow') && this.Get('chart.shadow.offsety') < 0 ? 7 : 4) - (this.Get('chart.variant') == '3d' ? 5 : 0),
                                    String(this.Get('chart.units.pre') + RGraph.array_sum(this.data[i]).toFixed(this.Get('chart.labels.above.decimals')) + this.Get('chart.units.post')),
                                    this.Get('chart.labels.above.angle') ? 'bottom' : null,
                                    this.Get('chart.labels.above.angle') ? (this.Get('chart.labels.above.angle') > 0 ? 'right' : 'left') : 'center',
                                    null,
                                    this.Get('chart.labels.above.angle'));
                      
                        // Turn any shadow back on
                        if (shadow) {
                            this.context.shadowColor   = shadowColor;
                            this.context.shadowBlur    = shadowBlur;
                            this.context.shadowOffsetX = shadowOffsetX;
                            this.context.shadowOffsetY = shadowOffsetY;
                        }
                    }
                    

                    /**
                    * Redraw the bars if the shadow is enabled due to hem being drawn from the bottom up, and the
                    * shadow spilling over to higher up bars
                    */
                    if (shadow) {

                        RGraph.NoShadow(this);

                        for (k=0; k<redrawCoords.length; ++k) {
                            this.context.strokeStyle = strokeStyle;
                            this.context.fillStyle = redrawCoords[k][4];
                            this.context.strokeRect(redrawCoords[k][0], redrawCoords[k][1], redrawCoords[k][2], redrawCoords[k][3]);
                            this.context.fillRect(redrawCoords[k][0], redrawCoords[k][1], redrawCoords[k][2], redrawCoords[k][3]);

                            this.context.stroke();
                            this.context.fill();
                        }
                        
                        // Reset the redraw coords to be empty
                        redrawCoords = [];
                    }
                /**
                * Grouped bar
                */
                } else if (typeof(this.data[i]) == 'object' && this.Get('chart.grouping') == 'grouped') {

                    var redrawCoords = [];
                    this.context.lineWidth = this.Get('chart.linewidth');

                    for (j=0; j<this.data[i].length; ++j) {

                        // Set the fill and stroke colors
                        this.context.strokeStyle = strokeStyle;
                        this.context.fillStyle   = colors[j];
                        
                        /**
                        * Sequential colors
                        */
                        if (this.Get('chart.colors.sequential') && colors[sequentialColorIndex]) {
                            this.context.fillStyle = colors[sequentialColorIndex++];
                        } else if (this.Get('chart.colors.sequential')) {
                            this.context.fillStyle = colors[sequentialColorIndex - 1];
                        }

                        var individualBarWidth = (width - (2 * hmargin)) / this.data[i].length;
                        var height = ((this.data[i][j] + (this.data[i][j] < 0 ? this.min : (-1 * this.min) )) / (this.max - this.min) ) * (this.canvas.height - this.gutterTop - this.gutterBottom );
                    
                        /**
                        * Check for a negative bar width
                        */
                        if (individualBarWidth < 0) {
                            alert('[RGRAPH] Warning: you have a negative bar width. This may be caused by the chart.hmargin being too high or the width of the canvas not being sufficient.');
                        }

                        // If the X axis pos is in the center, we need to half the  height
                        if (xaxispos == 'center') {
                            height /= 2;
                        }

                        var startX = x + hmargin + (j * individualBarWidth);

                        /**
                        * Determine the start positioning for the bar
                        */
                        if (xaxispos == 'top') {
                            var startY = this.Get('chart.gutter.top');
                            var height = Math.abs(height);

                        } else if (xaxispos == 'center') {
                            var startY = this.gutterTop + (this.grapharea / 2) - height;

                        } else {
                            var startY = this.canvas.height - this.gutterBottom - height;
                            var height = Math.abs(height);
                        }

                        /**
                        * Draw MSIE shadow
                        */
                        if (RGraph.isOld() && shadow) {
                            this.DrawIEShadow([startX, startY, individualBarWidth, height]);
                        }

                        this.context.strokeRect(startX, startY, individualBarWidth, height);
                        this.context.fillRect(startX, startY, individualBarWidth, height);
                        y += height;



                        /**
                        * Grouped 3D effect
                        */
                        if (variant == '3d') {
                            var prevFillStyle = this.context.fillStyle;
                            var prevStrokeStyle = this.context.strokeStyle;
                            
                            // Draw the top side
                            this.context.beginPath();
                                this.context.moveTo(startX, startY);
                                this.context.lineTo(startX + 10, startY - 5);
                                this.context.lineTo(startX + 10 + individualBarWidth, startY - 5);
                                this.context.lineTo(startX + individualBarWidth, startY);
                            this.context.closePath();
                            
                            this.context.fill();
                            this.context.stroke();
                            
                            // Draw the side section
                            this.context.beginPath();
                                this.context.moveTo(startX + individualBarWidth, startY);
                                this.context.lineTo(startX + individualBarWidth + 10, startY - 5);
                                this.context.lineTo(startX + individualBarWidth + 10, startY - 5 + height);
                                this.context.lineTo(startX + individualBarWidth , startY + height);
                            this.context.closePath();
                            
                            this.context.fill();
                            this.context.stroke();


                            // Draw the darker top side
                            this.context.fillStyle = 'rgba(255,255,255,0.3)';
                            this.context.beginPath();
                                this.context.moveTo(startX, startY);
                                this.context.lineTo(startX + 10, startY - 5);
                                this.context.lineTo(startX + 10 + individualBarWidth, startY - 5);
                                this.context.lineTo(startX + individualBarWidth, startY);
                            this.context.closePath();
                            
                            this.context.fill();
                            this.context.stroke();
                            
                            // Draw the darker side section
                            this.context.fillStyle = 'rgba(0,0,0,0.4)';
                            this.context.beginPath();
                                this.context.moveTo(startX + individualBarWidth, startY);
                                this.context.lineTo(startX + individualBarWidth + 10, startY - 5);
                                this.context.lineTo(startX + individualBarWidth + 10, startY - 5 + height);
                                this.context.lineTo(startX + individualBarWidth , startY + height);
                            this.context.closePath();
                            
                            this.context.fill();
                            this.context.stroke();

                            this.context.strokeStyle = prevStrokeStyle;
                            this.context.fillStyle   = prevFillStyle;
                        }
                        
                        if (height < 0) {
                            height = Math.abs(height);
                            startY = startY - height;
                        }

                        this.coords.push([startX, startY, individualBarWidth, height]);

                        // Facilitate shadows going to the left
                        if (this.Get('chart.shadow')) {
                            redrawCoords.push([startX, startY, individualBarWidth, height, this.context.fillStyle]);
                        }
// This bit draws the text labels that appear above the bars if requested
if (this.Get('chart.labels.above')) {

    this.context.strokeStyle = 'rgba(0,0,0,0)';

    // Turn off any shadow
    if (shadow) {
        RGraph.NoShadow(this);
    }

    var yPos = y - 3;

    // Account for negative bars
    if (this.data[i][j] < 0) {
        yPos += height + 6 + (this.Get('chart.text.size') - 4);
    }

    this.context.fillStyle = this.Get('chart.text.color');
    RGraph.Text(this.context,
                this.Get('chart.text.font'),
                typeof(this.Get('chart.labels.above.size')) == 'number' ? this.Get('chart.labels.above.size') : this.Get('chart.text.size') - 3,startX + (individualBarWidth / 2),
                startY - 2 - (this.Get('chart.variant') == '3d' ? 5 : 0),
                RGraph.number_format(this, this.data[i][j].toFixed(this.Get('chart.labels.above.decimals'))),
                null,
                this.Get('chart.labels.above.angle') ? (this.Get('chart.labels.above.angle') > 0 ? 'right' : 'left') : 'center',
                null,
                this.Get('chart.labels.above.angle'));
  
    // Turn any shadow back on
    if (shadow) {
        this.context.shadowColor   = shadowColor;
        this.context.shadowBlur    = shadowBlur;
        this.context.shadowOffsetX = shadowOffsetX;
        this.context.shadowOffsetY = shadowOffsetY;
    }
}
                    }
                    
                    /**
                    * Redraw the bar if shadows are going to the left
                    */
                    if (redrawCoords.length) {

                        RGraph.NoShadow(this);
                        
                        this.context.lineWidth = this.Get('chart.linewidth');

                        this.context.beginPath();
                            for (var j=0; j<redrawCoords.length; ++j) {

                                this.context.fillStyle   = redrawCoords[j][4];
                                this.context.strokeStyle = this.Get('chart.strokecolor');

                                this.context.fillRect(redrawCoords[j][0], redrawCoords[j][1], redrawCoords[j][2], redrawCoords[j][3]);
                                this.context.strokeRect(redrawCoords[j][0], redrawCoords[j][1], redrawCoords[j][2], redrawCoords[j][3]);
                            }
                        this.context.fill();
                        this.context.stroke();

                        redrawCoords = [];
                    }
                }

            this.context.closePath();
        }

        /**
        * Turn off any shadow
        */
        RGraph.NoShadow(this);
    }



    /**
    * Draws the labels for the graph
    */
    RGraph.Bar.prototype.DrawLabels = function ()
    {
        var context    = this.context;
        var text_angle = this.Get('chart.text.angle');
        var text_size  = this.Get('chart.text.size');
        var labels     = this.Get('chart.labels');


        // Draw the Y axis labels:
        if (this.Get('chart.ylabels')) {
            this.Drawlabels_top();
            this.Drawlabels_center();
            this.Drawlabels_bottom();
        }

        /**
        * The X axis labels
        */
        if (typeof(labels) == 'object' && labels) {

            var yOffset = 13 + Number(this.Get('chart.xlabels.offset'));

            /**
            * Text angle
            */
            var angle  = 0;
            var halign = 'center';

            if (text_angle > 0) {
                angle  = -1 * text_angle;
                halign   = 'right';
                yOffset -= 5;
                
                if (this.Get('chart.xaxispos') == 'top') {
                    halign   = 'left';
                    yOffset += 5;
                }
            }

            // Draw the X axis labels
            context.fillStyle = this.Get('chart.text.color');
            
            // How wide is each bar
            var barWidth = (RGraph.GetWidth(this) - this.gutterRight - this.gutterLeft) / labels.length;
            
            // Reset the xTickGap
            xTickGap = (RGraph.GetWidth(this) - this.gutterRight - this.gutterLeft) / labels.length

            // Draw the X tickmarks
            var i=0;
            var font = this.Get('chart.text.font');

            for (x=this.gutterLeft + (xTickGap / 2); x<=RGraph.GetWidth(this) - this.gutterRight; x+=xTickGap) {
                RGraph.Text(context, font,
                                      text_size,
                                      x + (this.Get('chart.text.angle') == 90 ? 0 : 0),
                                      this.Get('chart.xaxispos') == 'top' ? this.gutterTop - yOffset + text_size  - 1: (RGraph.GetHeight(this) - this.gutterBottom) + yOffset,
                                      String(labels[i++]),
                                      (this.Get('chart.text.angle') == 90 ? 'center' : null),
                                      halign,
                                      null,
                                      angle);
            }
        }
    }

    /**
    * Draws the X axis at the top
    */
    RGraph.Bar.prototype.Drawlabels_top = function ()
    {
        this.context.beginPath();
        this.context.fillStyle = this.Get('chart.text.color');
        this.context.strokeStyle = 'black';

        if (this.Get('chart.xaxispos') == 'top') {

            var context    = this.context;
            var interval   = (this.grapharea * (1/5) );
            var text_size  = this.Get('chart.text.size');
            var units_pre  = this.Get('chart.units.pre');
            var units_post = this.Get('chart.units.post');
            var align      = this.Get('chart.yaxispos') == 'left' ? 'right' : 'left';
            var font       = this.Get('chart.text.font');
            var numYLabels = this.Get('chart.ylabels.count');

            if (this.Get('chart.ylabels.inside') == true) {
                var xpos  = this.Get('chart.yaxispos') == 'left' ? this.gutterLeft + 5 : RGraph.GetWidth(this) - this.gutterRight - 5;
                var align = this.Get('chart.yaxispos') == 'left' ? 'left' : 'right';
                var boxed = true;
            } else {
                var xpos  = this.Get('chart.yaxispos') == 'left' ? this.gutterLeft - 5 : this.canvas.width - this.gutterRight + 5;
                var boxed = false;
            }
            
            /**
            * Draw specific Y labels here so that the local variables can be reused
            */
            if (typeof(this.Get('chart.ylabels.specific')) == 'object' && this.Get('chart.ylabels.specific')) {
                
                var labels = RGraph.array_reverse(this.Get('chart.ylabels.specific'));
                var grapharea = RGraph.GetHeight(this) - this.gutterTop - this.gutterBottom;

                for (var i=0; i<labels.length; ++i) {
                    
                    var y = this.gutterTop + (grapharea * (i / labels.length)) + (grapharea / labels.length);
                    
                    RGraph.Text(context, font, text_size, xpos, y, labels[i], 'center', align, boxed);
                }

                return;
            }

            // 1(ish) label
            if (numYLabels == 3 || numYLabels == 5) {
                RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight + interval, '-' + RGraph.number_format(this, this.scale[0], units_pre, units_post), null, align, boxed);
    
                // 5 labels
                if (numYLabels == 5) {
                    RGraph.Text(context, font, text_size, xpos, (1*interval) + this.gutterTop + this.halfTextHeight + interval, '-' + RGraph.number_format(this, this.scale[1], units_pre, units_post), null, align, boxed);
                    RGraph.Text(context, font, text_size, xpos, (3*interval) + this.gutterTop + this.halfTextHeight + interval, '-' + RGraph.number_format(this, this.scale[3], units_pre, units_post), null, align, boxed);
                }
                
                // 3 labels
                if (numYLabels == 3 || numYLabels == 5) {
                    RGraph.Text(context, font, text_size, xpos, (2*interval) + this.gutterTop + this.halfTextHeight + interval, '-' + RGraph.number_format(this, this.scale[2], units_pre, units_post), null, align, boxed);
                    RGraph.Text(context, font, text_size, xpos, (4*interval) + this.gutterTop + this.halfTextHeight + interval, '-' + RGraph.number_format(this, this.scale[4], units_pre, units_post), null, align, boxed);
                }
            }
            
            // 10 Y labels
            if (numYLabels == 10) {

                interval = (this.grapharea / numYLabels );

                for (var i=10; i>0; --i) {
                    RGraph.Text(context, font, text_size, xpos,this.gutterTop + ((this.grapharea / numYLabels) * i),'-' + RGraph.number_format(this,((this.scale[4] / numYLabels) * i).toFixed((this.Get('chart.scale.decimals'))), units_pre, units_post), 'center', align, boxed);
                }
            }

            /**
            * Show the minimum value if its not zero
            */
            if (this.Get('chart.ymin') != 0) {
                RGraph.Text(context,
                            font,
                            text_size,
                            xpos,
                            this.gutterTop,
                            '-' + RGraph.number_format(this,(this.min.toFixed((this.Get('chart.scale.decimals')))), units_pre, units_post),
                            'center',
                            align,
                            boxed);
            }

        }
        
        this.context.fill();
        this.context.stroke();
    }

    /**
    * Draws the X axis in the middle
    */
    RGraph.Bar.prototype.Drawlabels_center = function ()
    {
        var font       = this.Get('chart.text.font');
        var numYLabels = this.Get('chart.ylabels.count');

        this.context.fillStyle = this.Get('chart.text.color');

        if (this.Get('chart.xaxispos') == 'center') {

            /**
            * Draw the top labels
            */
            var interval   = (this.grapharea * (1/10) );
            var text_size  = this.Get('chart.text.size');
            var units_pre  = this.Get('chart.units.pre');
            var units_post = this.Get('chart.units.post');
            var context = this.context;
            var align   = '';
            var xpos    = 0;
            var boxed   = false;

            this.context.fillStyle = this.Get('chart.text.color');
            this.context.strokeStyle = 'black';

            if (this.Get('chart.ylabels.inside') == true) {
                var xpos  = this.Get('chart.yaxispos') == 'left' ? this.gutterLeft + 5 : RGraph.GetWidth(this) - this.gutterRight - 5;
                var align = this.Get('chart.yaxispos') == 'left' ? 'left' : 'right';
                var boxed = true;
            } else {
                var xpos  = this.Get('chart.yaxispos') == 'left' ? this.gutterLeft - 5 : RGraph.GetWidth(this) - this.gutterRight + 5;
                var align = this.Get('chart.yaxispos') == 'left' ? 'right' : 'left';
                var boxed = false;
            }












            /**
            * Draw specific Y labels here so that the local variables can be reused
            */
            if (typeof(this.Get('chart.ylabels.specific')) == 'object' && this.Get('chart.ylabels.specific')) {

                var labels = this.Get('chart.ylabels.specific');
                var grapharea = this.canvas.height - this.gutterTop - this.gutterBottom;

                // Draw the top halves labels
                for (var i=0; i<labels.length; ++i) {

                    var y = this.gutterTop + ((grapharea / 2) / labels.length) * i;
                    
                    RGraph.Text(context, font, text_size, xpos, y, String(labels[i]), 'center', align, boxed);
                }

                // Draw the bottom halves labels
                for (var i=labels.length-1; i>=0; --i) {
                    var y = this.gutterTop  + (grapharea * ( (i+1) / (labels.length * 2) )) + (grapharea / 2);

                    RGraph.Text(context, font, text_size, xpos, y, labels[labels.length - i - 1], 'center', align, boxed);
                }

                return;
            }












            if (numYLabels == 3 || numYLabels == 5) {
                RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight, RGraph.number_format(this, this.scale[4], units_pre, units_post), null, align, boxed);
    
                if (numYLabels == 5) {
                    RGraph.Text(context, font, text_size, xpos, (1*interval) + this.gutterTop + this.halfTextHeight, RGraph.number_format(this, this.scale[3], units_pre, units_post), null, align, boxed);
                    RGraph.Text(context, font, text_size, xpos, (3*interval) + this.gutterTop + this.halfTextHeight, RGraph.number_format(this, this.scale[1], units_pre, units_post), null, align, boxed);
                }
                
                if (numYLabels == 3 || numYLabels == 5) {
                    RGraph.Text(context, font, text_size, xpos, (4*interval) + this.gutterTop + this.halfTextHeight, RGraph.number_format(this, this.scale[0], units_pre, units_post), null, align, boxed);
                    RGraph.Text(context, font, text_size, xpos, (2*interval) + this.gutterTop + this.halfTextHeight, RGraph.number_format(this, this.scale[2], units_pre, units_post), null, align, boxed);
                }
            } else if (numYLabels == 10) {
                // 10Y labels
                interval = (this.grapharea / numYLabels) / 2;
            
                for (var i=0; i<numYLabels; ++i) {
                    RGraph.Text(context, font, text_size, xpos,this.gutterTop + ((this.grapharea / (numYLabels * 2)) * i),RGraph.number_format(this, ((this.scale[4] / numYLabels) * (numYLabels - i)).toFixed((this.Get('chart.scale.decimals'))), units_pre, units_post), 'center', align, boxed);
                }
            }
            ///////////////////////////////////////////////////////////////////////////////////

            /**
            * Draw the bottom (X axis) labels
            */
            var interval = (this.grapharea) / 10;

            if (numYLabels == 3 || numYLabels == 5) {
                if (numYLabels == 3 || numYLabels == 5) {
                    RGraph.Text(context, font, text_size, xpos, (this.grapharea + this.gutterTop + this.halfTextHeight) - (4 * interval), '-' + RGraph.number_format(this, this.scale[0], units_pre, units_post), null, align, boxed);
                    RGraph.Text(context, font, text_size, xpos, (this.grapharea + this.gutterTop + this.halfTextHeight) - (2 * interval), '-' + RGraph.number_format(this, this.scale[2], units_pre, units_post), null, align, boxed);
                }
    
                if (numYLabels == 5) {
                    RGraph.Text(context, font, text_size, xpos, (this.grapharea + this.gutterTop + this.halfTextHeight) - (3 * interval), '-' + RGraph.number_format(this, this.scale[1], units_pre, units_post), null, align, boxed);
                    RGraph.Text(context, font, text_size, xpos, (this.grapharea + this.gutterTop + this.halfTextHeight) - interval, '-' + RGraph.number_format(this, this.scale[3], units_pre, units_post), null, align, boxed);
                }
    
                RGraph.Text(context, font, text_size, xpos,  this.grapharea + this.gutterTop + this.halfTextHeight, '-' + RGraph.number_format(this, this.scale[4], units_pre, units_post), null, align, boxed);

            } else if (numYLabels == 10) {

                // Arbitrary number of Y labels
                interval = (this.grapharea / numYLabels) / 2;
            
                for (var i=0; i<numYLabels; ++i) {
                    RGraph.Text(context, font, text_size, xpos,this.gutterTop + (this.grapharea / 2) + ((this.grapharea / (numYLabels * 2)) * i) + (this.grapharea / (numYLabels * 2)),RGraph.number_format(this, ((this.scale[4] / numYLabels) * (i+1)).toFixed((this.Get('chart.scale.decimals'))), '-' + units_pre, units_post),'center', align, boxed);
                }
            }



            /**
            * Show the minimum value if its not zero
            */
            if (this.Get('chart.ymin') != 0) {
                RGraph.Text(context,
                            font,
                            text_size,
                            xpos,
                            this.gutterTop + (this.grapharea / 2),
                            RGraph.number_format(this,(this.min.toFixed((this.Get('chart.scale.decimals')))), units_pre, units_post),
                            'center',
                            align,
                            boxed);
            }
        }
    }

    /**
    * Draws the X axdis at the bottom (the default)
    */
    RGraph.Bar.prototype.Drawlabels_bottom = function ()
    {

        this.context.beginPath();
        this.context.fillStyle = this.Get('chart.text.color');
        this.context.strokeStyle = 'black';

        if (this.Get('chart.xaxispos') != 'center' && this.Get('chart.xaxispos') != 'top') {
            
            var interval   = (this.grapharea * (1/5) );
            var text_size  = this.Get('chart.text.size');
            var units_pre  = this.Get('chart.units.pre');
            var units_post = this.Get('chart.units.post');
            var context    = this.context;
            var align      = this.Get('chart.yaxispos') == 'left' ? 'right' : 'left';
            var font       = this.Get('chart.text.font');
            var numYLabels = this.Get('chart.ylabels.count');

            if (this.Get('chart.ylabels.inside') == true) {
                var xpos  = this.Get('chart.yaxispos') == 'left' ? this.gutterLeft + 5 : RGraph.GetWidth(this) - this.gutterRight - 5;
                var align = this.Get('chart.yaxispos') == 'left' ? 'left' : 'right';
                var boxed = true;
            } else {
                var xpos  = this.Get('chart.yaxispos') == 'left' ? this.gutterLeft - 5 : RGraph.GetWidth(this) - this.gutterRight + 5;
                var boxed = false;
            }
            
            /**
            * Draw specific Y labels here so that the local variables can be reused
            */
            if (this.Get('chart.ylabels.specific') && typeof(this.Get('chart.ylabels.specific')) == 'object') {
                
                var labels = this.Get('chart.ylabels.specific');
                var grapharea = this.canvas.height - this.gutterTop - this.gutterBottom;

                for (var i=0; i<labels.length; ++i) {
                    var y = this.gutterTop + (grapharea * (i / labels.length));
                    
                    RGraph.Text(context, font, text_size, xpos, y, labels[i], 'center', align, boxed);
                }

                return;
            }

            // 1 label
            if (numYLabels == 3 || numYLabels == 5) {

                RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight, RGraph.number_format(this, this.scale[4], units_pre, units_post), null, align, boxed);

                // 5 labels
                if (numYLabels == 5) {
                    RGraph.Text(context, font, text_size, xpos, (1*interval) + this.gutterTop + this.halfTextHeight, RGraph.number_format(this, this.scale[3], units_pre, units_post), null, align, boxed);
                    RGraph.Text(context, font, text_size, xpos, (3*interval) + this.gutterTop + this.halfTextHeight, RGraph.number_format(this, this.scale[1], units_pre, units_post), null, align, boxed);
                }
                
                // 3 labels
                if (numYLabels == 3 || numYLabels == 5) {
                    RGraph.Text(context, font, text_size, xpos, (2*interval) + this.gutterTop + this.halfTextHeight, RGraph.number_format(this, this.scale[2], units_pre, units_post), null, align, boxed);
                    RGraph.Text(context, font, text_size, xpos, (4*interval) + this.gutterTop + this.halfTextHeight, RGraph.number_format(this, this.scale[0], units_pre, units_post), null, align, boxed);
                }
            }
            
            // 10 Y labels
            if (numYLabels == 10) {

                interval   = (this.grapharea / numYLabels );

                for (var i=0; i<numYLabels; ++i) {
                    RGraph.Text(context, font, text_size, xpos, this.gutterTop + ((this.grapharea / numYLabels) * i), RGraph.number_format(this,((this.scale[4] / numYLabels) * (numYLabels - i)).toFixed((this.Get('chart.scale.decimals'))), units_pre, units_post), 'center', align, boxed);
                }
            }
            
            /**
            * Show the minimum value if its not zero
            */
            if (this.Get('chart.ymin') != 0) {
                RGraph.Text(context,
                            font,
                            text_size,
                            xpos,
                            this.canvas.height - this.gutterBottom,
                            RGraph.number_format(this,(this.min.toFixed((this.Get('chart.scale.decimals')))), units_pre, units_post),
                            'center',
                            align,
                            boxed);
            }
        }
        
        this.context.fill();
        this.context.stroke();
    }


    /**
    * This function is used by MSIE only to manually draw the shadow
    * 
    * @param array coords The coords for the bar
    */
    RGraph.Bar.prototype.DrawIEShadow = function (coords)
    {
        var prevFillStyle = this.context.fillStyle;
        var offsetx       = this.Get('chart.shadow.offsetx');
        var offsety       = this.Get('chart.shadow.offsety');
        
        this.context.lineWidth = this.Get('chart.linewidth');
        this.context.fillStyle = this.Get('chart.shadow.color');
        this.context.beginPath();
        
        // Draw shadow here
        this.context.fillRect(coords[0] + offsetx, coords[1] + offsety, coords[2], coords[3]);

        this.context.fill();
        
        // Change the fillstyle back to what it was
        this.context.fillStyle = prevFillStyle;
    }


    /**
    * Not used by the class during creating the graph, but is used by event handlers
    * to get the coordinates (if any) of the selected bar
    * 
    * @param object e The event object
    * @param object   OPTIONAL You can pass in the bar object instead of the
    *                          function using "this"
    */
    RGraph.Bar.prototype.getShape = 
    RGraph.Bar.prototype.getBar = function (e)
    {
        // This facilitates you being able to pass in the bar object as a parameter instead of
        // the function getting it from itself
        var obj = arguments[1] ? arguments[1] : this;

        var mouseXY = RGraph.getMouseXY(e);
        var mouseX  = mouseXY[0];
        var mouseY  = mouseXY[1];  

        for (var i=0; i<this.coords.length; i++) {

            var left   = obj.coords[i][0];
            var top    = obj.coords[i][1];
            var width  = obj.coords[i][2];
            var height = obj.coords[i][3];

            if (mouseX >= left && mouseX <= (left + width) && mouseY >= top && mouseY <= (top + height)) {

                if (this.Get('chart.tooltips')) {
                    var tooltip = RGraph.parseTooltipText ? RGraph.parseTooltipText(this.Get('chart.tooltips'), i) : this.Get('chart.tooltips')[i];
                }

                // Work out the dataset
                var dataset = 0;
                var idx = i;
                
                while (idx >=  (typeof(this.data[dataset]) == 'object' ? this.data[dataset].length : 1)) {
                    if (typeof(this.data[dataset]) == 'number') {
                        idx -= 1;
                    } else {
                        idx -= this.data[dataset].length;
                    }
                    
                    dataset++;
                }
                
                if (typeof(this.data[dataset]) == 'number') {
                    idx = null;
                }


                return {
                        0: obj, 1: left, 2: top, 3: width, 4: height, 5: i,
                        'object': obj, 'x': left, 'y': top, 'width': width, 'height': height, 'index': i, 'tooltip': tooltip, 'index_adjusted': idx, 'dataset': dataset
                       };
            }
        }
        
        return null;
    }


    /**
    * This retrives the bar based on the X coordinate only.
    * 
    * @param object e The event object
    * @param object   OPTIONAL You can pass in the bar object instead of the
    *                          function using "this"
    */
    RGraph.Bar.prototype.getShapeByX = function (e)
    {
        var canvas      = e.target;
        var mouseCoords = RGraph.getMouseXY(e);


        // This facilitates you being able to pass in the bar object as a parameter instead of
        // the function getting it from itself
        var obj = arguments[1] ? arguments[1] : this;


        /**
        * Loop through the bars determining if the mouse is over a bar
        */
        for (var i=0; i<obj.coords.length; i++) {

            var mouseX = mouseCoords[0];
            var mouseY = mouseCoords[1];    
            var left   = obj.coords[i][0];
            var top    = obj.coords[i][1];
            var width  = obj.coords[i][2];
            var height = obj.coords[i][3];

            if (mouseX >= left && mouseX <= (left + width)) {
            
                if (this.Get('chart.tooltips')) {
                    var tooltip = RGraph.parseTooltipText ? RGraph.parseTooltipText(this.Get('chart.tooltips'), i) : this.Get('chart.tooltips')[i];
                }

                

                return {
                        0: obj, 1: left, 2: top, 3: width, 4: height, 5: i,
                        'object': obj, 'x': left, 'y': top, 'width': width, 'height': height, 'index': i, 'tooltip': tooltip
                       };
            }
        }
        
        return null;
    }


    /**
    * When you click on the chart, this method can return the Y value at that point. It works for any point on the
    * chart (that is inside the gutters) - not just points within the Bars.
    * 
    * EITHER:
    * 
    * @param object arg The event object
    * 
    * OR:
    * 
    * @param object arg A two element array containing the X and Y coordinates
    */
    RGraph.Bar.prototype.getValue = function (arg)
    {
        if (arg.length == 2) {
            var mouseX = arg[0];
            var mouseY = arg[1];
        } else {
            var mouseCoords = RGraph.getMouseXY(arg);
            var mouseX      = mouseCoords[0];
            var mouseY      = mouseCoords[1];
        }

        if (   mouseY < this.Get('chart.gutter.top')
            || mouseY > (this.canvas.height - this.Get('chart.gutter.bottom'))
            || mouseX < this.Get('chart.gutter.left')
            || mouseX > (this.canvas.width - this.Get('chart.gutter.right'))
           ) {
            return null;
        }
        
        if (this.Get('chart.xaxispos') == 'center') {
            var value = (((this.grapharea / 2) - (mouseY - this.Get('chart.gutter.top'))) / this.grapharea) * (this.max - this.min)
            value *= 2;
            
            if (value >= 0) {
                value += this.min;
            } else {
                value -= this.min;
            }

        } else if (this.Get('chart.xaxispos') == 'top') {
            var value = ((this.grapharea - (mouseY - this.Get('chart.gutter.top'))) / this.grapharea) * (this.max - this.min)
            value = this.max - value;
            value = Math.abs(value) * -1;
        } else {
            var value = ((this.grapharea - (mouseY - this.Get('chart.gutter.top'))) / this.grapharea) * (this.max - this.min)
            value += this.min;
        }

        return value;
    }


    /**
    * This function can be used when the canvas is clicked on (or similar - depending on the event)
    * to retrieve the relevant Y coordinate for a particular value.
    * 
    * @param int value The value to get the Y coordinate for
    */
    RGraph.Bar.prototype.getYCoord = function (value)
    {
        var yCoord;

        yCoord = ((value - this.min) / (this.max - this.min)) * this.grapharea;
        yCoord = this.canvas.height - this.gutterBottom - yCoord;
        
        return yCoord;
    }



    /**
    * Each object type has its own Highlight() function which highlights the appropriate shape
    * 
    * @param object shape The shape to highlight
    */
    RGraph.Bar.prototype.Highlight = function (shape)
    {
        // Add the new highlight
        RGraph.Highlight.Rect(this, shape);
    }



    /**
    * The getObjectByXY() worker method
    */
    RGraph.Bar.prototype.getObjectByXY = function (e)
    {
        var mouseXY = RGraph.getMouseXY(e);

        if (
               mouseXY[0] >= this.Get('chart.gutter.left')
            && mouseXY[0] <= (this.canvas.width - this.Get('chart.gutter.right'))
            && mouseXY[1] >= this.Get('chart.gutter.top')
            && mouseXY[1] <= (this.canvas.height - this.Get('chart.gutter.bottom'))
            ) {

            return this;
        }
    }



    /**
    * This method handles the adjusting calculation for when the mouse is moved
    * 
    * @param object e The event object
    */
    RGraph.Bar.prototype.Adjusting_mousemove = function (e)
    {
        /**
        * Handle adjusting for the Bar
        */
        if (RGraph.Registry.Get('chart.adjusting') && RGraph.Registry.Get('chart.adjusting').uid == this.uid) {

            // Rounding the value to the given number of decimals make the chart step
            var value   = Number(this.getValue(e));//.toFixed(this.Get('chart.scale.decimals'));
            var shape   = this.getShapeByX(e);

            if (shape) {
                
                RGraph.Registry.Set('chart.adjusting.shape', shape);

                this.data[shape['index']] = Number(value);
                RGraph.RedrawCanvas(e.target);
                
                RGraph.FireCustomEvent(this, 'onadjust');
            }
        }
    }


    /*********************************************************************************************************
    * This is the combined bar and Line class which makes creating bar/line combo charts a little bit easier *
    /*********************************************************************************************************/



    RGraph.CombinedChart = function ()
    {
        /**
        * Create a default empty array for the objects
        */
        this.objects = [];

        for (var i=0; i<arguments.length; ++i) {
            this.objects[i] = arguments[i];
        
            /**
            * Set the Line chart gutters to match the Bar chart gutters
            */
            this.objects[i].Set('chart.gutter.left',  this.objects[0].Get('chart.gutter.left'));
            this.objects[i].Set('chart.gutter.right',  this.objects[0].Get('chart.gutter.right'));
            this.objects[i].Set('chart.gutter.top',    this.objects[0].Get('chart.gutter.top'));
            this.objects[i].Set('chart.gutter.bottom', this.objects[0].Get('chart.gutter.bottom'));
            
            if (this.objects[i].type == 'line') {
        
                /**
                * Set the line chart hmargin
                */
                this.objects[i].Set('chart.hmargin', ((this.objects[0].canvas.width - this.objects[0].Get('chart.gutter.right') - this.objects[0].Get('chart.gutter.left')) / this.objects[0].data.length) / 2 );
                
                
                /**
                * No labels, axes or grid on the Line chart
                */
                this.objects[i].Set('chart.noaxes', true);
                this.objects[i].Set('chart.background.grid', false);
                this.objects[i].Set('chart.ylabels', false);
            }
        }
    }

    
    RGraph.CombinedChart.prototype.Draw = function ()
    {
        for (var i=0; i<this.objects.length; ++i) {
            if (typeof(arguments[i]) == 'function') {
                arguments[i](this.objects[i]);
            } else {
                this.objects[i].Draw();
            }
        }
    }
	
/**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/LICENSE.txt                       |
    * o------------------------------------------------------------------------------o
    */
    
    if (typeof(RGraph) == 'undefined') RGraph = {};

    /**
    * The line chart constructor
    * 
    * @param object canvas The cxanvas object
    * @param array  data   The chart data
    * @param array  ...    Other lines to plot
    */
    RGraph.Line = function (id)
    {
        // Get the canvas and context objects
        this.id                = id;
        this.canvas            = document.getElementById(id);
        this.context           = this.canvas.getContext ? this.canvas.getContext("2d") : null;
        this.canvas.__object__ = this;
        this.type              = 'line';
        this.max               = 0;
        this.coords            = [];
        this.coords2           = [];
        this.coords.key        = [];
        this.hasnegativevalues = false;
        this.isRGraph          = true;
        this.uid               = RGraph.CreateUID();
        this.canvas.uid        = this.canvas.uid ? this.canvas.uid : RGraph.CreateUID();



        /**
        * Compatibility with older browsers
        */
        RGraph.OldBrowserCompat(this.context);


        // Various config type stuff
        this.properties = {
            'chart.background.barcolor1':   'rgba(0,0,0,0)',
            'chart.background.barcolor2':   'rgba(0,0,0,0)',
            'chart.background.grid':        1,
            'chart.background.grid.width':  1,
            'chart.background.grid.hsize':  25,
            'chart.background.grid.vsize':  25,
            'chart.background.grid.color':  '#ddd',
            'chart.background.grid.vlines': true,
            'chart.background.grid.hlines': true,
            'chart.background.grid.border': true,
            'chart.background.grid.autofit':           true,
            'chart.background.grid.autofit.align':     false,
            'chart.background.grid.autofit.numhlines': 5,
            'chart.background.grid.autofit.numvlines': 20,
            'chart.background.hbars':       null,
            'chart.background.image':       null,
            'chart.background.image.stretch': true,
            'chart.background.image.x':     null,
            'chart.background.image.y':     null,
            'chart.background.image.w':     null,
            'chart.background.image.h':     null,
            'chart.background.image.align': null,
            'chart.labels':                 null,
            'chart.labels.ingraph':         null,
            'chart.labels.above':           false,
            'chart.labels.above.size':      8,
            'chart.xtickgap':               20,
            'chart.smallxticks':            3,
            'chart.largexticks':            5,
            'chart.ytickgap':               20,
            'chart.smallyticks':            3,
            'chart.largeyticks':            5,
            'chart.numyticks':              10,
            'chart.linewidth':              1.01,
            'chart.colors':                 ['red', '#0f0', '#00f', '#f0f', '#ff0', '#0ff'],
            'chart.hmargin':                0,
            'chart.tickmarks.dot.color':    'white',
            'chart.tickmarks':              null,
            'chart.tickmarks.linewidth':    null,
            'chart.ticksize':               3,
            'chart.gutter.left':            25,
            'chart.gutter.right':           25,
            'chart.gutter.top':             25,
            'chart.gutter.bottom':          25,
            'chart.tickdirection':          -1,
            'chart.yaxispoints':            5,
            'chart.fillstyle':              null,
            'chart.xaxispos':               'bottom',
            'chart.yaxispos':               'left',
            'chart.xticks':                 null,
            'chart.text.size':              10,
            'chart.text.angle':             0,
            'chart.text.color':             'black',
            'chart.text.font':              'Arial',
            'chart.ymin':                   null,
            'chart.ymax':                   null,
            'chart.title':                  '',
            'chart.title.background':       null,
            'chart.title.hpos':             null,
            'chart.title.vpos':             0.5,
            'chart.title.bold':             true,
            'chart.title.font':             null,
            'chart.title.xaxis':            '',
            'chart.title.xaxis.bold':       true,
            'chart.title.xaxis.size':       null,
            'chart.title.xaxis.font':       null,
            'chart.title.yaxis':            '',
            'chart.title.yaxis.bold':       true,
            'chart.title.yaxis.size':       null,
            'chart.title.yaxis.font':       null,
            'chart.title.xaxis.pos':        null,
            'chart.title.yaxis.pos':        null,
            'chart.shadow':                 false,
            'chart.shadow.offsetx':         2,
            'chart.shadow.offsety':         2,
            'chart.shadow.blur':            3,
            'chart.shadow.color':           'rgba(0,0,0,0.5)',
            'chart.tooltips':               null,
            'chart.tooltips.hotspot.xonly': false,
            'chart.tooltips.effect':        'fade',
            'chart.tooltips.css.class':     'RGraph_tooltip',
            'chart.tooltips.event':         'onmousemove',
            'chart.tooltips.highlight':     true,
            'chart.tooltips.coords.page':   false,
            'chart.highlight.stroke':       'gray',
            'chart.highlight.fill':         'white',
            'chart.stepped':                false,
            'chart.key':                    [],
            'chart.key.background':         'white',
            'chart.key.position':           'graph',
            'chart.key.halign':             null,
            'chart.key.shadow':             false,
            'chart.key.shadow.color':       '#666',
            'chart.key.shadow.blur':        3,
            'chart.key.shadow.offsetx':     2,
            'chart.key.shadow.offsety':     2,
            'chart.key.position.gutter.boxed': true,
            'chart.key.position.x':         null,
            'chart.key.position.y':         null,
            'chart.key.color.shape':        'square',
            'chart.key.rounded':            true,
            'chart.key.linewidth':          1,
            'chart.key.colors':             null,
            'chart.key.interactive':        false,
            'chart.contextmenu':            null,
            'chart.ylabels':                true,
            'chart.ylabels.count':          5,
            'chart.ylabels.inside':         false,
            'chart.ylabels.invert':         false,
            'chart.xlabels.inside':         false,
            'chart.xlabels.inside.color':   'rgba(255,255,255,0.5)',
            'chart.noaxes':                 false,
            'chart.noyaxis':                false,
            'chart.noxaxis':                false,
            'chart.noendxtick':             false,
            'chart.noendytick':             false,
            'chart.units.post':             '',
            'chart.units.pre':              '',
            'chart.scale.decimals':         null,
            'chart.scale.point':            '.',
            'chart.scale.thousand':         ',',
            'chart.crosshairs':             false,
            'chart.crosshairs.color':       '#333',
            'chart.crosshairs.hline':       true,
            'chart.crosshairs.vline':       true,
            'chart.annotatable':            false,
            'chart.annotate.color':         'black',
            'chart.axesontop':              false,
            'chart.filled':                 false,
            'chart.filled.range':           false,
            'chart.filled.accumulative':    true,
            'chart.variant':                null,
            'chart.axis.color':             'black',
            'chart.zoom.factor':            1.5,
            'chart.zoom.fade.in':           true,
            'chart.zoom.fade.out':          true,
            'chart.zoom.hdir':              'right',
            'chart.zoom.vdir':              'down',
            'chart.zoom.frames':            25,
            'chart.zoom.delay':             16.666,
            'chart.zoom.shadow':            true,

            'chart.zoom.background':        true,
            'chart.zoom.action':            'zoom',
            'chart.backdrop':               false,
            'chart.backdrop.size':          30,
            'chart.backdrop.alpha':         0.2,
            'chart.resizable':              false,
            'chart.resize.handle.adjust':   [0,0],
            'chart.resize.handle.background': null,
            'chart.adjustable':             false,
            'chart.noredraw':               false,
            'chart.outofbounds':            false,
            'chart.chromefix':              true,
            'chart.animation.factor':       1,
            'chart.animation.unfold.x':     false,
            'chart.animation.unfold.y':     true,
            'chart.animation.unfold.initial': 2,
            'chart.curvy':                    false,
            'chart.curvy.factor':             0.25,
            'chart.line.visible':             true,
            'chart.events.click':             null,
            'chart.events.mousemove':         null
        }

        /**
        * Change null arguments to empty arrays
        */
        for (var i=1; i<arguments.length; ++i) {
            if (typeof(arguments[i]) == 'null' || !arguments[i]) {
                arguments[i] = [];
            }
        }


        /**
        * Store the original data. Thiss also allows for giving arguments as one big array.
        */
        this.original_data = [];

        for (var i=1; i<arguments.length; ++i) {
            if (arguments[1] && typeof(arguments[1]) == 'object' && arguments[1][0] && typeof(arguments[1][0]) == 'object' && arguments[1][0].length) {

                var tmp = [];

                for (var i=0; i<arguments[1].length; ++i) {
                    tmp[i] = RGraph.array_clone(arguments[1][i]);
                }

                for (var j=0; j<tmp.length; ++j) {
                    this.original_data[j] = RGraph.array_clone(tmp[j]);
                }

            } else {
                this.original_data[i - 1] = RGraph.array_clone(arguments[i]);
            }
        }

        // Check for support
        if (!this.canvas) {
            alert('[LINE] Fatal error: no canvas support');
            return;
        }
        
        /**
        * Store the data here as one big array
        */
        this.data_arr = RGraph.array_linearize(this.original_data);



        /**
        * Register the object so it is redrawn when necessary
        */
        RGraph.Register(this);
    }


    /**
    * An all encompassing accessor
    * 
    * @param string name The name of the property
    * @param mixed value The value of the property
    */
    RGraph.Line.prototype.Set = function (name, value)
    {
        // Consolidate the tooltips
        if (name == 'chart.tooltips' && typeof value == 'object' && value) {

            var tooltips = [];

            for (var i=1; i<arguments.length; i++) {
                if (typeof(arguments[i]) == 'object' && arguments[i][0]) {
                    for (var j=0; j<arguments[i].length; j++) {
                        tooltips.push(arguments[i][j]);
                    }

                } else if (typeof(arguments[i]) == 'function') {
                    tooltips = arguments[i];

                } else {
                    tooltips.push(arguments[i]);
                }
            }

            // Because "value" is used further down at the end of this function, set it to the expanded array os tooltips
            value = tooltips;
        }

        /**
        * Reverse the tickmarks to make them correspond to the right line
        */
        if (name == 'chart.tickmarks' && typeof(value) == 'object' && value) {
            value = RGraph.array_reverse(value);
        }
        
        /**
        * Inverted Y axis should show the bottom end of the scale
        */
        if (name == 'chart.ylabels.invert' && value && this.Get('chart.ymin') == null) {
            this.Set('chart.ymin', 0);
        }
        
        /**
        * If (buggy) Chrome and the linewidth is 1, change it to 1.01
        */
        if (name == 'chart.linewidth' && navigator.userAgent.match(/Chrome/)) {
            if (value == 1) {
                value = 1.01;
            
            } else if (RGraph.is_array(value)) {
                for (var i=0; i<value.length; ++i) {
                    if (typeof(value[i]) == 'number' && value[i] == 1) {
                        value[i] = 1.01;
                    }
                }
            }
        }
        
        /**
        * Check for xaxispos
        */
        if (name == 'chart.xaxispos' ) {
            if (value != 'bottom' && value != 'center' && value != 'top') {
                alert('[LINE] (' + this.id + ') chart.xaxispos should be top, center or bottom. Tried to set it to: ' + value + ' Changing it to center');
                value = 'center';
            }
        }
        
        /**
        * Check chart.curvy.factor - should be 0 - 0.5
        */
        if (name == 'chart.curvy.factor' && (value < 0 || value > 0.5)) {
            alert('[LINE] chart.curvy.factor should be between 0 and 0.5 - setting it to 0.25');
            value = 0.25;
        }
        
        /**
        * chart.xticks is now calledchart.numxticks
        */
        if (name == 'chart.numxticks') {
            name = 'chart.xticks';
        }

        this.properties[name] = value;
    }


    /**
    * An all encompassing accessor
    * 
    * @param string name The name of the property
    */
    RGraph.Line.prototype.Get = function (name)
    {
        return this.properties[name];
    }


    /**
    * The function you call to draw the line chart
    * 
    * @param bool An optional bool used internally to ditinguish whether the
    *             line chart is being called by the bar chart
    */
    RGraph.Line.prototype.Draw = function ()
    {
        // MUST be the first thing done!
        if (typeof(this.Get('chart.background.image')) == 'string') {
            RGraph.DrawBackgroundImage(this);
        }


        /**
        * Fire the onbeforedraw event
        */
        RGraph.FireCustomEvent(this, 'onbeforedraw');



        /**
        * This is new in May 2011 and facilitates indiviual gutter settings,
        * eg chart.gutter.left
        */
        this.gutterLeft   = this.Get('chart.gutter.left');
        this.gutterRight  = this.Get('chart.gutter.right');
        this.gutterTop    = this.Get('chart.gutter.top');
        this.gutterBottom = this.Get('chart.gutter.bottom');


        /**
        * Check for Chrome 6 and shadow
        * 
        * TODO Remove once it's been fixed (for a while)
        * 29/10/2011 - Looks like it's been fixed as long the linewidth is at least 1.01
        * SEARCH TAGS: CHROME FIX SHADOW BUG
        */
        if (   this.Get('chart.shadow')
            && navigator.userAgent.match(/Chrome/)
            && this.Get('chart.linewidth') <= 1
            && this.Get('chart.chromefix')
            && this.Get('chart.shadow.blur') > 0) {
                alert('[RGRAPH WARNING] Chrome has a shadow bug, meaning you should increase the linewidth to at least 1.01');
        }


        // Reset the data back to that which was initially supplied
        this.data = RGraph.array_clone(this.original_data);


        // Reset the max value
        this.max = 0;

        /**
        * Reverse the datasets so that the data and the labels tally
        *  COMMENTED OUT 15TH AUGUST 2011
        */
        //this.data = RGraph.array_reverse(this.data);

        if (this.Get('chart.filled') && !this.Get('chart.filled.range') && this.data.length > 1 && this.Get('chart.filled.accumulative')) {

            var accumulation = [];
        
            for (var set=0; set<this.data.length; ++set) {
                for (var point=0; point<this.data[set].length; ++point) {
                    this.data[set][point] = Number(accumulation[point] ? accumulation[point] : 0) + this.data[set][point];
                    accumulation[point] = this.data[set][point];
                }
            }
        }

        /**
        * Get the maximum Y scale value
        */
        if (this.Get('chart.ymax')) {
            
            this.max = this.Get('chart.ymax');
            this.min = this.Get('chart.ymin') ? this.Get('chart.ymin') : 0;

            this.scale = [
                          ( ((this.max - this.min) * (1/5)) + this.min).toFixed(this.Get('chart.scale.decimals')),
                          ( ((this.max - this.min) * (2/5)) + this.min).toFixed(this.Get('chart.scale.decimals')),
                          ( ((this.max - this.min) * (3/5)) + this.min).toFixed(this.Get('chart.scale.decimals')),
                          ( ((this.max - this.min) * (4/5)) + this.min).toFixed(this.Get('chart.scale.decimals')),
                          this.max.toFixed(this.Get('chart.scale.decimals'))
                         ];

            // Check for negative values
            if (!this.Get('chart.outofbounds')) {
                for (dataset=0; dataset<this.data.length; ++dataset) {
                    for (var datapoint=0; datapoint<this.data[dataset].length; datapoint++) {
            
                        // Check for negative values
                        this.hasnegativevalues = (this.data[dataset][datapoint] < 0) || this.hasnegativevalues;
                    }
                }
            }

        } else {

            this.min = this.Get('chart.ymin') ? this.Get('chart.ymin') : 0;

            // Work out the max Y value
            for (dataset=0; dataset<this.data.length; ++dataset) {
                for (var datapoint=0; datapoint<this.data[dataset].length; datapoint++) {
    
                    this.max = Math.max(this.max, this.data[dataset][datapoint] ? Math.abs(parseFloat(this.data[dataset][datapoint])) : 0);
    
                    // Check for negative values
                    if (!this.Get('chart.outofbounds')) {
                        this.hasnegativevalues = (this.data[dataset][datapoint] < 0) || this.hasnegativevalues;
                    }
                }
            }

            // 20th April 2009 - moved out of the above loop
            this.scale = RGraph.getScale(Math.abs(parseFloat(this.max)), this);
            this.max   = this.scale[4] ? this.scale[4] : 0;

            if (this.Get('chart.ymin')) {
                this.scale[0] = ((this.max - this.Get('chart.ymin')) * (1/5)) + this.Get('chart.ymin');
                this.scale[1] = ((this.max - this.Get('chart.ymin')) * (2/5)) + this.Get('chart.ymin');
                this.scale[2] = ((this.max - this.Get('chart.ymin')) * (3/5)) + this.Get('chart.ymin');
                this.scale[3] = ((this.max - this.Get('chart.ymin')) * (4/5)) + this.Get('chart.ymin');
                this.scale[4] = ((this.max - this.Get('chart.ymin')) * (5/5)) + this.Get('chart.ymin');
            }

            if (typeof(this.Get('chart.scale.decimals')) == 'number') {
                this.scale[0] = Number(this.scale[0]).toFixed(this.Get('chart.scale.decimals'));
                this.scale[1] = Number(this.scale[1]).toFixed(this.Get('chart.scale.decimals'));
                this.scale[2] = Number(this.scale[2]).toFixed(this.Get('chart.scale.decimals'));
                this.scale[3] = Number(this.scale[3]).toFixed(this.Get('chart.scale.decimals'));
                this.scale[4] = Number(this.scale[4]).toFixed(this.Get('chart.scale.decimals'));
            }
        }

        /**
        * Setup the context menu if required
        */
        if (this.Get('chart.contextmenu')) {
            RGraph.ShowContext(this);
        }

        /**
        * Reset the coords array otherwise it will keep growing
        */
        this.coords = [];

        /**
        * Work out a few things. They need to be here because they depend on things you can change before you
        * call Draw() but after you instantiate the object
        */
        this.grapharea      = this.canvas.height - this.gutterTop - this.gutterBottom;
        this.halfgrapharea  = this.grapharea / 2;
        this.halfTextHeight = this.Get('chart.text.size') / 2;

        // Check the combination of the X axis position and if there any negative values
        //
        // 19th Dec 2010 - removed for Opera since it can be reported incorrectly whn there
        // are multiple graphs on the page
        if (this.Get('chart.xaxispos') == 'bottom' && this.hasnegativevalues && navigator.userAgent.indexOf('Opera') == -1) {
            alert('[LINE] You have negative values and the X axis is at the bottom. This is not good...');
        }

        if (this.Get('chart.variant') == '3d') {
            RGraph.Draw3DAxes(this);
        }
        
        // Progressively Draw the chart
        RGraph.background.Draw(this);

        /**
        * Draw any horizontal bars that have been defined
        */
        if (this.Get('chart.background.hbars') && this.Get('chart.background.hbars').length > 0) {
            RGraph.DrawBars(this);
        }

        if (this.Get('chart.axesontop') == false) {
            this.DrawAxes();
        }

        /**
        * Handle the appropriate shadow color. This now facilitates an array of differing
        * shadow colors
        */
        var shadowColor = this.Get('chart.shadow.color');
        
        //if (typeof(shadowColor) == 'object') {
        //    shadowColor = RGraph.array_reverse(RGraph.array_clone(this.Get('chart.shadow.color')));
        //}


        for (var i=0, j=0; i<this.data.length; i++, j++) {

            this.context.beginPath();

            /**
            * Turn on the shadow if required
            */
            if (this.Get('chart.shadow') && !this.Get('chart.filled')) {

                /**
                * Accommodate an array of shadow colors as well as a single string
                */
                if (typeof(shadowColor) == 'object' && shadowColor[i - 1]) {
                    this.context.shadowColor = shadowColor[i];
                } else if (typeof(shadowColor) == 'object') {
                    this.context.shadowColor = shadowColor[0];
                } else if (typeof(shadowColor) == 'string') {
                    this.context.shadowColor = shadowColor;
                }

                this.context.shadowBlur    = this.Get('chart.shadow.blur');
                this.context.shadowOffsetX = this.Get('chart.shadow.offsetx');
                this.context.shadowOffsetY = this.Get('chart.shadow.offsety');
            
            } else if (this.Get('chart.filled') && this.Get('chart.shadow')) {
                alert('[LINE] Shadows are not permitted when the line is filled');
            }

            /**
            * Draw the line
            */

            if (this.Get('chart.fillstyle')) {
                if (typeof(this.Get('chart.fillstyle')) == 'object' && this.Get('chart.fillstyle')[j]) {
                   var fill = this.Get('chart.fillstyle')[j];
                
                } else if (typeof(this.Get('chart.fillstyle')) == 'string') {
                    var fill = this.Get('chart.fillstyle');
    
                } else {
                    alert('[LINE] Warning: chart.fillstyle must be either a string or an array with the same number of elements as you have sets of data');
                }
            } else if (this.Get('chart.filled')) {
                var fill = this.Get('chart.colors')[j];

            } else {
                var fill = null;
            }

            /**
            * Figure out the tickmark to use
            */
            if (this.Get('chart.tickmarks') && typeof(this.Get('chart.tickmarks')) == 'object') {
                var tickmarks = this.Get('chart.tickmarks')[i];
            } else if (this.Get('chart.tickmarks') && typeof(this.Get('chart.tickmarks')) == 'string') {
                var tickmarks = this.Get('chart.tickmarks');
            } else if (this.Get('chart.tickmarks') && typeof(this.Get('chart.tickmarks')) == 'function') {
                var tickmarks = this.Get('chart.tickmarks');
            } else {
                var tickmarks = null;
            }


            this.DrawLine(this.data[i],
                          this.Get('chart.colors')[j],
                          fill,
                          this.GetLineWidth(j),
                           tickmarks,
                           i);

            this.context.stroke();
        }

    /**
    * If the line is filled re-stroke the lines
    */
    if (this.Get('chart.filled') && this.Get('chart.filled.accumulative')) {

        for (var i=0; i<this.coords2.length; ++i) {

            this.context.beginPath();
            this.context.lineWidth = this.GetLineWidth(i);
            this.context.strokeStyle = this.Get('chart.colors')[i];

            for (var j=0; j<this.coords2[i].length; ++j) {

                if (j == 0 || this.coords2[i][j][1] == null || (this.coords2[i][j - 1] && this.coords2[i][j - 1][1] == null)) {
                    this.context.moveTo(this.coords2[i][j][0], this.coords2[i][j][1]);
                } else {
                    if (this.Get('chart.stepped')) {
                        this.context.lineTo(this.coords2[i][j][0], this.coords2[i][j - 1][1]);
                    }
                    this.context.lineTo(this.coords2[i][j][0], this.coords2[i][j][1]);
                }
            }
            
            this.context.stroke();
            // No fill!
        }

        //Redraw the tickmarks
        if (this.Get('chart.tickmarks')) {

            this.context.beginPath();

            this.context.fillStyle = 'white';
            
            for (var i=0; i<this.coords2.length; ++i) {

                this.context.beginPath();
                this.context.strokeStyle = this.Get('chart.colors')[i];
                for (var j=0; j<this.coords2[i].length; ++j) {
                    if (typeof(this.coords2[i][j]) == 'object' && typeof(this.coords2[i][j][0]) == 'number' && typeof(this.coords2[i][j][1]) == 'number') {
                        
                        var tickmarks = typeof(this.Get('chart.tickmarks')) == 'object' ? this.Get('chart.tickmarks')[i] : this.Get('chart.tickmarks');

                        this.DrawTick(  this.coords2[i][j],
                                        this.coords2[i][j][0],
                                        this.coords2[i][j][1],
                                        this.context.strokeStyle,
                                        false,
                                        j == 0 ? 0 : this.coords2[i][j - 1][0],
                                        j == 0 ? 0 : this.coords2[i][j - 1][1],
                                        tickmarks,
                                        j);
                    }
                }
            }

            this.context.stroke();
            this.context.fill();
        }
    }

    // ???
    this.context.beginPath();




        /**
        * If the axes have been requested to be on top, do that
        */
        if (this.Get('chart.axesontop')) {
            this.DrawAxes();
        }

        /**
        * Draw the labels
        */
        this.DrawLabels();
        
        /**
        * Draw the range if necessary
        */
        this.DrawRange();
        
        // Draw a key if necessary
        if (this.Get('chart.key').length && RGraph.DrawKey) {
            RGraph.DrawKey(this, this.Get('chart.key'), this.Get('chart.colors'));
        }

        /**
        * Draw " above" labels if enabled
        */
        if (this.Get('chart.labels.above')) {
            this.DrawAboveLabels();
        }

        /**
        * Draw the "in graph" labels
        */
        RGraph.DrawInGraphLabels(this);

        /**
        * Redraw the lines if a filled range is on the cards
        */
        if (this.Get('chart.filled') && this.Get('chart.filled.range') && this.data.length == 2) {

            this.context.beginPath();
            var len = this.coords.length / 2;
            this.context.lineWidth = this.Get('chart.linewidth');
            this.context.strokeStyle = this.Get('chart.colors')[0];

            for (var i=0; i<len; ++i) {
                if (i == 0) {
                    this.context.moveTo(this.coords[i][0], this.coords[i][1]);
                } else {
                    this.context.lineTo(this.coords[i][0], this.coords[i][1]);
                }
            }
            
            this.context.stroke();


            this.context.beginPath();
            
            if (this.Get('chart.colors')[1]) {
                this.context.strokeStyle = this.Get('chart.colors')[1];
            }
            
            for (var i=this.coords.length - 1; i>=len; --i) {
                if (i == (this.coords.length - 1) ) {
                    this.context.moveTo(this.coords[i][0], this.coords[i][1]);
                } else {
                    this.context.lineTo(this.coords[i][0], this.coords[i][1]);
                }
            }
            
            this.context.stroke();
        } else if (this.Get('chart.filled') && this.Get('chart.filled.range')) {
            alert('[LINE] You must have only two sets of data for a filled range chart');
        }
        
        /**
        * This function enables resizing
        */
        if (this.Get('chart.resizable')) {
            RGraph.AllowResizing(this);
        }


        /**
        * This installs the event listeners
        */
        RGraph.InstallEventListeners(this);


        
        /**
        * Fire the RGraph ondraw event
        */
        RGraph.FireCustomEvent(this, 'ondraw');
    }

    
    /**
    * Draws the axes
    */
    RGraph.Line.prototype.DrawAxes = function ()
    {
        // Don't draw the axes?
        if (this.Get('chart.noaxes')) {
            return;
        }

        // Turn any shadow off
        RGraph.NoShadow(this);

        this.context.lineWidth   = 1;
        this.context.lineCap = 'butt';
        this.context.strokeStyle = this.Get('chart.axis.color');
        this.context.beginPath();

        // Draw the X axis
        if (this.Get('chart.noxaxis') == false) {
            if (this.Get('chart.xaxispos') == 'center') {
                this.context.moveTo(this.gutterLeft, AA(this, (this.grapharea / 2) + this.gutterTop));
                this.context.lineTo(this.canvas.width - this.gutterRight, AA(this, (this.grapharea / 2) + this.gutterTop));
            } else if (this.Get('chart.xaxispos') == 'top') {
                this.context.moveTo(this.gutterLeft, AA(this, this.gutterTop));
                this.context.lineTo(this.canvas.width - this.gutterRight, AA(this, this.gutterTop));
            } else {
                this.context.moveTo(this.gutterLeft, AA(this, this.canvas.height - this.gutterBottom));
                this.context.lineTo(this.canvas.width - this.gutterRight, AA(this, this.canvas.height - this.gutterBottom));
            }
        }

        // Draw the Y axis
        if (this.Get('chart.noyaxis') == false) {
            if (this.Get('chart.yaxispos') == 'left') {
                this.context.moveTo(AA(this, this.gutterLeft), this.gutterTop);
                this.context.lineTo(AA(this, this.gutterLeft), this.canvas.height - this.gutterBottom );
            } else {
                this.context.moveTo(AA(this, this.canvas.width - this.gutterRight), this.gutterTop);
                this.context.lineTo(AA(this, this.canvas.width - this.gutterRight), this.canvas.height - this.gutterBottom);
            }
        }

        /**
        * Draw the X tickmarks
        */
        if (this.Get('chart.noxaxis') == false) {

            if (this.data[0].length > 0) {
                var xTickInterval = (this.canvas.width - this.gutterLeft - this.gutterRight) / (this.Get('chart.xticks') ? this.Get('chart.xticks') : (this.data[0].length - 1));
            }
            
            if (!xTickInterval || xTickInterval <= 0) {
                xTickInterval = (this.canvas.width - this.gutterLeft - this.gutterRight) / (this.Get('chart.labels') && this.Get('chart.labels').length ? this.Get('chart.labels').length - 1 : 10);
            }

            for (x=this.gutterLeft + (this.Get('chart.yaxispos') == 'left' ? xTickInterval : 0); x<=(this.canvas.width - this.gutterRight + 1 ); x+=xTickInterval) {

                if (this.Get('chart.yaxispos') == 'right' && x >= (this.canvas.width - this.gutterRight - 1) ) {
                    break;
                }

                // If the last tick is not desired...
                if (this.Get('chart.noendxtick')) {
                    if (this.Get('chart.yaxispos') == 'left' && x >= (this.canvas.width - this.gutterRight)) {
                        break;
                    } else if (this.Get('chart.yaxispos') == 'right' && x == this.gutterLeft) {
                        continue;
                    }
                }

                var yStart = this.Get('chart.xaxispos') == 'center' ? (this.gutterTop + (this.grapharea / 2)) - 3 : this.canvas.height - this.gutterBottom;
                var yEnd = this.Get('chart.xaxispos') == 'center' ? yStart + 6 : this.canvas.height - this.gutterBottom - (x % 60 == 0 ? this.Get('chart.largexticks') * this.Get('chart.tickdirection') : this.Get('chart.smallxticks') * this.Get('chart.tickdirection'));

                if (this.Get('chart.xaxispos') == 'center') {
                    var yStart = AA(this, (this.gutterTop + (this.grapharea / 2))) - 3;
                    var yEnd = yStart + 6;
                
                } else if (this.Get('chart.xaxispos') == 'bottom') {
                    var yStart = this.canvas.height - this.gutterBottom;
                    var yEnd  = this.canvas.height - this.gutterBottom - (x % 60 == 0 ? this.Get('chart.largexticks') * this.Get('chart.tickdirection') : this.Get('chart.smallxticks') * this.Get('chart.tickdirection'));
                        yEnd += 0.5;

                
                } else if (this.Get('chart.xaxispos') == 'top') {
                    yStart = this.gutterTop - 3;
                    yEnd   = this.gutterTop;
                }

                this.context.moveTo(AA(this, x), yStart);
                this.context.lineTo(AA(this, x), yEnd);
            }

        // Draw an extra tickmark if there is no X axis, but there IS a Y axis
        } else if (this.Get('chart.noyaxis') == false) {
            if (!this.Get('chart.noendytick')) {
                if (this.Get('chart.yaxispos') == 'left') {
                    this.context.moveTo(this.gutterLeft, AA(this, this.canvas.height - this.gutterBottom));
                    this.context.lineTo(this.gutterLeft - this.Get('chart.smallyticks'), AA(this, this.canvas.height - this.gutterBottom));
                } else {
                    this.context.moveTo(this.canvas.width - this.gutterRight, AA(this, this.canvas.height - this.gutterBottom));
                    this.context.lineTo(this.canvas.width - this.gutterRight + this.Get('chart.smallyticks'), AA(this, this.canvas.height - this.gutterBottom));
                }
            }
        }

        /**
        * Draw the Y tickmarks
        */
        var numyticks = this.Get('chart.numyticks');

        if (this.Get('chart.noyaxis') == false) {
            var counter    = 0;
            var adjustment = 0;
    
            if (this.Get('chart.yaxispos') == 'right') {
                adjustment = (this.canvas.width - this.gutterLeft - this.gutterRight);
            }
            
            // X axis at the center
            if (this.Get('chart.xaxispos') == 'center') {
                var interval = (this.grapharea / numyticks);
                var lineto = (this.Get('chart.yaxispos') == 'left' ? this.gutterLeft : this.canvas.width - this.gutterRight + this.Get('chart.smallyticks'));
    
                // Draw the upper halves Y tick marks
                for (y=this.gutterTop; y < (this.grapharea / 2) + this.gutterTop; y+=interval) {
                    if (y < (this.grapharea / 2) + this.gutterTop - 1) {
                        this.context.moveTo((this.Get('chart.yaxispos') == 'left' ? this.gutterLeft - this.Get('chart.smallyticks') : this.canvas.width - this.gutterRight), AA(this, y));
                        this.context.lineTo(lineto, AA(this, y));
                    }
                }
                
                // Draw the lower halves Y tick marks
                for (y=this.gutterTop + (this.halfgrapharea) + interval; y <= this.grapharea + this.gutterTop; y+=interval) {
                    this.context.moveTo((this.Get('chart.yaxispos') == 'left' ? this.gutterLeft - this.Get('chart.smallyticks') : this.canvas.width - this.gutterRight), AA(this, y));
                    this.context.lineTo(lineto, AA(this, y));
                }
            
            // X axis at the top
            } else if (this.Get('chart.xaxispos') == 'top') {
                var interval = (this.grapharea / numyticks);
                var lineto = (this.Get('chart.yaxispos') == 'left' ? this.gutterLeft : this.canvas.width - this.gutterRight + this.Get('chart.smallyticks'));

                // Draw the Y tick marks
                for (y=this.gutterTop + interval; y <=this.grapharea + this.gutterTop; y+=interval) {
                    this.context.moveTo((this.Get('chart.yaxispos') == 'left' ? this.gutterLeft - this.Get('chart.smallyticks') : this.canvas.width - this.gutterRight), AA(this, y));
                    this.context.lineTo(lineto, AA(this, y));
                }
                
                // If there's no X axis draw an extra tick
                if (this.Get('chart.noxaxis') && this.Get('chart.noendytick') == false) {
                    this.context.moveTo((this.Get('chart.yaxispos') == 'left' ? this.gutterLeft - this.Get('chart.smallyticks') : this.canvas.width - this.gutterRight), this.gutterTop);
                    this.context.lineTo(lineto, this.gutterTop);
                }
            
            // X axis at the bottom
            } else {

                var lineto = (this.Get('chart.yaxispos') == 'left' ? this.gutterLeft - this.Get('chart.smallyticks') : this.canvas.width - this.gutterRight + this.Get('chart.smallyticks'));

                for (y=this.gutterTop; y < (this.canvas.height - this.gutterBottom) && counter < numyticks; y+=( (this.canvas.height - this.gutterTop - this.gutterBottom) / numyticks) ) {

                    this.context.moveTo(this.gutterLeft + adjustment, AA(this, y));
                    this.context.lineTo(lineto, AA(this, y));
                
                    var counter = counter +1;
                }
            }

        // Draw an extra X tickmark
        } else if (this.Get('chart.noxaxis') == false) {

            if (this.Get('chart.yaxispos') == 'left') {
                this.context.moveTo(this.gutterLeft, this.Get('chart.xaxispos') == 'top' ? this.gutterTop : this.canvas.height - this.gutterBottom);
                this.context.lineTo(this.gutterLeft, this.Get('chart.xaxispos') == 'top' ? this.gutterTop - this.Get('chart.smallxticks') : this.canvas.height - this.gutterBottom + this.Get('chart.smallxticks'));
           } else {
                this.context.moveTo(this.canvas.width - this.gutterRight, this.canvas.height - this.gutterBottom);
                this.context.lineTo(this.canvas.width - this.gutterRight, this.canvas.height - this.gutterBottom + this.Get('chart.smallxticks'));
            }
        }

        this.context.stroke();
    }


    /**
    * Draw the text labels for the axes
    */
    RGraph.Line.prototype.DrawLabels = function ()
    {
        this.context.strokeStyle = 'black';
        this.context.fillStyle   = this.Get('chart.text.color');
        this.context.lineWidth   = 1;
        
        // Turn off any shadow
        RGraph.NoShadow(this);

        // This needs to be here
        var font      = this.Get('chart.text.font');
        var text_size = this.Get('chart.text.size');
        var context   = this.context;
        var canvas    = this.canvas;

        // Draw the Y axis labels
        if (this.Get('chart.ylabels') && this.Get('chart.ylabels.specific') == null) {

            var units_pre  = this.Get('chart.units.pre');
            var units_post = this.Get('chart.units.post');
            var xpos       = this.Get('chart.yaxispos') == 'left' ? this.gutterLeft - 5 : this.canvas.width - this.gutterRight + 5;
            var align      = this.Get('chart.yaxispos') == 'left' ? 'right' : 'left';
            
            var numYLabels = this.Get('chart.ylabels.count');
            var bounding   = false;
            var bgcolor    = this.Get('chart.ylabels.inside') ? this.Get('chart.ylabels.inside.color') : null;

            
            /**
            * If the Y labels are inside the Y axis, invert the alignment
            */
            if (this.Get('chart.ylabels.inside') == true && align == 'left') {
                xpos -= 10;
                align = 'right';
                bounding = true;
                

            } else if (this.Get('chart.ylabels.inside') == true && align == 'right') {
                xpos += 10;
                align = 'left';
                bounding = true;
            }



            if (this.Get('chart.xaxispos') == 'center') {
                var half = this.grapharea / 2;

                if (numYLabels == 1 || numYLabels == 3 || numYLabels == 5) {
                    //  Draw the upper halves labels
                    RGraph.Text(context, font, text_size, xpos, this.gutterTop + ( (0/5) * half ) + this.halfTextHeight, RGraph.number_format(this, this.scale[4], units_pre, units_post), null, align, bounding, null, bgcolor);
    
                    if (numYLabels == 5) {
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + ( (1/5) * half ) + this.halfTextHeight, RGraph.number_format(this, this.scale[3], units_pre, units_post), null, align, bounding, null, bgcolor);
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + ( (3/5) * half ) + this.halfTextHeight, RGraph.number_format(this, this.scale[1], units_pre, units_post), null, align, bounding, null, bgcolor);
                    }
    
                    if (numYLabels >= 3) {
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + ( (2/5) * half ) + this.halfTextHeight, RGraph.number_format(this, this.scale[2], units_pre, units_post), null, align, bounding, null, bgcolor);
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + ( (4/5) * half ) + this.halfTextHeight, RGraph.number_format(this, this.scale[0], units_pre, units_post), null, align, bounding, null, bgcolor);
                    }
                    
                    //  Draw the lower halves labels
                    if (numYLabels >= 3) {
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + ( (6/5) * half ) + this.halfTextHeight, '-' + RGraph.number_format(this, this.scale[0], units_pre, units_post), null, align, bounding, null, bgcolor);
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + ( (8/5) * half ) + this.halfTextHeight, '-' + RGraph.number_format(this, this.scale[2], units_pre, units_post), null, align, bounding, null, bgcolor);
                    }
    
                    if (numYLabels == 5) {
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + ( (7/5) * half ) + this.halfTextHeight, '-' + RGraph.number_format(this, this.scale[1], units_pre, units_post), null, align, bounding, null, bgcolor);
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + ( (9/5) * half ) + this.halfTextHeight, '-' + RGraph.number_format(this, this.scale[3], units_pre, units_post), null, align, bounding, null, bgcolor);
                    }
    
                    RGraph.Text(context, font, text_size, xpos, this.gutterTop + ( (10/5) * half ) + this.halfTextHeight, '-' + RGraph.number_format(this, (this.scale[4] == '1.0' ? '1.0' : this.scale[4]), units_pre, units_post), null, align, bounding, null, bgcolor);
                
                } else if (numYLabels == 10) {

                    // 10 Y labels
                    var interval = (this.grapharea / numYLabels) / 2;
                
                    for (var i=0; i<numYLabels; ++i) {
                        // This draws the upper halves labels
                        RGraph.Text(context,font, text_size, xpos, this.gutterTop + this.halfTextHeight + ((i/20) * (this.grapharea) ), RGraph.number_format(this, ((this.scale[4] / numYLabels) * (numYLabels - i)).toFixed((this.Get('chart.scale.decimals'))),units_pre, units_post), null, align, bounding, null, bgcolor);
                        
                        // And this draws the lower halves labels
                        RGraph.Text(context, font, text_size, xpos,
                        
                        this.gutterTop + this.halfTextHeight + ((i/20) * this.grapharea) + (this.grapharea / 2) + (this.grapharea / 20),
                        
                        '-' + RGraph.number_format(this, (this.scale[4] - ((this.scale[4] / numYLabels) * (numYLabels - i - 1))).toFixed((this.Get('chart.scale.decimals'))),units_pre, units_post), null, align, bounding, null, bgcolor);
                    }
                    
                } else {
                    alert('[LINE SCALE] The number of Y labels must be 1/3/5/10');
                }

                // Draw the lower limit if chart.ymin is specified
                if (typeof(this.Get('chart.ymin')) == 'number') {
                    RGraph.Text(context, font, text_size, xpos, this.canvas.height / 2, RGraph.number_format(this, this.Get('chart.ymin').toFixed(this.Get('chart.scale.decimals')), units_pre, units_post), 'center', align, bounding, null, bgcolor);
                }
                
                // No X axis - so draw 0
                if (this.Get('chart.noxaxis') == true) {
                    RGraph.Text(context,font,text_size,xpos,this.gutterTop + ( (5/5) * half ) + this.halfTextHeight,this.Get('chart.units.pre') + '0' + this.Get('chart.units.post'),null, align, bounding, null, bgcolor);
                }

            // X axis at the top
            } else if (this.Get('chart.xaxispos') == 'top') {

                var scale = RGraph.array_reverse(this.scale);

                /**
                * Accommodate reversing the Y labels
                */
                if (this.Get('chart.ylabels.invert')) {

                    scale = RGraph.array_reverse(scale);

                    this.context.translate(0, this.grapharea * -0.2);
                    if (typeof(this.Get('chart.ymin')) == null) {
                        this.Set('chart.ymin', 0);
                    }
                }

                if (numYLabels == 1 || numYLabels == 3 || numYLabels == 5) {
                    RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight + ((1/5) * (this.grapharea ) ), '-' + RGraph.number_format(this, scale[4], units_pre, units_post), null, align, bounding, null, bgcolor);
    
                    if (numYLabels == 5) {
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight + ((4/5) * (this.grapharea) ), '-' + RGraph.number_format(this, scale[1], units_pre, units_post), null, align, bounding, null, bgcolor);
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight + ((2/5) * (this.grapharea) ), '-' + RGraph.number_format(this, scale[3], units_pre, units_post), null, align, bounding, null, bgcolor);
                    }
    
                    if (numYLabels >= 3) {
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight + ((3/5) * (this.grapharea ) ), '-' + RGraph.number_format(this, scale[2], units_pre, units_post), null, align, bounding, null, bgcolor);
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight + ((5/5) * (this.grapharea) ), '-' + RGraph.number_format(this, scale[0], units_pre, units_post), null, align, bounding, null, bgcolor);
                    }
                
                } else if (numYLabels == 10) {

                    // 10 Y labels
                    var interval = (this.grapharea / numYLabels) / 2;

                    for (var i=0; i<numYLabels; ++i) {

                        RGraph.Text(context,font,text_size,xpos,(2 * interval) + this.gutterTop + this.halfTextHeight + ((i/10) * (this.grapharea) ),'-' + RGraph.number_format(this,(scale[0] - (((scale[0] - this.min) / numYLabels) * (numYLabels - i - 1))).toFixed((this.Get('chart.scale.decimals'))),units_pre,units_post),null,align,bounding,null,bgcolor);
                    }

                } else {
                    alert('[LINE SCALE] The number of Y labels must be 1/3/5/10');
                }


                /**
                * Accommodate translating back after reversing the labels
                */
                if (this.Get('chart.ylabels.invert')) {
                    this.context.translate(0, 0 - (this.grapharea * -0.2));
                }

                // Draw the lower limit if chart.ymin is specified
                if (typeof(this.Get('chart.ymin')) == 'number') {
                    RGraph.Text(context,font,text_size,xpos,this.Get('chart.ylabels.invert') ? this.canvas.height - this.gutterBottom : this.gutterTop,'-' + RGraph.number_format(this, this.Get('chart.ymin').toFixed(this.Get('chart.scale.decimals')), units_pre, units_post),'center',align,bounding,null,bgcolor);
                }

            } else {

                /**
                * Accommodate reversing the Y labels
                */
                if (this.Get('chart.ylabels.invert')) {
                    this.scale = RGraph.array_reverse(this.scale);
                    this.context.translate(0, this.grapharea * 0.2);
                    if (typeof(this.Get('chart.ymin')) == null) {
                        this.Set('chart.ymin', 0);
                    }
                }

                if (numYLabels == 1 || numYLabels == 3 || numYLabels == 5) {
                    RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight + ((0/5) * (this.grapharea ) ), RGraph.number_format(this, this.scale[4], units_pre, units_post), null, align, bounding, null, bgcolor);
    
                    if (numYLabels == 5) {
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight + ((3/5) * (this.grapharea) ), RGraph.number_format(this, this.scale[1], units_pre, units_post), null, align, bounding, null, bgcolor);
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight + ((1/5) * (this.grapharea) ), RGraph.number_format(this, this.scale[3], units_pre, units_post), null, align, bounding, null, bgcolor);
                    }
    
                    if (numYLabels >= 3) {
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight + ((2/5) * (this.grapharea ) ), RGraph.number_format(this, this.scale[2], units_pre, units_post), null, align, bounding, null, bgcolor);
                        RGraph.Text(context, font, text_size, xpos, this.gutterTop + this.halfTextHeight + ((4/5) * (this.grapharea) ), RGraph.number_format(this, this.scale[0], units_pre, units_post), null, align, bounding, null, bgcolor);
                    }
                
                } else if (numYLabels == 10) {

                    // 10 Y labels
                    var interval = (this.grapharea / numYLabels) / 2;
                
                    for (var i=0; i<numYLabels; ++i) {
                        RGraph.Text(context,font,text_size,xpos,this.gutterTop + this.halfTextHeight + ((i/10) * (this.grapharea) ),RGraph.number_format(this,((((this.scale[4] - this.min) / numYLabels) * (numYLabels - i)) + this.min).toFixed((this.Get('chart.scale.decimals'))),units_pre,units_post),null,align,bounding,null,bgcolor);
                    }

                } else {
                    alert('[LINE SCALE] The number of Y labels must be 1/3/5/10');
                }


                /**
                * Accommodate translating back after reversing the labels
                */
                if (this.Get('chart.ylabels.invert')) {
                    this.context.translate(0, 0 - (this.grapharea * 0.2));
                }

                // Draw the lower limit if chart.ymin is specified
                if (typeof(this.Get('chart.ymin')) == 'number') {
                    RGraph.Text(context,font,text_size,xpos,this.Get('chart.ylabels.invert') ? this.gutterTop : this.canvas.height - this.gutterBottom,RGraph.number_format(this, this.Get('chart.ymin').toFixed(this.Get('chart.scale.decimals')), units_pre, units_post),'center',align,bounding,null,bgcolor);
                }
            }

            // No X axis - so draw 0 - but not if the X axis is in the center
            if (   this.Get('chart.noxaxis') == true
                && this.Get('chart.ymin') == null
                && this.Get('chart.xaxispos') != 'center'
                && this.Get('chart.noendytick') == false
               ) {

                RGraph.Text(context,font,text_size,xpos,this.Get('chart.xaxispos') == 'top' ? this.gutterTop + this.halfTextHeight: (this.canvas.height - this.gutterBottom + this.halfTextHeight),this.Get('chart.units.pre') + '0' + this.Get('chart.units.post'),null, align, bounding, null, bgcolor);
            }
        
        } else if (this.Get('chart.ylabels') && typeof(this.Get('chart.ylabels.specific')) == 'object') {
            
            // A few things
            var gap      = this.grapharea / this.Get('chart.ylabels.specific').length;
            var halign   = this.Get('chart.yaxispos') == 'left' ? 'right' : 'left';
            var bounding = false;
            var bgcolor  = null;
            var ymin     = this.Get('chart.ymin') != null && this.Get('chart.ymin');

            // Figure out the X coord based on the position of the axis
            if (this.Get('chart.yaxispos') == 'left') {
                var x = this.gutterLeft - 5;
                
                if (this.Get('chart.ylabels.inside')) {
                    x += 10;
                    halign   = 'left';
                    bounding = true;
                    bgcolor  = 'rgba(255,255,255,0.5)';
                }

            } else if (this.Get('chart.yaxispos') == 'right') {
                var x = this.canvas.width - this.gutterRight + 5;
                
                if (this.Get('chart.ylabels.inside')) {
                    x -= 10;
                    halign = 'right';
                    bounding = true;
                    bgcolor  = 'rgba(255,255,255,0.5)';
                }
            }


            // Draw the labels
            if (this.Get('chart.xaxispos') == 'center') {
            
                // Draw the top halfs labels
                for (var i=0; i<this.Get('chart.ylabels.specific').length; ++i) {
                    var y = this.gutterTop + (this.grapharea / ((this.Get('chart.ylabels.specific').length ) * 2) * i);
                    
                    if (ymin && ymin > 0) {
                        var y  = ((this.grapharea / 2) / (this.Get('chart.ylabels.specific').length - (ymin ? 1 : 0)) ) * i;
                            y += this.gutterTop;
                    }
                    
                    RGraph.Text(context, font, text_size,x,y,String(this.Get('chart.ylabels.specific')[i]), 'center', halign, bounding, 0, bgcolor);
                }
                
                // Now reverse the labels and draw the bottom half
                var reversed_labels = RGraph.array_reverse(this.Get('chart.ylabels.specific'));
            
                // Draw the bottom halfs labels
                for (var i=0; i<reversed_labels.length; ++i) {
                    var y = (this.grapharea / 2) + this.gutterTop + ((this.grapharea / (reversed_labels.length * 2) ) * (i + 1));

                    if (ymin && ymin > 0) {
                        var y  = ((this.grapharea / 2) / (reversed_labels.length - (ymin ? 1 : 0)) ) * i;
                            y += this.gutterTop;
                            y += (this.grapharea / 2);
                    }

                    RGraph.Text(context, font, text_size,x,y,String(reversed_labels[i]), 'center', halign, bounding, 0, bgcolor);
                }
            
            } else if (this.Get('chart.xaxispos') == 'top') {

                // Reverse the labels and draw
                var reversed_labels = RGraph.array_reverse(this.Get('chart.ylabels.specific'));
            
                // Draw the bottom halfs labels
                for (var i=0; i<reversed_labels.length; ++i) {
                    
                    var y = ((this.grapharea / (reversed_labels.length - (ymin ? 1 : 0)) ) * (i + (ymin ? 0 : 1)));
                        y = y + this.gutterTop;

                    RGraph.Text(context, font, text_size,x,y,String(reversed_labels[i]), 'center', halign, bounding, 0, bgcolor);
                }

            } else {
                for (var i=0; i<this.Get('chart.ylabels.specific').length; ++i) {
                    var y = this.gutterTop + ((this.grapharea / (this.Get('chart.ylabels.specific').length - (ymin ? 1 : 0) )) * i);
                    RGraph.Text(context, font, text_size,x,y,String(this.Get('chart.ylabels.specific')[i]), 'center', halign, bounding, 0, bgcolor);
                }
            }
        }

        // Draw the X axis labels
        if (this.Get('chart.labels') && this.Get('chart.labels').length > 0) {

            var yOffset  = 5;
            var bordered = false;
            var bgcolor  = null;

            /**
            * Text angle
            */
            var angle  = 0;
            var valign = 'top';
            var halign = 'center';

            if (this.Get('chart.xlabels.inside')) {
                yOffset = -5;
                bordered = true;
                bgcolor  = this.Get('chart.xlabels.inside.color');
                valign = 'bottom';
            }
            
            if (this.Get('chart.xaxispos') == 'top') {
                valign = 'bottom';
                yOffset += 2;
            }

            if (typeof(this.Get('chart.text.angle')) == 'number' && this.Get('chart.text.angle') > 0) {
                angle   = -1 * this.Get('chart.text.angle');
                valign  = 'center';
                halign  = 'right';
                yOffset = 10;
                
                if (this.Get('chart.xaxispos') == 'top') {
                    yOffset = 10;
                }
            }

            this.context.fillStyle = this.Get('chart.text.color');
            var numLabels = this.Get('chart.labels').length;

            for (i=0; i<numLabels; ++i) {

                // Changed 8th Nov 2010 to be not reliant on the coords
                //if (this.Get('chart.labels')[i] && this.coords && this.coords[i] && this.coords[i][0]) {
                if (this.Get('chart.labels')[i]) {

                    var labelX = ((this.canvas.width - this.gutterLeft - this.gutterRight - (2 * this.Get('chart.hmargin'))) / (numLabels - 1) ) * i;
                        labelX += this.gutterLeft + this.Get('chart.hmargin');

                    /**
                    * Account for an unrelated number of labels
                    */
                    if (this.Get('chart.labels').length != this.data[0].length) {
                        labelX = this.gutterLeft + this.Get('chart.hmargin') + ((this.canvas.width - this.gutterLeft - this.gutterRight - (2 * this.Get('chart.hmargin'))) * (i / (this.Get('chart.labels').length - 1)));
                    }
                    
                    // This accounts for there only being one point on the chart
                    if (!labelX) {
                        labelX = this.gutterLeft + this.Get('chart.hmargin');
                    }

                    if (this.Get('chart.xaxispos') == 'top' && this.Get('chart.text.angle') > 0) {
                        halign = 'left';
                    }

                    RGraph.Text(context,
                                font,
                                text_size,
                                labelX,
                                (this.Get('chart.xaxispos') == 'top') ? this.gutterTop - yOffset - (this.Get('chart.xlabels.inside') ? -22 : 0) : (this.canvas.height - this.gutterBottom) + yOffset,
                                String(this.Get('chart.labels')[i]),
                                valign,
                                halign,
                                bordered,
                                angle,
                                bgcolor);
                }
            }

        }

        this.context.stroke();
        this.context.fill();
    }


    /**
    * Draws the line
    */
    RGraph.Line.prototype.DrawLine = function (lineData, color, fill, linewidth, tickmarks, index)
    {
        // This facilitates the Rise animation (the Y value only)
        if (this.Get('chart.animation.unfold.y') && this.Get('chart.animation.factor') != 1) {
            for (var i=0; i<lineData.length; ++i) {
                lineData[i] *= this.Get('chart.animation.factor');
            }
        }

        var penUp = false;
        var yPos  = null;
        var xPos  = 0;
        this.context.lineWidth = 1;
        var lineCoords = [];
        
        /**
        * Get the previous line data
        */
        if (index > 0) {
            var prevLineCoords = this.coords2[index - 1];
        }

        // Work out the X interval
        var xInterval = (this.canvas.width - (2 * this.Get('chart.hmargin')) - this.gutterLeft - this.gutterRight) / (lineData.length - 1);

        // Loop thru each value given, plotting the line
        // (FORMERLY FIRST)
        for (i=0; i<lineData.length; i++) {

            var data_point = lineData[i];

            yPos = this.canvas.height - (((data_point - (data_point > 0 ?  this.Get('chart.ymin') : (-1 * this.Get('chart.ymin')))) / (this.max - this.min) ) * this.grapharea);
            yPos = (this.grapharea / (this.max - this.min)) * (data_point - this.min);
            yPos = this.canvas.height - yPos;

            /**
            * This skirts an annoying JS rounding error
            * SEARCH TAGS: JS ROUNDING ERROR DECIMALS
            */
            if (data_point == this.max) {
                yPos = Math.round(yPos);
            }

            if (this.Get('chart.ylabels.invert')) {
                yPos -= this.gutterBottom;
                yPos -= this.gutterTop;
                yPos = this.canvas.height - yPos;
            }

            // Make adjustments depending on the X axis position
            if (this.Get('chart.xaxispos') == 'center') {
                yPos = (yPos - this.gutterBottom - this.gutterTop) / 2;
                yPos = yPos + this.gutterTop;

            
            // TODO Check this
            } else if (this.Get('chart.xaxispos') == 'top') {

                yPos = (this.grapharea / (this.max - this.min)) * (Math.abs(data_point) - this.min);
                yPos += this.gutterTop;
                
                if (this.Get('chart.ylabels.invert')) {
                    yPos -= this.gutterTop;
                    yPos  = this.grapharea - yPos;
                    yPos += this.gutterTop;
                }

            } else if (this.Get('chart.xaxispos') == 'bottom') {
                // TODO
                yPos -= this.gutterBottom; // Without this the line is out of place due to the gutter
            }



            // Null data points, and a special case for this bug:http://dev.rgraph.net/tests/ymin.html
            if (   lineData[i] == null
                || (this.Get('chart.xaxispos') == 'bottom' && lineData[i] < this.min && !this.Get('chart.outofbounds'))
                ||  (this.Get('chart.xaxispos') == 'center' && lineData[i] < (-1 * this.max) && !this.Get('chart.outofbounds'))) {

                yPos = null;
            }

            // Not always very noticeable, but it does have an effect
            // with thick lines
            this.context.lineCap  = 'round';
            this.context.lineJoin = 'round';

            // Plot the line if we're at least on the second iteration
            if (i > 0) {
                xPos = xPos + xInterval;
            } else {
                xPos = this.Get('chart.hmargin') + this.gutterLeft;
            }
            
            if (this.Get('chart.animation.unfold.x')) {
                xPos *= this.Get('chart.animation.factor');
                
                if (xPos < this.Get('chart.gutter.left')) {
                    xPos = this.Get('chart.gutter.left');
                }
            }

            /**
            * Add the coords to an array
            */
            this.coords.push([xPos, yPos]);
            lineCoords.push([xPos, yPos]);
        }
        
        this.context.stroke();

        // Store the coords in another format, indexed by line number
        this.coords2[index] = lineCoords;

        /**
        * For IE only: Draw the shadow ourselves as ExCanvas doesn't produce shadows
        */
        if (RGraph.isOld() && this.Get('chart.shadow')) {
            this.DrawIEShadow(lineCoords, this.context.shadowColor);
        }

        /**
        * Now draw the actual line [FORMERLY SECOND]
        */
        this.context.beginPath();
        // Transparent now as of 11/19/2011
        this.context.strokeStyle = 'rgba(0,0,0,0)';
        //this.context.strokeStyle = fill;
        if (fill) {
            this.context.fillStyle   = fill;
        }

        var isStepped = this.Get('chart.stepped');
        var isFilled = this.Get('chart.filled');
        
        if (this.Get('chart.xaxispos') == 'top') {
            var xAxisPos = this.gutterTop;
        } else if (this.Get('chart.xaxispos') == 'center') {
            var xAxisPos = this.gutterTop + (this.grapharea / 2);
        } else if (this.Get('chart.xaxispos') == 'bottom') {
            var xAxisPos = this.canvas.height - this.gutterBottom;
        }


        for (var i=0; i<lineCoords.length; ++i) {

            xPos = lineCoords[i][0];
            yPos = lineCoords[i][1];
            var set = index;

            var prevY     = (lineCoords[i - 1] ? lineCoords[i - 1][1] : null);
            var isLast    = (i + 1) == lineCoords.length;

            /**
            * This nullifys values which are out-of-range
            */
            if (prevY < this.gutterTop || prevY > (this.canvas.height - this.gutterBottom) ) {
                penUp = true;
            }

            if (i == 0 || penUp || !yPos || !prevY || prevY < this.gutterTop) {

                if (this.Get('chart.filled') && !this.Get('chart.filled.range')) {

                    this.context.moveTo(xPos + 1, xAxisPos);

                    // This facilitates the X axis being at the top
                    // NOTE: Also done below
                    if (this.Get('chart.xaxispos') == 'top') {
                        this.context.moveTo(xPos + 1, xAxisPos);
                    }

                    this.context.lineTo(xPos, yPos);

                } else {

                    if (RGraph.isOld() && yPos == null) {
                        // Nada
                    } else {
                        this.context.moveTo(xPos + 1, yPos);
                    }
                }

                if (yPos == null) {
                    penUp = true;

                } else {
                    penUp = false;
                }

            } else {

                // Draw the stepped part of stepped lines
                if (isStepped) {
                    this.context.lineTo(xPos, lineCoords[i - 1][1]);
                }

                if ((yPos >= this.gutterTop && yPos <= (this.canvas.height - this.gutterBottom)) || this.Get('chart.outofbounds') ) {

                    if (isLast && this.Get('chart.filled') && !this.Get('chart.filled.range') && this.Get('chart.yaxispos') == 'right') {
                        xPos -= 1;
                    }


                    // Added 8th September 2009
                    if (!isStepped || !isLast) {
                        this.context.lineTo(xPos, yPos);
                        
                        if (isFilled && lineCoords[i+1] && lineCoords[i+1][1] == null) {
                            this.context.lineTo(xPos, xAxisPos);
                        }
                    
                    // Added August 2010
                    } else if (isStepped && isLast) {
                        this.context.lineTo(xPos,yPos);
                    }


                    penUp = false;
                } else {
                    penUp = true;
                }
            }
        }

        /**
        * Draw a line to the X axis if the chart is filled
        */
        if (this.Get('chart.filled') && !this.Get('chart.filled.range')) {

            // Is this needed ??
            var fillStyle = this.Get('chart.fillstyle');

            /**
            * Draw the bottom edge of the filled bit using either the X axis or the prevlinedata,
            * depending on the index of the line. The first line uses the X axis, and subsequent
            * lines use the prevLineCoords array
            */
            if (index > 0 && this.Get('chart.filled.accumulative')) {
                
                this.context.lineTo(xPos, prevLineCoords ? prevLineCoords[i - 1][1] : (this.canvas.height - this.gutterBottom - 1 + (this.Get('chart.xaxispos') == 'center' ? (this.canvas.height - this.gutterTop - this.gutterBottom) / 2 : 0)));
            
                for (var k=(i - 1); k>=0; --k) {
                    this.context.lineTo(k == 0 ? prevLineCoords[k][0] + 1: prevLineCoords[k][0], prevLineCoords[k][1]);
                }
            } else {

                // Draw a line down to the X axis
                if (this.Get('chart.xaxispos') == 'top') {
                    this.context.lineTo(xPos, this.Get('chart.gutter.top') +  1);
                    this.context.lineTo(lineCoords[0][0],this.Get('chart.gutter.top') + 1);
                } else if (typeof(lineCoords[i - 1][1]) == 'number') {

                    var yPosition = this.Get('chart.xaxispos') == 'center' ? ((this.canvas.height - this.gutterTop - this.gutterBottom) / 2) + this.gutterTop : this.canvas.height - this.gutterBottom;

                    this.context.lineTo(xPos,yPosition);
                    this.context.lineTo(lineCoords[0][0],yPosition);
                }
            }

            this.context.fillStyle = fill;

            this.context.fill();
            this.context.beginPath();

        }

        /**
        * FIXME this may need removing when Chrome is fixed
        * SEARCH TAGS: CHROME SHADOW BUG
        */
        if (navigator.userAgent.match(/Chrome/) && this.Get('chart.shadow') && this.Get('chart.chromefix') && this.Get('chart.shadow.blur') > 0) {

            for (var i=lineCoords.length - 1; i>=0; --i) {
                if (
                       typeof(lineCoords[i][1]) != 'number'
                    || (typeof(lineCoords[i+1]) == 'object' && typeof(lineCoords[i+1][1]) != 'number')
                   ) {
                    this.context.moveTo(lineCoords[i][0],lineCoords[i][1]);
                } else {
                    this.context.lineTo(lineCoords[i][0],lineCoords[i][1]);
                }
            }
        }

        this.context.stroke();


        if (this.Get('chart.backdrop')) {
            this.DrawBackdrop(lineCoords, color);
        }

        // Now redraw the lines with the correct line width
        this.RedrawLine(lineCoords, color, linewidth);
        
        this.context.stroke();

        // Draw the tickmarks
        for (var i=0; i<lineCoords.length; ++i) {

            i = Number(i);

            if (isStepped && i == (lineCoords.length - 1)) {
                this.context.beginPath();
                //continue;
            }

            if (
                (
                    tickmarks != 'endcircle'
                 && tickmarks != 'endsquare'
                 && tickmarks != 'filledendsquare'
                 && tickmarks != 'endtick'
                 && tickmarks != 'endtriangle'
                 && tickmarks != 'arrow'
                 && tickmarks != 'filledarrow'
                )
                || (i == 0 && tickmarks != 'arrow' && tickmarks != 'filledarrow')
                || i == (lineCoords.length - 1)
               ) {

                var prevX = (i <= 0 ? null : lineCoords[i - 1][0]);
                var prevY = (i <= 0 ? null : lineCoords[i - 1][1]);

                this.DrawTick(lineData, lineCoords[i][0], lineCoords[i][1], color, false, prevX, prevY, tickmarks, i);

                // Draws tickmarks on the stepped bits of stepped charts. Takend out 14th July 2010
                //
                //if (this.Get('chart.stepped') && lineCoords[i + 1] && this.Get('chart.tickmarks') != 'endsquare' && this.Get('chart.tickmarks') != 'endcircle' && this.Get('chart.tickmarks') != 'endtick') {
                //    this.DrawTick(lineCoords[i + 1][0], lineCoords[i][1], color);
                //}
            }
        }

        // Draw something off canvas to skirt an annoying bug
        this.context.beginPath();
        this.context.arc(this.canvas.width + 50000, this.canvas.height + 50000, 2, 0, 6.38, 1);
    }
    
    
    /**
    * This functions draws a tick mark on the line
    * 
    * @param xPos  int  The x position of the tickmark
    * @param yPos  int  The y position of the tickmark
    * @param color str  The color of the tickmark
    * @param       bool Whether the tick is a shadow. If it is, it gets offset by the shadow offset
    */
    RGraph.Line.prototype.DrawTick = function (lineData, xPos, yPos, color, isShadow, prevX, prevY, tickmarks, index)
    {
        // If the yPos is null - no tick
        if ((yPos == null || yPos > (this.canvas.height - this.gutterBottom) || yPos < this.gutterTop) && !this.Get('chart.outofbounds') || !this.Get('chart.line.visible')) {
            return;
        }

        this.context.beginPath();

        var offset   = 0;

        // Reset the stroke and lineWidth back to the same as what they were when the line was drawm
        // UPDATE 28th July 2011 - the line width is now set to 1
        this.context.lineWidth   = this.Get('chart.tickmarks.linewidth') ? this.Get('chart.tickmarks.linewidth') : this.Get('chart.linewidth');
        this.context.strokeStyle = isShadow ? this.Get('chart.shadow.color') : this.context.strokeStyle;
        this.context.fillStyle   = isShadow ? this.Get('chart.shadow.color') : this.context.strokeStyle;

        // Cicular tick marks
        if (   tickmarks == 'circle'
            || tickmarks == 'filledcircle'
            || tickmarks == 'endcircle') {

            if (tickmarks == 'circle'|| tickmarks == 'filledcircle' || (tickmarks == 'endcircle') ) {
                this.context.beginPath();
                this.context.arc(xPos + offset, yPos + offset, this.Get('chart.ticksize'), 0, 360 / (180 / Math.PI), false);

                if (tickmarks == 'filledcircle') {
                    this.context.fillStyle = isShadow ? this.Get('chart.shadow.color') : this.context.strokeStyle;
                } else {
                    this.context.fillStyle = isShadow ? this.Get('chart.shadow.color') : 'white';
                }

                this.context.stroke();
                this.context.fill();
            }

        // Halfheight "Line" style tick marks
        } else if (tickmarks == 'halftick') {
            this.context.beginPath();
            this.context.moveTo(xPos, yPos);
            this.context.lineTo(xPos, yPos + this.Get('chart.ticksize'));

            this.context.stroke();
        
        // Tick style tickmarks
        } else if (tickmarks == 'tick') {
            this.context.beginPath();
            this.context.moveTo(xPos, yPos -  this.Get('chart.ticksize'));
            this.context.lineTo(xPos, yPos + this.Get('chart.ticksize'));

            this.context.stroke();
        
        // Endtick style tickmarks
        } else if (tickmarks == 'endtick') {
            this.context.beginPath();
            this.context.moveTo(xPos, yPos -  this.Get('chart.ticksize'));
            this.context.lineTo(xPos, yPos + this.Get('chart.ticksize'));

            this.context.stroke();
        
        // "Cross" style tick marks
        } else if (tickmarks == 'cross') {
            this.context.beginPath();
            this.context.moveTo(xPos - this.Get('chart.ticksize'), yPos - this.Get('chart.ticksize'));
            this.context.lineTo(xPos + this.Get('chart.ticksize'), yPos + this.Get('chart.ticksize'));
            this.context.moveTo(xPos + this.Get('chart.ticksize'), yPos - this.Get('chart.ticksize'));
            this.context.lineTo(xPos - this.Get('chart.ticksize'), yPos + this.Get('chart.ticksize'));
            
            this.context.stroke();


        // Triangle style tick marks
        } else if (tickmarks == 'triangle' || tickmarks == 'filledtriangle' || tickmarks == 'endtriangle') {
            this.context.beginPath();
                
                if (tickmarks == 'filledtriangle') {
                    this.context.fillStyle = isShadow ? this.Get('chart.shadow.color') : this.context.strokeStyle;
                } else {
                    this.context.fillStyle = 'white';
                }

                this.context.moveTo(xPos - this.Get('chart.ticksize'), yPos + this.Get('chart.ticksize'));
                this.context.lineTo(xPos, yPos - this.Get('chart.ticksize'));
                this.context.lineTo(xPos + this.Get('chart.ticksize'), yPos + this.Get('chart.ticksize'));
            this.context.closePath();
            
            this.context.stroke();
            this.context.fill();


        // A white bordered circle
        } else if (tickmarks == 'borderedcircle' || tickmarks == 'dot') {
                this.context.lineWidth   = 1;
                this.context.strokeStyle = this.Get('chart.tickmarks.dot.color');
                this.context.fillStyle   = this.Get('chart.tickmarks.dot.color');

                // The outer white circle
                this.context.beginPath();
                this.context.arc(xPos, yPos, this.Get('chart.ticksize'), 0, 360 / (180 / Math.PI), false);
                this.context.closePath();


                this.context.fill();
                this.context.stroke();
                
                // Now do the inners
                this.context.beginPath();
                this.context.fillStyle   = color;
                this.context.strokeStyle = color;
                this.context.arc(xPos, yPos, this.Get('chart.ticksize') - 2, 0, 360 / (180 / Math.PI), false);

                this.context.closePath();

                this.context.fill();
                this.context.stroke();
        
        } else if (   tickmarks == 'square'
                   || tickmarks == 'filledsquare'
                   || (tickmarks == 'endsquare')
                   || (tickmarks == 'filledendsquare') ) {

            this.context.fillStyle   = 'white';
            this.context.strokeStyle = this.context.strokeStyle; // FIXME Is this correct?

            this.context.beginPath();
            this.context.strokeRect(xPos - this.Get('chart.ticksize'), yPos - this.Get('chart.ticksize'), this.Get('chart.ticksize') * 2, this.Get('chart.ticksize') * 2);

            // Fillrect
            if (tickmarks == 'filledsquare' || tickmarks == 'filledendsquare') {
                this.context.fillStyle = isShadow ? this.Get('chart.shadow.color') : this.context.strokeStyle;
                this.context.fillRect(xPos - this.Get('chart.ticksize'), yPos - this.Get('chart.ticksize'), this.Get('chart.ticksize') * 2, this.Get('chart.ticksize') * 2);

            } else if (tickmarks == 'square' || tickmarks == 'endsquare') {
                this.context.fillStyle = isShadow ? this.Get('chart.shadow.color') : 'white';
                this.context.fillRect((xPos - this.Get('chart.ticksize')) + 1, (yPos - this.Get('chart.ticksize')) + 1, (this.Get('chart.ticksize') * 2) - 2, (this.Get('chart.ticksize') * 2) - 2);
            }

            this.context.stroke();
            this.context.fill();

        /**
        * FILLED arrowhead
        */
        } else if (tickmarks == 'filledarrow') {
        
            var x = Math.abs(xPos - prevX);
            var y = Math.abs(yPos - prevY);

            if (yPos < prevY) {
                var a = Math.atan(x / y) + 1.57;
            } else {
                var a = Math.atan(y / x) + 3.14;
            }

            this.context.beginPath();
                this.context.moveTo(xPos, yPos);
                this.context.arc(xPos, yPos, 7, a - 0.5, a + 0.5, false);
            this.context.closePath();

            this.context.stroke();
            this.context.fill();

        /**
        * Arrow head, NOT filled
        */
        } else if (tickmarks == 'arrow') {

            var x = Math.abs(xPos - prevX);
            var y = Math.abs(yPos - prevY);
            
            var orig_linewidth = this.context.lineWidth;

            if (yPos < prevY) {
                var a = Math.atan(x / y) + 1.57;
            } else {
                var a = Math.atan(y / x) + 3.14;
            }

            this.context.beginPath();
                this.context.moveTo(xPos, yPos);
                this.context.arc(xPos, yPos, 7, a - 0.5 - (document.all ? 0.1 : 0.01), a - 0.4, false);

                this.context.moveTo(xPos, yPos);
                this.context.arc(xPos, yPos, 7, a + 0.5 + (document.all ? 0.1 : 0.01), a + 0.5, true);
            this.context.stroke();
            this.context.fill();
            
            // Revert to original lineWidth
            this.context.lineWidth = orig_linewidth;
        
        /**
        * Custom tick drawing function
        */
        } else if (typeof(tickmarks) == 'function') {
            tickmarks(this, lineData, lineData[index], index, xPos, yPos, color, prevX, prevY);
        }
    }


    /**
    * Draws a filled range if necessary
    */
    RGraph.Line.prototype.DrawRange = function ()
    {
        /**
        * Fill the range if necessary
        */
        if (this.Get('chart.filled.range') && this.Get('chart.filled')) {
            this.context.beginPath();
            this.context.fillStyle = this.Get('chart.fillstyle');
            this.context.strokeStyle = this.Get('chart.fillstyle');
            this.context.lineWidth = 1;
            var len = (this.coords.length / 2);

            for (var i=0; i<len; ++i) {
                if (i == 0) {
                    this.context.moveTo(this.coords[i][0], this.coords[i][1])
                } else {
                    this.context.lineTo(this.coords[i][0], this.coords[i][1])
                }
            }

            for (var i=this.coords.length - 1; i>=len; --i) {
                this.context.lineTo(this.coords[i][0], this.coords[i][1])
            }
            this.context.stroke();
            this.context.fill();
        }
    }


    /**
    * Redraws the line with the correct line width etc
    * 
    * @param array coords The coordinates of the line
    */
    RGraph.Line.prototype.RedrawLine = function (coords, color, linewidth)
    {
        if (this.Get('chart.noredraw')) {
            return;
        }

        this.context.strokeStyle = (typeof(color) == 'object' && color ? color[0] : color);
        this.context.lineWidth = linewidth;
        
        if (!this.Get('chart.line.visible')) {
            this.context.strokeStyle = 'rgba(0,0,0,0)';
        }

        if (this.Get('chart.curvy')) {
            this.DrawCurvyLine(coords, !this.Get('chart.line.visible') ? 'rgba(0,0,0,0)' : color, linewidth);
            return;
        }

        this.context.beginPath();

        var len    = coords.length;
        var width  = this.canvas.width
        var height = this.canvas.height;
        var penUp  = false;

        for (var i=0; i<len; ++i) {

            var xPos   = coords[i][0];
            var yPos   = coords[i][1];

            if (i > 0) {
                var prevX = coords[i - 1][0];
                var prevY = coords[i - 1][1];
            }


            if ((
                   (i == 0 && coords[i])
                || (yPos < this.gutterTop)
                || (prevY < this.gutterTop)
                || (yPos > (height - this.gutterBottom))
                || (i > 0 && prevX > (width - this.gutterRight))
                || (i > 0 && prevY > (height - this.gutterBottom))
                || prevY == null
                || penUp == true
               ) && (!this.Get('chart.outofbounds') || yPos == null || prevY == null) ) {

                if (RGraph.isOld() && yPos == null) {
                    // ...?
                } else {
                    this.context.moveTo(coords[i][0], coords[i][1]);
                }

                penUp = false;

            } else {

                if (this.Get('chart.stepped') && i > 0) {
                    this.context.lineTo(coords[i][0], coords[i - 1][1]);
                }
                
                // Don't draw the last bit of a stepped chart. Now DO
                //if (!this.Get('chart.stepped') || i < (coords.length - 1)) {
                this.context.lineTo(coords[i][0], coords[i][1]);
                //}
                penUp = false;
            }
        }

        /**
        * If two colors are specified instead of one, go over the up bits
        */
        if (this.Get('chart.colors.alternate') && typeof(color) == 'object' && color[0] && color[1]) {
            for (var i=1; i<len; ++i) {

                var prevX = coords[i - 1][0];
                var prevY = coords[i - 1][1];
                
                this.context.beginPath();
                this.context.strokeStyle = color[coords[i][1] < prevY ? 0 : 1];
                this.context.lineWidth = this.Get('chart.linewidth');
                this.context.moveTo(prevX, prevY);
                this.context.lineTo(coords[i][0], coords[i][1]);
                this.context.stroke();
            }
        }
    }


    /**
    * This function is used by MSIE only to manually draw the shadow
    * 
    * @param array coords The coords for the line
    */
    RGraph.Line.prototype.DrawIEShadow = function (coords, color)
    {
        var offsetx = this.Get('chart.shadow.offsetx');
        var offsety = this.Get('chart.shadow.offsety');
        
        this.context.lineWidth   = this.Get('chart.linewidth');
        this.context.strokeStyle = color;
        this.context.beginPath();

        for (var i=0; i<coords.length; ++i) {
            if (i == 0) {
                this.context.moveTo(coords[i][0] + offsetx, coords[i][1] + offsety);
            } else {
                this.context.lineTo(coords[i][0] + offsetx, coords[i][1] + offsety);
            }
        }

        this.context.stroke();
    }


    /**
    * Draw the backdrop
    */
    RGraph.Line.prototype.DrawBackdrop = function (coords, color)
    {
        var size = this.Get('chart.backdrop.size');
        this.context.lineWidth = size;
        this.context.globalAlpha = this.Get('chart.backdrop.alpha');
        this.context.strokeStyle = color;
        this.context.lineJoin = 'miter';
        
        this.context.beginPath();
            this.context.moveTo(coords[0][0], coords[0][1]);
            for (var j=1; j<coords.length; ++j) {
                this.context.lineTo(coords[j][0], coords[j][1]);
            }
    
        this.context.stroke();
    
        // Reset the alpha value
        this.context.globalAlpha = 1;
        this.context.lineJoin = 'round';
        RGraph.NoShadow(this);
    }


    /**
    * Returns the linewidth
    */
    RGraph.Line.prototype.GetLineWidth = function (i)
    {
        var linewidth = this.Get('chart.linewidth');
        
        if (typeof(linewidth) == 'number') {
            return linewidth;
        
        } else if (typeof(linewidth) == 'object') {
            if (linewidth[i]) {
                return linewidth[i];
            } else {
                return linewidth[0];
            }

            alert('[LINE] Error! chart.linewidth should be a single number or an array of one or more numbers');
        }
    }



    /**
    * The getPoint() method - used to get the point the mouse is currently over, if any
    * 
    * @param object e The event object
    * @param object   OPTIONAL You can pass in the bar object instead of the
    *                          function getting it from the canvas
    */
    RGraph.Line.prototype.getShape =
    RGraph.Line.prototype.getPoint = function (e)
    {
        var canvas  = e.target;
        var obj     = this;
        var context = obj.context;
        var mouseXY = RGraph.getMouseXY(e);
        var mouseX  = mouseXY[0];
        var mouseY  = mouseXY[1];
        
        // This facilitates you being able to pass in the bar object as a parameter instead of
        // the function getting it from the object
        if (arguments[1]) {
            obj = arguments[1];
        }

        for (var i=0; i<obj.coords.length; ++i) {
        
            var x = obj.coords[i][0];
            var y = obj.coords[i][1];

            // Do this if the hotspot is triggered by the X coord AND the Y coord
            if (   mouseX <= (x + 5)
                && mouseX >= (x - 5)
                && mouseY <= (y + 5)
                && mouseY >= (y - 5)
               ) {

                    var tooltip = RGraph.parseTooltipText(this.Get('chart.tooltips'), i);
                    
                    // Work out the dataset
                    var dataset = 0;
                    var idx = i;
                    while ((idx + 1) > this.data[dataset].length) {
                        idx -= this.data[dataset].length;
                        dataset++;
                    }

                    return {0:obj, 1:x, 2:y, 3:i, 'object': obj, 'x': x, 'y': y, 'index': i, 'tooltip': tooltip, 'dataset': dataset, 'index_adjusted': idx};

            } else if (    obj.Get('chart.tooltips.hotspot.xonly') == true
                        && mouseX <= (x + 5)
                        && mouseX >= (x - 5)) {

                        var tooltip = RGraph.parseTooltipText(this.Get('chart.tooltips'), i);

                        return {0:obj, 1:x, 2:y, 3:i, 'object': obj, 'x': x, 'y': y, 'index': i, 'tooltip': tooltip};
            }
        }
    }



    /**
    * Draws the above line labels
    */
    RGraph.Line.prototype.DrawAboveLabels = function ()
    {
        var context    = this.context;
        var size       = this.Get('chart.labels.above.size');
        var font       = this.Get('chart.text.font');
        var units_pre  = this.Get('chart.units.pre');
        var units_post = this.Get('chart.units.post');

        context.beginPath();

        // Don't need to check that chart.labels.above is enabled here, it's been done already
        for (var i=0; i<this.coords.length; ++i) {
            var coords = this.coords[i];
            
            RGraph.Text(context, font, size, coords[0], coords[1] - 5 - size, RGraph.number_format(this, this.data_arr[i], units_pre, units_post), 'center', 'center', true, null, 'rgba(255, 255, 255, 0.7)');
        }
        
        context.fill();
    }


    /**
    * Draw a curvy line. This isn't 100% accurate but may be more to your tastes
    */
    RGraph.Line.prototype.DrawCurvyLine = function (coords, color, linewidth)
    {
        var co = this.context;

        // Now calculate the halfway point
        co.beginPath();
        
            co.strokeStyle = color;
            co.lineWidth   = linewidth;

            for (var i=0; i<coords.length; ++i) {

                var factor  = this.Get('chart.curvy.factor');

                if (coords[i] && typeof(coords[i][1]) == 'number' && coords[i + 1] && typeof(coords[i + 1][1]) == 'number') {

                    var coordX  = coords[i][0];
                    var coordY  = coords[i][1];
                    var nextX   = coords[i + 1][0];
                    var nextY   = coords[i + 1][1];
                    var prevX   = coords[i - 1] ? coords[i - 1][0] : null;
                    var prevY   = coords[i - 1] ? coords[i - 1][1] : null;
                    var offsetX = (coords[i + 1][0] - coords[i][0]) * factor;
                    var offsetY = (coords[i + 1][1] - coords[i][1]) * factor;


                    if (i == 0) {
                        co.moveTo(coordX, coordY);
                        co.lineTo(nextX - offsetX, nextY - offsetY);
                    
                    } else if (nextY == null) {
                        co.lineTo(coordX, coordY);
                    
                    } else if (prevY == null) {
                        co.moveTo(coordX, coordY);
                    
                    } else if (coordY == null) {
                        co.moveTo(nextX, nextY);
                    

                    } else {

                        co.quadraticCurveTo(coordX, coordY, coordX + offsetX, coordY + offsetY);
                        
                        if (nextY) {
                            co.lineTo(nextX - offsetX, nextY - offsetY);
                        } else {
                            co.lineTo(coordX, coordY);
                        }
                    }

                } else if (typeof(coords[i][1]) == 'number') {
                    co.lineTo(coords[i][0], coords[i][1]);
                }
            }

        co.stroke();
    }


    /**
    * When you click on the chart, this method can return the Y value at that point. It works for any point on the
    * chart (that is inside the gutters) - not just points on the Line.
    * 
    * @param object e The event object
    */
    RGraph.Line.prototype.getValue = function (arg)
    {
        if (arg.length == 2) {
            var mouseX = arg[0];
            var mouseY = arg[1];
        } else {
            var mouseCoords = RGraph.getMouseXY(arg);
            var mouseX      = mouseCoords[0];
            var mouseY      = mouseCoords[1];
        }

        var obj = this;
        
        if (   mouseY < obj.Get('chart.gutter.top')
            || mouseY > (obj.canvas.height - obj.Get('chart.gutter.bottom'))
            || mouseX < obj.Get('chart.gutter.left')
            || mouseX > (obj.canvas.width - obj.Get('chart.gutter.right'))
           ) {
            return null;
        }
        
        if (this.Get('chart.xaxispos') == 'center') {
            var value = (( (obj.grapharea / 2) - (mouseY - obj.Get('chart.gutter.top'))) / obj.grapharea) * (obj.max - obj.min);
            value *= 2;
            return value;
        } else if (this.Get('chart.xaxispos') == 'top') {
            var value = ((obj.grapharea - (mouseY - obj.Get('chart.gutter.top'))) / obj.grapharea) * (obj.max - obj.min);
            value = Math.abs(obj.max - value) * -1;
            return value;
        } else {
            var value = ((obj.grapharea - (mouseY - obj.Get('chart.gutter.top'))) / obj.grapharea) * (obj.max - obj.min)
            value += obj.min;
            return value;
        }
    }



    /**
    * Each object type has its own Highlight() function which highlights the appropriate shape
    * 
    * @param object shape The shape to highlight
    */
    RGraph.Line.prototype.Highlight = function (shape)
    {
        if (this.Get('chart.tooltips.highlight')) {
            // Add the new highlight
            RGraph.Highlight.Point(this, shape);
        }
    }



    /**
    * The getObjectByXY() worker method. Don't call this call:
    * 
    * RGraph.ObjectRegistry.getObjectByXY(e)
    * 
    * @param object e The event object
    */
    RGraph.Line.prototype.getObjectByXY = function (e)
    {
        var mouseXY = RGraph.getMouseXY(e);

        if (
               mouseXY[0] > this.Get('chart.gutter.left')
            && mouseXY[0] < (this.canvas.width - this.Get('chart.gutter.right'))
            && mouseXY[1] > this.Get('chart.gutter.top')
            && mouseXY[1] < (this.canvas.height - this.Get('chart.gutter.bottom'))
            ) {

            return this;
        }
    }



    /**
    * This method handles the adjusting calculation for when the mouse is moved
    * 
    * @param object e The event object
    */
    RGraph.Line.prototype.Adjusting_mousemove = function (e)
    {
        /**
        * Handle adjusting for the Bar
        */
        if (RGraph.Registry.Get('chart.adjusting') && RGraph.Registry.Get('chart.adjusting').uid == this.uid) {

            // Rounding the value to the given number of decimals make the chart step
            var value   = Number(this.getValue(e));//.toFixed(this.Get('chart.scale.decimals'));
            var shape   = RGraph.Registry.Get('chart.adjusting.shape');

            if (shape) {

                RGraph.Registry.Set('chart.adjusting.shape', shape);

                this.original_data[shape['dataset']][shape['index_adjusted']] = Number(value);
                RGraph.RedrawCanvas(e.target);
                
                RGraph.FireCustomEvent(this, 'onadjust');
            }
        }
    }
	
    /**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/LICENSE.txt                       |
    * o------------------------------------------------------------------------------o
    */
    
    if (typeof(RGraph) == 'undefined') RGraph = {};

    /**
    * The pie chart constructor
    * 
    * @param data array The data to be represented on the Pie chart
    */
    RGraph.Pie = function (id, data)
    {
        this.id                = id;
        this.canvas            = document.getElementById(id);
        this.context           = this.canvas.getContext("2d");
        this.canvas.__object__ = this;
        this.total             = 0;
        this.subTotal          = 0;
        this.angles            = [];
        this.data              = data;
        this.properties        = [];
        this.type              = 'pie';
        this.isRGraph          = true;
        this.coords            = [];
        this.coords.key        = [];
        this.uid               = RGraph.CreateUID();
        this.canvas.uid        = this.canvas.uid ? this.canvas.uid : RGraph.CreateUID();


        /**
        * Compatibility with older browsers
        */
        RGraph.OldBrowserCompat(this.context);

        this.properties = {
            'chart.colors':                 ['red', '#ddd', '#0f0', 'blue', 'pink', 'yellow', 'black', 'cyan'],
            'chart.strokestyle':            '#999',
            'chart.linewidth':              1,
            'chart.labels':                 [],
            'chart.labels.sticks':          false,
            'chart.labels.sticks.length':   7,
            'chart.labels.sticks.color':    '#aaa',
            'chart.segments':               [],
            'chart.gutter.left':            25,
            'chart.gutter.right':           25,
            'chart.gutter.top':             25,
            'chart.gutter.bottom':          25,
            'chart.title':                  '',
            'chart.title.background':       null,
            'chart.title.hpos':             null,
            'chart.title.vpos':             0.5,
            'chart.title.bold':             true,
            'chart.title.font':             null,
            'chart.shadow':                 false,
            'chart.shadow.color':           'rgba(0,0,0,0.5)',
            'chart.shadow.offsetx':         3,
            'chart.shadow.offsety':         3,
            'chart.shadow.blur':            3,
            'chart.text.size':              10,
            'chart.text.color':             'black',
            'chart.text.font':              'Arial',
            'chart.contextmenu':            null,
            'chart.tooltips':               null,
            'chart.tooltips.event':         'onclick',
            'chart.tooltips.effect':        'fade',
            'chart.tooltips.css.class':     'RGraph_tooltip',
            'chart.tooltips.highlight':     true,
            'chart.highlight.style':        '2d',
            'chart.highlight.style.2d.fill': 'rgba(255,255,255,0.7)',
            'chart.highlight.style.2d.stroke': 'rgba(255,255,255,0.7)',
            'chart.centerx':                null,
            'chart.centery':                null,
            'chart.radius':                 null,
            'chart.border':                 false,
            'chart.border.color':           'rgba(255,255,255,0.5)',
            'chart.key':                    null,
            'chart.key.background':         'white',
            'chart.key.position':           'graph',
            'chart.key.halign':             'right',
            'chart.key.shadow':             false,
            'chart.key.shadow.color':       '#666',
            'chart.key.shadow.blur':        3,
            'chart.key.shadow.offsetx':     2,
            'chart.key.shadow.offsety':     2,
            'chart.key.position.gutter.boxed': true,
            'chart.key.position.x':         null,
            'chart.key.position.y':         null,
            'chart.key.color.shape':        'square',
            'chart.key.rounded':            true,
            'chart.key.linewidth':          1,
            'chart.key.colors':             null,
            'chart.annotatable':            false,
            'chart.annotate.color':         'black',
            'chart.align':                  'center',
            'chart.zoom.factor':            1.5,
            'chart.zoom.fade.in':           true,
            'chart.zoom.fade.out':          true,
            'chart.zoom.hdir':              'right',
            'chart.zoom.vdir':              'down',
            'chart.zoom.frames':            25,
            'chart.zoom.delay':             16.666,
            'chart.zoom.shadow':            true,

            'chart.zoom.background':        true,
            'chart.zoom.action':            'zoom',
            'chart.resizable':              false,
            'chart.resize.handle.adjust':   [0,0],
            'chart.resize.handle.background': null,
            'chart.variant':                'pie',
            'chart.variant.donut.color':    'white',
            'chart.exploded':               [],
            'chart.effect.roundrobin.multiplier': 1,
            'chart.events.click':             null,
            'chart.events.mousemove':         null,
            'chart.centerx':                  null,
            'chart.centery':                  null,
            'chart.radius':                   null
        }

        /**
        * Calculate the total
        */
        for (var i=0,len=data.length; i<len; i++) {
            this.total += data[i];
        }
        
        
        /**
        * Now all charts are always registered
        */
        RGraph.Register(this);
    }


    /**
    * A generic setter
    */
    RGraph.Pie.prototype.Set = function (name, value)
    {
        if (name == 'chart.highlight.style.2d.color') {
            name = 'chart.highlight.style.2d.fill';
        }

        this.properties[name] = value;
    }


    /**
    * A generic getter
    */
    RGraph.Pie.prototype.Get = function (name)
    {
        if (name == 'chart.highlight.style.2d.color') {
            name = 'chart.highlight.style.2d.fill';
        }

        return this.properties[name];
    }



    /**
    * This draws the pie chart
    */
    RGraph.Pie.prototype.Draw = function ()
    {
        /**
        * Fire the onbeforedraw event
        */
        RGraph.FireCustomEvent(this, 'onbeforedraw');


        /**
        * This is new in May 2011 and facilitates indiviual gutter settings,
        * eg chart.gutter.left
        */
        this.gutterLeft   = this.Get('chart.gutter.left');
        this.gutterRight  = this.Get('chart.gutter.right');
        this.gutterTop    = this.Get('chart.gutter.top');
        this.gutterBottom = this.Get('chart.gutter.bottom');


        
        this.radius   = this.getRadius();// MUST be first
        this.centerx  = (this.graph.width / 2) + this.gutterLeft
        this.centery  = (this.graph.height / 2) + this.gutterTop
        this.subTotal = 0;
        this.angles   = [];

        /**
        * Allow specification of a custom radius & center X/Y
        */
        if (typeof(this.Get('chart.radius')) == 'number')  this.radius = this.Get('chart.radius');
        if (typeof(this.Get('chart.centerx')) == 'number') this.centerx = this.Get('chart.centerx');
        if (typeof(this.Get('chart.centery')) == 'number') this.centery = this.Get('chart.centery');


        if (this.radius <= 0) {
            return;
        }
        /**
        * Alignment (Pie is center aligned by default) Only if centerx is not defined - donut defines the centerx
        *
        if (this.Get('chart.align') == 'left') {
            this.centerx = this.radius + this.gutterLeft;
        
        } else if (this.Get('chart.align') == 'right') {
            this.centerx = this.canvas.width - this.radius - this.gutterRight;
        
        } else {
            this.centerx = this.canvas.width / 2;
        }
        */

        /**
        * Draw the title
        */
        RGraph.DrawTitle(this,
                         this.Get('chart.title'),
                         (this.canvas.height / 2) - this.radius - 5,
                         this.centerx,
                         this.Get('chart.title.size') ? this.Get('chart.title.size') : this.Get('chart.text.size') + 2);

        /**
        * Draw the shadow if required
        */
        if (this.Get('chart.shadow') && 0) {
        
            var offsetx = document.all ? this.Get('chart.shadow.offsetx') : 0;
            var offsety = document.all ? this.Get('chart.shadow.offsety') : 0;

            this.context.beginPath();
            this.context.fillStyle = this.Get('chart.shadow.color');

            this.context.shadowColor   = this.Get('chart.shadow.color');
            this.context.shadowBlur    = this.Get('chart.shadow.blur');
            this.context.shadowOffsetX = this.Get('chart.shadow.offsetx');
            this.context.shadowOffsetY = this.Get('chart.shadow.offsety');
            
            this.context.arc(this.centerx + offsetx, this.centery + offsety, this.radius, 0, 6.28, 0);
            
            this.context.fill();
            
            // Now turn off the shadow
            RGraph.NoShadow(this);
        }

        /**
        * The total of the array of values
        */
        this.total = RGraph.array_sum(this.data);

        for (var i=0,len=this.data.length; i<len; i++) {
            
            var angle = ((this.data[i] / this.total) * (Math.PI * 2));

            // Draw the segment
            this.DrawSegment(angle,this.Get('chart.colors')[i],i == (this.data.length - 1), i);
        }

        RGraph.NoShadow(this);


        /**
        * Redraw the seperating lines
        */
        this.DrawBorders();

        /**
        * Now draw the segments again with shadow turned off. This is always performed,
        * not just if the shadow is on.
        */

        for (var i=0; i<this.angles.length; i++) {
    
            this.context.beginPath();
                this.context.strokeStyle = typeof(this.Get('chart.strokestyle')) == 'object' ? this.Get('chart.strokestyle')[i] : this.Get('chart.strokestyle');
                this.context.fillStyle = this.Get('chart.colors')[i];
                
                this.context.arc(this.angles[i][2],
                                 this.angles[i][3],
                                 this.radius,
                                 (this.angles[i][0]),
                                 (this.angles[i][1]),
                                 false);
                if (this.Get('chart.variant') == 'donut') {

                    this.context.arc(this.angles[i][2],
                                     this.angles[i][3],
                                     this.radius / 2,
                                     (this.angles[i][1]),
                                     (this.angles[i][0]),
                                     true);
                    
                } else {
                    this.context.lineTo(this.angles[i][2], this.angles[i][3]);
                }
            this.context.closePath();
            this.context.stroke();
            this.context.fill();
        }


        /**
        * Draw label sticks
        */
        if (this.Get('chart.labels.sticks')) {
            
            this.DrawSticks();
            
            // Redraw the border going around the Pie chart if the stroke style is NOT white
            var strokeStyle = this.Get('chart.strokestyle');
            var isWhite     = strokeStyle == 'white' || strokeStyle == '#fff' || strokeStyle == '#fffffff' || strokeStyle == 'rgb(255,255,255)' || strokeStyle == 'rgba(255,255,255,0)';

            if (!isWhite || (isWhite && this.Get('chart.shadow'))) {
               // Again (?)
              this.DrawBorders();
           }
        }

        /**
        * Draw the labels
        */
        this.DrawLabels();
        
        
        /**
        * Setup the context menu if required
        */
        if (this.Get('chart.contextmenu')) {
            RGraph.ShowContext(this);
        }



        /**
        * If a border is pecified, draw it
        */
        if (this.Get('chart.border')) {
            this.context.beginPath();
            this.context.lineWidth = 5;
            this.context.strokeStyle = this.Get('chart.border.color');

            this.context.arc(this.centerx,
                             this.centery,
                             this.radius - 2,
                             0,
                             6.28,
                             0);

            this.context.stroke();
        }
        
        /**
        * Draw the kay if desired
        */
        if (this.Get('chart.key') != null) {
            //this.Set('chart.key.position', 'graph');
            RGraph.DrawKey(this, this.Get('chart.key'), this.Get('chart.colors'));
        }

        RGraph.NoShadow(this);

        
        /**
        * This function enables resizing
        */
        if (this.Get('chart.resizable')) {
            RGraph.AllowResizing(this);
        }


        /**
        * This installs the event listeners
        */
        RGraph.InstallEventListeners(this);


        /**
        * Fire the RGraph ondraw event
        */
        RGraph.FireCustomEvent(this, 'ondraw');
    }


    /**
    * Draws a single segment of the pie chart
    * 
    * @param int degrees The number of degrees for this segment
    */
    RGraph.Pie.prototype.DrawSegment = function (radians, color, last, index)
    {
        var context  = this.context;
        var canvas   = this.canvas;
        var subTotal = this.subTotal;
            radians  = radians * this.Get('chart.effect.roundrobin.multiplier');

        context.beginPath();

            context.fillStyle   = color;
            context.strokeStyle = this.Get('chart.strokestyle');
            context.lineWidth   = 0;
            
            if (this.Get('chart.shadow')) {
                RGraph.SetShadow(this, this.Get('chart.shadow.color'),this.Get('chart.shadow.offsetx'), this.Get('chart.shadow.offsety'), this.Get('chart.shadow.blur'));
            }

            /**
            * Exploded segments
            */
            if ( (typeof(this.Get('chart.exploded')) == 'object' && this.Get('chart.exploded')[index] > 0) || typeof(this.Get('chart.exploded')) == 'number') {
                var explosion = typeof(this.Get('chart.exploded')) == 'number' ? this.Get('chart.exploded') : this.Get('chart.exploded')[index];
                var x         = 0;
                var y         = 0;
                var h         = explosion;
                var t         = (subTotal + (radians / 2)) - 1.57;
                var x         = (Math.cos(t) * explosion);
                var y         = (Math.sin(t) * explosion);
            
                this.context.moveTo(this.centerx + x, this.centery + y);
            } else {
                var x = 0;
                var y = 0;
            }
            
            /**
            * Calculate the angles
            */
            var startAngle = (subTotal) - 1.57;
            var endAngle   = (((subTotal + radians))) - 1.57;

            context.arc(this.centerx + x,
                        this.centery + y,
                        this.radius,
                        startAngle,
                        endAngle,
                        0);

            if (this.Get('chart.variant') == 'donut') {
    
                context.arc(this.centerx + x,
                            this.centery + y,
                            (this.radius / 2),
                            endAngle,
                            startAngle,
                            true);
            } else {
                context.lineTo(this.centerx + x, this.centery + y);
            }

        this.context.closePath();


        // Keep hold of the angles
        this.angles.push([subTotal - (Math.PI / 2), subTotal + radians - (Math.PI / 2), this.centerx + x, this.centery + y]);


        
        //this.context.stroke();
        this.context.fill();

        /**
        * Calculate the segment angle
        */
        this.Get('chart.segments').push([subTotal, subTotal + radians]);
        this.subTotal += radians;
    }

    /**
    * Draws the graphs labels
    */
    RGraph.Pie.prototype.DrawLabels = function ()
    {
        var hAlignment = 'left';
        var vAlignment = 'center';
        var labels     = this.Get('chart.labels');
        var context    = this.context;

        /**
        * Turn the shadow off
        */
        RGraph.NoShadow(this);
        
        context.fillStyle = 'black';
        context.beginPath();

        /**
        * Draw the key (ie. the labels)
        */
        if (labels && labels.length) {

            var text_size = this.Get('chart.text.size');

            for (i=0; i<labels.length; ++i) {
            
                /**
                * T|his ensures that if we're given too many labels, that we don't get an error
                */
                if (typeof(this.angles) == 'undefined') {
                    continue;
                }

                // Move to the centre
                context.moveTo(this.centerx,this.centery);
                
                var a = this.angles[i][0] + ((this.angles[i][1] - this.angles[i][0]) / 2);

                /**
                * Alignment
                */
                if (a < (Math.PI / 2)) {
                    hAlignment = 'left';
                    vAlignment = 'center';
                } else if (a < (Math.PI * 2)) {
                    hAlignment = 'right';
                    vAlignment = 'center';
                } else if (a < (Math.PI * 1.5)) {
                    hAlignment = 'right';
                    vAlignment = 'center';
                } else if (a < (Math.PI * 2)) {
                    hAlignment = 'left';
                    vAlignment = 'center';
                }

                var angle = ((this.angles[i][1] - this.angles[i][0]) / 2) + this.angles[i][0];

                /**
                * Handle the additional "explosion" offset
                */
                if (typeof(this.Get('chart.exploded')) == 'object' && this.Get('chart.exploded')[i] || typeof(this.Get('chart.exploded')) == 'number') {

                    var t = ((this.angles[i][1] - this.angles[i][0]) / 2);
                    var seperation = typeof(this.Get('chart.exploded')) == 'number' ? this.Get('chart.exploded') : this.Get('chart.exploded')[i];

                    // Adjust the angles
                    var explosion_offsetx = (Math.cos(angle) * seperation);
                    var explosion_offsety = (Math.sin(angle) * seperation);
                } else {
                    var explosion_offsetx = 0;
                    var explosion_offsety = 0;
                }
                
                /**
                * Allow for the label sticks
                */
                if (this.Get('chart.labels.sticks')) {
                    explosion_offsetx += (Math.cos(angle) * this.Get('chart.labels.sticks.length'));
                    explosion_offsety += (Math.sin(angle) * this.Get('chart.labels.sticks.length'));
                }


                context.fillStyle = this.Get('chart.text.color');

                RGraph.Text(context,
                            this.Get('chart.text.font'),
                            text_size,
                            this.centerx + explosion_offsetx + ((this.radius + 10)* Math.cos(a)) + (this.Get('chart.labels.sticks') ? (a < 1.57 || a > 4.71 ? 2 : -2) : 0),
                            this.centery + explosion_offsety + (((this.radius + 10) * Math.sin(a))),
                            labels[i],
                            vAlignment,
                            hAlignment);
            }
            
            context.fill();
        }
    }


    /**
    * This function draws the pie chart sticks (for the labels)
    */
    RGraph.Pie.prototype.DrawSticks = function ()
    {
        var context  = this.context;
        var offset   = this.Get('chart.linewidth') / 2;
        var exploded = this.Get('chart.exploded');
        var sticks   = this.Get('chart.labels.sticks');

        for (var i=0; i<this.angles.length; ++i) {

            // This allows the chart.labels.sticks to be an array as well as a boolean
            if (typeof(sticks) == 'object' && !sticks[i]) {
                continue;
            }

            var radians = this.angles[i][1] - this.angles[i][0];

            context.beginPath();
            context.strokeStyle = this.Get('chart.labels.sticks.color');
            context.lineWidth   = 1;

            var midpoint = (this.angles[i][0] + (radians / 2));

            if (typeof(exploded) == 'object' && exploded[i]) {
                var extra = exploded[i];
            } else if (typeof(exploded) == 'number') {
                var extra = exploded;
            } else {
                var extra = 0;
            }

            context.lineJoin = 'round';
            context.lineWidth = 1;

            context.arc(this.centerx,
                        this.centery,
                        this.radius + this.Get('chart.labels.sticks.length') + extra,
                        midpoint,
                        midpoint + 0.001,
                        0);
            context.arc(this.centerx,
                        this.centery,
                        this.radius + extra,
                        midpoint,
                        midpoint + 0.001,
                        0);

            context.stroke();
        }
    }


    /**
    * The (now Pie chart specific) getSegment function
    * 
    * @param object e The event object
    */
    RGraph.Pie.prototype.getShape =
    RGraph.Pie.prototype.getSegment = function (e)
    {
        RGraph.FixEventObject(e);

        // The optional arg provides a way of allowing some accuracy (pixels)
        var accuracy = arguments[1] ? arguments[1] : 0;

        var canvas      = this.canvas;
        var context     = this.context;
        var mouseCoords = RGraph.getMouseXY(e);
        var r           = this.radius;
        var angles      = this.angles;
        var ret         = [];

        for (var i=0; i<angles.length; ++i) {

            var x     = mouseCoords[0] - angles[i][2];
            var y     = mouseCoords[1] - angles[i][3];
            var theta = Math.atan(y / x); // RADIANS
            var hyp   = y == 0 ? x : y / Math.sin(theta);
            var hyp   = (hyp < 0) ? hyp + accuracy : hyp - accuracy;


            /**
            * Account for the correct quadrant
            */
            if (x < 0 && y >= 0) {
                theta += Math.PI;
            } else if (x < 0 && y < 0) {
                theta += Math.PI;
            }

            if (theta > (2 * Math.PI)) {
                theta -= (2 * Math.PI);
            }

            if (theta >= angles[i][0] && theta < angles[i][1]) {

                hyp = Math.abs(hyp);

                if (!hyp || (this.radius && hyp > this.radius) ) {
                    return null;
                }

                if (this.type == 'pie' && this.Get('chart.variant') == 'donut' && (hyp > this.radius || hyp < (this.radius / 2) ) ) {
                    return null;
                }



                ret[0] = angles[i][2];
                ret[1] = angles[i][3];
                ret[2] = this.radius;
                ret[3] = angles[i][0] - (2 * Math.PI);
                ret[4] = angles[i][1];
                ret[5] = i;


                
                if (ret[3] < 0) ret[3] += (2 * Math.PI);
                if (ret[4] > (2 * Math.PI)) ret[4] -= (2 * Math.PI);
                
                ret[3] = ret[3];
                ret[4] = ret[4];
                
                /**
                * Add the tooltip to the returned shape
                */
                var tooltip = RGraph.parseTooltipText ? RGraph.parseTooltipText(this.Get('chart.tooltips'), ret[5]) : null;
                
                /**
                * Now return textual keys as well as numerics
                */
                ret['object']      = this;
                ret['x']           = ret[0];
                ret['y']           = ret[1];
                ret['radius']      = ret[2];
                ret['angle.start'] = ret[3];
                ret['angle.end']   = ret[4];
                ret['index']       = ret[5];
                ret['tooltip']     = tooltip;

                return ret;
            }
        }
        
        return null;
    }


    RGraph.Pie.prototype.DrawBorders = function ()
    {
        if (this.Get('chart.linewidth') > 0) {

            this.context.lineWidth = this.Get('chart.linewidth');
            this.context.strokeStyle = this.Get('chart.strokestyle');

            for (var i=0,len=this.angles.length; i<len; ++i) {

                this.context.beginPath();
                    this.context.arc(this.angles[i][2],
                                     this.angles[i][3],
                                     this.radius,
                                     (this.angles[i][0]),
                                     (this.angles[i][0] + 0.001),
                                     0);
                    this.context.arc(this.angles[i][2],
                                     this.angles[i][3],
                                     this.Get('chart.variant') == 'donut' ? this.radius / 2: this.radius,
                                     this.angles[i][0],
                                     this.angles[i][0] + 0.0001,
                                     0);
                this.context.closePath();
            
                this.context.stroke();

            }
        }
    }


    /**
    * Returns the radius of the pie chart
    * 
    * [06-02-2012] Maintained for compatibility ONLY.
    */
    RGraph.Pie.prototype.getRadius = function ()
    {

        this.graph        = {};
        this.graph.width  = this.canvas.width - this.Get('chart.gutter.left') - this.Get('chart.gutter.right');
        this.graph.height = this.canvas.height - this.Get('chart.gutter.top') - this.Get('chart.gutter.bottom');

        if (typeof(this.Get('chart.radius')) == 'number') {
            this.radius = this.Get('chart.radius');
        } else {
            this.radius = Math.min(this.graph.width, this.graph.height) / 2;
        }

        return this.radius;
    }


    /**
    * A programmatic explode function
    * 
    * @param object obj   The chart object
    * @param number index The zero-indexed number of the segment
    * @param number size  The size (in pixels) of the explosion
    */
    RGraph.Pie.prototype.Explode = function (index, size)
    {
        var obj = this;
        
        this.Set('chart.exploded', []);
        this.Get('chart.exploded')[index] = 0;

        for (var o=0; o<size; ++o) {
            setTimeout(
                function ()
                {
                    obj.Get('chart.exploded')[index] +=1;
                    RGraph.Clear(obj.canvas);
                    RGraph.Redraw()
                }, o * (document.all ? 25 : 16.666));
        }
        
        /**
        * Now set the property accordingly
        */
        //setTimeout(
        //    function ()
        //    {
        //        obj.Set('chart.exploded', []);
        //    }, size * (document.all ? 50 : 20)
        //)
    }


    /**
    * This function highlights a segment
    * 
    * @param array segment The segment information that is returned by the pie.getSegment(e) function
    */
    RGraph.Pie.prototype.highlight_segment = function (segment)
    {
        var context = this.context;

        context.beginPath();
    
        context.strokeStyle = this.Get('chart.highlight.style.2d.stroke');
        context.fillStyle   = this.Get('chart.highlight.style.2d.fill');
    
        context.moveTo(segment[0], segment[1]);
        context.arc(segment[0], segment[1], segment[2], this.angles[segment[5]][0], this.angles[segment[5]][1], 0);
        context.lineTo(segment[0], segment[1]);
        context.closePath();
        
        context.stroke();
        context.fill();
    }


    /**
    * Each object type has its own Highlight() function which highlights the appropriate shape
    * 
    * @param object shape The shape to highlight
    */
    RGraph.Pie.prototype.Highlight = function (shape)
    {
        if (this.Get('chart.tooltips.highlight')) {
            /**
            * 3D style of highlighting
            */
            if (this.Get('chart.highlight.style') == '3d') {
        
                this.context.lineWidth = 1;
                
                // This is the extent of the 2D effect. Bigger values will give the appearance of a larger "protusion"
                var extent = 2;
        
                // Draw a white-out where the segment is
                this.context.beginPath();
                    RGraph.NoShadow(this);
                    this.context.fillStyle   = 'rgba(0,0,0,0)';
                    this.context.arc(shape['x'], shape['y'], shape['radius'], shape['angle.start'], shape['angle.end'], false);
                    if (this.Get('chart.variant') == 'donut') {
                        this.context.arc(shape['x'], shape['y'], shape['radius'] / 5, shape['angle.end'], shape['angle.start'], true);
                    } else {
                        this.context.lineTo(shape['x'], shape['y']);
                    }
                this.context.closePath();
                this.context.fill();
    
                // Draw the new segment
                this.context.beginPath();
    
                    this.context.shadowColor   = '#666';
                    this.context.shadowBlur    = 3;
                    this.context.shadowOffsetX = 3;
                    this.context.shadowOffsetY = 3;
    
                    this.context.fillStyle   = this.Get('chart.colors')[shape['index']];
                    this.context.strokeStyle = this.Get('chart.strokestyle');
                    this.context.arc(shape['x'] - extent, shape['y'] - extent, shape['radius'], shape['angle.start'], shape['angle.end'], false);
                    if (this.Get('chart.variant') == 'donut') {
                        this.context.arc(shape['x'] - extent, shape['y'] - extent, shape['radius'] / 2, shape['angle.end'], shape['angle.start'],  true)
                    } else {
                        this.context.lineTo(shape['x'] - extent, shape['y'] - extent);
                    }
                this.context.closePath();
                
                this.context.stroke();
                this.context.fill();
                
                // Turn off the shadow
                RGraph.NoShadow(this);
    
                /**
                * If a border is defined, redraw that
                */
                if (this.Get('chart.border')) {
                    this.context.beginPath();
                    this.context.strokeStyle = obj.Get('chart.border.color');
                    this.context.lineWidth = 5;
                    this.context.arc(shape['x'] - extent, shape['y'] - extent, shape['radius'] - 2, shape['angle.start'], shape['angle.end'], false);
                    this.context.stroke();
                }
    
    
    
    
            // Default 2D style of  highlighting
            } else {

                this.context.beginPath();
                    this.context.strokeStyle = this.Get('chart.highlight.style.2d.stroke');
                    this.context.fillStyle   = this.Get('chart.highlight.style.2d.fill');
                    
                    if (this.Get('chart.variant') == 'donut') {
                        this.context.arc(shape['x'], shape['y'], shape['radius'], shape['angle.start'], shape['angle.end'], false);
                        this.context.arc(shape['x'], shape['y'], shape['radius'] / 2, shape['angle.end'], shape['angle.start'], true);
                    } else {
                        this.context.arc(shape['x'], shape['y'], shape['radius'], shape['angle.start'], shape['angle.end'], false);
                        this.context.lineTo(shape['x'], shape['y']);
                    }
                this.context.closePath();
    
                this.context.stroke();
                this.context.fill();
            }
        }
    }



    /**
    * The getObjectByXY() worker method. The Pie chart is able to use the
    * getShape() method - so it does.
    */
    RGraph.Pie.prototype.getObjectByXY = function (e)
    {
        if (this.getShape(e)) {
            return this;
        }
    }