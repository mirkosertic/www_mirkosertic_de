var bytecoder = {

     runningInstance: undefined,
     runningInstanceMemory: undefined,
     exports: undefined,
     referenceTable: ['EMPTY'],

     init: function(instance) {
         bytecoder.runningInstance = instance;
         bytecoder.runningInstanceMemory = new Uint8Array(instance.exports.memory.buffer);
         bytecoder.exports = instance.exports;
     },

     intInMemory: function(value) {
         return bytecoder.runningInstanceMemory[value]
                + (bytecoder.runningInstanceMemory[value + 1] * 256)
                + (bytecoder.runningInstanceMemory[value + 2] * 256 * 256)
                + (bytecoder.runningInstanceMemory[value + 3] * 256 * 256 * 256);
     },

     logByteArrayAsString: function(acaller, value) {
         console.log(bytecoder.toJSString(value));
     },


     toJSString: function(value) {
         var theByteArray = bytecoder.intInMemory(value + 8);
         var theData = bytecoder.byteArraytoJSString(theByteArray);
         return theData;
     },

     byteArraytoJSString: function(value) {
         var theLength = bytecoder.intInMemory(value + 16);
         var theData = '';
         value = value + 20;
         for (var i=0;i<theLength;i++) {
             var theCharCode = bytecoder.intInMemory(value);
             value = value + 4;
             theData+= String.fromCharCode(theCharCode);
         }
         return theData;
     },

     toBytecoderReference: function(value) {
         var index = bytecoder.referenceTable.indexOf(value);
         if (index>=0) {
             return index;
         }
         bytecoder.referenceTable.push(value);
         return bytecoder.referenceTable.length - 1;
     },

     toJSReference: function(value) {
         return bytecoder.referenceTable[value];
     },

     toBytecoderString: function(value) {
         var newArray = bytecoder.exports.newByteArray(0, value.length);
         for (var i=0;i<value.length;i++) {
             bytecoder.exports.setByteArrayEntry(0,newArray,i,value.charCodeAt(i));
         }
         return bytecoder.exports.newString(0, newArray);
     },

     logDebug: function(caller,value) {
         console.log(value);
     },

     imports: {
         system: {
             currentTimeMillis: function() {return Date.now();},
             nanoTime: function() {return Date.now() * 1000000;},
             logDebugObject: function(caller, value) {bytecoder.logDebug(caller, value);},
             writeByteArrayToConsole: function(caller, value) {bytecoder.byteArraytoJSString(caller, value);},
         },
         vm: {
             newRuntimeGeneratedTypeMethodTypeMethodHandleObject: function() {},
         },
         tsystem: {
             logDebugObject: function(caller, value) {bytecoder.logDebug(caller, value);},
         },
         printstream: {
             logDebug: function(caller, value) {bytecoder.logDebug(caller,value);},
         },
         memorymanager: {
             logExceptionTextString : function(thisref, p1) {
                 console.log('Exception with message : ' + bytecoder.toJSString(p1));
             }
         },
         opaquearrays : {
             createIntArrayINT: function(thisref, p1) {
                 return bytecoder.toBytecoderReference(new Int32Array(p1));
             },
             createFloatArrayINT: function(thisref, p1) {
                 return bytecoder.toBytecoderReference(new Float32Array(p1));
             },
             createObjectArray: function(thisref) {
                 return bytecoder.toBytecoderReference([]);
             },
         },
         math: {
             floorDOUBLE: function (thisref, p1) {return Math.floor(p1);},
             ceilDOUBLE: function (thisref, p1) {return Math.ceil(p1);},
             sinDOUBLE: function (thisref, p1) {return Math.sin(p1);},
             cosDOUBLE: function  (thisref, p1) {return Math.cos(p1);},
             tanDOUBLE: function  (thisref, p1) {return Math.tan(p1);},
             roundDOUBLE: function  (thisref, p1) {return Math.round(p1);},
             sqrtDOUBLE: function(thisref, p1) {return Math.sqrt(p1);},
             add: function(thisref, p1, p2) {return p1 + p2;},
             maxLONGLONG: function(thisref, p1, p2) { return Math.max(p1, p2);},
             maxDOUBLEDOUBLE: function(thisref, p1, p2) { return Math.max(p1, p2);},
             maxINTINT: function(thisref, p1, p2) { return Math.max(p1, p2);},
             maxFLOATFLOAT: function(thisref, p1, p2) { return Math.max(p1, p2);},
             minFLOATFLOAT: function(thisref, p1, p2) { return Math.min(p1, p2);},
             minINTINT: function(thisref, p1, p2) { return Math.min(p1, p2);},
             minDOUBLEDOUBLE: function(thisref, p1, p2) { return Math.min(p1, p2);},
             toRadiansDOUBLE: function(thisref, p1) {
                 return p1 * (Math.PI / 180);
             },
             toDegreesDOUBLE: function(thisref, p1) {
                 return p1 * (180 / Math.PI);
             },
             random: function(thisref) { return Math.random();},
         },
         strictmath: {
             floorDOUBLE: function (thisref, p1) {return Math.floor(p1);},
             ceilDOUBLE: function (thisref, p1) {return Math.ceil(p1);},
             sinDOUBLE: function (thisref, p1) {return Math.sin(p1);},
             cosDOUBLE: function  (thisref, p1) {return Math.cos(p1);},
             roundFLOAT: function  (thisref, p1) {return Math.round(p1);},
             sqrtDOUBLE: function(thisref, p1) {return Math.sqrt(p1);},
             atan2DOUBLEDOUBLE: function(thisref, p1) {return Math.sqrt(p1);},
         },
         profiler: {
             logMemoryLayoutBlock: function(aCaller, aStart, aUsed, aNext) {
                 if (aUsed == 1) return;
                 console.log('   Block at ' + aStart + ' status is ' + aUsed + ' points to ' + aNext);
                 console.log('      Block size is ' + bytecoder.intInMemory(aStart));
                 console.log('      Object type ' + bytecoder.intInMemory(aStart + 12));
             },
         },
         runtime: {
             nativewindow: function(caller) {return bytecoder.toBytecoderReference(window);},
             nativeconsole: function(caller) {return bytecoder.toBytecoderReference(console);},
         },
         opaquereferencearray: {
             objectArrayLength: function(target) {
               return bytecoder.referenceTable[target].length;
             },
             getINT: function(target,arg0) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target][arg0]);
             },
         },
         container: {
             addChildDisplayObject: function(target,arg0) {
               bytecoder.referenceTable[target].addChild(bytecoder.toJSReference(arg0));
             },
             removeChildDisplayObject: function(target,arg0) {
               bytecoder.referenceTable[target].removeChild(bytecoder.toJSReference(arg0));
             },
         },
         console: {
             logString: function(target,arg0) {
               bytecoder.referenceTable[target].log(bytecoder.toJSString(arg0));
             },
             profileTimeString: function(target,arg0) {
               bytecoder.referenceTable[target].time(bytecoder.toJSString(arg0));
             },
             profileTimeEndString: function(target,arg0) {
               bytecoder.referenceTable[target].timeEnd(bytecoder.toJSString(arg0));
             },
         },
         renderer: {
             rendererType: function(target) {
               return bytecoder.referenceTable[target].rendererType;
             },
             resizeINTINT: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].resize(arg0,arg1);
             },
             backgroundColorINT: function(target,arg0) {
               bytecoder.referenceTable[target].backgroundColor=arg0;
             },
             renderContainer: function(target,arg0) {
               bytecoder.referenceTable[target].render(bytecoder.toJSReference(arg0));
             },
         },
         loaderresource: {
             getData: function(target) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].data);
             },
         },
         loader: {
             addString: function(target,arg0) {
               bytecoder.referenceTable[target].add(bytecoder.toJSString(arg0));
             },
             loadLoader$LoadHandler: function(target,arg0) {
               bytecoder.referenceTable[target].load(function (farg0,farg1) {var marg0=bytecoder.toBytecoderReference(farg0);var marg1=bytecoder.toBytecoderReference(farg1);bytecoder.exports.dmgbpLoader$LoadHandler_VOIDonLoaddmgbpLoaderdmgbpLoader$Resources(arg0,marg0,marg1);});
             },
         },
         keyevent: {
             keyCode: function(target) {
               return bytecoder.referenceTable[target].keyCode;
             },
         },
         promise: {
             thenPromise$Handler: function(target,arg0) {
               bytecoder.referenceTable[target].then(function (farg0) {var marg0=bytecoder.toBytecoderReference(farg0);bytecoder.exports.dmbawPromise$Handler_VOIDhandleObjectdmbaOpaqueReferenceType(arg0,marg0);});
             },
         },
         graphics: {
             widthINT: function(target,arg0) {
               bytecoder.referenceTable[target].width=arg0;
             },
             heightINT: function(target,arg0) {
               bytecoder.referenceTable[target].height=arg0;
             },
             lineStyleINTINTFLOAT: function(target,arg0,arg1,arg2) {
               bytecoder.referenceTable[target].lineStyle(arg0,arg1,arg2);
             },
             drawRectINTINTINTINT: function(target,arg0,arg1,arg2,arg3) {
               bytecoder.referenceTable[target].drawRect(arg0,arg1,arg2,arg3);
             },
         },
         body: {
             text: function(target) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].text());
             },
         },
         eventtarget: {
             addEventListenerStringEventListener: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].addEventListener(bytecoder.toJSString(arg0),function (farg0) {var marg0=bytecoder.toBytecoderReference(farg0);bytecoder.exports.dmbawEventListener_VOIDrundmbawEvent(arg1,marg0);delete bytecoder.referenceTable[marg0];});
             },
         },
         displayobject: {
             scale: function(target) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].scale);
             },
             pivot: function(target) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].pivot);
             },
             zOrderINT: function(target,arg0) {
               bytecoder.referenceTable[target].zOrder=arg0;
             },
             alphaFLOAT: function(target,arg0) {
               bytecoder.referenceTable[target].alpha=arg0;
             },
             position: function(target) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].position);
             },
             rotationFLOAT: function(target,arg0) {
               bytecoder.referenceTable[target].rotation=arg0;
             },
             destroyDisplayObject: function(target) {
               bytecoder.referenceTable[target].destroy();
             },
         },
         stringpromise: {
             thenStringPromise$Handler: function(target,arg0) {
               bytecoder.referenceTable[target].then(function (farg0) {var marg0=bytecoder.toBytecoderString(farg0);bytecoder.exports.dmbawStringPromise$Handler_VOIDhandleStringjlString(arg0,marg0);});
             },
         },
         point: {
             setFLOATFLOAT: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].set(arg0,arg1);
             },
         },
         spritesheetjsonresource: {
             getFrames: function(target) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].frames);
             },
         },
         clickevent: {
             clientX: function(target) {
               return bytecoder.referenceTable[target].clientX;
             },
             clientY: function(target) {
               return bytecoder.referenceTable[target].clientY;
             },
         },
         style: {
             fontFamilyString: function(target,arg0) {
               bytecoder.referenceTable[target].fontFamily=bytecoder.toJSString(arg0);
             },
             fontSizeString: function(target,arg0) {
               bytecoder.referenceTable[target].fontSize=bytecoder.toJSString(arg0);
             },
             fillString: function(target,arg0) {
               bytecoder.referenceTable[target].fill=bytecoder.toJSString(arg0);
             },
             strokeString: function(target,arg0) {
               bytecoder.referenceTable[target].stroke=bytecoder.toJSString(arg0);
             },
         },
         parentnode: {
             getElementByIdString: function(target,arg0) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].getElementById(bytecoder.toJSString(arg0)));
             },
         },
         text: {
             style: function(target) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].style);
             },
             textString: function(target,arg0) {
               bytecoder.referenceTable[target].text=bytecoder.toJSString(arg0);
             },
         },
         window: {
             document: function(target) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].document);
             },
             innerWidth: function(target) {
               return bytecoder.referenceTable[target].innerWidth;
             },
             innerHeight: function(target) {
               return bytecoder.referenceTable[target].innerHeight;
             },
             requestAnimationFrameAnimationFrameCallback: function(target,arg0) {
               bytecoder.referenceTable[target].requestAnimationFrame(function (farg0) {var marg0=farg0;bytecoder.exports.dmbawAnimationFrameCallback_VOIDrunINT(arg0,marg0);});
             },
         },
         windoworworkerglobalscope: {
             fetchString: function(target,arg0) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].fetch(bytecoder.toJSString(arg0)));
             },
         },
     },
};
