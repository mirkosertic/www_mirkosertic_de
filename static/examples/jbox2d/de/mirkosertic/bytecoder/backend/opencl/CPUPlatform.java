/*
 * Copyright 2018 Mirko Sertic
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package de.mirkosertic.bytecoder.backend.opencl;

import de.mirkosertic.bytecoder.api.opencl.Context;
import de.mirkosertic.bytecoder.api.opencl.DeviceProperties;
import de.mirkosertic.bytecoder.api.opencl.Platform;
import de.mirkosertic.bytecoder.api.opencl.PlatformProperties;
import de.mirkosertic.bytecoder.api.Logger;

public class CPUPlatform implements Platform {

    private final PlatformProperties platformProperties;
    private final DeviceProperties deviceProperties;
    private final Logger logger;

    public CPUPlatform(Logger aLogger) {
        logger = aLogger;
        platformProperties = () -> "JVM Emulation";
        deviceProperties = new DeviceProperties() {
            @Override
            public String getName() {
                return "System CPU";
            }

            @Override
            public int getNumberOfComputeUnits() {
                return Runtime.getRuntime().availableProcessors();
            }

            @Override
            public long[] getMaxWorkItemSizes() {
                return new long[] {-1, -1 , -1};
            }

            @Override
            public long getMaxWorkGroupSize() {
                return -1;
            }

            @Override
            public long getClockFrequency() {
                return 1;
            }
        };
    }

    @Override
    public Context createContext() {
        return new CPUContext(logger);
    }

    @Override
    public PlatformProperties getPlatformProperties() {
        return platformProperties;
    }

    @Override
    public DeviceProperties getDeviceProperties() {
        return deviceProperties;
    }
}
