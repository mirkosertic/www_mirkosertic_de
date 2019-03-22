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
             initialize: function() {},
             initializeFromArchiveClass: function() {},
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
             createInt8ArrayINT: function(thisref, p1) {
                 return bytecoder.toBytecoderReference(new Int8Array(p1));
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
         canvasrenderingcontext2d: {
             setFillStyleString: function(target,arg0) {
               bytecoder.referenceTable[target].fillStyle=bytecoder.toJSString(arg0);
             },
             setStrokeStyleString: function(target,arg0) {
               bytecoder.referenceTable[target].strokeStyle=bytecoder.toJSString(arg0);
             },
             fillRectFLOATFLOATFLOATFLOAT: function(target,arg0,arg1,arg2,arg3) {
               bytecoder.referenceTable[target].fillRect(arg0,arg1,arg2,arg3);
             },
             save: function(target) {
               bytecoder.referenceTable[target].save();
             },
             translateFLOATFLOAT: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].translate(arg0,arg1);
             },
             scaleFLOATFLOAT: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].scale(arg0,arg1);
             },
             setLineWidthFLOAT: function(target,arg0) {
               bytecoder.referenceTable[target].lineWidth=arg0;
             },
             rotateFLOAT: function(target,arg0) {
               bytecoder.referenceTable[target].rotate(arg0);
             },
             beginPath: function(target) {
               bytecoder.referenceTable[target].beginPath();
             },
             arcDOUBLEDOUBLEDOUBLEDOUBLEDOUBLEBOOLEAN: function(target,arg0,arg1,arg2,arg3,arg4,arg5) {
               bytecoder.referenceTable[target].arc(arg0,arg1,arg2,arg3,arg4,arg5);
             },
             closePath: function(target) {
               bytecoder.referenceTable[target].closePath();
             },
             stroke: function(target) {
               bytecoder.referenceTable[target].stroke();
             },
             moveToFLOATFLOAT: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].moveTo(arg0,arg1);
             },
             lineToFLOATFLOAT: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].lineTo(arg0,arg1);
             },
             restore: function(target) {
               bytecoder.referenceTable[target].restore();
             },
         },
         htmlcanvaselement: {
             getContextString: function(target,arg0) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].getContext(bytecoder.toJSString(arg0)));
             },
         },
         htmlbutton: {
             disabledBOOLEAN: function(target,arg0) {
               bytecoder.referenceTable[target].disabled=arg0;
             },
         },
         parentnode: {
             getElementByIdString: function(target,arg0) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].getElementById(bytecoder.toJSString(arg0)));
             },
         },
         window: {
             document: function(target) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].document);
             },
             requestAnimationFrameAnimationFrameCallback: function(target,arg0) {
               bytecoder.referenceTable[target].requestAnimationFrame(function (farg0) {var marg0=farg0;bytecoder.exports.dmbawAnimationFrameCallback_VOIDrunINT(arg0,marg0);});
             },
         },
         eventtarget: {
             addEventListenerStringEventListener: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].addEventListener(bytecoder.toJSString(arg0),function (farg0) {var marg0=bytecoder.toBytecoderReference(farg0);bytecoder.exports.dmbawEventListener_VOIDrundmbawEvent(arg1,marg0);delete bytecoder.referenceTable[marg0];});
             },
         },
     },
};
