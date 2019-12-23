var bytecoder = {

     runningInstance: undefined,
     runningInstanceMemory: undefined,
     exports: undefined,
     referenceTable: ['EMPTY'],
     callbacks: [],
     filehandles: [],

     openForRead: function(path) {
         try {
             var request = new XMLHttpRequest();
             request.open('GET',path,false);
             request.overrideMimeType('text\/plain; charset=x-user-defined');
             request.send(null);
             if (request.status == 200) {
                var length = request.getResponseHeader('content-length');
                var responsetext = request.response;
                var buf = new ArrayBuffer(responsetext.length);
                var bufView = new Uint8Array(buf);
                for (var i=0, strLen=responsetext.length; i<strLen; i++) {
                    bufView[i] = responsetext.charCodeAt(i) & 0xff;
                }
                var handle = bytecoder.filehandles.length;
                bytecoder.filehandles[handle] = {
                    currentpos: 0,
                    data: bufView,
                    size: length,
                    skip0LONGLONG: function(handle,amount) {
                        var remaining = this.size - this.currentpos;
                        var possible = Math.min(remaining, amount);
                        this.currentpos+=possible;
                        return possible;
                    },
                    available0LONG: function(handle) {
                        return this.size - this.currentpos;
                    },
                    read0LONG: function(handle) {
                        return this.data[this.currentpos++];
                    },
                    readBytesLONGL1BYTEINTINT: function(handle,target,offset,length) {
                        if (length === 0) {
                            return 0;
                        }
                        var remaining = this.size - this.currentpos;
                        var possible = Math.min(remaining, length);
                        if (possible === 0) {
                            return -1;
                        }
                        for (var j=0;j<possible;j++) {
                            bytecoder.runningInstanceMemory[target + 20 + offset * 4]=this.data[this.currentpos++];
                            offset++;
                        }
                        return possible;
                    }
                };
                return handle;
            }
            return -1;
         } catch(e) {
             return -1;
         }
     },

     init: function(instance) {
         bytecoder.runningInstance = instance;
         bytecoder.runningInstanceMemory = new Uint8Array(instance.exports.memory.buffer);
         bytecoder.exports = instance.exports;
     },

     initializeFileIO: function() {
         var stddin = {
         };
         var stdout = {
             buffer: "",
             writeBytesLONGL1BYTEINTINT: function(handle, data, offset, length) {
                 if (length > 0) {
                     var array = new Uint8Array(length);
                     data+=20;
                     for (var i = 0; i < length; i++) {
                         array[i] = bytecoder.intInMemory(data);
                         data+=4;
                     }
                     var asstring = String.fromCharCode.apply(null, array);
                     for (var i=0;i<asstring.length;i++) {
                         var c = asstring.charAt(i);
                         if (c == '\n') {
                             console.log(stdout.buffer);
                             stdout.buffer="";
                         } else {
                             stdout.buffer = stdout.buffer.concat(c);
                         }
                     }
                 }
             },
             close0LONG: function(handle) {
             },
             writeIntLONGINT: function(handle,value) {
                 var c = String.fromCharCode(value);
                 if (c == '\n') {
                     console.log(stdout.buffer);
                     stdout.buffer="";
                 } else {
                     stdout.buffer = stdout.buffer.concat(c);
                 }
             }
         };
         bytecoder.filehandles[0] = stddin;
         bytecoder.filehandles[1] = stdout;
         bytecoder.filehandles[2] = stdout;
         bytecoder.exports.initDefaultFileHandles(-1,0,1,2);
     },

     intInMemory: function(value) {
         return bytecoder.runningInstanceMemory[value]
                + (bytecoder.runningInstanceMemory[value + 1] * 256)
                + (bytecoder.runningInstanceMemory[value + 2] * 256 * 256)
                + (bytecoder.runningInstanceMemory[value + 3] * 256 * 256 * 256);
     },

     toJSString: function(value) {
         var theByteArray = bytecoder.intInMemory(value + 12);
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
         return bytecoder.exports.newStringUTF8(0, newArray);
     },

     registerCallback: function(ptr,callback) {
         bytecoder.callbacks.push(ptr);
         return callback;
     },

     imports: {
         stringutf16: {
             isBigEndian: function() {return 1;},
         },
         system: {
             currentTimeMillis: function() {return Date.now();},
             nanoTime: function() {return Date.now() * 1000000;},
         },
         vm: {
             newRuntimeGeneratedTypeStringMethodTypeMethodHandleObject: function() {},
         },
         memorymanager: {
             logExceptionTextString : function(thisref, p1) {
                 console.log('Exception with message : ' + bytecoder.toJSString(p1));
             },
             isUsedAsCallbackINT : function(thisref, ptr) {
                 return bytecoder.callbacks.includes(ptr);
             },
             printObjectDebugInternalObjectINTINTBOOLEANBOOLEAN: function(thisref, ptr, indexAlloc, indexFree, usedByStack, usedByHeap) {
                 console.log('Memory debug for ' + ptr);
                 var theAllocatedBlock = ptr - 12;
                 var theSize = bytecoder.intInMemory(theAllocatedBlock);
                 var theNext = bytecoder.intInMemory(theAllocatedBlock +  4);
                 var theSurvivorCount = bytecoder.intInMemory(theAllocatedBlock +  8);
                 console.log(' Allocation starts at '+ theAllocatedBlock);
                 console.log(' Size = ' + theSize + ', Next = ' + theNext);
                 console.log(' GC survivor count        : ' + theSurvivorCount);
                 console.log(' Index in allocation list : ' + indexAlloc);
                 console.log(' Index in free list       : ' + indexFree);
                 console.log(' Used by STACK            : ' + usedByStack);
                 console.log(' Used by HEAP             : ' + usedByHeap);
                 for (var i=0;i<theSize;i+=4) {
                     console.log(' Memory offset +' + i + ' = ' + bytecoder.intInMemory( theAllocatedBlock + i));
                 }
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
             cbrtDOUBLE: function(thisref, p1) {return Math.cbrt(p1);},
             add: function(thisref, p1, p2) {return p1 + p2;},
             maxLONGLONG: function(thisref, p1, p2) { return Math.max(p1, p2);},
             maxDOUBLEDOUBLE: function(thisref, p1, p2) { return Math.max(p1, p2);},
             maxINTINT: function(thisref, p1, p2) { return Math.max(p1, p2);},
             maxFLOATFLOAT: function(thisref, p1, p2) { return Math.max(p1, p2);},
             minFLOATFLOAT: function(thisref, p1, p2) { return Math.min(p1, p2);},
             minINTINT: function(thisref, p1, p2) { return Math.min(p1, p2);},
             minLONGLONG: function(thisref, p1, p2) { return Math.min(p1, p2);},
             minDOUBLEDOUBLE: function(thisref, p1, p2) { return Math.min(p1, p2);},
             toRadiansDOUBLE: function(thisref, p1) {
                 return p1 * (Math.PI / 180);
             },
             toDegreesDOUBLE: function(thisref, p1) {
                 return p1 * (180 / Math.PI);
             },
             random: function(thisref) { return Math.random();},
             logDOUBLE: function (thisref, p1) {return Math.log(p1);},
             powDOUBLEDOUBLE: function (thisref, p1, p2) {return Math.pow(p1, p2);},
             acosDOUBLE: function (thisref, p1, p2) {return Math.acos(p1);},
             atan2DOUBLE: function (thisref, p1, p2) {return Math.atan2(p1);},
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
         runtime: {
             nativewindow: function(caller) {return bytecoder.toBytecoderReference(window);},
             nativeconsole: function(caller) {return bytecoder.toBytecoderReference(console);},
         },
         unixfilesystem :{
             getBooleanAttributes0String : function(thisref,path) {
                 var jsPath = bytecoder.toJSString(path);
                 try {
                     var request = new XMLHttpRequest();
                     request.open('HEAD',jsPath,false);
                     request.send(null);
                     if (request.status == 200) {
                         var length = request.getResponseHeader('content-length');
                         return 0x01;
                     }
                     return 0;
                 } catch(e) {
                     return 0;
                 }
             },
         },
         fileoutputstream : {
             writeBytesLONGL1BYTEINTINT : function(thisref, handle, data, offset, length) {
                 bytecoder.filehandles[handle].writeBytesLONGL1BYTEINTINT(handle,data,offset,length);
             },
             writeIntLONGINT : function(thisref, handle, intvalue) {
                 bytecoder.filehandles[handle].writeIntLONGINT(handle,intvalue);
             },
             close0LONG : function(thisref,handle) {
                 bytecoder.filehandles[handle].close0LONG(handle);
             },
         },
         fileinputstream : {
             open0String : function(thisref,name) {
                 return bytecoder.openForRead(bytecoder.toJSString(name));
             },
             read0LONG : function(thisref,handle) {
                 return bytecoder.filehandles[handle].read0LONG(handle);
             },
             readBytesLONGL1BYTEINTINT : function(thisref,handle,data,offset,length) {
                 return bytecoder.filehandles[handle].readBytesLONGL1BYTEINTINT(handle,data,offset,length);
             },
             skip0LONGLONG : function(thisref,handle,amount) {
                 return bytecoder.filehandles[handle].skip0LONGLONG(handle,amount);
             },
             available0LONG : function(thisref,handle) {
                 return bytecoder.filehandles[handle].available0LONG(handle);
             },
             close0LONG : function(thisref,handle) {
                 bytecoder.filehandles[handle].close0LONG(handle);
             },
         },
         inflater : {
             initIDs : function(thisref) {
             },
             initBOOLEAN : function(thisref,nowrap) {
             },
             inflateBytesBytesLONGL1BYTEINTINTL1BYTEINTINT : function(thisref,addr,inputArray,inputOff,inputLen,outputArray,outputOff,outputLen) {
             },
             inflateBufferBytesLONGLONGINTL1BYTEINTINT : function(thisref,addr,inputAddress,inputLen,outputArray,outputOff,outputLen) {
             },
             endLONG : function(thisref,addr) {
             },
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
               bytecoder.referenceTable[target].load(bytecoder.registerCallback(arg0,function (farg0,farg1) {var marg0=bytecoder.toBytecoderReference(farg0);var marg1=bytecoder.toBytecoderReference(farg1);bytecoder.exports.dmgbpLoader$LoadHandler_VOIDonLoaddmgbpLoaderdmgbpLoader$Resources(arg0,marg0,marg1);}));
             },
         },
         keyevent: {
             keyCode: function(target) {
               return bytecoder.referenceTable[target].keyCode;
             },
         },
         promise: {
             thenPromise$Handler: function(target,arg0) {
               bytecoder.referenceTable[target].then(bytecoder.registerCallback(arg0,function (farg0) {var marg0=bytecoder.toBytecoderReference(farg0);bytecoder.exports.dmbawPromise$Handler_VOIDhandleObjectdmbaOpaqueReferenceType(arg0,marg0);}));
             },
         },
         graphics: {
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
               bytecoder.referenceTable[target].addEventListener(bytecoder.toJSString(arg0),bytecoder.registerCallback(arg1,function (farg0) {var marg0=bytecoder.toBytecoderReference(farg0);bytecoder.exports.dmbawEventListener_VOIDrundmbawEvent(arg1,marg0);delete bytecoder.referenceTable[marg0];}));
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
             widthINT: function(target,arg0) {
               bytecoder.referenceTable[target].width=arg0;
             },
             heightINT: function(target,arg0) {
               bytecoder.referenceTable[target].height=arg0;
             },
             destroyDisplayObject: function(target) {
               bytecoder.referenceTable[target].destroy();
             },
         },
         stringpromise: {
             thenStringPromise$Handler: function(target,arg0) {
               bytecoder.referenceTable[target].then(bytecoder.registerCallback(arg0,function (farg0) {var marg0=bytecoder.toBytecoderString(farg0);bytecoder.exports.dmbawStringPromise$Handler_VOIDhandleStringjlString(arg0,marg0);}));
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
               bytecoder.referenceTable[target].requestAnimationFrame(bytecoder.registerCallback(arg0,function (farg0) {var marg0=farg0;bytecoder.exports.dmbawAnimationFrameCallback_VOIDrunINT(arg0,marg0);}));
             },
         },
         windoworworkerglobalscope: {
             fetchString: function(target,arg0) {
               return bytecoder.toBytecoderReference(bytecoder.referenceTable[target].fetch(bytecoder.toJSString(arg0)));
             },
         },
     },
};
