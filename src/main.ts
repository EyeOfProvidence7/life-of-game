import cellShaderCode from './cellShader.wgsl';

const GRID_SIZE = 32;

const canvas = document.querySelector("canvas")! as HTMLCanvasElement;
if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}
const adapter: GPUAdapter | null = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
}
const device = await adapter.requestDevice();

const context: GPUCanvasContext | null = canvas.getContext("webgpu");
if (!context) {
    throw new Error("Unable to obtain WebGPU context.");
}

const canvasFormat: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
    device: device,
    format: canvasFormat,
});

const encoder: GPUCommandEncoder = device.createCommandEncoder();

const vertices: Float32Array = new Float32Array([
    //   X,    Y,
    -0.8, -0.8, // Triangle 1 (Blue)
    0.8, -0.8,
    0.8, 0.8,

    -0.8, -0.8, // Triangle 2 (Red)
    0.8, 0.8,
    -0.8, 0.8,
]);

const vertexBuffer: GPUBuffer = device.createBuffer({
    label: "Cell vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

// Create a uniform buffer that describes the grid.
const uniformArray: Float32Array = new Float32Array([GRID_SIZE, GRID_SIZE]);
const uniformBuffer: GPUBuffer = device.createBuffer({
    label: "Grid Uniforms",
    size: uniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, vertices);
device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 8,
    attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0, // Position, see vertex shader
    }],
};

const cellShaderModule: GPUShaderModule = device.createShaderModule({
    label: "Cell shader",
    code: cellShaderCode
});

const cellPipeline: GPURenderPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: "auto",
    vertex: {
        module: cellShaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout]
    },
    fragment: {
        module: cellShaderModule,
        entryPoint: "fragmentMain",
        targets: [{
            format: canvasFormat
        }]
    }
});

const bindGroup: GPUBindGroup = device.createBindGroup({
    label: "Cell renderer bind group",
    layout: cellPipeline.getBindGroupLayout(0),
    entries: [{
        binding: 0,
        resource: { buffer: uniformBuffer }
    }],
});

const pass: GPURenderPassEncoder = encoder.beginRenderPass({
    colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
        storeOp: "store",
    }]
});

pass.setPipeline(cellPipeline);
pass.setVertexBuffer(0, vertexBuffer);
pass.setBindGroup(0, bindGroup);
pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);

pass.end();

device.queue.submit([encoder.finish()]);

export { };

