/*
 * Copyright 2017 Mirko Sertic
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
package de.mirkosertic.bytecoder.core;

public class BytecodeInstructionIFICMP extends BytecodeInstruction {

    public enum Type {
        eq, ne, lt, ge, gt, le
    }

    private final Type type;
    private final int jumpOffset;

    public BytecodeInstructionIFICMP(BytecodeOpcodeAddress aOpcodeIndex, Type aType, int aJumpOffset) {
        super(aOpcodeIndex);
        type = aType;
        jumpOffset = aJumpOffset;
    }

    public Type getType() {
        return type;
    }

    public BytecodeOpcodeAddress getJumpTarget() {
        return getOpcodeAddress().add(jumpOffset);
    }

    @Override
    public BytecodeOpcodeAddress[] getPotentialJumpTargets() {
        return new BytecodeOpcodeAddress[] { getJumpTarget()};
    }

    @Override
    public boolean isJumpSource() {
        return true;
    }
}
