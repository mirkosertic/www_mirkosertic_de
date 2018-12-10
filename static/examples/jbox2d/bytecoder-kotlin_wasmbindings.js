var bytecoder = {

     runningInstance: undefined,
     runningInstanceMemory: undefined,
     exports: undefined,
     referenceTable: [],

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


     toJSEventListener: function(value) {
         return function(event) {
             try {
                 var eventIndex = bytecoder.toBytecoderReference(event);
                 bytecoder.exports.summonCallback(0,value,eventIndex);
                 delete bytecoder.referenceTable[eventIndex];
             } catch (e) {
                 console.log(e);
             }
         };
     },

     toBytecoderReference: function(value) {
         bytecoder.referenceTable.push(value);
         return bytecoder.referenceTable.length - 1;
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
             logDebug: function(caller, value) {bytecoder.logDebug(caller, value);},
             writeByteArrayToConsole: function(caller, value) {bytecoder.byteArraytoJSString(caller, value);},
         },
         tsystem: {
             logDebug: function(caller, value) {bytecoder.logDebug(caller, value);},
         },
         printstream: {
             logDebug: function(caller, value) {bytecoder.logDebug(caller,value);},
         },
         math: {
             floor: function (thisref, p1) {return Math.floor(p1);},
             ceil: function (thisref, p1) {return Math.ceil(p1);},
             sin: function (thisref, p1) {return Math.sin(p1);},
             cos: function  (thisref, p1) {return Math.cos(p1);},
             round: function  (thisref, p1) {return Math.round(p1);},
             sqrt: function(thisref, p1) {return Math.sqrt(p1);},
             add: function(thisref, p1, p2) {return p1 + p2;},
             max: function(p1, p2) { return Math.max(p1, p2);},
             min: function(p1, p2) { return Math.min(p1, p2);},
         },
         strictmath: {
             floor: function (thisref, p1) {return Math.floor(p1);},
             ceil: function (thisref, p1) {return Math.ceil(p1);},
             sin: function (thisref, p1) {return Math.sin(p1);},
             cos: function  (thisref, p1) {return Math.cos(p1);},
             round: function  (thisref, p1) {return Math.round(p1);},
             sqrt: function(thisref, p1) {return Math.sqrt(p1);},
             add: function(thisref, p1, p2) {return p1 + p2;},
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
         },
         canvasrenderingcontext2d: {
             setFillStyle: function(target,arg0) {
               bytecoder.referenceTable[target].fillStyle=bytecoder.toJSString(arg0);
             },
             setStrokeStyle: function(target,arg0) {
               bytecoder.referenceTable[target].strokeStyle=bytecoder.toJSString(arg0);
             },
             fillRect: function(target,arg0,arg1,arg2,arg3) {
               bytecoder.referenceTable[target].fillRect(arg0,arg1,arg2,arg3);
             },
             save: function(target) {
               bytecoder.referenceTable[target].save();
             },
             translate: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].translate(arg0,arg1);
             },
             scale: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].scale(arg0,arg1);
             },
             setLineWidth: function(target,arg0) {
               bytecoder.referenceTable[target].lineWidth=arg0;
             },
             rotate: function(target,arg0) {
               bytecoder.referenceTable[target].rotate(arg0);
             },
             beginPath: function(target) {
               bytecoder.referenceTable[target].beginPath();
             },
             arc: function(target,arg0,arg1,arg2,arg3,arg4,arg5) {
               bytecoder.referenceTable[target].arc(arg0,arg1,arg2,arg3,arg4,arg5);
             },
             closePath: function(target) {
               bytecoder.referenceTable[target].closePath();
             },
             stroke: function(target) {
               bytecoder.referenceTable[target].stroke();
             },
             moveTo: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].moveTo(arg0,arg1);
             },
             lineTo: function(target,arg0,arg1) {
               bytecoder.referenceTable[target].lineTo(arg0,arg1);
             },
             restore: function(target) {
               bytecoder.referenceTable[target].restore();
             },
         },
         htmlcanvaselement: {
             getContext: function(target,arg0) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].getContext(bytecoder.toJSString(arg0)));
             },
         },
         parentnode: {
             getElementById: function(target,arg0) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].getElementById(bytecoder.toJSString(arg0)));
             },
         },
         window: {
             document: function(target) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].document);
             },
         },
     },
};
