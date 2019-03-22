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
         vuedata: {
             setPropertyStringString: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].setProperty(bytecoder.toJSString(arg0),bytecoder.toJSString(arg1));
             },
         },
         vuedemo$myvueinstance: {
             welcomemessageString: function(target,arg0) {
               bytecoder.referenceTable[target].welcomemessage=bytecoder.toJSString(arg0);
             },
         },
         vuebuilder: {
             bindToTemplateSelectorString: function(target,arg0) {
               bytecoder.referenceTable[target].bindToTemplateSelector(bytecoder.toJSString(arg0));
             },
             data: function(target) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].data());
             },
             addEventListenerStringVueEventListener: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].addEventListener(bytecoder.toJSString(arg0),function (farg0,farg1) {var marg0=bytecoder.toBytecoderReference(farg0);var marg1=bytecoder.toBytecoderReference(farg1);bytecoder.exports.dmbavVueEventListener_VOIDhandledmbavVueInstancedmbawEvent(arg1,marg0,marg1);delete bytecoder.referenceTable[marg1];});
             },
             build: function(target) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].build());
             },
         },
     },
};
